// ============================================================================
// AUTH MODULE - Authentication operations
// ============================================================================

import { authHttpClient } from './httpClient';
import {
  LoginReqDTO,
  LoginResDTO,
  OAuthLoginReqDTO,
  RefreshTokenReqDTO,
  RefreshTokenResDTO,
  VerifyTokenResDTO,
  RevokeTokenReqDTO,
} from '../../dtos/auth';
import { ApiResponseDTO } from '../../dtos/common';

/**
 * AuthModule - Handles all authentication operations
 * 
 * Responsibilities:
 * - Login/Logout
 * - Token refresh
 * - Token verification
 * - OAuth authentication
 */
class AuthModule {
  private static instance: AuthModule;

  private constructor() {}

  static getInstance(): AuthModule {
    if (!AuthModule.instance) {
      AuthModule.instance = new AuthModule();
    }
    return AuthModule.instance;
  }

  // ============================================================================
  // LOGIN / LOGOUT
  // ============================================================================

  /**
   * Login with email and password
   */
  async login(credentials: LoginReqDTO): Promise<ApiResponseDTO<LoginResDTO>> {
    const response = await authHttpClient.post<LoginResDTO>('/auth/login', credentials);
    
    if (response.success && response.data) {
      authHttpClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Login with OAuth provider
   */
  async oauthLogin(request: OAuthLoginReqDTO): Promise<ApiResponseDTO<LoginResDTO>> {
    const response = await authHttpClient.post<LoginResDTO>('/auth/oauth/login', request);
    
    if (response.success && response.data) {
      authHttpClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Logout current session
   */
  async logout(): Promise<ApiResponseDTO<void>> {
    const response = await authHttpClient.post<void>('/auth/logout');
    authHttpClient.clearTokens();
    return response;
  }

  /**
   * Logout all sessions
   */
  async logoutAll(): Promise<ApiResponseDTO<void>> {
    const response = await authHttpClient.post<void>('/auth/logout-all');
    authHttpClient.clearTokens();
    return response;
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /**
   * Refresh access token
   */
  async refreshToken(request: RefreshTokenReqDTO): Promise<ApiResponseDTO<RefreshTokenResDTO>> {
    const response = await authHttpClient.post<RefreshTokenResDTO>('/auth/refresh', request);
    
    if (response.success && response.data) {
      authHttpClient.setTokens(response.data.accessToken, response.data.refreshToken);
    }
    
    return response;
  }

  /**
   * Verify current access token
   */
  async verifyToken(): Promise<ApiResponseDTO<VerifyTokenResDTO>> {
    return authHttpClient.get<VerifyTokenResDTO>('/auth/verify');
  }

  /**
   * Revoke refresh token
   */
  async revokeToken(request: RevokeTokenReqDTO): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/auth/revoke', request);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return authHttpClient.isAuthenticated();
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return authHttpClient.getAccessToken();
  }

  /**
   * Clear stored tokens (local logout)
   */
  clearSession(): void {
    authHttpClient.clearTokens();
  }
}

export const authModule = AuthModule.getInstance();
export default AuthModule;

