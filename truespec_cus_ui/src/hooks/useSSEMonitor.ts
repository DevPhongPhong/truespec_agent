// ============================================================================
// USE SSE MONITOR HOOK - React hook để sử dụng SSE Monitor Service
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { sseMonitorService, SSEMonitorConfig } from '../services/SSEMonitorService';
import { ConnectionStatus } from '../dtos/common';
import { monitorService } from '../services/MonitorService';

export interface UseSSEMonitorReturn {
  // Trạng thái kết nối
  status: ConnectionStatus;
  isConnected: boolean;
  
  // Các phương thức điều khiển
  connect: (config?: Partial<SSEMonitorConfig>) => Promise<void>;
  disconnect: () => void;
  
  // Dữ liệu từ MonitorService (sẽ tự động cập nhật khi SSE nhận dữ liệu)
  monitor: typeof monitorService;
}

/**
 * Hook để sử dụng SSE Monitor Service
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { status, isConnected, connect, disconnect, monitor } = useSSEMonitor();
 * 
 *   useEffect(() => {
 *     connect({ endpoint: '/sse', accessToken: 'your-token' });
 *     return () => disconnect();
 *   }, []);
 * 
 *   return (
 *     <div>
 *       <p>Status: {status}</p>
 *       <p>CPU Load: {monitor.cpu.data.load}%</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSSEMonitor(config?: Partial<SSEMonitorConfig>): UseSSEMonitorReturn {
  const [status, setStatus] = useState<ConnectionStatus>(sseMonitorService.getStatus());
  const [isConnected, setIsConnected] = useState(sseMonitorService.isConnected());

  // Cập nhật trạng thái khi có thay đổi
  useEffect(() => {
    const checkStatus = () => {
      setStatus(sseMonitorService.getStatus());
      setIsConnected(sseMonitorService.isConnected());
    };

    // Kiểm tra trạng thái ban đầu
    checkStatus();

    // Thiết lập callback để cập nhật trạng thái
    const statusChangeHandler = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
      config?.onStatusChange?.(newStatus);
    };

    sseMonitorService.configure({
      ...config,
      onStatusChange: statusChangeHandler,
    });

    // Kiểm tra định kỳ (fallback)
    const interval = setInterval(checkStatus, 1000);

    return () => {
      clearInterval(interval);
      // Reset callback khi unmount
      sseMonitorService.configure({
        onStatusChange: config?.onStatusChange,
      });
    };
  }, [config?.onStatusChange]);

  // Hàm connect
  const connect = useCallback(async (connectConfig?: Partial<SSEMonitorConfig>) => {
    try {
      await sseMonitorService.connect(connectConfig || config);
      setStatus(sseMonitorService.getStatus());
      setIsConnected(sseMonitorService.isConnected());
    } catch (error) {
      console.error('[useSSEMonitor] Connection failed:', error);
      setStatus('error');
      setIsConnected(false);
      throw error;
    }
  }, [config]);

  // Hàm disconnect
  const disconnect = useCallback(() => {
    sseMonitorService.disconnect();
    setStatus('disconnected');
    setIsConnected(false);
  }, []);

  return {
    status,
    isConnected,
    connect,
    disconnect,
    monitor: monitorService,
  };
}

/**
 * Hook đơn giản hơn - tự động kết nối khi component mount
 */
export function useSSEMonitorAuto(config?: Partial<SSEMonitorConfig>) {
  const { status, isConnected, connect, disconnect, monitor } = useSSEMonitor(config);

  useEffect(() => {
    // Tự động kết nối khi component mount
    connect(config).catch(console.error);

    // Tự động ngắt kết nối khi component unmount
    return () => {
      disconnect();
    };
  }, []); // Chỉ chạy một lần khi mount

  return {
    status,
    isConnected,
    disconnect,
    monitor,
  };
}

