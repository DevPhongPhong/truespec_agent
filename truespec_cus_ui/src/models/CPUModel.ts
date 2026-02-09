// ============================================================================
// CPU MODEL - OOP Model for CPU data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { CPUData, CPUCore, CPUSpecs, CPUProcess, StatusLevel } from '../types';

export class CPUModel extends ObservableModel<CPUData> {
  constructor(specs?: Partial<CPUSpecs>) {
    // Khởi tạo với dữ liệu minimal, sẽ được update từ API
    const defaultSpecs: CPUSpecs = {
      name: 'Unknown CPU',
      manufacturer: 'Unknown',
      generation: '',
      architecture: '',
      cores: 0,
      threads: 0,
      baseClock: 0,
      turboClock: 0,
      socket: '',
      serialNumber: '',
      tdp: 0,
      l1Cache: '',
      l2Cache: '',
      l3Cache: '',
      supportedFeatures: [],
      ...specs,
    };

    const initialData: CPUData = {
      id: 'cpu-main',
      name: 'CPU',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      load: 0,
      coreLoads: [],
      temperature: 0,
      power: 0,
      currentClock: 0,
      throttling: {
        thermal: false,
        power: false,
        isThrottling: false,
      },
      topProcesses: [],
      coreData: [],
      history: {
        usage: [],
        clock: [],
        temp: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private initializeHistory(): void {
  }

  validate(): boolean {
    const { load, temperature, power } = this._data;
    return load >= 0 && load <= 100 &&
      temperature >= 0 && temperature <= 150 &&
      power >= 0;
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        usage: this.getHistory('usage'),
        clock: this.getHistory('clock'),
        temp: this.getHistory('temp'),
      },
    };
  }

  // Refresh - data sẽ được update từ API service
  refresh(): void {
    // Data được update từ HardwareDeviceService
  }

  getStatus(): StatusLevel {
    if (this._data.temperature > 85 || this._data.load > 95) return 'danger';
    if (this._data.temperature > 70 || this._data.load > 80) return 'warn';
    return 'ok';
  }

  getStatusLabel(): string {
    const status = this.getStatus();
    if (status === 'danger') return 'Quá tải';
    if (status === 'warn') return 'Cảnh báo';
    return 'Ổn định';
  }
}

