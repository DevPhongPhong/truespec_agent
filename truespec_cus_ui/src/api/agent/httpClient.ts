// ============================================================================
// AGENT HTTP CLIENT - HTTP client for Agent API
// ============================================================================

import { ApiResponseDTO, ApiErrorDTO } from '../../dtos/common';

export interface AgentConfig {
  baseUrl: string;
  timeout?: number;
  onError?: (error: ApiErrorDTO) => void;
}

const DEFAULT_CONFIG: AgentConfig = {
  baseUrl: import.meta.env.VITE_AGENT_URL || 'http://localhost:9000/api',
  timeout: 15000,
};

class AgentHttpClient {
  private config: AgentConfig;
  private accessToken: string | null = null;

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
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
    body?: unknown
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

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  configure(config: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  getBaseUrl(): string {
    return this.config.baseUrl;
  }
}

// Singleton instance
export const agentHttpClient = new AgentHttpClient();

export default AgentHttpClient;

