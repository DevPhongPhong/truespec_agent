// ============================================================================
// USER MODULE - User profile and settings operations
// ============================================================================

import { authHttpClient } from './httpClient';
import {
  RegisterUserReqDTO,
  UpdateProfileReqDTO,
  ChangePasswordReqDTO,
  ResetPasswordReqDTO,
  ConfirmResetPasswordReqDTO,
  Enable2FAReqDTO,
  Verify2FAReqDTO,
  UserProfileResDTO,
  UserSessionResDTO,
  Enable2FAResDTO,
} from '../../dtos/auth';
import { ApiResponseDTO, PaginationResDTO } from '../../dtos/common';

/**
 * UserModule - Handles user profile and account operations
 * 
 * Responsibilities:
 * - User registration
 * - Profile management
 * - Password operations
 * - Two-factor authentication
 * - Session management
 */
class UserModule {
  private static instance: UserModule;

  private constructor() {}

  static getInstance(): UserModule {
    if (!UserModule.instance) {
      UserModule.instance = new UserModule();
    }
    return UserModule.instance;
  }

  // ============================================================================
  // REGISTRATION
  // ============================================================================

  /**
   * Register new user
   */
  async register(data: RegisterUserReqDTO): Promise<ApiResponseDTO<{ userId: string }>> {
    return authHttpClient.post<{ userId: string }>('/users/register', data);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/verify-email', { token });
  }

  /**
   * Resend verification email
   */
  async resendVerification(email: string): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/resend-verification', { email });
  }

  // ============================================================================
  // PROFILE
  // ============================================================================

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponseDTO<UserProfileResDTO>> {
    return authHttpClient.get<UserProfileResDTO>('/users/me');
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileReqDTO): Promise<ApiResponseDTO<UserProfileResDTO>> {
    return authHttpClient.patch<UserProfileResDTO>('/users/me', data);
  }

  /**
   * Upload avatar image
   */
  async uploadAvatar(file: File): Promise<ApiResponseDTO<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // Special handling for file upload
    const response = await fetch(`${authHttpClient.getConfig().baseUrl}/users/me/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authHttpClient.getAccessToken()}`,
      },
      body: formData,
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      data: response.ok ? data.data : null,
      error: response.ok ? null : data.error,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Delete avatar
   */
  async deleteAvatar(): Promise<ApiResponseDTO<void>> {
    return authHttpClient.delete<void>('/users/me/avatar');
  }

  // ============================================================================
  // PASSWORD
  // ============================================================================

  /**
   * Change password
   */
  async changePassword(data: ChangePasswordReqDTO): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/me/password', data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(data: ResetPasswordReqDTO): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/password-reset', data);
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(data: ConfirmResetPasswordReqDTO): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/password-reset/confirm', data);
  }

  // ============================================================================
  // TWO-FACTOR AUTHENTICATION
  // ============================================================================

  /**
   * Enable 2FA
   */
  async enable2FA(data: Enable2FAReqDTO): Promise<ApiResponseDTO<Enable2FAResDTO>> {
    return authHttpClient.post<Enable2FAResDTO>('/users/me/2fa/enable', data);
  }

  /**
   * Verify and activate 2FA
   */
  async verify2FA(data: Verify2FAReqDTO): Promise<ApiResponseDTO<{ backupCodes: string[] }>> {
    return authHttpClient.post<{ backupCodes: string[] }>('/users/me/2fa/verify', data);
  }

  /**
   * Disable 2FA
   */
  async disable2FA(password: string): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/me/2fa/disable', { password });
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(password: string): Promise<ApiResponseDTO<{ backupCodes: string[] }>> {
    return authHttpClient.post<{ backupCodes: string[] }>('/users/me/2fa/backup-codes', { password });
  }

  // ============================================================================
  // SESSIONS
  // ============================================================================

  /**
   * Get active sessions
   */
  async getSessions(): Promise<ApiResponseDTO<UserSessionResDTO[]>> {
    return authHttpClient.get<UserSessionResDTO[]>('/users/me/sessions');
  }

  /**
   * Terminate specific session
   */
  async terminateSession(sessionId: string): Promise<ApiResponseDTO<void>> {
    return authHttpClient.delete<void>(`/users/me/sessions/${sessionId}`);
  }

  /**
   * Terminate all other sessions
   */
  async terminateAllOtherSessions(): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/me/sessions/terminate-others');
  }

  // ============================================================================
  // ACCOUNT
  // ============================================================================

  /**
   * Delete user account
   */
  async deleteAccount(password: string, reason?: string): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/users/me/delete', { password, reason });
  }

  /**
   * Export user data (GDPR)
   */
  async exportData(): Promise<ApiResponseDTO<{ downloadUrl: string; expiresAt: string }>> {
    return authHttpClient.get<{ downloadUrl: string; expiresAt: string }>('/users/me/export');
  }
}

export const userModule = UserModule.getInstance();
export default UserModule;

