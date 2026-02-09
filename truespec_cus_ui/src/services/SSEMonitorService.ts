// ============================================================================
// SSE MONITOR SERVICE - Chuyên dụng để kết nối SSE và cập nhật UI
// ============================================================================

import { agentSseClient } from '../api/agent/sseClient';
import { monitorService } from './MonitorService';
import {
  SSEResponseUnion,
} from '../dtos/agent/SSEResponseDTO';
import { ConnectionStatus } from '../dtos/common';

export interface SSEMonitorConfig {
  endpoint: string;
  accessToken?: string;
  autoReconnect?: boolean;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

/**
 * SSE Monitor Service - Module chuyên dụng để:
 * - Kết nối tới SSE endpoint
 * - Nhận và xử lý dữ liệu metrics từ server
 * - Cập nhật tất cả các model (CPU, RAM, GPU, Storage, Network, Battery, Fan)
 * - Quản lý trạng thái kết nối
 */
export class SSEMonitorService {
  private static instance: SSEMonitorService | null = null;
  private config: SSEMonitorConfig;
  private unsubscribeFns: (() => void)[] = [];
  private _isConnected = false;
  
  // Track previous network values for rate calculation
  private previousNetworkBytesRecv: number = 0;
  private previousNetworkBytesSent: number = 0;
  private previousNetworkTimestamp: number = Date.now();

  private constructor(config: SSEMonitorConfig = { endpoint: '/sse' }) {
    this.config = {
      autoReconnect: true,
      ...config,
    };
  }

  static getInstance(config?: SSEMonitorConfig): SSEMonitorService {
    if (!SSEMonitorService.instance) {
      SSEMonitorService.instance = new SSEMonitorService(config);
    }
    return SSEMonitorService.instance;
  }

  /**
   * Kết nối tới SSE endpoint
   */
  async connect(config?: Partial<SSEMonitorConfig>): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (this._isConnected) {
      console.warn('[SSE Monitor] Already connected');
      return;
    }

    try {
      // Cấu hình SSE client với auto-reconnect
      agentSseClient.configure({
        reconnect: this.config.autoReconnect ?? true,
        reconnectInterval: 3000,
        maxReconnectAttempts: 10,
        onStatusChange: (status) => {
          this._isConnected = status === 'connected';
          this.config.onStatusChange?.(status);
        },
      });

      // Kết nối tới endpoint
      await agentSseClient.connect(this.config.endpoint, this.config.accessToken);

      // Đăng ký xử lý các event
      this.setupEventHandlers();
      
      // Reset network tracking values khi kết nối mới
      this.previousNetworkBytesRecv = 0;
      this.previousNetworkBytesSent = 0;
      this.previousNetworkTimestamp = Date.now();

      this._isConnected = true;
      console.log('[SSE Monitor] Connected successfully');
    } catch (error) {
      this._isConnected = false;
      const err = error instanceof Error ? error : new Error('Failed to connect to SSE');
      console.error('[SSE Monitor] Connection error:', err);
      this.config.onError?.(err);
      throw err;
    }
  }

  /**
   * Ngắt kết nối SSE
   */
  disconnect(): void {
    // Hủy đăng ký tất cả handlers
    this.unsubscribeFns.forEach(fn => fn());
    this.unsubscribeFns = [];

    // Ngắt kết nối SSE client
    agentSseClient.disconnect();

    this._isConnected = false;
    console.log('[SSE Monitor] Disconnected');
  }

  /**
   * Thiết lập các event handlers
   */
  private setupEventHandlers(): void {
    // Xử lý event 'metrics' - dữ liệu metrics chính
    const unsubMetrics = agentSseClient.on<any>('metrics', (data) => {
      console.log('[SSE Monitor] 📦 Received metrics event:', data);
      try {
        // 1. Parse dữ liệu từ server (giả định data là object như mẫu bạn gửi)
        const metrics = typeof data === 'string' ? JSON.parse(data) : data;

        // 2. Cập nhật CPU
        const cpuLoad = Math.round(metrics.cpu_usage);
        const perCoreUsage = metrics.per_core_usage || metrics.cpu_per_core_usage || [];
        
        // Populate coreLoads array with per-core usage
        const coreLoads: number[] = perCoreUsage.length > 0
          ? perCoreUsage.map((usage: number) => Math.max(0, Math.min(100, Math.round(usage))))
          : [];
        
        // Cập nhật coreData với per-core usage nếu có
        let coreData = monitorService.cpu.data.coreData;
        if (perCoreUsage.length > 0 && coreData.length > 0) {
          // Update existing coreData with per-core usage
          coreData = coreData.map((core, index) => ({
            ...core,
            load: index < perCoreUsage.length ? perCoreUsage[index] : cpuLoad,
          }));
        } else if (perCoreUsage.length > 0 && coreData.length === 0) {
          // Create coreData if it doesn't exist
          const currentClock = monitorService.cpu.data.currentClock || 0;
          coreData = perCoreUsage.map((usage: number, index: number) => ({
            coreIndex: index,
            load: usage,
            clock: currentClock,
            temperature: 0,
          }));
        } else if (perCoreUsage.length === 0 && coreData.length > 0) {
          // Update all cores with overall CPU load if no per-core data
          coreData = coreData.map(core => ({
            ...core,
            load: cpuLoad,
          }));
        }
        
        monitorService.cpu.update({
          load: cpuLoad,
          coreLoads: coreLoads.length > 0 ? coreLoads : monitorService.cpu.data.coreLoads || [],
          coreData: coreData,
          lastUpdated: new Date()
        });
        
        // Thêm vào history cho biểu đồ
        monitorService.cpu.addHistoryPoint('usage', cpuLoad);

        // 2.5. Cập nhật GPU (nếu có dữ liệu)
        if (metrics.gpu_usage !== undefined && metrics.gpu_usage !== null) {
          monitorService.gpu.update({
            load: Math.round(metrics.gpu_usage),
            lastUpdated: new Date()
          });
          
          // Thêm vào history cho biểu đồ
          monitorService.gpu.addHistoryPoint('usage', metrics.gpu_usage);
        }

        // 3. Cập nhật RAM
        // Chuyển đổi bytes sang GB cho phù hợp với Model hiện tại của bạn
        const totalRAM_GB = metrics.total_memory / (1024 ** 3);
        const usedRAM_GB = metrics.used_memory / (1024 ** 3);

        monitorService.ram.update({
          usedPercent: metrics.memory_usage,
          usedGB: parseFloat(usedRAM_GB.toFixed(2)),
          freeGB: parseFloat((totalRAM_GB - usedRAM_GB).toFixed(2)),
          lastUpdated: new Date()
        });

        // 4. Cập nhật Storage (Disk)
        const totalDisk_GB = metrics.total_disk / (1024 ** 3);
        const usedDisk_GB = metrics.used_disk / (1024 ** 3);

        monitorService.storage.update({
          usedPercent: Math.round(metrics.disk_usage),
          usedGB: Math.round(usedDisk_GB),
          freeGB: Math.round(totalDisk_GB - usedDisk_GB),
          lastUpdated: new Date()
        });

        // 5. Cập nhật Network
        // Lưu ý: network_bytes_recv thường là tổng dung lượng tích lũy (accumulated)
        const currentTimestamp = Date.now();
        const currentBytesRecv = metrics.network_bytes_recv || 0;
        const currentBytesSent = metrics.network_bytes_sent || 0;
        
        // Tính tốc độ download/upload (bytes/sec) từ sự chênh lệch
        const timeDiffSeconds = (currentTimestamp - this.previousNetworkTimestamp) / 1000;
        let downloadRateMbps = 0;
        let uploadRateMbps = 0;
        
        // Chỉ tính tốc độ nếu có dữ liệu trước đó và khoảng thời gian hợp lệ (> 0.1 giây để tránh tính sai)
        if (timeDiffSeconds > 0.1 && this.previousNetworkBytesRecv > 0) {
          const bytesRecvDiff = Math.max(0, currentBytesRecv - this.previousNetworkBytesRecv);
          const bytesSentDiff = Math.max(0, currentBytesSent - this.previousNetworkBytesSent);
          
          // Tính tốc độ (bytes/sec) rồi chuyển sang Mbps
          const downloadRateBytesPerSec = bytesRecvDiff / timeDiffSeconds;
          const uploadRateBytesPerSec = bytesSentDiff / timeDiffSeconds;
          
          // Chuyển từ bytes/sec sang Mbps (1 byte = 8 bits, 1 Mbps = 1,000,000 bits/sec)
          downloadRateMbps = (downloadRateBytesPerSec * 8) / (1000 * 1000);
          uploadRateMbps = (uploadRateBytesPerSec * 8) / (1000 * 1000);
        }
        
        // Cập nhật model với cả total và current rates
        monitorService.network.update({
          totalReceived: currentBytesRecv / (1024 ** 2), // Đổi sang MB
          totalSent: currentBytesSent / (1024 ** 2),    // Đổi sang MB
          currentDownload: downloadRateMbps,
          currentUpload: uploadRateMbps,
          lastUpdated: new Date()
        });
        
        // Thêm vào history cho biểu đồ
        monitorService.network.addHistoryPoint('download', downloadRateMbps);
        monitorService.network.addHistoryPoint('upload', uploadRateMbps);
        
        // Lưu giá trị hiện tại để tính tốc độ cho lần sau
        this.previousNetworkBytesRecv = currentBytesRecv;
        this.previousNetworkBytesSent = currentBytesSent;
        this.previousNetworkTimestamp = currentTimestamp;

        // 6. QUAN TRỌNG: Phát tín hiệu để các Hook (useMonitor) nhận biết và update UI
        monitorService.notifyUpdate();

      } catch (error) {
        console.error('[SSE Monitor] Error handling metrics event:', error);
      }
    });

    const unsubConnected = agentSseClient.on<SSEResponseUnion | unknown>('connected', (data, event) => {
      console.log('[SSE Monitor] 📦 Received connected event:', {
        eventType: event.event,
        eventId: event.id,
        rawData: data,
        timestamp: new Date().toISOString(),
      });
    });

    // Xử lý event 'heartbeat' - ping từ server
    const unsubHeartbeat = agentSseClient.on<SSEResponseUnion | unknown>('heartbeat', (data, event) => {
      console.log('[SSE Monitor] 📦 Received heartbeat event:', {
        eventType: event.event,
        eventId: event.id,
        rawData: data,
        timestamp: new Date().toISOString(),
      });
    });

    // Xử lý event 'disconnect' - thông báo ngắt kết nối
    const unsubDisconnect = agentSseClient.on<SSEResponseUnion | unknown>('disconnect', (data, event) => {
      console.log('[SSE Monitor] 📦 Received disconnect event:', {
        eventType: event.event,
        eventId: event.id,
        rawData: data,
        timestamp: new Date().toISOString(),
      });
    });

    this.unsubscribeFns.push(unsubMetrics);
    this.unsubscribeFns.push(unsubConnected);
    this.unsubscribeFns.push(unsubHeartbeat);
    this.unsubscribeFns.push(unsubDisconnect);
  }

  /**
   * Lấy trạng thái kết nối
   */
  getStatus(): ConnectionStatus {
    return agentSseClient.getStatus();
  }

  /**
   * Kiểm tra xem có đang kết nối không
   */
  isConnected(): boolean {
    return this._isConnected && agentSseClient.isConnected();
  }

  /**
   * Cấu hình lại service
   */
  configure(config: Partial<SSEMonitorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const sseMonitorService = SSEMonitorService.getInstance();

