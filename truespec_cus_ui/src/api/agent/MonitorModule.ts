import { agentSseClient } from './sseClient';
import { agentHttpClient } from './httpClient';
import { ConnectionStatus, ApiResponseDTO } from '../../dtos/common';
import {
  SystemMetricsResDTO,
} from '../../dtos/agent';

export type MetricsUpdateHandler = (metrics: SystemMetricsResDTO) => void;
export type ConnectionHandler = (status: ConnectionStatus) => void;

export interface MonitorConfig {
  metricsInterval: number; // ms between metrics updates
}

const DEFAULT_CONFIG: MonitorConfig = {
  metricsInterval: 1000,
};

/**
 * MonitorModule - Real-time system metrics monitoring
 * 
 * Responsibilities:
 * - Receive real-time metrics updates
 * - Manage subscriptions
 * - Handle connection lifecycle
 */
class MonitorModule {
  private static instance: MonitorModule;
  private config: MonitorConfig;
  private metricsHandlers = new Set<MetricsUpdateHandler>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private unsubscribeFns: (() => void)[] = [];
  private isStarted = false;

  private constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(): MonitorModule {
    if (!MonitorModule.instance) {
      MonitorModule.instance = new MonitorModule();
    }
    return MonitorModule.instance;
  }

  // ============================================================================
  // CONNECTION
  // ============================================================================

  /**
   * Start monitoring connection
   */
  async start(accessToken: string): Promise<void> {
    if (this.isStarted) {
      console.warn('[Monitor] Already started');
      return;
    }

    // Set access token for HTTP client
    agentHttpClient.setAccessToken(accessToken);

    await this.startSSE(accessToken);

    this.isStarted = true;
  }

  /**
   * Stop monitoring connection
   */
  stop(): void {
    this.unsubscribeFns.forEach(fn => fn());
    this.unsubscribeFns = [];

    agentSseClient.disconnect();

    this.isStarted = false;
  }

  /**
   * Reconnect
   */
  async reconnect(accessToken: string): Promise<void> {
    this.stop();
    await this.start(accessToken);
  }

  // ============================================================================
  // SSE MODE
  // ============================================================================

  private async startSSE(accessToken: string): Promise<void> {
    // Setup status handler
    agentSseClient.configure({
      onStatusChange: (status) => {
        this.notifyConnectionStatus(status);
      },
    });

    // Connect to metrics stream
    await agentSseClient.connect('/sse/metrics', accessToken);

    // Setup metrics handler
    const unsubMetrics = agentSseClient.on<SystemMetricsResDTO>('metrics', (metrics) => {
      this.notifyMetricsUpdate(metrics);
    });
    this.unsubscribeFns.push(unsubMetrics);
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Subscribe to metrics updates
   */
  onMetrics(handler: MetricsUpdateHandler): () => void {
    this.metricsHandlers.add(handler);
    return () => this.metricsHandlers.delete(handler);
  }

  /**
   * Subscribe to connection status changes
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  private notifyMetricsUpdate(metrics: SystemMetricsResDTO): void {
    this.metricsHandlers.forEach(handler => handler(metrics));
  }

  private notifyConnectionStatus(status: ConnectionStatus): void {
    this.connectionHandlers.forEach(handler => handler(status));
  }

  // ============================================================================
  // HTTP FALLBACK
  // ============================================================================

  /**
   * Get metrics via HTTP (fallback when real-time unavailable)
   */
  async getMetrics(): Promise<ApiResponseDTO<SystemMetricsResDTO>> {
    return agentHttpClient.get<SystemMetricsResDTO>('/metrics');
  }

  /**
   * Get specific component metrics
   */
  async getComponentMetrics(component: 'cpu' | 'gpu' | 'ram' | 'storage' | 'network' | 'battery' | 'fans'): Promise<ApiResponseDTO<unknown>> {
    return agentHttpClient.get(`/metrics/${component}`);
  }

  // ============================================================================
  // STATUS
  // ============================================================================

  getConnectionStatus(): ConnectionStatus {
    return agentSseClient.getStatus();
  }

  isConnected(): boolean {
    return agentSseClient.isConnected();
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  configure(config: Partial<MonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const monitorModule = MonitorModule.getInstance();
export default MonitorModule;

