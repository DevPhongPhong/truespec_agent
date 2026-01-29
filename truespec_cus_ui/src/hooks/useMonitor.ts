// ============================================================================
// USE MONITOR HOOK - React hook for monitor service
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { monitorService, MonitorService } from '../services';

export function useMonitor() {
  const [, forceUpdate] = useState({});
  const serviceRef = useRef<MonitorService>(monitorService);

  const refresh = useCallback(() => {
    forceUpdate({});
  }, []);

  useEffect(() => {
    const service = serviceRef.current;
    
    // Initialize service
    service.initialize();

    // Subscribe to updates
    const unsubscribe = service.onUpdate(refresh);

    // Start auto-refresh
    service.startAutoRefresh(10000);

    return () => {
      unsubscribe();
      service.stopAutoRefresh();
    };
  }, [refresh]);

  return {
    service: serviceRef.current,
    cpu: serviceRef.current.cpu,
    gpu: serviceRef.current.gpu,
    ram: serviceRef.current.ram,
    storage: serviceRef.current.storage,
    network: serviceRef.current.network,
    battery: serviceRef.current.battery,
    fan: serviceRef.current.fan,
    deviceInfo: serviceRef.current.getDeviceInfo(),
    systemStatus: serviceRef.current.getSystemStatus(),
    quickMetrics: serviceRef.current.getQuickMetrics(),
    manualRefresh: () => serviceRef.current.refresh(),
  };
}

// Individual model hooks for optimized re-renders
export function useCPU() {
  const [data, setData] = useState(monitorService.cpu.data);

  useEffect(() => {
    const unsubscribe = monitorService.cpu.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.cpu };
}

export function useGPU() {
  const [data, setData] = useState(monitorService.gpu.data);

  useEffect(() => {
    const unsubscribe = monitorService.gpu.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.gpu };
}

export function useRAM() {
  const [data, setData] = useState(monitorService.ram.data);

  useEffect(() => {
    const unsubscribe = monitorService.ram.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.ram };
}

export function useStorage() {
  const [data, setData] = useState(monitorService.storage.data);

  useEffect(() => {
    const unsubscribe = monitorService.storage.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.storage };
}

export function useNetwork() {
  const [data, setData] = useState(monitorService.network.data);

  useEffect(() => {
    const unsubscribe = monitorService.network.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.network };
}

export function useBattery() {
  const [data, setData] = useState(monitorService.battery.data);

  useEffect(() => {
    const unsubscribe = monitorService.battery.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.battery };
}

export function useFan() {
  const [data, setData] = useState(monitorService.fan.data);

  useEffect(() => {
    const unsubscribe = monitorService.fan.subscribe(setData);
    return unsubscribe;
  }, []);

  return { data, model: monitorService.fan };
}

