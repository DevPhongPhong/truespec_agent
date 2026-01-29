// ============================================================================
// USER RESPONSE DTOs
// ============================================================================

/**
 * Full user profile response
 */
export interface UserProfileResDTO {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'premium';
  isVerified: boolean;
  twoFactorEnabled: boolean;
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  subscription: SubscriptionResDTO;
  devices: UserDeviceResDTO[];
}

/**
 * User subscription info
 */
export interface SubscriptionResDTO {
  planId: string;
  planName: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'expired' | 'cancelled' | 'trial';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  maxDevices: number;
  features: string[];
}

/**
 * User registered device
 */
export interface UserDeviceResDTO {
  id: string;
  name: string;
  platform: 'windows' | 'macos' | 'linux';
  osVersion: string;
  lastSeenAt: string;
  isCurrentDevice: boolean;
  ipAddress?: string;
  location?: string;
}

/**
 * User session info
 */
export interface UserSessionResDTO {
  sessionId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  location?: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrentSession: boolean;
}

/**
 * Enable 2FA response
 */
export interface Enable2FAResDTO {
  secret?: string; // For TOTP
  qrCode?: string; // Base64 QR code image
  backupCodes: string[];
  message: string;
}

