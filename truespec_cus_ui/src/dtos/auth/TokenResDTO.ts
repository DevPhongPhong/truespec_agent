// ============================================================================
// TOKEN RESPONSE DTOs
// ============================================================================

/**
 * Refresh token response
 */
export interface RefreshTokenResDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/**
 * Verify token response
 */
export interface VerifyTokenResDTO {
  valid: boolean;
  userId?: string;
  expiresAt?: string;
  scopes?: string[];
}

