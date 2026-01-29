// ============================================================================
// RAM MODEL - OOP Model for RAM data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { RAMData, RAMModule, RAMProcess, RAMSpecs, StatusLevel } from '../types';

export class RAMModel extends ObservableModel<RAMData> {
  constructor(specs?: Partial<RAMSpecs>) {
    const defaultModules: RAMModule[] = [
      { slot: 'Slot 1', size: 8, brand: 'Samsung M471A1K43CB1-CTD', speed: 2133, type: 'DDR4' },
      { slot: 'Slot 2', size: 8, brand: 'Micron 16ATF1G64HZ-2G1A2', speed: 2133, type: 'DDR4' },
    ];

    const defaultSpecs: RAMSpecs = {
      totalSize: 16,
      type: 'DDR4',
      speed: 2133,
      speedMTs: 4266, // MT/s (typically 2x MHz for DDR)
      speedMode: 'XMP',
      channels: 'Dual',
      modules: defaultModules,
      ...specs,
    };

    const defaultProcesses: RAMProcess[] = [
      { pid: 1234, name: 'chrome.exe', memoryUsage: 2.4, percentage: 15 },
      { pid: 2345, name: 'Code.exe', memoryUsage: 1.2, percentage: 7.5 },
      { pid: 3456, name: 'VMware.exe', memoryUsage: 3.0, percentage: 18.75 },
      { pid: 4567, name: 'discord.exe', memoryUsage: 0.6, percentage: 3.75 },
      { pid: 5678, name: 'explorer.exe', memoryUsage: 0.3, percentage: 1.875 },
    ];

    const initialData: RAMData = {
      id: 'ram-main',
      name: 'RAM',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      usedPercent: 79,
      usedGB: 12.6,
      freeGB: 3.4,
      availableGB: 6.2, // Free + Cached
      cachePercent: 10,
      cacheGB: 2.8,
      compressedGB: 0.5,
      swapUsedGB: 0.2,
      swapTotalGB: 8.0,
      isSwapping: false,
      topProcesses: defaultProcesses,
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

