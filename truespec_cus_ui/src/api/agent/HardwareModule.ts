// ============================================================================
// HARDWARE MODULE - Static hardware information
// ============================================================================

import { agentHttpClient } from './httpClient';
import { ApiResponseDTO } from '../../dtos/common';
import {
  HardwareInfoResDTO,
  CPUInfoResDTO,
  GPUInfoResDTO,
  RAMInfoResDTO,
  StorageInfoResDTO,
  NetworkInfoResDTO,
  BatteryInfoResDTO,
  ScanHardwareReqDTO,
  ScanHardwareResultResDTO,
} from '../../dtos/agent';

/**
 * HardwareModule - Static hardware specifications
 * 
 * Responsibilities:
 * - Fetch hardware specifications
 * - Scan/detect hardware changes
 * - Cache hardware info
 */
class HardwareModule {
  private static instance: HardwareModule;
  private cachedInfo: HardwareInfoResDTO | null = null;
  private lastFetch: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): HardwareModule {
    if (!HardwareModule.instance) {
      HardwareModule.instance = new HardwareModule();
    }
    return HardwareModule.instance;
  }

  // ============================================================================
  // FULL HARDWARE INFO
  // ============================================================================

  /**
   * Get complete hardware information
   */
  async getHardwareInfo(forceRefresh = false): Promise<ApiResponseDTO<HardwareInfoResDTO>> {
    // Return cached if valid
    if (!forceRefresh && this.cachedInfo && (Date.now() - this.lastFetch) < this.cacheTimeout) {
      return {
        success: true,
        data: this.cachedInfo,
        error: null,
        timestamp: new Date().toISOString(),
      };
    }

    const response = await agentHttpClient.get<HardwareInfoResDTO>('/hardware');
    
    if (response.success && response.data) {
      this.cachedInfo = response.data;
      this.lastFetch = Date.now();
    }

    return response;
  }

  // ============================================================================
  // INDIVIDUAL COMPONENTS
  // ============================================================================

  /**
   * Get CPU specifications
   */
  async getCPUInfo(): Promise<ApiResponseDTO<CPUInfoResDTO>> {
    return agentHttpClient.get<CPUInfoResDTO>('/hardware/cpu');
  }

  /**
   * Get GPU specifications
   */
  async getGPUInfo(): Promise<ApiResponseDTO<GPUInfoResDTO[]>> {
    return agentHttpClient.get<GPUInfoResDTO[]>('/hardware/gpu');
  }

  /**
   * Get RAM specifications
   */
  async getRAMInfo(): Promise<ApiResponseDTO<RAMInfoResDTO>> {
    return agentHttpClient.get<RAMInfoResDTO>('/hardware/ram');
  }

  /**
   * Get Storage specifications
   */
  async getStorageInfo(): Promise<ApiResponseDTO<StorageInfoResDTO[]>> {
    return agentHttpClient.get<StorageInfoResDTO[]>('/hardware/storage');
  }

  /**
   * Get Network adapter info
   */
  async getNetworkInfo(): Promise<ApiResponseDTO<NetworkInfoResDTO[]>> {
    return agentHttpClient.get<NetworkInfoResDTO[]>('/hardware/network');
  }

  /**
   * Get Battery info
   */
  async getBatteryInfo(): Promise<ApiResponseDTO<BatteryInfoResDTO | null>> {
    return agentHttpClient.get<BatteryInfoResDTO | null>('/hardware/battery');
  }

  // ============================================================================
  // HARDWARE SCAN
  // ============================================================================

  /**
   * Trigger hardware scan
   */
  async scanHardware(options?: ScanHardwareReqDTO): Promise<ApiResponseDTO<ScanHardwareResultResDTO>> {
    const response = await agentHttpClient.post<ScanHardwareResultResDTO>('/hardware/scan', options || {});
    
    // Invalidate cache after scan
    if (response.success) {
      this.clearCache();
    }

    return response;
  }

  /**
   * Check for hardware changes
   */
  async detectChanges(): Promise<ApiResponseDTO<{ hasChanges: boolean; changes: unknown[] }>> {
    return agentHttpClient.get<{ hasChanges: boolean; changes: unknown[] }>('/hardware/changes');
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Clear cached hardware info
   */
  clearCache(): void {
    this.cachedInfo = null;
    this.lastFetch = 0;
  }

  /**
   * Get cached info without fetching
   */
  getCached(): HardwareInfoResDTO | null {
    return this.cachedInfo;
  }

  /**
   * Set cache timeout
   */
  setCacheTimeout(ms: number): void {
    this.cacheTimeout = ms;
  }
}

export const hardwareModule = HardwareModule.getInstance();
export default HardwareModule;

