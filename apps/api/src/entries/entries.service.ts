import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScanResult, CredentialStatus, EntryType, VerificationMethod } from '@prisma/client';

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

  // Atomic QR scan with SELECT ... FOR UPDATE row locking
  async scanQr(data: { token: string; scannedById: string }) {
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

    // Step 3: Handle Cancelled Credential
    if (credential.status === CredentialStatus.CANCELLED) {
      await this.prisma.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: credential.id,
          scannedById: data.scannedById,
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

    // Step 4: Handle Already Used Credential
    if (credential.status === CredentialStatus.USED) {
      await this.prisma.scanAttempt.create({
        data: {
          eventId: activeEvent.id,
          credentialId: credential.id,
          scannedById: data.scannedById,
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

    // Step 5: Atomic Transaction with Row Locking
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

      const entry = await tx.entry.create({
        data: {
          eventId: activeEvent.id,
          attendeeId: credential.attendeeId,
          registrationId: credential.registrationId,
          credentialId: credential.id,
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
        payload: { fullName: data.fullName, phone: data.phone },
      },
    });

    return {
      success: true,
      data: entry,
      message: `Direct Walk-in Entry Granted for ${data.fullName}`,
    };
  }
}
