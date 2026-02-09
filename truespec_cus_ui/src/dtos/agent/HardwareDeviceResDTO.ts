// ============================================================================
// HARDWARE DEVICE RESPONSE DTOs - Response từ Agent API Go
// ============================================================================

/**
 * CPU Info từ API Go
 */
export interface CPUDeviceResDTO {
  usage_percent?: number;
  per_core_usage?: number[]; // Array of CPU usage per core/thread
  cores?: number;
  threads?: number;
  model?: string;
  mhz?: number;
  vendor?: string;
  base_clock_mhz?: number;
  max_clock_mhz?: number;
  current_clock_mhz?: number;
  architecture?: string;
  socket?: string;
  serial_number?: string;
  tdp?: number;
  l1_cache_kb?: number;
  l2_cache_kb?: number;
  l3_cache_kb?: number;
}

/**
 * GPU Info từ API Go
 */
export interface GPUDeviceResDTO {
  index: number;
  name: string;
  vendor: string;
  vram_total_mb: number;
  vram_used_mb: number;
  driver: string;
  bus_id: string;
  integrated: boolean;
}

/**
 * RAM Info từ API Go
 */
export interface RAMDeviceResDTO {
  total_mb: number;
  available_mb: number;
  used_mb: number;
  used_percent: number;
  free_mb: number;
  cached_mb: number;
  buffers_mb: number;
}

/**
 * Storage Partition từ API Go
 */
export interface StoragePartitionResDTO {
  device: string;
  mountpoint: string;
  fstype: string;
  total_gb: number;
  used_gb: number;
  free_gb: number;
  used_percent: number;
}

/**
 * Network Interface từ API Go
 */
export interface NetworkInterfaceResDTO {
  name: string;
  mtu: number;
  flags: string[];
  addresses: string[];
  mac?: string;
}

/**
 * OS Info từ API Go
 */
export interface OSDeviceResDTO {
  hostname: string;
  os: string;
  platform: string;
  platform_family: string;
  platform_version: string;
  kernel_version: string;
  kernel_arch: string;
  uptime: number;
  boot_time: number;
  go_version: string;
  num_cpu: number;
}

/**
 * Complete Hardware Info từ API Go
 */
export interface HardwareDeviceInfoResDTO {
  os: OSDeviceResDTO;
  cpu: CPUDeviceResDTO;
  gpu: GPUDeviceResDTO[];
  ram: RAMDeviceResDTO;
  storage: {
    partitions: StoragePartitionResDTO[];
  };
  network: {
    interfaces: NetworkInterfaceResDTO[];
  };
}
