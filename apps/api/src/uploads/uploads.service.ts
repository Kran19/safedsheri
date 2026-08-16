import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class UploadsService {
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads', 'documents');
  private readonly allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  private readonly maxSizeBytes = 5 * 1024 * 1024; // 5MB

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveAadhaarDocument(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
  }) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Aadhaar document file is mandatory');
    }

    if (!this.allowedMimes.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestException('Invalid file format. Allowed formats: JPEG, PNG, WebP, PDF');
    }

    if (file.size > this.maxSizeBytes) {
      throw new BadRequestException('File size exceeds the 5MB maximum limit');
    }

    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const ext = path.extname(file.originalname) || '.dat';
    const randomName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, randomName);

    await fs.promises.writeFile(filePath, file.buffer);

    return {
      storageKey: randomName,
      originalFilename: path.basename(file.originalname),
      mimeType: file.mimetype,
      sizeBytes: file.size,
      checksum,
    };
  }

  async getDocumentFile(storageKey: string) {
    // Sanitize to prevent path traversal
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Requested Aadhaar document not found');
    }

    return {
      filePath,
      stream: fs.createReadStream(filePath),
    };
  }
}
