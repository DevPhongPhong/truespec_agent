// ============================================================================
// APP - Main Application Component with Routing
// ============================================================================

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import {
  OverviewPage,
  CPUPage,
  GPUPage,
  RAMPage,
  StoragePage,
  NetworkPage,
  BatteryPage,
  FanPage,
} from './pages';
import { sseMonitorService } from './services/SSEMonitorService';
import './styles/global.css';

function App() {
  // Khởi tạo kết nối SSE ngay khi app chạy
  useEffect(() => {
    const initializeSSE = async () => {
      try {
        console.log('[App] Initializing SSE connection...');
        await sseMonitorService.connect({
          endpoint: '/sse',
          autoReconnect: true,
          onStatusChange: (status) => {
            console.log('[App] SSE connection status changed:', status);
          },
          onError: (error) => {
            console.error('[App] SSE connection error:', error);
          },
        });
        console.log('[App] SSE connection initialized successfully');
      } catch (error) {
        console.error('[App] Failed to initialize SSE connection:', error);
      }
    };

    initializeSSE();

    // Cleanup: disconnect khi app unmount
    return () => {
      console.log('[App] Disconnecting SSE...');
      sseMonitorService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="cpu" element={<CPUPage />} />
          <Route path="gpu" element={<GPUPage />} />
          <Route path="ram" element={<RAMPage />} />
          <Route path="storage" element={<StoragePage />} />
          <Route path="network" element={<NetworkPage />} />
          <Route path="battery" element={<BatteryPage />} />
          <Route path="fan" element={<FanPage />} />
          <Route path="settings" element={<OverviewPage />} /> {/* Placeholder */}
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
