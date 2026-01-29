// ============================================================================
// LOGIN RESPONSE DTO
// ============================================================================

/**
 * Login response payload
 */
export interface LoginResDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
  user: UserBasicResDTO;
}

/**
 * Basic user info returned after login
 */
export interface UserBasicResDTO {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  avatar?: string;
  role: 'user' | 'admin' | 'premium';
  isVerified: boolean;
}

