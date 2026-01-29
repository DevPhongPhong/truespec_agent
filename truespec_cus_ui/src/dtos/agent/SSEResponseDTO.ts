// ============================================================================
// SSE RESPONSE DTOs - Cấu trúc dữ liệu cho mỗi SSE response từ server
// Tất cả các loại response đều ở cùng một level, không nested
// ============================================================================

import { SystemMetricsResDTO } from './SystemMetricsResDTO';
import { StatusLevel } from '../common';

/**
 * Enum phân loại các loại SSE event từ server
 * Chỉ bao gồm 5 loại chính: metrics, connected, disconnect, error, heartbeat
 */
export enum SSEEventType {
  METRICS = 'metrics',        // Dữ liệu metrics hệ thống
  CONNECTED = 'connected',     // Kết nối thành công
  DISCONNECT = 'disconnect',  // Thông báo ngắt kết nối
  ERROR = 'error',            // Lỗi từ server
  HEARTBEAT = 'heartbeat',    // Ping định kỳ để giữ kết nối
}

/**
 * Type alias cho backward compatibility
 */
export type SSEEventTypeString = 
  | 'connected'      // Kết nối thành công
  | 'heartbeat'      // Ping định kỳ để giữ kết nối
  | 'metrics'        // Dữ liệu metrics hệ thống
  | 'alert'          // Cảnh báo từ hệ thống
  | 'error'          // Lỗi từ server
  | 'message'        // Message thông thường
  | 'disconnect';    // Thông báo ngắt kết nối

/**
 * Base interface đại diện cho tất cả các SSE responses
 * Tất cả các response đều kế thừa từ interface này
 */
export interface SSEResponseBase {
  /**
   * Loại event SSE (sử dụng enum SSEEventType hoặc string literal)
   */
  event: SSEEventType | SSEEventTypeString;
  
  /**
   * Timestamp khi server gửi (Unix timestamp in milliseconds)
   */
  timestamp: number;
  
  /**
   * ID của message (để tracking và deduplication)
   */
  messageId?: string;
  
  /**
   * Device ID nếu có
   */
  deviceId?: string;
  
  /**
   * Retry interval (milliseconds) - chỉ dùng cho SSE protocol
   */
  retry?: number;
}

/**
 * Connected Event Response - Khi server xác nhận kết nối thành công
 * Class kế thừa từ SSEResponseBase, đại diện cho event CONNECTED
 */
export interface SSEConnectedResponseDTO extends SSEResponseBase {
  event: SSEEventType.CONNECTED | 'connected';
  
  /**
   * Session ID được tạo bởi server
   */
  sessionId: string;
  
  /**
   * Device ID được xác nhận
   */
  deviceId: string;
  
  /**
   * Thông điệp chào mừng
   */
  message?: string;
  
  /**
   * Cấu hình từ server
   */
  config?: {
    /**
     * Interval giữa các metrics update (milliseconds)
     */
    metricsInterval?: number;
    
    /**
     * Interval giữa các heartbeat (milliseconds)
     */
    heartbeatInterval?: number;
  };
}

/**
 * Heartbeat Event Response - Ping định kỳ để giữ kết nối
 * Class kế thừa từ SSEResponseBase, đại diện cho event HEARTBEAT
 */
export interface SSEHeartbeatResponseDTO extends SSEResponseBase {
  event: SSEEventType.HEARTBEAT | 'heartbeat';
  
  /**
   * Timestamp của heartbeat
   */
  heartbeatTimestamp: number;
  
  /**
   * Uptime của server (seconds)
   */
  serverUptime?: number;
  
  /**
   * Số lượng clients đang kết nối
   */
  activeConnections?: number;
}

/**
 * Metrics Event Response - Dữ liệu metrics hệ thống chính
 * Class kế thừa từ SSEResponseBase, đại diện cho event METRICS
 * Đây là event quan trọng nhất, chứa tất cả thông tin về CPU, RAM, GPU, Storage, Network, Battery, Fan
 */
export interface SSEMetricsResponseDTO extends SSEResponseBase {
  event: SSEEventType.METRICS | 'metrics';
  
  /**
   * Dữ liệu metrics hệ thống
   */
  metrics: SystemMetricsResDTO;
}

/**
 * Alert Event Response - Cảnh báo từ hệ thống
 * Level ngang với heartbeat và các response khác
 */
export interface SSEAlertResponseDTO extends SSEResponseBase {
  event: 'alert';
  
  /**
   * ID của alert
   */
  alertId: string;
  
  /**
   * Loại alert
   */
  type: 'cpu' | 'ram' | 'gpu' | 'storage' | 'network' | 'battery' | 'fan' | 'system';
  
  /**
   * Mức độ nghiêm trọng
   */
  severity: StatusLevel;
  
  /**
   * Tiêu đề alert
   */
  title: string;
  
  /**
   * Nội dung chi tiết
   */
  message: string;
  
  /**
   * Giá trị hiện tại gây ra alert
   */
  currentValue?: number;
  
  /**
   * Ngưỡng cảnh báo
   */
  threshold?: number;
  
  /**
   * Timestamp khi alert được tạo
   */
  createdAt: number;
  
  /**
   * Metadata bổ sung
   */
  metadata?: Record<string, unknown>;
}

/**
 * Error Event Response - Lỗi từ server
 * Class kế thừa từ SSEResponseBase, đại diện cho event ERROR
 */
export interface SSEErrorResponseDTO extends SSEResponseBase {
  event: SSEEventType.ERROR | 'error';
  
  /**
   * Mã lỗi
   */
  code: string;
  
  /**
   * Thông điệp lỗi
   */
  message: string;
  
  /**
   * Chi tiết lỗi (optional)
   */
  details?: Record<string, unknown>;
  
  /**
   * Có thể retry không
   */
  retryable?: boolean;
}

/**
 * Message Event Response - Message thông thường
 * Level ngang với heartbeat và các response khác
 */
export interface SSEMessageResponseDTO extends SSEResponseBase {
  event: 'message';
  
  /**
   * Nội dung message
   */
  content: string;
  
  /**
   * Loại message
   */
  type?: 'info' | 'warning' | 'success';
  
  /**
   * Metadata bổ sung
   */
  metadata?: Record<string, unknown>;
}

/**
 * Disconnect Event Response - Thông báo ngắt kết nối
 * Class kế thừa từ SSEResponseBase, đại diện cho event DISCONNECT
 */
export interface SSEDisconnectResponseDTO extends SSEResponseBase {
  event: SSEEventType.DISCONNECT | 'disconnect';
  
  /**
   * Lý do ngắt kết nối
   */
  reason: string;
  
  /**
   * Có thể kết nối lại không
   */
  reconnectable?: boolean;
  
  /**
   * Thời gian chờ trước khi reconnect (milliseconds)
   */
  reconnectDelay?: number;
}

/**
 * Union type cho tất cả các loại SSE response
 */
export type SSEResponseUnion =
  | SSEConnectedResponseDTO
  | SSEHeartbeatResponseDTO
  | SSEMetricsResponseDTO
  | SSEAlertResponseDTO
  | SSEErrorResponseDTO
  | SSEMessageResponseDTO
  | SSEDisconnectResponseDTO;

/**
 * Type guard để kiểm tra loại SSE response
 * Sử dụng enum SSEEventType để kiểm tra
 */
export function isSSEMetricsResponse(
  response: SSEResponseBase & { event: string | SSEEventType }
): response is SSEMetricsResponseDTO {
  const event = String(response.event);
  return event === SSEEventType.METRICS || event === 'metrics';
}

export function isSSEConnectedResponse(
  response: SSEResponseBase & { event: string | SSEEventType }
): response is SSEConnectedResponseDTO {
  const event = String(response.event);
  return event === SSEEventType.CONNECTED || event === 'connected';
}

export function isSSEHeartbeatResponse(
  response: SSEResponseBase & { event: string | SSEEventType }
): response is SSEHeartbeatResponseDTO {
  const event = String(response.event);
  return event === SSEEventType.HEARTBEAT || event === 'heartbeat';
}

export function isSSEErrorResponse(
  response: SSEResponseBase & { event: string | SSEEventType }
): response is SSEErrorResponseDTO {
  const event = String(response.event);
  return event === SSEEventType.ERROR || event === 'error';
}

export function isSSEDisconnectResponse(
  response: SSEResponseBase & { event: string | SSEEventType }
): response is SSEDisconnectResponseDTO {
  const event = String(response.event);
  return event === SSEEventType.DISCONNECT || event === 'disconnect';
}

export function isSSEAlertResponse(
  response: SSEResponseBase & { event: string }
): response is SSEAlertResponseDTO {
  return response.event === 'alert';
}

export function isSSEMessageResponse(
  response: SSEResponseBase & { event: string }
): response is SSEMessageResponseDTO {
  return response.event === 'message';
}

/**
 * Parse và validate SSE Metrics Response
 */
function parseMetricsResponse(data: Record<string, unknown>): SSEMetricsResponseDTO {
  if (!data.metrics || typeof data.metrics !== 'object') {
    throw new Error('Invalid metrics response: missing or invalid metrics field');
  }
  
  return {
    event: SSEEventType.METRICS,
    timestamp: (data.timestamp as number) ?? Date.now(),
    messageId: data.messageId as string | undefined,
    deviceId: data.deviceId as string | undefined,
    retry: data.retry as number | undefined,
    metrics: data.metrics as SystemMetricsResDTO,
  };
}

/**
 * Parse và validate SSE Connected Response
 */
function parseConnectedResponse(data: Record<string, unknown>): SSEConnectedResponseDTO {
  if (!data.sessionId || typeof data.sessionId !== 'string') {
    throw new Error('Invalid connected response: missing or invalid sessionId field');
  }
  
  return {
    event: SSEEventType.CONNECTED,
    timestamp: (data.timestamp as number) ?? Date.now(),
    messageId: data.messageId as string | undefined,
    deviceId: (data.deviceId as string) ?? '',
    retry: data.retry as number | undefined,
    sessionId: data.sessionId as string,
    message: data.message as string | undefined,
    config: data.config as SSEConnectedResponseDTO['config'] | undefined,
  };
}

/**
 * Parse và validate SSE Heartbeat Response
 */
function parseHeartbeatResponse(data: Record<string, unknown>): SSEHeartbeatResponseDTO {
  if (data.heartbeatTimestamp === undefined || typeof data.heartbeatTimestamp !== 'number') {
    throw new Error('Invalid heartbeat response: missing or invalid heartbeatTimestamp field');
  }
  
  return {
    event: SSEEventType.HEARTBEAT,
    timestamp: (data.timestamp as number) ?? Date.now(),
    messageId: data.messageId as string | undefined,
    deviceId: data.deviceId as string | undefined,
    retry: data.retry as number | undefined,
    heartbeatTimestamp: data.heartbeatTimestamp as number,
    serverUptime: data.serverUptime as number | undefined,
    activeConnections: data.activeConnections as number | undefined,
  };
}

/**
 * Parse và validate SSE Error Response
 */
function parseErrorResponse(data: Record<string, unknown>): SSEErrorResponseDTO {
  if (!data.code || typeof data.code !== 'string') {
    throw new Error('Invalid error response: missing or invalid code field');
  }
  if (!data.message || typeof data.message !== 'string') {
    throw new Error('Invalid error response: missing or invalid message field');
  }
  
  return {
    event: SSEEventType.ERROR,
    timestamp: (data.timestamp as number) ?? Date.now(),
    messageId: data.messageId as string | undefined,
    deviceId: data.deviceId as string | undefined,
    retry: data.retry as number | undefined,
    code: data.code as string,
    message: data.message as string,
    details: data.details as Record<string, unknown> | undefined,
    retryable: data.retryable as boolean | undefined,
  };
}

/**
 * Parse và validate SSE Disconnect Response
 */
function parseDisconnectResponse(data: Record<string, unknown>): SSEDisconnectResponseDTO {
  if (!data.reason || typeof data.reason !== 'string') {
    throw new Error('Invalid disconnect response: missing or invalid reason field');
  }
  
  return {
    event: SSEEventType.DISCONNECT,
    timestamp: (data.timestamp as number) ?? Date.now(),
    messageId: data.messageId as string | undefined,
    deviceId: data.deviceId as string | undefined,
    retry: data.retry as number | undefined,
    reason: data.reason as string,
    reconnectable: data.reconnectable as boolean | undefined,
    reconnectDelay: data.reconnectDelay as number | undefined,
  };
}

/**
 * Helper function để parse SSE response từ raw data
 * Kiểm tra type nhận được và parse về đúng class tương ứng (1 trong 5 loại chính)
 */
export function parseSSEResponse(rawData: string | object): SSEResponseUnion {
  let data: unknown;
  
  if (typeof rawData === 'string') {
    try {
      data = JSON.parse(rawData);
    } catch (error) {
      throw new Error(`Failed to parse SSE response: ${error}`);
    }
  } else {
    data = rawData;
  }
  
  // Validate structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid SSE response: data is not an object');
  }
  
  const response = data as Record<string, unknown>;
  
  // Validate event field
  if (!response.event || typeof response.event !== 'string') {
    throw new Error('Invalid SSE response: missing or invalid event field');
  }
  
  const eventType: string = String(response.event);
  
  // Kiểm tra type và parse về đúng class tương ứng
  // Chỉ parse 5 loại chính: metrics, connected, disconnect, error, heartbeat
  if (eventType === SSEEventType.METRICS || eventType === 'metrics') {
    return parseMetricsResponse(response);
  }
  
  if (eventType === SSEEventType.CONNECTED || eventType === 'connected') {
    return parseConnectedResponse(response);
  }
  
  if (eventType === SSEEventType.HEARTBEAT || eventType === 'heartbeat') {
    return parseHeartbeatResponse(response);
  }
  
  if (eventType === SSEEventType.ERROR || eventType === 'error') {
    return parseErrorResponse(response);
  }
  
  if (eventType === SSEEventType.DISCONNECT || eventType === 'disconnect') {
    return parseDisconnectResponse(response);
  }
  
  // Fallback: parse như một response chung nếu không khớp với 5 loại chính
  // (có thể là alert hoặc message)
  return {
    ...response,
    timestamp: (response.timestamp as number) ?? Date.now(),
  } as unknown as SSEResponseUnion;
}

