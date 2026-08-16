import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly secretKey: Buffer;
  private readonly hmacSecret: string;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
    this.secretKey = Buffer.from(keyString.padEnd(32, '0').slice(0, 32));
    this.hmacSecret = process.env.AADHAAR_HMAC_SECRET || 'safed_sheri_2026_aadhaar_hmac_secret_key_prod';
  }

  encrypt(text: string): string {
    if (!text) return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) return '';
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encryptedText = parts[2];

      const decipher = crypto.createDecipheriv('aes-256-gcm', this.secretKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '[Decryption Error]';
    }
  }

  computeAadhaarHmac(aadhaar: string): string {
    if (!aadhaar) return '';
    const normalized = aadhaar.replace(/\s+/g, '').trim();
    return crypto
      .createHmac('sha256', this.hmacSecret)
      .update(normalized)
      .digest('hex');
  }

  maskAadhaar(aadhaar: string): string {
    if (!aadhaar) return '';
    const clean = aadhaar.replace(/\s+/g, '');
    if (clean.length < 4) return 'XXXX XXXX XXXX';
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }
}
