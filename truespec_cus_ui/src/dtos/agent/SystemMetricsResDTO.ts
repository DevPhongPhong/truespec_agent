// ============================================================================
// SYSTEM METRICS RESPONSE DTOs - Real-time monitoring data from Agent
// ============================================================================

import { StatusLevel } from '../common';

/**
 * Complete system metrics snapshot
 */
export interface SystemMetricsResDTO {
  timestamp: number;
  deviceId: string;
  cpu: CPUMetricsResDTO;
  gpu: GPUMetricsResDTO;
  ram: RAMMetricsResDTO;
  storage: StorageMetricsResDTO;
  network: NetworkMetricsResDTO;
  battery: BatteryMetricsResDTO;
  fans: FanMetricsResDTO[];
  system: SystemInfoResDTO;
}

/**
 * CPU real-time metrics
 */
export interface CPUMetricsResDTO {
  load: number;
  temperature: number;
  power: number;
  frequency: number;
  voltage: number;
  cores: CPUCoreMetricsResDTO[];
}

/**
 * Per-core CPU metrics
 */
export interface CPUCoreMetricsResDTO {
  coreIndex: number;
  load: number;
  clock: number;
  temperature: number;
  voltage?: number;
}

/**
 * GPU real-time metrics
 */
export interface GPUMetricsResDTO {
  load: number;
  temperature: number;
  fanSpeed: number;
  fanPercent: number;
  power: number;
  vramUsed: number;
  vramTotal: number;
  coreClock: number;
  memoryClock: number;
  engines: GPUEngineMetricsResDTO[];
}

/**
 * GPU engine metrics
 */
export interface GPUEngineMetricsResDTO {
  engineIndex: number;
  name: string;
  usage: number;
  clock?: number;
}

/**
 * RAM real-time metrics
 */
export interface RAMMetricsResDTO {
  usedPercent: number;
  usedBytes: number;
  freeBytes: number;
  totalBytes: number;
  cacheBytes: number;
  commitedBytes: number;
  pageFileUsed: number;
}

/**
 * Storage real-time metrics
 */
export interface StorageMetricsResDTO {
  disks: DiskMetricsResDTO[];
}

/**
 * Per-disk metrics
 */
export interface DiskMetricsResDTO {
  id: string;
  name: string;
  usedPercent: number;
  usedBytes: number;
  freeBytes: number;
  totalBytes: number;
  readRate: number; // bytes/sec
  writeRate: number; // bytes/sec
  temperature?: number;
  health?: number;
}

/**
 * Network real-time metrics
 */
export interface NetworkMetricsResDTO {
  isOnline: boolean;
  ping: number;
  downloadRate: number; // bytes/sec
  uploadRate: number; // bytes/sec
  totalReceived: number;
  totalSent: number;
  packetLoss: number;
  adapters: NetworkAdapterMetricsResDTO[];
}

/**
 * Network adapter metrics
 */
export interface NetworkAdapterMetricsResDTO {
  id: string;
  name: string;
  type: 'wifi' | 'ethernet' | 'virtual' | 'bluetooth';
  isUp: boolean;
  ipv4?: string;
  mac?: string;
  downloadRate: number;
  uploadRate: number;
  signalStrength?: number;
}

/**
 * Battery real-time metrics
 */
export interface BatteryMetricsResDTO {
  present: boolean;
  percent: number;
  state: 'charging' | 'discharging' | 'full' | 'not_charging';
  isPlugged: boolean;
  powerDraw: number;
  voltage: number;
  timeRemaining: number; // minutes, -1 if unknown
  designCapacity: number;
  fullChargeCapacity: number;
  cycleCount: number;
  health: number;
  temperature?: number;
}

/**
 * Fan real-time metrics
 */
export interface FanMetricsResDTO {
  id: string;
  name: string;
  rpm: number;
  pwm: number;
  minRpm: number;
  maxRpm: number;
  mode: 'auto' | 'manual';
  tempSource: string;
  tachOk: boolean;
  status: StatusLevel;
}

/**
 * System general info
 */
export interface SystemInfoResDTO {
  uptimeSeconds: number;
  bootTime: number;
  localTime: string;
  timezone: string;
  status: StatusLevel;
  alerts: number;
}

