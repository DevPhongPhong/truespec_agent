// ============================================================================
// HARDWARE INFO RESPONSE DTOs - Static hardware specifications from Agent
// ============================================================================

/**
 * Complete hardware specifications
 */
export interface HardwareInfoResDTO {
  deviceId: string;
  deviceName: string;
  collectedAt: string;
  os: OSInfoResDTO;
  motherboard: MotherboardInfoResDTO;
  cpu: CPUInfoResDTO;
  gpu: GPUInfoResDTO[];
  ram: RAMInfoResDTO;
  storage: StorageInfoResDTO[];
  network: NetworkInfoResDTO[];
  battery: BatteryInfoResDTO | null;
  bios: BIOSInfoResDTO;
}

/**
 * Operating System info
 */
export interface OSInfoResDTO {
  name: string;
  version: string;
  build: string;
  architecture: '32-bit' | '64-bit';
  installDate?: string;
  lastUpdate?: string;
  serialNumber?: string;
}

/**
 * Motherboard info
 */
export interface MotherboardInfoResDTO {
  manufacturer: string;
  model: string;
  serialNumber?: string;
  biosVersion?: string;
}

/**
 * CPU specifications
 */
export interface CPUInfoResDTO {
  name: string;
  manufacturer: string;
  family: string;
  generation?: string;
  architecture: string;
  cores: number;
  threads: number;
  baseClock: number; // MHz
  turboClock: number; // MHz
  socket: string;
  tdp: number; // Watts
  lithography?: string;
  l1Cache: string;
  l2Cache: string;
  l3Cache: string;
  features: string[];
  virtualization: boolean;
}

/**
 * GPU specifications
 */
export interface GPUInfoResDTO {
  id: string;
  name: string;
  manufacturer: string;
  architecture?: string;
  vramSize: number; // MB
  vramType: string;
  busWidth: number; // bits
  baseClock: number; // MHz
  boostClock: number; // MHz
  technology?: string;
  tdp?: number;
  cudaCores?: number;
  streamProcessors?: number;
  driverVersion: string;
  driverDate?: string;
}

/**
 * RAM specifications
 */
export interface RAMInfoResDTO {
  totalSize: number; // bytes
  type: string;
  speed: number; // MHz
  channels: number;
  slots: number;
  usedSlots: number;
  modules: RAMModuleInfoResDTO[];
}

/**
 * RAM module info
 */
export interface RAMModuleInfoResDTO {
  slot: string;
  size: number; // bytes
  manufacturer: string;
  partNumber?: string;
  serialNumber?: string;
  speed: number;
  type: string;
  voltage?: number;
}

/**
 * Storage device info
 */
export interface StorageInfoResDTO {
  id: string;
  name: string;
  model: string;
  serialNumber?: string;
  type: 'hdd' | 'ssd' | 'nvme' | 'usb' | 'unknown';
  interface: string;
  totalCapacity: number; // bytes
  firmware?: string;
  partitions: PartitionInfoResDTO[];
  smart: SMARTInfoResDTO | null;
}

/**
 * Partition info
 */
export interface PartitionInfoResDTO {
  letter: string;
  label: string;
  fileSystem: string;
  totalSize: number;
  freeSpace: number;
  isSystem: boolean;
  isBoot: boolean;
}

/**
 * SMART data
 */
export interface SMARTInfoResDTO {
  healthPercent: number;
  status: 'good' | 'warning' | 'bad';
  powerOnHours: number;
  powerCycles: number;
  totalBytesWritten: number;
  totalBytesRead: number;
  reallocatedSectors: number;
  pendingSectors: number;
  mediaErrors: number;
  temperature?: number;
}

/**
 * Network adapter info
 */
export interface NetworkInfoResDTO {
  id: string;
  name: string;
  description: string;
  type: 'wifi' | 'ethernet' | 'virtual' | 'bluetooth';
  manufacturer?: string;
  macAddress: string;
  maxSpeed?: number;
  ipv4?: string;
  ipv6?: string;
  gateway?: string;
  dns?: string[];
  dhcp: boolean;
}

/**
 * Battery info
 */
export interface BatteryInfoResDTO {
  manufacturer?: string;
  model?: string;
  chemistry: string;
  designCapacity: number; // mWh
  fullChargeCapacity: number;
  voltage: number;
  cells?: number;
  manufactureDate?: string;
  serialNumber?: string;
}

/**
 * BIOS info
 */
export interface BIOSInfoResDTO {
  vendor: string;
  version: string;
  date: string;
  isUEFI: boolean;
  secureBoot?: boolean;
}

