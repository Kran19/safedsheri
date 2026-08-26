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

      let dob: string | null = null;
      let calculatedAge: number | null = null;

      // Clean and normalize text for date recognition (handling OCR artifacts like 'O'/'o' for '0' and spaced slashes)
      const normalizedText = text
        .replace(/(\d)\s*[\/|\-|\.]\s*([0-9Oo]{1,2})\s*[\/|\-|\.]\s*([0-9Oo]{2,4})/g, (match, p1, p2, p3) => {
          const cleanP2 = p2.replace(/[Oo]/g, '0');
          const cleanP3 = p3.replace(/[Oo]/g, '0');
          return `${p1}/${cleanP2}/${cleanP3}`;
        });

      // Strategy 1: Look for DOB / Birth keyword followed by date with slashes, dashes, dots, or spaces
      // Examples: "DOB: 02/01/2014", "DOB: 02-01-2014", "DOB : 02 . 01 . 2014", "DOB: 02 01 2014"
      const dobWithDelimitersRegex = /(?:DOB|D\.O\.B|Date\s*of\s*Birth|जन्म\s*तारीख|जन्म\s*तिथि|जन्म|Birth)[\s:\/\-_\|]*(\d{1,2})[\s\/\-\.]+(\d{1,2})[\s\/\-\.]+(\d{2,4})/i;
      const match1 = normalizedText.match(dobWithDelimitersRegex) || text.match(dobWithDelimitersRegex);

      if (match1) {
        let day = match1[1].padStart(2, '0');
        let month = match1[2].padStart(2, '0');
        let year = match1[3];
        if (year.length === 2) {
          const yNum = parseInt(year, 10);
          year = yNum <= 30 ? `20${year}` : `19${year}`;
        }
        if (parseInt(month, 10) > 12 && parseInt(day, 10) <= 12) {
          const tmp = day; day = month; month = tmp;
        }
        const yNum = parseInt(year, 10);
        const mNum = parseInt(month, 10);
        const dNum = parseInt(day, 10);
        if (yNum >= 1930 && yNum <= new Date().getFullYear() && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
          dob = `${year}-${month}-${day}`;
        }
      }

      // Strategy 2: Look for DOB keyword followed by 8 continuous digits (DDMMYYYY) or 6 digits (DDMMYY)
      // Example from actual Aadhaar card OCR: "ow Af DOB: 02012014"
      if (!dob) {
        const dob8DigitsRegex = /(?:DOB|D\.O\.B|Date\s*of\s*Birth|जन्म\s*तारीख|जन्म\s*तिथि|जन्म|Birth)[\s:\/\-_\|]*(\d{2})(\d{2})(\d{4})/i;
        const match2 = normalizedText.match(dob8DigitsRegex) || text.match(dob8DigitsRegex);
        if (match2) {
          let day = match2[1].padStart(2, '0');
          let month = match2[2].padStart(2, '0');
          let year = match2[3];
          const yNum = parseInt(year, 10);
          const mNum = parseInt(month, 10);
          const dNum = parseInt(day, 10);
          if (yNum >= 1930 && yNum <= new Date().getFullYear() && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
            dob = `${year}-${month}-${day}`;
          }
        }
      }

      // Strategy 3: Year of Birth label match (e.g. "Year of Birth : 2014", "जन्म वर्ष : 2014", "YOB: 2014")
      if (!dob) {
        const yobRegex = /(?:Year\s*of\s*Birth|YOB|जन्म\s*वर्ष|वर्ष)[\s:\/\-_\|]*(\d{4})/i;
        const match3 = normalizedText.match(yobRegex) || text.match(yobRegex);
        if (match3) {
          const year = match3[1];
          const yNum = parseInt(year, 10);
          if (yNum >= 1930 && yNum <= new Date().getFullYear()) {
            dob = `${year}-01-01`;
          }
        }
      }

      // Strategy 4: Any standard date pattern in text (DD/MM/YYYY or DD-MM-YYYY)
      if (!dob) {
        const genericDateRegex = /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g;
        let match;
        while ((match = genericDateRegex.exec(normalizedText)) !== null) {
          let day = match[1].padStart(2, '0');
          let month = match[2].padStart(2, '0');
          let year = match[3];
          const yNum = parseInt(year, 10);
          const mNum = parseInt(month, 10);
          const dNum = parseInt(day, 10);

          if (yNum >= 1930 && yNum <= new Date().getFullYear() && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
            dob = `${year}-${month}-${day}`;
            break;
          }
        }
      }

      // Strategy 5: 8-digit date sequence near DOB line if separated
      if (!dob) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const dobIdx = lines.findIndex(l => /(?:DOB|Date of Birth|जन्म|YOB|Year of Birth)/i.test(l));
        if (dobIdx !== -1) {
          const combined = [lines[dobIdx], lines[dobIdx + 1] || ''].join(' ');
          const match8 = combined.match(/\b(\d{2})[\s\/\-\.]?(\d{2})[\s\/\-\.]?(\d{4})\b/);
          if (match8) {
            let day = match8[1];
            let month = match8[2];
            let year = match8[3];
            const yNum = parseInt(year, 10);
            const mNum = parseInt(month, 10);
            const dNum = parseInt(day, 10);
            if (yNum >= 1930 && yNum <= new Date().getFullYear() && mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
              dob = `${year}-${month}-${day}`;
            }
          }
        }
      }

      if (dob) {
        const [y, m, d] = dob.split('-').map(Number);
        const dobDate = new Date(y, m - 1, d);
        if (!isNaN(dobDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - dobDate.getFullYear();
          const mDiff = today.getMonth() - dobDate.getMonth();
          if (mDiff < 0 || (mDiff === 0 && today.getDate() < dobDate.getDate())) {
            age--;
          }
          calculatedAge = age;
        }
      }

      const genderMatch = text.match(/\b(MALE|FEMALE|TRANSGENDER)\b/i);
      const gender = genderMatch ? genderMatch[1].toUpperCase() : null;

      let name = null;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const dobLineIndex = lines.findIndex(l => /(?:DOB|Year of Birth|YOB|जन्म)/i.test(l));
      if (dobLineIndex > 0) {
        const potentialName = lines[dobLineIndex - 1];
        if (potentialName && !potentialName.toLowerCase().includes('government') && !potentialName.toLowerCase().includes('india')) {
          name = potentialName.replace(/[^a-zA-Z\s.]/g, '').replace(/\s+/g, ' ').trim();
        }
      }

      return {
        aadhaarNumber,
        dob,
        age: calculatedAge,
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
