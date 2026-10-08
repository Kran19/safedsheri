import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { CredentialStatus, RegistrationStatus, PassType, GazeboInquiryStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class CredentialsService {
  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private authService: AuthService,
  ) {}

  async ensureApprovedGazebosMinted() {
    try {
      const activeInquiries = await this.prisma.gazeboInquiry.findMany({
        where: {
          status: { in: [GazeboInquiryStatus.APPROVED, GazeboInquiryStatus.CONFIRMED] },
        },
        include: { gazebo: true },
      });

      for (const inq of activeInquiries) {
        let targetGazeboId = inq.gazeboId;
        if (!targetGazeboId) {
          const availableGzb = await this.prisma.gazebo.findFirst({
            where: { level: inq.level, status: 'AVAILABLE' },
          });
          if (availableGzb) {
            targetGazeboId = availableGzb.id;
            await this.prisma.gazeboInquiry.update({
              where: { id: inq.id },
              data: { gazeboId: targetGazeboId },
            });
            await this.prisma.gazebo.update({
              where: { id: targetGazeboId },
              data: { status: 'CONFIRMED' },
            });
          }
        }

        if (!targetGazeboId) continue;

        const existingReg = await this.prisma.registration.findFirst({
          where: {
            deletedAt: null,
            gazeboId: targetGazeboId,
            credentials: { some: {} },
          },
        });

        if (existingReg) continue;

        const event = await this.prisma.event.findFirst({
          where: { status: 'ACTIVE' },
          orderBy: { eventDate: 'desc' },
        });
        const pricingPhase = await this.prisma.pricingPhase.findFirst({
          where: { isActive: true },
        });
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'SUPER_ADMIN' },
        });

        if (!event || !pricingPhase || !adminUser) continue;

        const rawNotes = inq.notes || '';
        const lines = rawNotes.split('\n');
        const parsedGuests: Array<{ fullName: string; phone: string; email?: string; aadhaarNumber: string }> = [];

        for (const line of lines) {
          if (!line.includes('Guest ') || !line.includes('|')) continue;
          const nameMatch = line.match(/Guest \d+:\s*([^|]+)/);
          const phoneMatch = line.match(/Ph:\s*([^|]+)/);
          const emailMatch = line.match(/Email:\s*([^|]+)/);
          const aadhMatch = line.match(/Aadh:\s*(\d{12})/);

          if (nameMatch) {
            const cleanPhone = phoneMatch ? phoneMatch[1].trim() : inq.phone;
            const cleanAadh = aadhMatch ? aadhMatch[1].trim() : ('99' + cleanPhone.replace(/\D/g, '').padStart(10, '0')).slice(-12);
            parsedGuests.push({
              fullName: nameMatch[1].trim(),
              phone: cleanPhone,
              email: emailMatch ? emailMatch[1].trim() : undefined,
              aadhaarNumber: cleanAadh,
            });
          }
        }

        if (parsedGuests.length === 0) {
          const aadhInNotes = rawNotes.match(/\b\d{12}\b/);
          const cleanPhone = inq.phone || '9999999999';
          const cleanAadh = aadhInNotes ? aadhInNotes[0] : ('99' + cleanPhone.replace(/\D/g, '').padStart(10, '0')).slice(-12);
          parsedGuests.push({
            fullName: inq.fullName || 'VIP Host',
            phone: cleanPhone,
            aadhaarNumber: cleanAadh,
          });
        }

        const count = await this.prisma.registration.count();
        const seq = (count + 1).toString().padStart(6, '0');
        const registrationNumber = `REG-26-${seq}`;

        const reg = await this.prisma.registration.create({
          data: {
            registrationNumber,
            eventId: event.id,
            pricingPhaseId: pricingPhase.id,
            passType: PassType.GAZEBO,
            status: RegistrationStatus.PASS_ISSUED,
            amountDue: 0,
            createdById: adminUser.id,
            reviewedById: adminUser.id,
            reviewedAt: new Date(),
            gazeboId: targetGazeboId,
            reviewNotes: `Auto-issued Gazebo VIP Pass for inquiry ${inq.inquiryNumber}`,
          },
        });

        for (let i = 0; i < parsedGuests.length; i++) {
          const g = parsedGuests[i];
          const cleanAadhaar = g.aadhaarNumber.replace(/\D/g, '').slice(-12);
          const aadhaarMasked = this.encryptionService.maskAadhaar(cleanAadhaar);
          const aadhaarEncrypted = this.encryptionService.encrypt(cleanAadhaar);
          const aadhaarHmac = this.encryptionService.computeAadhaarHmac(cleanAadhaar);

          const att = await this.prisma.attendee.upsert({
            where: { aadhaarHmac },
            update: {
              fullName: g.fullName,
              phone: g.phone,
              email: g.email || null,
              gender: 'MALE',
              aadhaarMasked,
              aadhaarEncrypted,
            },
            create: {
              fullName: g.fullName,
              phone: g.phone,
              email: g.email || null,
              gender: 'MALE',
              aadhaarHmac,
              aadhaarMasked,
              aadhaarEncrypted,
            },
          });

          await this.prisma.registrationAttendee.create({
            data: {
              registrationId: reg.id,
              attendeeId: att.id,
              isPrimary: i === 0,
              status: RegistrationStatus.PASS_ISSUED,
              reviewedAt: new Date(),
            },
          });
        }

        await this.generateCredentialsForRegistration(reg.id);

        await this.prisma.gazebo.update({
          where: { id: targetGazeboId },
          data: { status: 'CONFIRMED' },
        });
      }
    } catch (err) {
      console.error('Error auto-syncing approved gazebo passes:', err);
    }
  }

  async findAll(passType?: PassType, search?: string) {
    // Ensure all approved or confirmed Gazebos have their VIP passes minted
    await this.ensureApprovedGazebosMinted();

    const where: any = {
      registration: {
        deletedAt: null,
      },
    };

    if (passType) {
      if (passType === 'GAZEBO') {
        where.registration = {
          ...where.registration,
          OR: [
            { passType: 'GAZEBO' },
            { gazeboId: { not: null } },
          ],
        };
      } else {
        where.registration.passType = passType;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { passCode: { contains: q, mode: 'insensitive' } },
        { credentialNumber: { contains: q, mode: 'insensitive' } },
        { secureToken: { contains: q } },
        { attendee: { fullName: { contains: q, mode: 'insensitive' } } },
        { attendee: { phone: { contains: q } } },
        { registration: { registrationNumber: { contains: q, mode: 'insensitive' } } },
        { registration: { gazebo: { gazeboNumber: { contains: q, mode: 'insensitive' } } } },
      ];
    }

    const credentials = await this.prisma.credential.findMany({
      where,
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            aadhaarMasked: true,
            kidsAgeGroup: true,
          },
        },
        registration: {
          select: {
            id: true,
            registrationNumber: true,
            passType: true,
            status: true,
            amountDue: true,
            createdAt: true,
            gazeboId: true,
            gazebo: {
              select: {
                id: true,
                gazeboNumber: true,
                level: true,
              },
            },
          },
        },
        entries: {
          select: {
            id: true,
            createdAt: true,
            entryType: true,
            gateId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    return { success: true, data: credentials };
  }

  async findOne(id: string) {
    const credential = await this.prisma.credential.findFirst({
      where: {
        OR: [{ id }, { secureToken: id }, { credentialNumber: id }, { passCode: id }],
      },
      include: {
        attendee: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            gender: true,
            aadhaarMasked: true,
          },
        },
        registration: {
          select: {
            id: true,
            registrationNumber: true,
            passType: true,
            status: true,
          },
        },
      },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }
    return { success: true, data: credential };
  }

  async generateCredentialsForRegistration(registrationId: string, customTx?: any) {
    const db = customTx || this.prisma;

    const registration = await db.registration.findUnique({
      where: { id: registrationId },
      include: {
        attendees: {
          include: { attendee: true },
        },
        credentials: true,
      },
    });

    if (!registration) {
      throw new NotFoundException(`Registration ${registrationId} not found`);
    }

    if (registration.credentials && registration.credentials.length > 0) {
      return registration.credentials;
    }

    const generatedCredentials = [];
    const prefix = registration.passType === PassType.SINGLE
      ? 'SS26-SINGLE'
      : registration.passType === PassType.COUPLE
      ? 'SS26-COUPLE'
      : registration.passType === PassType.KIDS
      ? 'SS26-KIDS'
      : 'SS26-GAZEBO';

    // Filter attendees who are NOT rejected
    const eligibleAttendees = registration.attendees.filter(
      (ra) => ra.status !== RegistrationStatus.REJECTED
    );

    for (let i = 0; i < eligibleAttendees.length; i++) {
      const att = eligibleAttendees[i].attendee;
      const passRandom = crypto.randomBytes(2).toString('hex').toUpperCase();
      const passCode = `${prefix}-${passRandom}`;
      const credSeq = (Math.floor(100000 + Math.random() * 900000)).toString();
      const credentialNumber = `PASS-2026-${credSeq}`;
      const secureToken = `ss_qr_${crypto.randomBytes(32).toString('hex')}`;

      const credential = await db.credential.create({
        data: {
          credentialNumber,
          passCode,
          registrationId: registration.id,
          attendeeId: att.id,
          secureToken,
          status: CredentialStatus.ACTIVE,
        },
      });

      generatedCredentials.push(credential);
    }

    await db.registration.update({
      where: { id: registration.id },
      data: { status: RegistrationStatus.PASS_ISSUED },
    });

    return generatedCredentials;
  }

  private async resolveQueryToAttendeeAndPhone(query: string): Promise<{
    attendee: any | null;
    targetPhone: string;
    isPhone: boolean;
    cleanDigits: string;
  }> {
    const rawDigits = query.replace(/\D/g, '');
    let cleanDigits = rawDigits;

    // 1. If 12 digits starting with '91', check if it's an Indian phone number with country code
    if (rawDigits.length === 12 && rawDigits.startsWith('91')) {
      const phoneCandidate = rawDigits.slice(2);
      let attendeeByPhone = await this.prisma.attendee.findFirst({
        where: { phone: { contains: phoneCandidate } },
      });
      if (!attendeeByPhone) {
        const gInq = await this.prisma.gazeboInquiry.findFirst({
          where: {
            OR: [
              { phone: { contains: phoneCandidate } },
              { notes: { contains: phoneCandidate } },
            ],
            status: { notIn: [GazeboInquiryStatus.REJECTED, GazeboInquiryStatus.CANCELLED] },
          },
        });
        if (gInq) {
          attendeeByPhone = {
            id: gInq.id,
            fullName: gInq.fullName,
            phone: phoneCandidate,
            isGazeboInquiry: true,
          } as any;
        }
      }
      if (attendeeByPhone) {
        return {
          attendee: attendeeByPhone,
          targetPhone: attendeeByPhone.phone,
          isPhone: true,
          cleanDigits: phoneCandidate,
        };
      }
    }

    // 2. 10-digit mobile number
    if (rawDigits.length === 10) {
      let attendee = await this.prisma.attendee.findFirst({
        where: { phone: { contains: rawDigits } },
      });
      if (!attendee) {
        const gInq = await this.prisma.gazeboInquiry.findFirst({
          where: {
            OR: [
              { phone: { contains: rawDigits } },
              { notes: { contains: rawDigits } },
            ],
            status: { notIn: [GazeboInquiryStatus.REJECTED, GazeboInquiryStatus.CANCELLED] },
          },
        });
        if (gInq) {
          let guestName = gInq.fullName;
          if (gInq.notes) {
            const lines = gInq.notes.split('\n');
            for (const l of lines) {
              if (l.includes(rawDigits)) {
                const nameMatch = l.match(/Guest \d+:\s*([^|]+)/);
                if (nameMatch) guestName = nameMatch[1].trim();
                break;
              }
            }
          }
          attendee = {
            id: gInq.id,
            fullName: guestName,
            phone: rawDigits,
            isGazeboInquiry: true,
          } as any;
        }
      }
      return {
        attendee,
        targetPhone: attendee ? attendee.phone : rawDigits,
        isPhone: true,
        cleanDigits: rawDigits,
      };
    }

    // 3. 12-digit Aadhaar number
    if (rawDigits.length === 12) {
      const aadhaarHmac = this.encryptionService.computeAadhaarHmac(rawDigits);
      let attendee = await this.prisma.attendee.findUnique({
        where: { aadhaarHmac },
      });
      let targetPhone = attendee ? attendee.phone : '';
      if (!attendee) {
        const gInq = await this.prisma.gazeboInquiry.findFirst({
          where: {
            notes: { contains: rawDigits },
            status: { notIn: [GazeboInquiryStatus.REJECTED, GazeboInquiryStatus.CANCELLED] },
          },
        });
        if (gInq) {
          let guestName = gInq.fullName;
          let guestPhone = gInq.phone;
          if (gInq.notes) {
            const lines = gInq.notes.split('\n');
            for (const l of lines) {
              if (l.includes(rawDigits)) {
                const nameMatch = l.match(/Guest \d+:\s*([^|]+)/);
                const phoneMatch = l.match(/Ph:\s*([^|]+)/);
                if (nameMatch) guestName = nameMatch[1].trim();
                if (phoneMatch) guestPhone = phoneMatch[1].trim();
                break;
              }
            }
          }
          attendee = {
            id: gInq.id,
            fullName: guestName,
            phone: guestPhone,
            isGazeboInquiry: true,
          } as any;
          targetPhone = guestPhone;
        }
      }
      return {
        attendee,
        targetPhone,
        isPhone: false,
        cleanDigits: rawDigits,
      };
    }

    // 4. Registration number (e.g. SS-2026-000266)
    if (query.toUpperCase().includes('SS-')) {
      const cleanRegNum = query.trim().toUpperCase();
      const reg = await this.prisma.registration.findFirst({
        where: { registrationNumber: cleanRegNum },
        include: { attendees: { include: { attendee: true } } },
      });
      if (reg && reg.attendees.length > 0) {
        const primaryAtt = reg.attendees.find((ra) => ra.isPrimary)?.attendee || reg.attendees[0].attendee;
        return {
          attendee: primaryAtt,
          targetPhone: primaryAtt.phone,
          isPhone: true,
          cleanDigits: primaryAtt.phone.replace(/\D/g, '').slice(-10),
        };
      }
    }

    // 5. Gazebo inquiry reference (e.g. GZB-INQ-...)
    if (query.toUpperCase().includes('GZB-')) {
      const cleanInqNum = query.trim().toUpperCase();
      const gInq = await this.prisma.gazeboInquiry.findFirst({
        where: {
          OR: [
            { inquiryNumber: cleanInqNum },
            { id: { startsWith: cleanInqNum.replace('GZB-INQ-', '').toLowerCase() } }
          ],
          status: { notIn: [GazeboInquiryStatus.REJECTED, GazeboInquiryStatus.CANCELLED] }
        }
      });
      if (gInq) {
        return {
          attendee: {
            id: gInq.id,
            fullName: gInq.fullName,
            phone: gInq.phone,
            isGazeboInquiry: true,
          },
          targetPhone: gInq.phone,
          isPhone: true,
          cleanDigits: gInq.phone.replace(/\D/g, '').slice(-10),
        };
      }
    }

    return {
      attendee: null,
      targetPhone: '',
      isPhone: false,
      cleanDigits: rawDigits,
    };
  }

  async findMyPass(query: string, otpToken?: string) {
    const resolved = await this.resolveQueryToAttendeeAndPhone(query);
    const { cleanDigits, isPhone } = resolved;
    let targetPhone = resolved.targetPhone;

    if (cleanDigits.length !== 10 && cleanDigits.length !== 12) {
      throw new BadRequestException('Invalid query length. Must be 10-digit phone, 12-digit Aadhaar, or Registration Number.');
    }

    let isBypassed = false;
    const cleanPhoneKey = targetPhone ? targetPhone.replace(/\D/g, '').slice(-10) : '';
    if (cleanPhoneKey && cleanPhoneKey.length === 10) {
      const checkBypass = await this.prisma.otpBypass.findUnique({
        where: { phone: cleanPhoneKey },
      });
      isBypassed = !!checkBypass;
    }

    if (!isBypassed) {
      if (!otpToken) {
        throw new BadRequestException('Verification required. Please verify your phone number via WhatsApp OTP.');
      }
      const verified = await this.authService.verifyOtpToken(otpToken);
      if (!verified || !verified.verified) {
        throw new BadRequestException('Session expired or invalid verification token. Please verify again.');
      }

      const verifiedPhone = verified.phone.replace(/\D/g, '');

      // Enforce that verified phone matches the query.
      if (isPhone || cleanDigits.length === 10) {
        const last10Query = cleanDigits.slice(-10);
        const last10Verified = verifiedPhone.slice(-10);
        if (last10Query !== last10Verified) {
          throw new BadRequestException('The verified phone number does not match your search query.');
        }
      } else if (cleanDigits.length === 12) {
        const aadhaarHmac = this.encryptionService.computeAadhaarHmac(cleanDigits);
        const attendee = await this.prisma.attendee.findUnique({
          where: { aadhaarHmac },
        });
        if (!attendee) {
          throw new NotFoundException('No active booking found for this Aadhaar number.');
        }
        const attendeePhone = attendee.phone.replace(/\D/g, '');
        const last10Attendee = attendeePhone.slice(-10);
        const last10Verified = verifiedPhone.slice(-10);
        if (last10Attendee !== last10Verified) {
          throw new BadRequestException('The verified phone number does not match the phone number registered for this Aadhaar card.');
        }
      }
    }

    const attendeeWhereOr: any[] = [];

    // Search by 12-digit Aadhaar number (HMAC / Masked) if not resolved as phone
    if (!isPhone && cleanDigits.length === 12) {
      const aadhaarHmac = this.encryptionService.computeAadhaarHmac(cleanDigits);
      attendeeWhereOr.push({ aadhaarHmac });
      attendeeWhereOr.push({ aadhaarMasked: { contains: cleanDigits.slice(-4) } });
    } else {
      // Search by 10-digit mobile number
      const last10 = cleanDigits.slice(-10);
      attendeeWhereOr.push({ phone: { contains: last10 } });
    }

    const initialAttendees = await this.prisma.attendee.findMany({
      where: {
        OR: attendeeWhereOr,
      },
      include: { registrations: true },
    });

    if (!initialAttendees || initialAttendees.length === 0) {
      // Check if this phone number or Aadhaar belongs to an active Gazebo reservation
      const activeInquiry = await this.prisma.gazeboInquiry.findFirst({
        where: {
          OR: [
            { phone: { contains: cleanDigits.slice(-10) } },
            { notes: { contains: cleanDigits.slice(-10) } },
            ...(cleanDigits.length === 12 ? [{ notes: { contains: cleanDigits } }] : [])
          ],
          status: { notIn: [GazeboInquiryStatus.REJECTED, GazeboInquiryStatus.CANCELLED] }
        },
        include: { gazebo: true }
      });

      if (activeInquiry) {
        const isApproved = activeInquiry.status === GazeboInquiryStatus.APPROVED || activeInquiry.status === GazeboInquiryStatus.CONFIRMED;

        // Parse matching guest from notes
        let guestName = activeInquiry.fullName;
        let guestPhone = activeInquiry.phone;
        let guestAadhaar = 'In Gazebo Record';
        let isHost = true;
        let guestIdx = 1;

        if (activeInquiry.notes) {
          const lines = activeInquiry.notes.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(cleanDigits.slice(-10)) || (cleanDigits.length === 12 && line.includes(cleanDigits))) {
              const nameMatch = line.match(/Guest \d+:\s*([^|]+)/);
              const phoneMatch = line.match(/Ph:\s*([^|]+)/);
              const aadhMatch = line.match(/Aadh:\s*(\d{12})/);
              if (nameMatch) guestName = nameMatch[1].trim();
              if (phoneMatch) guestPhone = phoneMatch[1].trim();
              if (aadhMatch) guestAadhaar = `XXXX XXXX ${aadhMatch[1].slice(-4)}`;
              isHost = (i === 0 || line.includes('Guest 1:'));
              guestIdx = i + 1;
              break;
            }
          }
        }

        const gzbNum = activeInquiry.gazebo?.gazeboNumber || (activeInquiry.notes?.match(/REQUESTED GAZEBO:\s*#?([^\n\r]+)/)?.[1]?.trim() || `Level ${activeInquiry.level}`);
        const passSeq = activeInquiry.inquiryNumber || activeInquiry.id.slice(0, 6).toUpperCase();
        const passCode = `SS26-GZB-${gzbNum.replace(/#/g, '')}-${guestIdx}`;
        const secureToken = `ss_gzb_${activeInquiry.id}_${guestPhone.replace(/\D/g, '').slice(-10) || guestIdx}`;

        return {
          success: true,
          data: [{
            attendeeId: `${activeInquiry.id}-g${guestIdx}`,
            attendeeName: guestName,
            phone: guestPhone,
            gender: isHost ? 'VIP HOST' : 'VIP GUEST',
            aadhaarMasked: guestAadhaar,
            registrationId: activeInquiry.id,
            registrationNumber: activeInquiry.inquiryNumber || `GZB-INQ-${activeInquiry.id.slice(0, 6).toUpperCase()}`,
            registrationStatus: isApproved ? 'PASS_ISSUED' : 'UNDER_REVIEW',
            attendeeStatus: isApproved ? 'PASS_ISSUED' : 'UNDER_REVIEW',
            passType: 'GAZEBO',
            paymentLinkId: null,
            amountDue: activeInquiry.gazebo?.price ? Number(activeInquiry.gazebo.price) : (activeInquiry.level === 3 ? 125000 : activeInquiry.level === 2 ? 100000 : 85000),
            reviewNotes: isApproved 
              ? `Your VIP Gazebo reservation (${gzbNum}) is Approved! Your digital access pass is active.`
              : `Your VIP Gazebo reservation is currently under review by our executive concierge.`,
            submittedAt: activeInquiry.createdAt,
            hasActivePass: isApproved,
            hasUsedPass: false,
            credential: isApproved ? {
              credentialNumber: `PASS-GZB-${passSeq}`,
              passCode,
              secureToken,
              status: CredentialStatus.ACTIVE,
              issuedAt: activeInquiry.createdAt,
              usedAt: null,
            } : null,
            isPaymentPending: false,
            isUnderReview: !isApproved,
            isRejected: false,
            isCancelled: false,
            isPrimary: isHost,
          }],
          message: `Active Gazebo reservation found.`,
        };
      }

      return {
        success: true,
        data: [],
        message: `No booking records found for "${query}".`,
      };
    }

    const registrationIds = Array.from(
      new Set(initialAttendees.flatMap((att) => att.registrations.map((r) => r.registrationId)))
    );

    const attendees = await this.prisma.attendee.findMany({
      where: {
        registrations: {
          some: { registrationId: { in: registrationIds } }
        }
      },
      include: {
        registrations: {
          where: { registrationId: { in: registrationIds } },
          include: {
            registration: {
              include: {
                pricingPhase: true,
                credentials: true,
                payments: true,
              },
            },
          },
          orderBy: { registration: { createdAt: 'desc' } },
        },
        credentials: {
          where: { registrationId: { in: registrationIds } },
          include: {
            registration: true,
          },
          orderBy: { issuedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const passes = [];

    for (const att of attendees) {
      const regAttList = att.registrations || [];

      // Check if this attendee has any active or used credential
      const activeCred = att.credentials.find(
        (c) => c.status === CredentialStatus.ACTIVE || c.status === CredentialStatus.USED
      );

      // Check if attendee is part of an active/pending registration where this attendee is NOT rejected
      const activeRegLink = regAttList.find((ra) => {
        const r = ra.registration;
        const isRegActive =
          r.status === RegistrationStatus.PASS_ISSUED ||
          r.status === RegistrationStatus.PAYMENT_PENDING ||
          r.status === RegistrationStatus.APPROVED ||
          r.status === RegistrationStatus.SUBMITTED ||
          r.status === RegistrationStatus.UNDER_REVIEW;
        return isRegActive && ra.status !== RegistrationStatus.REJECTED;
      });

      if (activeCred || activeRegLink) {
        // Attendee has an ACTIVE or APPROVED/PENDING pass!
        // Push ONLY the active pass / current registration.
        // DO NOT show old historical rejected cards for this attendee!
        const targetReg = activeCred?.registration || activeRegLink?.registration;
        if (targetReg) {
          passes.push({
            attendeeId: att.id,
            attendeeName: att.fullName,
            phone: att.phone,
            gender: att.gender,
            aadhaarMasked: att.aadhaarMasked,
            registrationId: targetReg.id,
            registrationNumber: targetReg.registrationNumber,
            registrationStatus: targetReg.status,
            attendeeStatus: activeRegLink?.status || (activeCred ? 'PASS_ISSUED' : targetReg.status),
            passType: targetReg.passType,
            paymentLinkId: targetReg.paymentLinkId,
            amountDue: Number(targetReg.amountDue),
            reviewNotes: activeRegLink?.reviewNotes || targetReg.reviewNotes,
            submittedAt: targetReg.createdAt,
            hasActivePass: Boolean(activeCred && activeCred.status === CredentialStatus.ACTIVE),
            hasUsedPass: Boolean(activeCred && activeCred.status === CredentialStatus.USED),
            credential: activeCred
              ? {
                  credentialNumber: activeCred.credentialNumber,
                  passCode: activeCred.passCode,
                  secureToken: activeCred.secureToken,
                  status: activeCred.status,
                  issuedAt: activeCred.issuedAt,
                  usedAt: activeCred.usedAt,
                }
              : null,
            isPaymentPending:
              targetReg.status === RegistrationStatus.APPROVED ||
              targetReg.status === RegistrationStatus.PAYMENT_PENDING,
            isUnderReview:
              targetReg.status === RegistrationStatus.SUBMITTED ||
              targetReg.status === RegistrationStatus.UNDER_REVIEW,
            isRejected: false,
            isCancelled: targetReg.status === RegistrationStatus.CANCELLED,
            isPrimary: activeRegLink?.isPrimary || false,
          });
        }
      } else {
        // Attendee has NO active/pending pass, and their latest decision is REJECTED.
        // Push ONLY their latest rejected record so they can read the specific note and click "Apply Again".
        const latestRegAtt = regAttList[0];
        if (latestRegAtt) {
          const reg = latestRegAtt.registration;
          passes.push({
            attendeeId: att.id,
            attendeeName: att.fullName,
            phone: att.phone,
            gender: att.gender,
            aadhaarMasked: att.aadhaarMasked,
            registrationId: reg.id,
            registrationNumber: reg.registrationNumber,
            registrationStatus: 'REJECTED',
            attendeeStatus: 'REJECTED',
            passType: reg.passType,
            paymentLinkId: null,
            amountDue: Number(reg.amountDue),
            reviewNotes:
              latestRegAtt.reviewNotes ||
              reg.reviewNotes ||
              'Aadhaar document verification failed. Please upload a clear document and apply again.',
            submittedAt: reg.createdAt,
            hasActivePass: false,
            hasUsedPass: false,
            credential: null,
            isPaymentPending: false,
            isUnderReview: false,
            isRejected: true,
            isCancelled: false,
          });
        }
      }
    }

    // Status Hierarchy Sorting:
    // 1. PASS_ISSUED
    // 2. PAYMENT_PENDING
    // 3. UNDER_REVIEW
    // 4. REJECTED / CANCELLED
    // Secondary Sort: Latest submission date first (createdAt descending)
    const statusWeight: Record<string, number> = {
      PASS_ISSUED: 1,
      PAYMENT_PENDING: 2,
      APPROVED: 2,
      UNDER_REVIEW: 3,
      SUBMITTED: 3,
      REJECTED: 4,
      CANCELLED: 5,
    };

    passes.sort((a, b) => {
      const weightA = statusWeight[a.registrationStatus] || 99;
      const weightB = statusWeight[b.registrationStatus] || 99;
      if (weightA !== weightB) {
        return weightA - weightB;
      }
      return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
    });

    return {
      success: true,
      data: passes,
    };
  }

  async sendWalletOtp(query: string) {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Valid phone number or Aadhaar number is required');
    }

    const resolved = await this.resolveQueryToAttendeeAndPhone(query);
    if (!resolved.attendee) {
      if (resolved.isPhone || resolved.cleanDigits.length === 10) {
        throw new BadRequestException('No active booking found for the provided phone number.');
      } else if (resolved.cleanDigits.length === 12) {
        throw new BadRequestException('No active booking found for the provided Aadhaar number.');
      } else {
        throw new BadRequestException('Please enter a valid 10-digit mobile number, 12-digit Aadhaar number, or Registration Number.');
      }
    }
    const targetPhone = resolved.targetPhone;

    const bypassPhoneKey = targetPhone.replace(/\D/g, '').slice(-10);
    const checkBypass = await this.prisma.otpBypass.findUnique({
      where: { phone: bypassPhoneKey },
    });
    if (checkBypass) {
      return {
        success: true,
        data: { bypassed: true, maskedPhone: 'Bypassed', phone: targetPhone },
        message: 'OTP verification bypassed for this number.',
      };
    }

    const otpResult = await this.authService.sendWhatsAppOtp(targetPhone);
    if (!otpResult.success) {
      throw new BadRequestException(otpResult.message || 'Failed to send OTP');
    }

    const cleanTargetPhone = targetPhone.replace(/\D/g, '');
    const maskedPhone = cleanTargetPhone.length > 4
      ? `+${cleanTargetPhone.slice(0, cleanTargetPhone.length - 4).replace(/./g, '*')} ${cleanTargetPhone.slice(-4)}`
      : '****';

    return {
      success: true,
      data: { maskedPhone, phone: targetPhone },
      message: `WhatsApp OTP sent successfully to your registered number ending in ${cleanTargetPhone.slice(-4)}.`,
    };
  }

  async verifyWalletOtp(query: string, code: string) {
    const resolved = await this.resolveQueryToAttendeeAndPhone(query);
    if (!resolved.attendee) {
      if (resolved.isPhone || resolved.cleanDigits.length === 10) {
        throw new BadRequestException('No active booking found for the provided phone number.');
      } else if (resolved.cleanDigits.length === 12) {
        throw new BadRequestException('No active booking found for the provided Aadhaar number.');
      } else {
        throw new BadRequestException('Please enter a valid 10-digit mobile number, 12-digit Aadhaar number, or Registration Number.');
      }
    }
    const targetPhone = resolved.targetPhone;

    const cleanTargetPhone = targetPhone.replace(/\D/g, '').slice(-10);
    const checkBypass = await this.prisma.otpBypass.findUnique({
      where: { phone: cleanTargetPhone },
    });
    if (checkBypass) {
      const passesResult = await this.findMyPass(query);
      return {
        success: true,
        data: {
          otpToken: '',
          passes: passesResult.data,
        },
        message: 'OTP verified successfully (bypassed).',
      };
    }

    const verifyResult = await this.authService.verifyWhatsAppOtp(targetPhone, code);
    if (!verifyResult.success) {
      throw new BadRequestException(verifyResult.message || 'Failed to verify OTP');
    }

    const passesResult = await this.findMyPass(query, verifyResult.data.otpToken);

    return {
      success: true,
      data: {
        otpToken: verifyResult.data.otpToken,
        passes: passesResult.data,
      },
      message: 'OTP verified successfully.',
    };
  }
}
