// ============================================================================
// AGENT SSE CLIENT - Server-Sent Events for real-time updates
// ============================================================================

import { ConnectionStatus, SseEventDTO } from '../../dtos/common';

export interface SSEConfig {
  baseUrl: string;
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  onStatusChange?: (status: ConnectionStatus) => void;
}

const DEFAULT_CONFIG: SSEConfig = {
  baseUrl: import.meta.env.VITE_AGENT_URL || 'http://localhost:9000',
  reconnect: true,
  reconnectInterval: 3000,
  maxReconnectAttempts: 10,
  onStatusChange: undefined,
};

type SSEHandler<T = unknown> = (data: T, event: SseEventDTO<T>) => void;

class AgentSSEClient {
  private config: SSEConfig;
  private eventSource: EventSource | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: number | null = null;
  private handlers = new Map<string, Set<SSEHandler>>();
  private currentUrl: string | null = null;
  private accessToken: string | null = null;

  constructor(config: Partial<SSEConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  connect(endpoint: string, accessToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.eventSource) {
        this.disconnect();
      }

      this.accessToken = accessToken || null;
      this.setStatus('connecting');

      try {
        // Build URL with auth token if provided
        const url = new URL(endpoint, this.config.baseUrl);
        if (accessToken) {
          url.searchParams.set('token', accessToken);
        }
        this.currentUrl = url.toString();

        this.eventSource = new EventSource(this.currentUrl);

        this.eventSource.onopen = () => {
          this.reconnectAttempts = 0;
          this.setStatus('connected');
          resolve();
        };

        this.eventSource.onerror = (error) => {
          console.error('[SSE] Error:', error);

          if (this.eventSource?.readyState === EventSource.CLOSED) {
            this.handleDisconnect();
          } else {
            this.setStatus('error');
          }

          if (this.status === 'connecting') {
            reject(new Error('Failed to connect'));
          }
        };

        // Default message handler
        this.eventSource.onmessage = (event) => {
          this.handleEvent('message', event);
        };

      } catch (error) {
        this.setStatus('error');
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopReconnect();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.currentUrl = null;
    this.setStatus('disconnected');
  }

  // ============================================================================
  // EVENT SUBSCRIPTION
  // ============================================================================

  /**
   * Subscribe to a specific event type
   */
  on<T = unknown>(eventType: string, handler: SSEHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());

      // Add event listener to EventSource
      if (this.eventSource) {
        this.eventSource.addEventListener(eventType, (event: MessageEvent) => {
          this.handleEvent(eventType, event);
        });
      }
    }

    this.handlers.get(eventType)!.add(handler as SSEHandler);

    return () => {
      this.handlers.get(eventType)?.delete(handler as SSEHandler);
    };
  }

  /**
   * Unsubscribe from event type
   */
  off(eventType: string, handler?: SSEHandler): void {
    if (handler) {
      this.handlers.get(eventType)?.delete(handler);
    } else {
      this.handlers.delete(eventType);
    }
  }

  // ============================================================================
  // INTERNAL METHODS
  // ============================================================================

  private handleEvent(eventType: string, event: MessageEvent): void {
    // Log tất cả các event nhận được
    const handler = this.handlers.get(eventType);
    if (!handler || handler.size === 0) {
      console.warn(`[SSE Client] ⚠️ No handler registered for event type: "${eventType}"`);
      return;
    }

    try {
      const data = JSON.parse(event.data);
      const sseEvent: SseEventDTO<unknown> = {
        event: eventType,
        data,
        id: event.lastEventId,
      };
      handler.forEach(handler => handler(data, sseEvent));
    } catch (error) {
      // Try raw data if JSON parsing fails
      const sseEvent: SseEventDTO<string> = {
        event: eventType,
        data: event.data,
        id: event.lastEventId,
      };
      handler.forEach(handler => handler(event.data, sseEvent as SseEventDTO<unknown>));
    }
  }

  private handleDisconnect(): void {
    this.eventSource = null;

    if (this.config.reconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.setStatus('reconnecting');
      this.scheduleReconnect();
    } else {
      this.setStatus('disconnected');
    }
  }

  private scheduleReconnect(): void {
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`[SSE] Reconnect attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);

      if (this.currentUrl) {
        const url = new URL(this.currentUrl);
        const endpoint = url.pathname;
        this.connect(endpoint, this.accessToken || undefined).catch(console.error);
      }
    }, this.config.reconnectInterval);
  }

  private stopReconnect(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.config.onStatusChange?.(status);
    }
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && this.eventSource?.readyState === EventSource.OPEN;
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  configure(config: Partial<SSEConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
export const agentSseClient = new AgentSSEClient();

export default AgentSSEClient;

