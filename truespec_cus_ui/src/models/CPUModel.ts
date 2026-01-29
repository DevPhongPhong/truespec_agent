// ============================================================================
// CPU MODEL - OOP Model for CPU data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { CPUData, CPUCore, CPUSpecs, CPUProcess, StatusLevel } from '../types';

export class CPUModel extends ObservableModel<CPUData> {
  constructor(specs?: Partial<CPUSpecs>) {
    const defaultSpecs: CPUSpecs = {
      name: 'Intel Core i5-8250U',
      manufacturer: 'Intel',
      generation: '8th Gen',
      architecture: 'Kaby Lake R',
      cores: 4,
      threads: 8,
      baseClock: 1.6,
      turboClock: 3.4,
      socket: 'F4 (BGA)',
      tdp: 15,
      l1Cache: '256 KB (I+D)',
      l2Cache: '1 MB',
      l3Cache: '6 MB',
      supportedFeatures: ['VT-x', 'VT-d', 'EM64T', 'SSE4.1'],
      ...specs,
    };

    const defaultProcesses: CPUProcess[] = [
      { pid: 1234, name: 'chrome.exe', cpuUsage: 15.2, percentage: 15.2 },
      { pid: 2345, name: 'Code.exe', cpuUsage: 8.5, percentage: 8.5 },
      { pid: 3456, name: 'VMware.exe', cpuUsage: 6.3, percentage: 6.3 },
    ];

    const coreData = CPUModel.generateCoreData(defaultSpecs.threads, 32, 42);
    const avgClock = coreData.reduce((sum, core) => sum + core.clock, 0) / coreData.length;

    const initialData: CPUData = {
      id: 'cpu-main',
      name: 'CPU',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      load: 32,
      temperature: 42,
      power: 12.6,
      currentClock: avgClock,
      throttling: {
        thermal: false,
        power: false,
        isThrottling: false,
      },
      topProcesses: defaultProcesses,
      coreData,
      history: {
        usage: [],
        clock: [],
        temp: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private static generateCoreData(threadCount: number, baseLoad: number, baseTemp: number): CPUCore[] {
    return Array.from({ length: threadCount }, (_, i) => ({
      coreIndex: i,
      load: Math.round(baseLoad + (Math.random() * 50 - 25)),
      clock: +(1.6 + Math.random() * 1.3).toFixed(2),
      temperature: Math.round(baseTemp + Math.random() * 10 - 3),
    }));
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

  // Refresh with simulated data
  refresh(): void {

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

