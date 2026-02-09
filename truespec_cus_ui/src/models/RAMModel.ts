// ============================================================================
// RAM MODEL - OOP Model for RAM data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { RAMData, RAMModule, RAMProcess, RAMSpecs, StatusLevel } from '../types';

export class RAMModel extends ObservableModel<RAMData> {
  constructor(specs?: Partial<RAMSpecs>) {
    // Khởi tạo với dữ liệu minimal, sẽ được update từ API
    const defaultSpecs: RAMSpecs = {
      totalSize: 0,
      type: '',
      speed: 0,
      speedMTs: 0,
      speedMode: 'JEDEC',
      channels: 'Single',
      modules: [],
      ...specs,
    };

    const initialData: RAMData = {
      id: 'ram-main',
      name: 'RAM',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      usedPercent: 0,
      usedGB: 0,
      freeGB: 0,
      availableGB: 0,
      cachePercent: 0,
      cacheGB: 0,
      compressedGB: 0,
      swapUsedGB: 0,
      swapTotalGB: 0,
      isSwapping: false,
      topProcesses: [],
      history: {
        usage: [],
        cache: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private initializeHistory(): void {
  }

  validate(): boolean {
    const { usedPercent, usedGB, specs } = this._data;
    return usedPercent >= 0 && usedPercent <= 100 &&
      usedGB >= 0 && usedGB <= specs.totalSize;
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        usage: this.getHistory('usage'),
        cache: this.getHistory('cache'),
      },
    };
  }

  refresh(): void {
    // Data được update từ HardwareDeviceService
  }

  getStatus(): StatusLevel {
    if (this._data.usedPercent > 90) return 'danger';
    if (this._data.usedPercent > 75) return 'warn';
    return 'ok';
  }

  getStatusLabel(): string {
    const status = this.getStatus();
    if (status === 'danger') return 'RAM đang đầy';
    if (status === 'warn') return 'RAM đang cao';
    return 'RAM ổn định';
  }
}

