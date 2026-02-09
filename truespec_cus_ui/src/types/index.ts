// ============================================================================
// LUNA MONITOR - TYPE DEFINITIONS
// Cấu trúc dữ liệu chuẩn OOP cho ứng dụng giám sát hệ thống
// ============================================================================

// ============================================================================
// BASE TYPES
// ============================================================================

export type StatusLevel = 'ok' | 'warn' | 'danger';
export type Theme = 'dark' | 'light';
export type FanMode = 'AUTO' | 'MANUAL';
export type BatteryState = 'Charging' | 'Discharging' | 'Full' | 'NotCharging';
export type AdapterStatus = 'up' | 'down';

// ============================================================================
// METRIC BASE
// ============================================================================

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface MetricValue {
  value: number;
  unit: string;
  displayValue: string;
}

export interface BaseMetric {
  id: string;
  name: string;
  lastUpdated: Date;
}

// ============================================================================
// SYSTEM & DEVICE
// ============================================================================
export enum DeviceType {
  DESKTOP = 1,
  LAPTOP = 2,
  SERVER = 3,
}

export const DeviceTypeLabel = {
  [DeviceType.DESKTOP]: 'Desktop',
  [DeviceType.LAPTOP]: 'Laptop',
  [DeviceType.SERVER]: 'Server',
}

export interface DeviceInfo {
  id: string;
  name: string;
  type: DeviceType;
  os: string;
  osVersion: string;
  architecture: '32-bit' | '64-bit';
  manufacturer?: string;
  model?: string;
}

export interface SystemStatus {
  overall: StatusLevel;
  label: string;
  description: string;
  uptimeDays: number;
  lastCheck: Date;
}

// ============================================================================
// CPU
// ============================================================================

export interface CPUCore {
  coreIndex: number;
  load: number;
  clock: number;
  temperature: number;
}

export interface CPUProcess {
  pid: number;
  name: string;
  cpuUsage: number;
  percentage: number;
}

export interface CPUThrottling {
  thermal: boolean;
  power: boolean;
  isThrottling: boolean;
}

export interface CPUSpecs {
  name: string;
  manufacturer: string;
  generation: string;
  architecture: string;
  cores: number;
  threads: number;
  baseClock: number;
  turboClock: number;
  socket: string;
  serialNumber: string;
  tdp: number;
  l1Cache: string;
  l2Cache: string;
  l3Cache: string;
  supportedFeatures: string[];
}

export interface CPUData extends BaseMetric {
  specs: CPUSpecs;
  load: number;
  coreLoads: number[];
  temperature: number;
  power: number;
  currentClock: number;
  throttling: CPUThrottling;
  topProcesses: CPUProcess[];
  coreData: CPUCore[];
  history: {
    usage: TimeSeriesPoint[];
    clock: TimeSeriesPoint[];
    temp: TimeSeriesPoint[];
  };
}

// ============================================================================
// GPU
// ============================================================================

export interface GPUEngine {
  engineIndex: number;
  name: string;
  usage: number;
  clock: number;
  temperature: number;
}

export interface GPUProcess {
  pid: number;
  name: string;
  gpuUsage: number;
  vramUsage: number;
  percentage: number;
}

export type GPUType = 'iGPU' | 'dGPU' | 'Hybrid';

export interface GPUSpecs {
  name: string;
  manufacturer: string;
  architecture: string;
  vramSize: number;
  vramType: string;
  technology: string;
  busWidth: number;
  baseClock: number;
  boostClock: number;
  tdp: number;
  cudaCores?: number;
  driverVersion: string;
}

export interface GPUData extends BaseMetric {
  specs: GPUSpecs;
  gpuType: GPUType;
  activeGPU: string; // Which GPU is currently active
  load: number;
  temperature: number;
  fanSpeed: number;
  vramUsed: number;
  vramTotal: number;
  currentClock: number; // Current GPU clock in MHz
  power: number; // Power consumption in W
  engines: GPUEngine[];
  topProcesses: GPUProcess[];
  history: {
    usage: TimeSeriesPoint[];
    vram: TimeSeriesPoint[];
    temp: TimeSeriesPoint[];
    power: TimeSeriesPoint[];
  };
}

// ============================================================================
// RAM
// ============================================================================

export interface RAMModule {
  slot: string;
  size: number;
  brand: string;
  speed: number;
  type: string;
}

export interface RAMProcess {
  pid: number;
  name: string;
  memoryUsage: number;
  percentage: number;
}

export interface RAMSpecs {
  totalSize: number;
  type: string;
  speed: number; // MHz
  speedMTs?: number; // MT/s (MegaTransfers per second)
  speedMode?: 'JEDEC' | 'XMP' | 'EXPO'; // Memory profile mode
  channels: 'Single' | 'Dual' | 'Quad';
  modules: RAMModule[];
}

export interface RAMData extends BaseMetric {
  specs: RAMSpecs;
  usedPercent: number;
  usedGB: number;
  freeGB: number;
  availableGB?: number; // Available = Free + Cached (can be reclaimed)
  cachePercent: number;
  cacheGB?: number; // Cached memory in GB
  compressedGB?: number; // Compressed memory (Windows Memory Compression)
  swapUsedGB?: number; // Swap/Pagefile used in GB
  swapTotalGB?: number; // Total swap/pagefile size in GB
  isSwapping?: boolean; // Whether system is actively swapping
  topProcesses: RAMProcess[];
  history: {
    usage: TimeSeriesPoint[];
    cache: TimeSeriesPoint[];
  };
}

// ============================================================================
// STORAGE
// ============================================================================

export interface Partition {
  letter: string;
  label: string;
  fileSystem: string;
  usedGB: number;
  totalGB: number;
  usedPercent: number;
}

export interface SMARTData {
  healthPercent: number;
  powerOnHours: number;
  powerCycles: number;
  totalBytesWritten: number;
  reallocatedSectors: number;
  pendingSectors?: number;
  mediaErrors: number;
  temperature?: number;
  status: 'Good' | 'Warning' | 'Bad';
}

export interface StorageSpecs {
  name: string;
  model: string;
  type: 'HDD' | 'SSD' | 'NVMe';
  interface: string;
  pcieGen?: 'Gen3' | 'Gen4' | 'Gen5' | string;
  totalCapacity: number;
}

export interface StorageData extends BaseMetric {
  specs: StorageSpecs;
  usedPercent: number;
  usedGB: number;
  freeGB: number;
  partitions: Partition[];
  smart: SMARTData;
  performance: {
    currentRead: number;
    currentWrite: number;
    peakRead: number;
    peakWrite: number;
    baselineRead?: number;
    baselineWrite?: number;
  };
  history: {
    read: TimeSeriesPoint[];
    write: TimeSeriesPoint[];
  };
}

// ============================================================================
// NETWORK
// ============================================================================

export enum WiFiStandard {
  WIFI_5 = 'Wi-Fi 5',
  WIFI_6 = 'Wi-Fi 6',
  WIFI_6E = 'Wi-Fi 6E',
  WIFI_7 = 'Wi-Fi 7',
}

export enum WiFiFrequencyBand {
  BAND_2_4_GHZ = '2.4 GHz',
  BAND_5_GHZ = '5 GHz',
  BAND_6_GHZ = '6 GHz',
}

export enum ConnectionType {
  WIFI = 'Wi-Fi',
  ETHERNET = 'Ethernet',
}

export enum DNSStatus {
  WORKING = 'Working',
  SLOW = 'Slow',
  FAILED = 'Failed',
  UNKNOWN = 'Unknown',
}

export interface NetworkAdapter {
  name: string;
  type: 'Wi-Fi' | 'Ethernet' | 'Virtual' | 'Bluetooth';
  status: AdapterStatus;
  ipv4?: string;
  mac?: string;
}

export interface NetworkConnection {
  ssid?: string;
  type: string;
  security: string;
  status: 'Online' | 'Offline' | 'Limited';
  ipv4: string;
  gateway: string;
  dns: string;
  publicIP?: string;
  linkSpeed: number;
  signalStrength?: number;
  // New fields
  adapterName?: string;
  wifiStandard?: WiFiStandard;
  frequencyBand?: WiFiFrequencyBand;
  rssi?: number; // Signal strength in dBm
  jitter?: number; // Jitter in ms
  dnsStatus?: DNSStatus;
}

export interface NetworkData extends BaseMetric {
  connection: NetworkConnection;
  adapters: NetworkAdapter[];
  ping: number;
  currentDownload: number;
  currentUpload: number;
  totalReceived: number;
  totalSent: number;
  packetLoss: number;
  natType?: string;
  history: {
    download: TimeSeriesPoint[];
    upload: TimeSeriesPoint[];
  };
}

// ============================================================================
// BATTERY
// ============================================================================

export interface BatteryHealth {
  healthPercent: number;
  designCapacity: number;
  fullChargeCapacity: number;
  cycleCount: number;
  wearLevel: number;
  status: 'Good' | 'Fair' | 'Poor';
  lastFullCharge: string;
}

export interface UsageScenario {
  name: string;
  estimatedDraw: number;
  estimatedRuntime: number;
}

export interface BatteryDrainApp {
  name: string;
  powerDraw: number; // W
  percentage: number; // % of total power draw
}

export interface BatteryData extends BaseMetric {
  percent: number;
  state: BatteryState;
  isPlugged: boolean;
  powerMode: string;
  powerDraw: number;
  chargingRate?: number; // W when charging
  dischargingRate?: number; // W when discharging
  timeRemainingMinutes: number;
  timeToFullChargeMinutes?: number; // minutes to full charge when charging
  chargingLimitEnabled?: boolean; // 80% charging limit
  chargingLimitSupported?: boolean; // whether device supports charging limit
  health: BatteryHealth;
  scenarios: UsageScenario[];
  topDrainApps?: BatteryDrainApp[];
  history: {
    level: TimeSeriesPoint[];
  };
}

// ============================================================================
// FAN
// ============================================================================

export interface FanCurvePoint {
  temperature: number;
  pwmDuty: number;
}

export interface Fan {
  id: string;
  name: string;
  rpm: number;
  minRpm: number;
  maxRpm: number;
  pwm: number;
  mode: FanMode;
  tempSource: string;
  tachOk: boolean;
  status: StatusLevel;
}

export interface FanData extends BaseMetric {
  provider: string;
  fans: Fan[];
  selectedFanId: string;
  curve: FanCurvePoint[];
  history: {
    rpm: TimeSeriesPoint[];
    pwm: TimeSeriesPoint[];
  };
}

// ============================================================================
// ALERT
// ============================================================================

export interface AlertReason {
  reason: string;
  detail: string;
  status: StatusLevel;
}

export interface Alert {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  title: string;
  subtitle: string;
  code: string;
  detectedAt: Date;
  deviceName: string;
  reasons: AlertReason[];
  isRead: boolean;
  isDismissed: boolean;
}

// ============================================================================
// USER & SUBSCRIPTION
// ============================================================================

export interface User {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  memberSince: Date;
}

export interface Device {
  id: string;
  name: string;
  type: 'desktop' | 'laptop';
  os: string;
  status: 'active' | 'warning' | 'offline';
  icon: string;
}

export interface Subscription {
  planId: string;
  planName: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  renewalDate: Date;
  daysUsed: number;
  daysRemaining: number;
  maxDevices: number;
}

export interface UserSettings {
  user: User;
  devices: Device[];
  subscription: Subscription;
  twoFactorEnabled: boolean;
  language: string;
  lastPasswordChange: Date;
}

// ============================================================================
// PRICING PLANS
// ============================================================================

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  isRecommended: boolean;
  isEnterprise: boolean;
}

// ============================================================================
// APP STATE
// ============================================================================

export interface AppState {
  theme: Theme;
  currentDevice: DeviceInfo | null;
  systemStatus: SystemStatus | null;
  lastRefresh: Date | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// LOG ENTRY
// ============================================================================

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: StatusLevel;
  title: string;
  description: string;
  source: string;
}

