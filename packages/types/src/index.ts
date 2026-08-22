export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TICKETING_FINANCE = 'TICKETING_FINANCE',
  ENTRY_VERIFICATION = 'ENTRY_VERIFICATION',
  ATTENDEE = 'ATTENDEE',
  // Backward compatibility aliases
  CASHIER = 'TICKETING_FINANCE',
  SECURITY = 'ENTRY_VERIFICATION',
}

export enum Gender {
  FEMALE = 'FEMALE',
  MALE = 'MALE',
  OTHER = 'OTHER',
}

export enum PassType {
  SINGLE = 'SINGLE',
  COUPLE = 'COUPLE',
  GAZEBO = 'GAZEBO',
}

export enum RegistrationStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PASS_ISSUED = 'PASS_ISSUED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum PaymentMethod {
  ONLINE_GATEWAY = 'ONLINE_GATEWAY',
  UPI_QR = 'UPI_QR',
  CUSTOM_DIRECT = 'CUSTOM_DIRECT',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum CredentialStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum ScanResult {
  VALID = 'VALID',
  ALREADY_USED = 'ALREADY_USED',
  CANCELLED = 'CANCELLED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  WRONG_EVENT = 'WRONG_EVENT',
  PAYMENT_NOT_CONFIRMED = 'PAYMENT_NOT_CONFIRMED',
  EXPIRED = 'EXPIRED',
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
  APPROVED = 'APPROVED',
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
  passType?: PassType;
  passCode?: string;
  attendeeCount?: number;
  registrationNumber?: string;
  scannedAt: string;
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
  passType?: PassType;
  passCode?: string;
  attendeeCount?: number;
  registrationNumber?: string;
  scannedAt: string;
}

export interface AttendeeInput {
  fullName: string;
  phone: string;
  email?: string;
  gender: Gender;
  aadhaarNumber: string;
  documentKey: string;
  documentName: string;
  originalFilename?: string;
  documentBackKey?: string;
  documentBackName?: string;
  documentBackMimeType?: string;
  documentBackSizeBytes?: number;
  documentBackChecksum?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  kidsAgeGroup?: string;
}
