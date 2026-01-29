// ============================================================================
// AUTH SERVER HTTP CLIENT - Base HTTP client for Auth Server
// ============================================================================

import { ApiResponseDTO, ApiErrorDTO } from '../../dtos/common';

export interface AuthServerConfig {
  baseUrl: string;
  timeout?: number;
  onUnauthorized?: () => void;
  onError?: (error: ApiErrorDTO) => void;
}

const DEFAULT_CONFIG: AuthServerConfig = {
  baseUrl: import.meta.env.VITE_AUTH_SERVER_URL || 'http://localhost:8080/api',
  timeout: 30000,
};

class AuthHttpClient {
  private config: AuthServerConfig;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: Partial<AuthServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadTokensFromStorage();
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  private loadTokensFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('luna_access_token');
      this.refreshToken = localStorage.getItem('luna_refresh_token');
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('luna_access_token', accessToken);
    localStorage.setItem('luna_refresh_token', refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('luna_access_token');
    localStorage.removeItem('luna_refresh_token');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponseDTO<T>> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>('GET', url);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponseDTO<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('POST', url, body);
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponseDTO<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('PUT', url, body);
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponseDTO<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('PATCH', url, body);
  }

  async delete<T>(endpoint: string): Promise<ApiResponseDTO<T>> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('DELETE', url);
  }

  // ============================================================================
  // INTERNAL METHODS
  // ============================================================================

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    url: string,
    body?: unknown,
    isRetry = false
  ): Promise<ApiResponseDTO<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 Unauthorized
      if (response.status === 401 && !isRetry) {
        const refreshed = await this.tryRefreshToken();
        if (refreshed) {
          return this.request<T>(method, url, body, true);
        }
        this.config.onUnauthorized?.();
        throw new Error('Unauthorized');
      }

      const data = await response.json();

      if (!response.ok) {
        const error: ApiErrorDTO = data.error || {
          code: `HTTP_${response.status}`,
          message: response.statusText,
        };
        this.config.onError?.(error);
        return {
          success: false,
          data: null,
          error,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        data: data.data ?? data,
        error: null,
        timestamp: data.timestamp || new Date().toISOString(),
        requestId: data.requestId,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const apiError: ApiErrorDTO = {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
      this.config.onError?.(apiError);
      return {
        success: false,
        data: null,
        error: apiError,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async tryRefreshToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    // Prevent multiple refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          this.setTokens(data.data.accessToken, data.data.refreshToken);
          return true;
        }
        
        this.clearTokens();
        return false;
      } catch {
        this.clearTokens();
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  configure(config: Partial<AuthServerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AuthServerConfig {
    return { ...this.config };
  }
}

// Singleton instance
export const authHttpClient = new AuthHttpClient();

export default AuthHttpClient;

