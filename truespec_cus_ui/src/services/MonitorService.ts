// ============================================================================
// MONITOR SERVICE - Central service for all hardware monitoring
// ============================================================================

import { BaseService } from './BaseService';
import { 
  CPUModel, 
  GPUModel, 
  RAMModel, 
  StorageModel, 
  NetworkModel, 
  BatteryModel, 
  FanModel 
} from '../models';
import { DeviceInfo, SystemStatus, StatusLevel, DeviceType } from '../types';

type MonitorCallback = () => void;

export class MonitorService extends BaseService {
  private static instance: MonitorService | null = null;
  
  // Models
  public readonly cpu: CPUModel;
  public readonly gpu: GPUModel;
  public readonly ram: RAMModel;
  public readonly storage: StorageModel;
  public readonly network: NetworkModel;
  public readonly battery: BatteryModel;
  public readonly fan: FanModel;

  // Device info
  private deviceInfo: DeviceInfo;

  // Callbacks
  private onUpdateCallbacks: Set<MonitorCallback> = new Set();

  private constructor() {
    super();
    this.cpu = new CPUModel();
    this.gpu = new GPUModel();
    this.ram = new RAMModel();
    this.storage = new StorageModel();
    this.network = new NetworkModel();
    this.battery = new BatteryModel();
    this.fan = new FanModel();

    this.deviceInfo = {
      id: 'device-001',
      name: 'My Laptop',
      type: DeviceType.LAPTOP,
      os: 'Windows 11 Home SL',
      osVersion: '22H2',
      architecture: '64-bit',
      manufacturer: 'HP',
      model: 'HP Laptop 15',
    };
  }

  static getInstance(): MonitorService {
    if (!MonitorService.instance) {
      MonitorService.instance = new MonitorService();
    }
    return MonitorService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Simulate initial data fetch
    await this.delay(100);
    this.isInitialized = true;
  }

  async refresh(): Promise<void> {
    // Refresh all models
    this.cpu.refresh();
    this.gpu.refresh();
    this.ram.refresh();
    this.storage.refresh();
    this.network.refresh();
    this.battery.refresh();
    this.fan.refresh();

    // Notify subscribers
    this.notifyUpdate();
  }

  dispose(): void {
    this.stopAutoRefresh();
    this.onUpdateCallbacks.clear();
    MonitorService.instance = null;
  }

  // Subscribe to updates
  onUpdate(callback: MonitorCallback): () => void {
    this.onUpdateCallbacks.add(callback);
    return () => this.onUpdateCallbacks.delete(callback);
  }

  notifyUpdate(): void {
    this.onUpdateCallbacks.forEach(cb => cb());
  }

  // Getters
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  getSystemStatus(): SystemStatus {
    const statuses: StatusLevel[] = [
      this.cpu.getStatus(),
      this.gpu.getStatus(),
      this.ram.getStatus(),
      this.storage.getStatus(),
      this.network.getStatus(),
      this.battery.getStatus(),
      this.fan.getOverallStatus(),
    ];

    let overall: StatusLevel = 'ok';
    let label = 'Ổn định';
    let description = 'Máy đang chạy ổn định';

    if (statuses.some(s => s === 'danger')) {
      overall = 'danger';
      label = 'Nguy hiểm';
      description = 'Có vấn đề nghiêm trọng cần xử lý';
    } else if (statuses.some(s => s === 'warn')) {
      overall = 'warn';
      label = 'Cảnh báo';
      description = 'Có một số vấn đề cần lưu ý';
    }

    return {
      overall,
      label,
      description,
      uptimeDays: 10,
      lastCheck: new Date(),
    };
  }

  // Quick metrics for overview
  getQuickMetrics() {
    return {
      cpuLoad: this.cpu.data.load,
      cpuTemp: this.cpu.data.temperature,
      ramUsage: this.ram.data.usedPercent,
      gpuLoad: this.gpu.data.load,
      gpuTemp: this.gpu.data.temperature,
      storageUsed: this.storage.data.usedPercent,
      batteryPercent: this.battery.data.percent,
      batteryPlugged: this.battery.data.isPlugged,
      networkOnline: this.network.isOnline(),
      networkPing: this.network.data.ping,
    };
  }
}

export const monitorService = MonitorService.getInstance();

