// ============================================================================
// USER REQUEST DTOs
// ============================================================================

/**
 * Register new user request
 */
export interface RegisterUserReqDTO {
  email: string;
  password: string;
  fullName: string;
  displayName?: string;
  acceptTerms: boolean;
}

/**
 * Update user profile request
 */
export interface UpdateProfileReqDTO {
  fullName?: string;
  displayName?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  language?: string;
  timezone?: string;
}

/**
 * Change password request
 */
export interface ChangePasswordReqDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  logoutAllDevices?: boolean;
}

/**
 * Reset password request
 */
export interface ResetPasswordReqDTO {
  email: string;
}

/**
 * Confirm reset password request
 */
export interface ConfirmResetPasswordReqDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Enable 2FA request
 */
export interface Enable2FAReqDTO {
  type: 'totp' | 'sms' | 'email';
  phoneNumber?: string;
}

/**
 * Verify 2FA request
 */
export interface Verify2FAReqDTO {
  code: string;
  type: 'totp' | 'sms' | 'email';
}

