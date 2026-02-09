// ============================================================================
// USE HARDWARE DEVICE HOOK - React hook for hardware device service
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as service from '../services/HardwareDeviceService'; 
import { CPUModel } from '../models/CPUModel';
import { GPUModel } from '../models/GPUModel';
import { RAMModel } from '../models/RAMModel';
import { StorageModel } from '../models/StorageModel';
import { NetworkModel } from '../models/NetworkModel';

export type HardwareType = 'cpu' | 'gpu' | 'ram' | 'storage' | 'network' | 'all';

interface UseHardwareDeviceOptions {
  fetchOnMount?: HardwareType;
  autoRefreshInterval?: number;
}

/**
 * Hook chính để quản lý hardware device module
 */
export function useHardwareDevice(options: UseHardwareDeviceOptions = {}) {
  const { fetchOnMount = 'all', autoRefreshInterval } = options;
  
  const [, setTick] = useState(0);
  const forceUpdate = useCallback(() => setTick(tick => tick + 1), []);
  
  const intervalRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch dữ liệu dựa trên loại hardware từ module actions
  const fetchData = useCallback(async (type: HardwareType) => {
    setLoading(true);
    setError(null);
    try {
      switch (type) {
        case 'cpu':     await service.fetchCPU(); break;
        case 'gpu':     await service.fetchGPU(); break;
        case 'ram':     await service.fetchRAM(); break;
        case 'storage': await service.fetchStorage(); break;
        case 'network': await service.fetchNetwork(); break;
        case 'all':     await service.refresh(); break;
      }
      forceUpdate(); // Cập nhật UI sau khi dữ liệu trong module đã thay đổi
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch hardware data');
      setError(error);
      console.error(`[useHardwareDevice] Error fetching ${type}:`, error);
    } finally {
      setLoading(false);
    }
  }, [forceUpdate]);

  useEffect(() => {
    const initAndFetch = async () => {
      if (!service.HardwareDeviceService.isInitialized) {
        await service.initialize();
      }
      await fetchData(fetchOnMount);
    };

    initAndFetch();

    if (autoRefreshInterval && autoRefreshInterval > 0) {
      intervalRef.current = window.setInterval(() => {
        fetchData(fetchOnMount);
      }, autoRefreshInterval);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchOnMount, autoRefreshInterval, fetchData]);

  return {
    // Export trực tiếp các state từ module
    cpu: service.cpu,
    gpu: service.gpu,
    ram: service.ram,
    storage: service.storage,
    network: service.network,
    loading,
    error,
    refresh: () => fetchData(fetchOnMount),
    fetchCPU: () => fetchData('cpu'),
    fetchGPU: () => fetchData('gpu'),
    fetchRAM: () => fetchData('ram'),
    fetchStorage: () => fetchData('storage'),
    fetchNetwork: () => fetchData('network'),
  };
}

// ============================================================================
// INDIVIDUAL HARDWARE HOOKS
// ============================================================================

/**
 * Hook cho CPU - Tự động subscribe vào Model
 */
export function useHardwareCPU(options?: Omit<UseHardwareDeviceOptions, 'fetchOnMount'>) {
  debugger
  const { cpu, loading, error, fetchCPU } = useHardwareDevice({
    ...options,
    fetchOnMount: 'cpu',
  });
  
  const [data, setData] = useState<CPUModel['data']>(cpu.data);

  useEffect(() => {
    return cpu.subscribe(setData); // Đồng bộ state local khi Model update
  }, [cpu]);

  return { data, model: cpu, loading, error, refresh: fetchCPU };
}

/**
 * Hook cho GPU - Xử lý mảng GPU
 */
export function useHardwareGPU(options?: Omit<UseHardwareDeviceOptions, 'fetchOnMount'>) {
  const { gpu, loading, error, fetchGPU } = useHardwareDevice({
    ...options,
    fetchOnMount: 'gpu',
  });

  // Đối với mảng, ta subscribe vào sự thay đổi của chính array reference hoặc logic refresh
  const [data, setData] = useState<GPUModel[]>([...gpu]);

  useEffect(() => {
    setData([...gpu]);
  }, [gpu]); // Re-render khi mảng gpu trong module thay đổi (nhờ forceUpdate ở hook cha)

  return { data, models: gpu, loading, error, refresh: fetchGPU };
}

/**
 * Hook cho RAM
 */
export function useHardwareRAM(options?: Omit<UseHardwareDeviceOptions, 'fetchOnMount'>) {
  const { ram, loading, error, fetchRAM } = useHardwareDevice({
    ...options,
    fetchOnMount: 'ram',
  });
  
  const [data, setData] = useState<RAMModel['data']>(ram.data);

  useEffect(() => {
    return ram.subscribe(setData);
  }, [ram]);

  return { data, model: ram, loading, error, refresh: fetchRAM };
}

/**
 * Hook cho Storage
 */
export function useHardwareStorage(options?: Omit<UseHardwareDeviceOptions, 'fetchOnMount'>) {
  const { storage, loading, error, fetchStorage } = useHardwareDevice({
    ...options,
    fetchOnMount: 'storage',
  });

  const [data, setData] = useState<StorageModel[]>([...storage]);

  useEffect(() => {
    setData([...storage]);
  }, [storage]);

  return { data, models: storage, loading, error, refresh: fetchStorage };
}

/**
 * Hook cho Network
 */
export function useHardwareNetwork(options?: Omit<UseHardwareDeviceOptions, 'fetchOnMount'>) {
  const { network, loading, error, fetchNetwork } = useHardwareDevice({
    ...options,
    fetchOnMount: 'network',
  });
  
  const [data, setData] = useState<NetworkModel['data']>(network.data);

  useEffect(() => {
    return network.subscribe(setData);
  }, [network]);

  return { data, model: network, loading, error, refresh: fetchNetwork };
}