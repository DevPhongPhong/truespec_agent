// ============================================================================
// TOKEN REQUEST DTOs
// ============================================================================

/**
 * Refresh token request
 */
export interface RefreshTokenReqDTO {
  refreshToken: string;
}

/**
 * Verify token request
 */
export interface VerifyTokenReqDTO {
  accessToken: string;
}

/**
 * Revoke token request
 */
export interface RevokeTokenReqDTO {
  refreshToken: string;
  revokeAll?: boolean; // Revoke all sessions
}

