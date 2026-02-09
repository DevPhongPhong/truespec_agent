// ============================================================================
// GPU MODEL - OOP Model for GPU data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { GPUData, GPUEngine, GPUSpecs, GPUProcess, StatusLevel } from '../types';

export class GPUModel extends ObservableModel<GPUData> {
  constructor(specs?: Partial<GPUSpecs>) {
    // Khởi tạo với dữ liệu minimal, sẽ được update từ API
    const defaultSpecs: GPUSpecs = {
      name: 'Unknown GPU',
      manufacturer: 'Unknown',
      architecture: '',
      vramSize: 0,
      vramType: '',
      technology: '',
      busWidth: 0,
      baseClock: 0,
      boostClock: 0,
      tdp: 0,
      cudaCores: 0,
      driverVersion: '',
      ...specs,
    };

    const initialData: GPUData = {
      id: 'gpu-main',
      name: 'GPU',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      gpuType: 'dGPU',
      activeGPU: defaultSpecs.name,
      load: 0,
      temperature: 0,
      fanSpeed: 0,
      vramUsed: 0,
      vramTotal: defaultSpecs.vramSize,
      currentClock: 0,
      power: 0,
      engines: [],
      topProcesses: [],
      history: {
        usage: [],
        vram: [],
        temp: [],
        power: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private initializeHistory(): void {
  }

  validate(): boolean {
    const { load, temperature, vramUsed, vramTotal } = this._data;
    return load >= 0 && load <= 100 &&
      temperature >= 0 && temperature <= 120 &&
      vramUsed >= 0 && vramUsed <= vramTotal;
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        usage: this.getHistory('usage'),
        vram: this.getHistory('vram'),
        temp: this.getHistory('temp'),
        power: this.getHistory('power'),
      },
    };
  }

  refresh(): void {
    // Data được update từ HardwareDeviceService
  }

  getStatus(): StatusLevel {
    if (this._data.temperature > 90 || this._data.load > 98) return 'danger';
    if (this._data.temperature > 80 || this._data.load > 90) return 'warn';
    return 'ok';
  }

  getVRAMUsagePercent(): number {
    return (this._data.vramUsed / this._data.vramTotal) * 100;
  }

  getStatusLabel(): string {
    const status = this.getStatus();
    if (status === 'danger') return 'Quá tải';
    if (status === 'warn') return 'Cảnh báo';
    return 'Ổn định';
  }
}

