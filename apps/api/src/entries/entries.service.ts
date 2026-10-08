import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanResult, CredentialStatus, EntryType, VerificationMethod, Role, PassType, RegistrationStatus } from '@prisma/client';

@Injectable()
export class EntriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(type?: EntryType) {
    const where: any = {};
    if (type) where.entryType = type;

    const entries = await this.prisma.entry.findMany({
      where,
      include: {
        attendee: {
          select: { id: true, fullName: true, phone: true, gender: true, aadhaarMasked: true },
        },
        registration: {
          select: { id: true, registrationNumber: true, passType: true },
        },
        credential: {
          select: { id: true, credentialNumber: true, passCode: true, secureToken: true },
        },
        verifiedBy: {
          select: { id: true, fullName: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return { success: true, data: entries };
  }

  async getLiveGateStats(scannedById: string, gateId?: string) {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });

    const eventId = activeEvent?.id;

    // Start of today (00:00:00 local time)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Total valid scans performed by this scanner operator TODAY
    const myScansCount = await this.prisma.scanAttempt.count({
      where: {
        scannedById: scannedById,
        result: ScanResult.VALID,
        scannedAt: { gte: todayStart },
        ...(eventId ? { eventId } : {}),
      },
    });

    // Total valid scans for the specified gate TODAY
    const gateScansCount = gateId
      ? await this.prisma.scanAttempt.count({
          where: {
            gateId: gateId,
            result: ScanResult.VALID,
            scannedAt: { gte: todayStart },
            ...(eventId ? { eventId } : {}),
          },
        })
      : 0;

    // 1. Calculate Total Issued Passes per category (All Active / Used Credentials)
    const credentials = await this.prisma.credential.findMany({
      select: {
        registration: { select: { passType: true } },
      },
    });

    let issuedCouple = 0;
    let issuedSingle = 0;
    let issuedKids = 0;
    let issuedGazebo = 0;

    for (const cred of credentials) {
      const pt = cred.registration?.passType;
      if (pt === PassType.COUPLE) issuedCouple++;
      else if (pt === PassType.SINGLE) issuedSingle++;
      else if (pt === PassType.KIDS) issuedKids++;
      else if (pt === PassType.GAZEBO) issuedGazebo++;
    }

    // Query registrations to ensure total passes accurately reflect registered attendees
    const regCounts = await this.prisma.registration.groupBy({
      by: ['passType'],
      where: {
        deletedAt: null,
        status: { notIn: [RegistrationStatus.REJECTED, RegistrationStatus.CANCELLED] },
      },
      _count: { id: true },
    });

    for (const r of regCounts) {
      if (r.passType === PassType.COUPLE) issuedCouple = Math.max(issuedCouple, r._count.id);
      else if (r.passType === PassType.SINGLE) issuedSingle = Math.max(issuedSingle, r._count.id);
      else if (r.passType === PassType.KIDS) issuedKids = Math.max(issuedKids, r._count.id);
      else if (r.passType === PassType.GAZEBO) issuedGazebo = Math.max(issuedGazebo, r._count.id);
    }

    // 2. Attendance breakdown by pass type from created entries TODAY
    const allEntries = await this.prisma.entry.findMany({
      where: {
        createdAt: { gte: todayStart },
        ...(eventId ? { eventId } : {}),
      },
      include: {
        registration: { select: { passType: true } },
        credential: {
          select: {
            registration: { select: { passType: true } },
          },
        },
      },
    });

    let coupleCount = 0;
    let singleCount = 0;
    let kidsCount = 0;
    let gazeboCount = 0;

    for (const entry of allEntries) {
      let pt = entry.registration?.passType || entry.credential?.registration?.passType;

      if (!pt && entry.gateId) {
        if (entry.gateId === 'GATE_1') pt = PassType.COUPLE;
        else if (entry.gateId === 'GATE_2') pt = PassType.SINGLE;
        else if (entry.gateId === 'GATE_3') pt = PassType.KIDS;
        else if (entry.gateId === 'GATE_4') pt = PassType.GAZEBO;
      }

      if (!pt && entry.notes) {
        const notesUpper = entry.notes.toUpperCase();
        if (notesUpper.includes('COUPLE')) pt = PassType.COUPLE;
        else if (notesUpper.includes('SINGLE') || notesUpper.includes('FEMALE')) pt = PassType.SINGLE;
        else if (notesUpper.includes('KIDS')) pt = PassType.KIDS;
        else if (notesUpper.includes('GAZEBO')) pt = PassType.GAZEBO;
      }

      if (!pt) {
        pt = PassType.COUPLE;
      }

      if (pt === PassType.COUPLE) coupleCount++;
      else if (pt === PassType.SINGLE) singleCount++;
      else if (pt === PassType.KIDS) kidsCount++;
      else if (pt === PassType.GAZEBO) gazeboCount++;
    }

    // Gate-by-gate breakdown
    const gateCounts: Record<string, number> = {
      GATE_1: 0,
      GATE_2: 0,
      GATE_3: 0,
      GATE_4: 0,
      MASTER_ADMIN: 0,
    };

    const gateScanAttempts = await this.prisma.scanAttempt.findMany({
      where: {
        result: ScanResult.VALID,
        ...(eventId ? { eventId } : {}),
      },
      select: { gateId: true },
    });

    for (const scan of gateScanAttempts) {
      const g = scan.gateId || 'GATE_1';
      gateCounts[g] = (gateCounts[g] || 0) + 1;
    }

    return {
      success: true,
      data: {
        myScansCount,
        gateScansCount,
        totalAttendeesScanned: allEntries.length,
        breakdown: {
          couple: coupleCount,
          single: singleCount,
          kids: kidsCount,
          gazebo: gazeboCount,
        },
        metrics: {
          COUPLE: {
            issued: issuedCouple,
            scanned: coupleCount,
            remaining: Math.max(0, issuedCouple - coupleCount),
          },
          SINGLE: {
            issued: issuedSingle,
            scanned: singleCount,
            remaining: Math.max(0, issuedSingle - singleCount),
          },
          KIDS: {
            issued: issuedKids,
            scanned: kidsCount,
            remaining: Math.max(0, issuedKids - kidsCount),
          },
          GAZEBO: {
            issued: issuedGazebo,
            scanned: gazeboCount,
            remaining: Math.max(0, issuedGazebo - gazeboCount),
          },
        },
        gateBreakdown: gateCounts,
      },
    };
  }

  // Atomic QR scan with Gate Pass Validation & Master Admin Override
  async scanQr(data: { token: string; gateId?: string; scannedById: string; userRole?: Role }) {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!activeEvent) {
      return {
        success: true,
        data: {
          status: 'NOT_VALID',
          reason: ScanResult.WRONG_EVENT,
          scannedAt: new Date().toISOString(),
        },
      };
    }

    const cleanToken = data.token ? data.token.trim() : '';
    const gateId = data.gateId || 'GATE_1';
    const userRole = data.userRole;

    // Step 1: Look up Credential by secureToken (or passCode in test mode)
    const credential = await this.prisma.credential.findFirst({
      where: {
        OR: [{ secureToken: cleanToken }, { passCode: cleanToken }, { credentialNumber: cleanToken }],
      },
      include: {
        attendee: true,
        registration: true,
      },
    });

    // Step 2: Handle Invalid Token
    if (!credential) {
      await this.prisma.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: null,
          scannedById: data.scannedById,
          gateId: gateId,
          result: ScanResult.INVALID_TOKEN,
          rawTokenScanned: cleanToken,
        },
      });
      return {
        success: true,
        data: {
          status: 'NOT_VALID',
          reason: ScanResult.INVALID_TOKEN,
          scannedAt: new Date().toISOString(),
        },
      };
    }

    // Step 3: Check Gate Specific Pass Restrictions
    const passType = credential.registration?.passType;
    let isAllowedForGate = false;

    if (userRole === Role.SUPER_ADMIN || gateId === 'MASTER_ADMIN') {
      isAllowedForGate = true;
    } else if (gateId === 'GATE_1' && passType === PassType.COUPLE) {
      isAllowedForGate = true;
    } else if (gateId === 'GATE_2' && passType === PassType.SINGLE) {
      isAllowedForGate = true;
    } else if (gateId === 'GATE_3' && passType === PassType.KIDS) {
      isAllowedForGate = true;
    } else if (gateId === 'GATE_4' && passType === PassType.GAZEBO) {
      isAllowedForGate = true;
    }

    if (!isAllowedForGate) {
      const gateNames: Record<string, string> = {
        GATE_1: 'COUPLE PASS ONLY',
        GATE_2: 'FEMALE / SINGLE PASS ONLY',
        GATE_3: 'KIDS PASS ONLY',
        GATE_4: 'GAZEBO PASS ONLY',
      };
      const requiredName = gateNames[gateId] || 'MATCHING PASS';

      await this.prisma.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: credential.id,
          scannedById: data.scannedById,
          gateId: gateId,
          result: ScanResult.WRONG_GATE,
          rawTokenScanned: cleanToken,
        },
      });

      return {
        success: true,
        data: {
          status: 'NOT_VALID',
          reason: ScanResult.WRONG_GATE,
          message: `${gateId.replace('_', ' ')} ACCEPTS ${requiredName}. Scanned Pass: ${passType || 'UNKNOWN'}`,
          attendeeName: credential.attendee?.fullName,
          passType: passType,
          passCode: credential.passCode,
          registrationNumber: credential.registration?.registrationNumber,
          scannedAt: new Date().toISOString(),
        },
      };
    }

    // Step 4: Handle Cancelled Credential
    if (credential.status === CredentialStatus.CANCELLED) {
      await this.prisma.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: credential.id,
          scannedById: data.scannedById,
          gateId: gateId,
          result: ScanResult.CANCELLED,
          rawTokenScanned: cleanToken,
        },
      });
      return {
        success: true,
        data: {
          status: 'NOT_VALID',
          reason: ScanResult.CANCELLED,
          attendeeName: credential.attendee?.fullName,
          passType: credential.registration?.passType,
          passCode: credential.passCode,
          scannedAt: new Date().toISOString(),
        },
      };
    }

    // Step 5: Handle Already Used Credential
    if (credential.status === CredentialStatus.USED) {
      await this.prisma.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: credential.id,
          scannedById: data.scannedById,
          gateId: gateId,
          result: ScanResult.ALREADY_USED,
          rawTokenScanned: cleanToken,
        },
      });
      return {
        success: true,
        data: {
          status: 'NOT_VALID',
          reason: ScanResult.ALREADY_USED,
          attendeeName: credential.attendee?.fullName,
          passType: credential.registration?.passType,
          passCode: credential.passCode,
          registrationNumber: credential.registration?.registrationNumber,
          scannedAt: new Date().toISOString(),
        },
      };
    }

    // Step 6: Atomic Transaction with Row Locking
    return await this.prisma.$transaction(async (tx) => {
      const lockedRows: any[] = await tx.$queryRaw`
        SELECT id, status FROM "Credential"
        WHERE id = ${credential.id}
        FOR UPDATE
      `;

      if (!lockedRows || lockedRows.length === 0 || lockedRows[0].status !== 'ACTIVE') {
        await tx.scanAttempt.create({
          data: {
            eventId: activeEvent.id,
            credentialId: credential.id,
            scannedById: data.scannedById,
            gateId: gateId,
            result: ScanResult.ALREADY_USED,
            rawTokenScanned: cleanToken,
          },
        });
        return {
          success: true,
          data: {
            status: 'NOT_VALID',
            reason: ScanResult.ALREADY_USED,
            attendeeName: credential.attendee?.fullName,
            passType: credential.registration?.passType,
            passCode: credential.passCode,
            scannedAt: new Date().toISOString(),
          },
        };
      }

      const now = new Date();
      await tx.credential.update({
        where: { id: credential.id },
        data: {
          status: CredentialStatus.USED,
          usedAt: now,
        },
      });

      await tx.entry.create({
        data: {
          eventId: activeEvent.id,
          attendeeId: credential.attendeeId,
          registrationId: credential.registrationId,
          credentialId: credential.id,
          gateId: gateId,
          entryType: EntryType.QR,
          verificationMethod: VerificationMethod.QR_SCAN,
          verifiedById: data.scannedById,
        },
      });

      await tx.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: credential.id,
          scannedById: data.scannedById,
          gateId: gateId,
          result: ScanResult.VALID,
          rawTokenScanned: cleanToken,
        },
      });

      return {
        success: true,
        data: {
          status: 'VALID',
          attendeeName: credential.attendee.fullName,
          passType: credential.registration.passType,
          passCode: credential.passCode,
          registrationNumber: credential.registration.registrationNumber,
          scannedAt: now.toISOString(),
        },
      };
    });
  }

  async directEntry(data: {
    fullName: string;
    phone?: string;
    notes?: string;
    gateId?: string;
    verifiedById: string;
  }) {
    const activeEvent = await this.prisma.event.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (!activeEvent) {
      throw new BadRequestException('No active Safed Sheri event found');
    }

    const entry = await this.prisma.entry.create({
      data: {
        eventId: activeEvent.id,
        attendeeId: null,
        registrationId: null,
        credentialId: null,
        gateId: data.gateId || 'GATE_1',
        entryType: EntryType.DIRECT,
        verificationMethod: VerificationMethod.CASHIER,
        verifiedById: data.verifiedById,
        notes: `Direct Walk-in: ${data.fullName} (${data.phone || 'No phone'}) - ${data.notes || ''}`,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: data.verifiedById,
        action: 'DIRECT_ENTRY_GRANTED',
        targetEntity: 'Entry',
        targetId: entry.id,
        payload: { fullName: data.fullName, phone: data.phone, gateId: data.gateId },
      },
    });

    return {
      success: true,
      data: entry,
      message: `Direct Walk-in Entry Granted for ${data.fullName}`,
    };
  }
}
