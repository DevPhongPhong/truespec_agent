// ============================================================================
// GPU MODEL - OOP Model for GPU data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { GPUData, GPUEngine, GPUSpecs, GPUProcess, StatusLevel } from '../types';

export class GPUModel extends ObservableModel<GPUData> {
  constructor(specs?: Partial<GPUSpecs>) {
    const defaultSpecs: GPUSpecs = {
      name: 'NVIDIA GeForce MX130',
      manufacturer: 'NVIDIA',
      architecture: 'Maxwell GP108',
      vramSize: 2048,
      vramType: 'GDDR5',
      technology: '28 nm',
      busWidth: 64,
      baseClock: 1122,
      boostClock: 1242,
      tdp: 25,
      cudaCores: 384,
      driverVersion: '551.52',
      ...specs,
    };

    const defaultProcesses: GPUProcess[] = [
      { pid: 1234, name: 'chrome.exe', gpuUsage: 15.2, vramUsage: 256, percentage: 15.2 },
      { pid: 2345, name: 'game.exe', gpuUsage: 45.8, vramUsage: 1024, percentage: 45.8 },
      { pid: 3456, name: 'render.exe', gpuUsage: 12.3, vramUsage: 512, percentage: 12.3 },
    ];

    const initialData: GPUData = {
      id: 'gpu-main',
      name: 'GPU',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      gpuType: 'dGPU',
      activeGPU: defaultSpecs.name,
      load: 31,
      temperature: 46,
      fanSpeed: 1480,
      vramUsed: 488,
      vramTotal: defaultSpecs.vramSize,
      currentClock: 1150,
      power: 18.5,
      engines: GPUModel.generateEngineData(6, 31, 46),
      topProcesses: defaultProcesses,
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

  private static generateEngineData(count: number, baseLoad: number, baseTemp: number): GPUEngine[] {
    const engineNames = ['3D', 'Copy', 'Video Encode', 'Video Decode', 'Compute', 'Graphics'];
    return Array.from({ length: count }, (_, i) => ({
      engineIndex: i,
      name: engineNames[i] || `Engine ${i}`,
      usage: Math.round(baseLoad + (Math.random() * 40 - 20)),
      clock: +(1.0 + Math.random() * 0.4).toFixed(2),
      temperature: Math.round(baseTemp + Math.random() * 8 - 3),
    }));
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

