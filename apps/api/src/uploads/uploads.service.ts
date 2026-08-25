import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as Tesseract from 'tesseract.js';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
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

  async extractAadhaarData(fileBuffer: Buffer, side: string = 'front'): Promise<any> {
    this.logger.log('Starting OCR extraction with Tesseract.js...');
    try {
      const { data: { text } } = await Tesseract.recognize(fileBuffer, 'eng');
      this.logger.log(`OCR Extraction complete. Raw text length: ${text.length}`);

      const lowerText = text.toLowerCase();
      
      if (side === 'front') {
        if (!lowerText.includes('government of india') && !lowerText.includes('dob') && !lowerText.includes('year of birth')) {
           const numberMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
           if (!numberMatch) {
              throw new BadRequestException('Invalid Document. Please upload the FRONT side of a clear Aadhaar card.');
           }
        }
      } else if (side === 'back') {
        const isBack = lowerText.includes('address') || lowerText.includes('pin') || lowerText.includes('unique identification') || lowerText.includes('c/o') || lowerText.includes('s/o') || lowerText.includes('w/o') || lowerText.includes('d/o') || lowerText.includes('uidai.gov.in') || lowerText.includes('1947') || lowerText.includes('enrollment no') || lowerText.match(/\b\d{6}\b/);
        
        if (!isBack) {
           throw new BadRequestException('Invalid Document. Please upload the BACK side of a clear Aadhaar card, or a full E-Aadhaar document.');
        }
      }

      const aadhaarMatch = text.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      const aadhaarNumber = aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : null;

      const dobMatch = text.match(/(?:DOB|Date of Birth|Year of Birth|YOB)[\s:]*(\d{2}\/\d{2}\/\d{4}|\d{4})/i);
      const dob = dobMatch ? dobMatch[1] : null;

      const genderMatch = text.match(/\b(MALE|FEMALE|TRANSGENDER)\b/i);
      const gender = genderMatch ? genderMatch[1].toUpperCase() : null;

      let name = null;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const dobLineIndex = lines.findIndex(l => /(?:DOB|Year of Birth|YOB)/i.test(l));
      if (dobLineIndex > 0) {
        const potentialName = lines[dobLineIndex - 1];
        if (potentialName && !potentialName.toLowerCase().includes('government')) {
          name = potentialName.replace(/[^a-zA-Z\s.]/g, '').replace(/\s+/g, ' ').trim();
        }
      }

      return {
        aadhaarNumber,
        dob,
        gender,
        name,
        rawText: text
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('OCR Extraction failed', error);
      throw new BadRequestException('Failed to process image. Please upload a clearer image.');
    }
  }
}
