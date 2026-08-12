export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TICKETING_FINANCE = 'TICKETING_FINANCE',
  ENTRY_VERIFICATION = 'ENTRY_VERIFICATION',
  ATTENDEE = 'ATTENDEE',
  // Backward compatibility aliases
  CASHIER = 'TICKETING_FINANCE',
  SECURITY = 'ENTRY_VERIFICATION',
}

export enum RegistrationStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
}

export enum PaymentStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum CredentialStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
}

export enum ScanResult {
  VALID = 'VALID',
  ALREADY_USED = 'ALREADY_USED',
  CANCELLED = 'CANCELLED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  WRONG_EVENT = 'WRONG_EVENT',
  PAYMENT_NOT_CONFIRMED = 'PAYMENT_NOT_CONFIRMED',
}

export enum EntryType {
  QR = 'QR',
  DIRECT = 'DIRECT',
  MANUAL = 'MANUAL',
}

export enum VerificationMethod {
  QR_SCAN = 'QR_SCAN',
  CASHIER = 'CASHIER',
  MANUAL = 'MANUAL',
}

export enum GazeboStatus {
  AVAILABLE = 'AVAILABLE',
  HELD = 'HELD',
  CONFIRMED = 'CONFIRMED',
}

export enum GazeboInquiryStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  DISCUSSION = 'DISCUSSION',
  HOLD = 'HOLD',
  CONFIRMED = 'CONFIRMED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
}

export interface ScanResultResponse {
  status: 'VALID' | 'NOT_VALID';
  reason?: ScanResult;
  attendeeName?: string;
  registrationNumber?: string;
  scannedAt: string;
}
