// ============================================================================
// COMMON DTOs - Shared request/response structures
// ============================================================================

/**
 * Base response wrapper from API
 */
export interface ApiResponseDTO<T> {
  success: boolean;
  data: T | null;
  error: ApiErrorDTO | null;
  timestamp: string;
  requestId?: string;
}

/**
 * API Error structure
 */
export interface ApiErrorDTO {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination request
 */
export interface PaginationReqDTO {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Pagination response
 */
export interface PaginationResDTO<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * SSE event wrapper
 */
export interface SseEventDTO<T> {
  event: string;
  data: T;
  id?: string;
  retry?: number;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

/**
 * Status level type
 */
export type StatusLevel = 'ok' | 'warn' | 'danger';

