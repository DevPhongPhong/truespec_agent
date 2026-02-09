// ============================================================================
// HARDWARE DEVICE MODULE - Service để lấy và bind dữ liệu hardware từ API
// ============================================================================

import { hardwareModule } from '../api/agent';
import {
  CPUDeviceResDTO,
  GPUDeviceResDTO,
  RAMDeviceResDTO,
  StoragePartitionResDTO,
  NetworkInterfaceResDTO,
  HardwareDeviceInfoResDTO,
} from '../dtos/agent/HardwareDeviceResDTO';
import { CPUModel } from '../models/CPUModel';
import { GPUModel } from '../models/GPUModel';
import { RAMModel } from '../models/RAMModel';
import { StorageModel } from '../models/StorageModel';
import { NetworkModel } from '../models/NetworkModel';
import { CPUSpecs, GPUSpecs, RAMSpecs, StorageSpecs } from '../types';

// State nội bộ của module (Thay thế cho properties trong Class)
export const cpu = new CPUModel();
export const gpu: GPUModel[] = [];
export const ram = new RAMModel();
export const storage: StorageModel[] = [];
export const network = new NetworkModel();

let isInitialized = false;

// ============================================================================
// HELPER METHODS (Private trong module)
// ============================================================================

const detectStorageType = (fstype: string): 'HDD' | 'SSD' | 'NVMe' => {
  const lower = fstype.toLowerCase();
  if (lower.includes('nvme') || lower.includes('nvm')) return 'NVMe';
  return 'SSD';
};

const detectInterface = (device: string): string => {
  if (device.includes('nvme')) return 'PCIe NVMe';
  if (device.includes('sd') || device.includes('hd')) return 'SATA';
  return 'Unknown';
};

const detectNetworkType = (name: string): 'Wi-Fi' | 'Ethernet' | 'Virtual' | 'Bluetooth' => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('wifi') || lowerName.includes('wlan') || lowerName.includes('wireless')) return 'Wi-Fi';
  if (lowerName.includes('ethernet') || lowerName.includes('eth')) return 'Ethernet';
  if (lowerName.includes('bluetooth') || lowerName.includes('bt')) return 'Bluetooth';
  if (lowerName.includes('virtual') || lowerName.includes('vmware') || lowerName.includes('virtualbox')) return 'Virtual';
  return 'Ethernet';
};

// ============================================================================
// DATA BINDING METHODS
// ============================================================================

const bindCPUData = (cpuData: CPUDeviceResDTO): void => {
  const cores = cpuData.cores || 0;
  const threads = cpuData.threads || cores; // Sử dụng threads từ API, fallback về cores nếu không có
  
  // Format cache sizes
  const formatCache = (kb?: number): string => {
    if (!kb || kb === 0) return '-';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };
  
  // Base clock: ưu tiên base_clock_mhz, sau đó max_clock_mhz, cuối cùng mhz
  const baseClockMHz = cpuData.base_clock_mhz || cpuData.max_clock_mhz || cpuData.mhz || 0;
  const baseClockGHz = baseClockMHz / 1000;
  
  // Turbo clock: 
  // - Nếu có max_clock_mhz và current_clock_mhz > max_clock_mhz, thì current là turbo
  // - Nếu không, ước tính turbo = base * 1.2 (20% boost typical)
  const maxClockMHz = cpuData.max_clock_mhz || cpuData.mhz || 0;
  const currentClockMHz = cpuData.current_clock_mhz || maxClockMHz || cpuData.mhz || 0;
  
  // Turbo clock logic: if current > max, use current as turbo, else estimate
  const turboClockGHz = currentClockMHz > maxClockMHz && maxClockMHz > 0
    ? currentClockMHz / 1000
    : baseClockGHz > 0 
      ? baseClockGHz * 1.2  // Estimate 20% boost
      : 0;
  
  const specs: Partial<CPUSpecs> = {
    name: cpuData.model || 'Unknown CPU',
    manufacturer: cpuData.vendor || 'Unknown',
    cores: cores,
    threads: threads,
    baseClock: baseClockGHz,
    turboClock: turboClockGHz,
    architecture: cpuData.architecture || '',
    socket: cpuData.socket || '',
    serialNumber: cpuData.serial_number || '',
    tdp: cpuData.tdp || 0,
    l1Cache: formatCache(cpuData.l1_cache_kb),
    l2Cache: formatCache(cpuData.l2_cache_kb),
    l3Cache: formatCache(cpuData.l3_cache_kb),
  };

  // Generate core data with per-core usage if available
  const perCoreUsage = cpuData.per_core_usage || [];
  
  // Populate coreLoads array with per-core usage
  const coreLoads: number[] = perCoreUsage.length > 0 
    ? perCoreUsage.map(usage => Math.max(0, Math.min(100, usage))) // Ensure 0-100 range
    : threads > 0 
      ? Array(threads).fill(cpuData.usage_percent || 0) // Fallback to overall usage
      : [];
  
  const coreData = Array.from({ length: threads }, (_, i) => ({
    coreIndex: i,
    // Use per-core usage if available, otherwise use overall CPU usage
    load: i < coreLoads.length ? coreLoads[i] : (cpuData.usage_percent || 0),
    clock: currentClockMHz / 1000,
    temperature: 0, // Temperature không có trong API response
  }));

  cpu.update({
    specs: { ...cpu.data.specs, ...specs },
    load: cpuData.usage_percent || 0, // Overall CPU load
    coreLoads: coreLoads, // Array of load for each core/thread
    currentClock: currentClockMHz / 1000,
    coreData: coreData,
    topProcesses: [], // Processes không có trong hardware API
    lastUpdated: new Date(),
  });
};

const bindGPUData = (gpuArray: GPUDeviceResDTO[]): void => {
  gpu.length = 0; // Clear array
  gpuArray.forEach((gpuData, index) => {
    const specs: Partial<GPUSpecs> = {
      name: gpuData.name,
      manufacturer: gpuData.vendor,
      vramSize: gpuData.vram_total_mb,
      driverVersion: gpuData.driver,
    };

    const gpuModel = new GPUModel(specs);

    gpuModel.update({
      id: `gpu-${index}`,
      name: gpuData.name,
      activeGPU: gpuData.name,
      gpuType: gpuData.integrated ? 'iGPU' : 'dGPU',
      vramUsed: gpuData.vram_used_mb,
      vramTotal: gpuData.vram_total_mb,
      load: 0, // Load không có trong API response
      temperature: 0, // Temperature không có trong API response
      topProcesses: [], // Processes không có trong hardware API
      engines: [], // Engines không có trong API response
      lastUpdated: new Date(),
    });
    gpu.push(gpuModel);
  });
};

const bindRAMData = (ramData: RAMDeviceResDTO): void => {
  const specs: Partial<RAMSpecs> = { totalSize: ramData.total_mb / 1024 };

  ram.update({
    specs: { ...ram.data.specs, ...specs },
    usedPercent: ramData.used_percent,
    usedGB: ramData.used_mb / 1024,
    freeGB: ramData.free_mb / 1024,
    availableGB: ramData.available_mb / 1024,
    cacheGB: ramData.cached_mb / 1024,
    lastUpdated: new Date(),
  });
};

const bindStorageData = (partitions: StoragePartitionResDTO[]): void => {
  storage.length = 0; // Clear existing storage

  // Tạo một StorageModel cho mỗi partition để hiển thị đầy đủ
  partitions.forEach((partition, index) => {
    const specs: Partial<StorageSpecs> = {
      name: partition.device,
      model: partition.device,
      totalCapacity: partition.total_gb,
      type: detectStorageType(partition.fstype),
      interface: detectInterface(partition.device),
    };

    const storageModel = new StorageModel(specs);
    
    // Extract drive letter từ mountpoint (ví dụ: C:\, D:\)
    const driveLetter = partition.mountpoint.length > 0 
      ? partition.mountpoint.charAt(0).toUpperCase() + ':' 
      : partition.mountpoint;

    storageModel.update({
      id: `storage-${index}`,
      name: `Storage ${driveLetter}`,
      usedPercent: partition.used_percent,
      usedGB: partition.used_gb,
      freeGB: partition.free_gb,
      // Mỗi partition là một storage device riêng, nên partitions array chỉ chứa chính nó
      partitions: [{
        letter: driveLetter,
        label: partition.mountpoint || driveLetter,
        fileSystem: partition.fstype,
        usedGB: partition.used_gb,
        totalGB: partition.total_gb,
        usedPercent: partition.used_percent,
      }],
      lastUpdated: new Date(),
    });
    
    storage.push(storageModel);
  });
};

const bindNetworkData = (interfaces: NetworkInterfaceResDTO[]): void => {
  const adapters = interfaces.map(iface => ({
    name: iface.name,
    type: detectNetworkType(iface.name),
    status: iface.flags.includes('up') ? 'up' as const : 'down' as const,
    ipv4: iface.addresses.find(addr => addr.includes('.'))?.split('/')[0],
    mac: iface.mac,
  }));

  const activeAdapter = adapters.find(a => a.status === 'up' && a.ipv4);

  network.update({
    adapters,
    connection: activeAdapter ? {
      ...network.data.connection,
      adapterName: activeAdapter.name,
      ipv4: activeAdapter.ipv4 || '',
      type: activeAdapter.type,
    } : network.data.connection,
    lastUpdated: new Date(),
  });
};

const bindHardwareData = async (data: HardwareDeviceInfoResDTO): Promise<void> => {
  if (data.cpu) bindCPUData(data.cpu);
  if (data.gpu) bindGPUData(data.gpu);
  if (data.ram) bindRAMData(data.ram);
  if (data.storage?.partitions) bindStorageData(data.storage.partitions);
  if (data.network?.interfaces) bindNetworkData(data.network.interfaces);
};

// ============================================================================
// EXPORTED ACTIONS (Public API)
// ============================================================================

export const fetchCPU = async (): Promise<void> => {
  const res = await hardwareModule.getCPUInfo();
  if (res.success && res.data) {
    const cpuData = (res.data as unknown as CPUDeviceResDTO[])[0];
    if (cpuData) bindCPUData(cpuData);
  }
};

export const fetchGPU = async (): Promise<void> => {
  const res = await hardwareModule.getGPUInfo();
  if (res.success && res.data) bindGPUData(res.data as unknown as GPUDeviceResDTO[]);
};

export const fetchRAM = async (): Promise<void> => {
  const res = await hardwareModule.getRAMInfo();
  if (res.success && res.data) {
    const ramData = (res.data as unknown as RAMDeviceResDTO[])[0];
    if (ramData) bindRAMData(ramData);
  }
};

export const fetchStorage = async (): Promise<void> => {
  const res = await hardwareModule.getStorageInfo();
  if (res.success && res.data) bindStorageData(res.data as unknown as StoragePartitionResDTO[]);
};

export const fetchNetwork = async (): Promise<void> => {
  const res = await hardwareModule.getNetworkInfo();
  if (res.success && res.data) bindNetworkData(res.data as unknown as NetworkInterfaceResDTO[]);
};

export const refresh = async (): Promise<void> => {
  try {
    const res = await hardwareModule.getHardwareInfo(true);
    if (res.success && res.data) {
      await bindHardwareData(res.data as unknown as HardwareDeviceInfoResDTO);
    }
  } catch (error) {
    console.error('[HardwareDeviceModule] Error refreshing data:', error);
  }
};

export const initialize = async (): Promise<void> => {
  if (isInitialized) return;
  await refresh();
  isInitialized = true;
};

/**
 * Một object gom nhóm tất cả các phương thức (tương tự instance cũ)
 * Tiện cho việc migrate code cũ: hardwareDeviceService.refresh()
 */
export const HardwareDeviceService = {
  cpu,
  gpu,
  ram,
  storage,
  network,
  initialize,
  refresh,
  fetchCPU,
  fetchGPU,
  fetchRAM,
  fetchStorage,
  fetchNetwork,
  get isInitialized() { return isInitialized; }
};

export default HardwareDeviceService;