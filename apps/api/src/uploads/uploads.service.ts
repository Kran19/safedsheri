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

      // Strategy 1: Explicit DOB label match (e.g. "DOB: 12/04/2014", "DOB / जन्म तारीख : 12/04/2014", "Date of Birth : 12-04-2014")
      const explicitDobRegex = /(?:DOB|D\.O\.B|Date\s*of\s*Birth|जन्म\s*तारीख|जन्म\s*तिथि|Birth)[\s:\/\-_\|]*(\d{1,2}\s*[\/\-\.]\s*\d{1,2}\s*[\/\-\.]\s*\d{2,4})/i;
      const explicitMatch = normalizedText.match(explicitDobRegex) || text.match(explicitDobRegex);

      if (explicitMatch) {
        const rawDate = explicitMatch[1].replace(/\s+/g, '');
        const parts = rawDate.split(/[\/\-\.]/);
        if (parts.length === 3) {
          let day = parts[0].padStart(2, '0');
          let month = parts[1].padStart(2, '0');
          let year = parts[2];
          if (year.length === 2) {
            const yNum = parseInt(year, 10);
            year = yNum <= 30 ? `20${year}` : `19${year}`;
          }
          if (parseInt(month, 10) > 12 && parseInt(day, 10) <= 12) {
            const tmp = day; day = month; month = tmp;
          }
          dob = `${year}-${month}-${day}`;
        }
      }

      // Strategy 2: Year of Birth label match (e.g. "Year of Birth : 2014", "जन्म वर्ष : 2014", "YOB: 2014")
      if (!dob) {
        const yobRegex = /(?:Year\s*of\s*Birth|YOB|जन्म\s*वर्ष|वर्ष)[\s:\/\-_\|]*(\d{4})/i;
        const yobMatch = normalizedText.match(yobRegex) || text.match(yobRegex);
        if (yobMatch) {
          const year = yobMatch[1];
          const yNum = parseInt(year, 10);
          if (yNum >= 1930 && yNum <= new Date().getFullYear()) {
            dob = `${year}-01-01`;
          }
        }
      }

      // Strategy 3: Any date pattern in DD/MM/YYYY or DD-MM-YYYY format
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
          } else if (yNum >= 1930 && yNum <= new Date().getFullYear() && dNum >= 1 && dNum <= 12 && mNum >= 1 && mNum <= 31) {
            dob = `${year}-${day}-${month}`;
            break;
          }
        }
      }

      // Strategy 4: Look across adjacent lines if DOB keyword and date are separated
      if (!dob) {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const dobIdx = lines.findIndex(l => /(?:DOB|Date of Birth|जन्म|YOB|Year of Birth)/i.test(l));
        if (dobIdx !== -1) {
          const searchLines = [lines[dobIdx], lines[dobIdx + 1] || ''].join(' ');
          const fallbackMatch = searchLines.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\b\d{4}\b)/);
          if (fallbackMatch) {
            if (fallbackMatch[1]) {
              const parts = fallbackMatch[1].replace(/\s+/g, '').split(/[\/\-\.]/);
              if (parts.length === 3) {
                dob = `${parts[2].length === 2 ? '20' + parts[2] : parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            } else if (fallbackMatch[2]) {
              const yNum = parseInt(fallbackMatch[2], 10);
              if (yNum >= 1930 && yNum <= new Date().getFullYear()) {
                dob = `${fallbackMatch[2]}-01-01`;
              }
            }
          }
        }
      }

      if (dob) {
        const dobDate = new Date(dob);
        if (!isNaN(dobDate.getTime())) {
          const diffMs = Date.now() - dobDate.getTime();
          calculatedAge = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
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
