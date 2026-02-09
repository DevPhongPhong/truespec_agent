// ============================================================================
// STORAGE MODEL - OOP Model for Storage data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { StorageData, Partition, SMARTData, StorageSpecs, StatusLevel } from '../types';

export class StorageModel extends ObservableModel<StorageData> {
  constructor(specs?: Partial<StorageSpecs>) {
    // Khởi tạo với dữ liệu minimal, sẽ được update từ API
    const defaultSpecs: StorageSpecs = {
      name: 'Unknown Storage',
      model: '',
      type: 'SSD',
      interface: '',
      pcieGen: undefined,
      totalCapacity: 0,
      ...specs,
    };

    const defaultSMART: SMARTData = {
      healthPercent: 100,
      powerOnHours: 0,
      powerCycles: 0,
      totalBytesWritten: 0,
      reallocatedSectors: 0,
      pendingSectors: 0,
      mediaErrors: 0,
      temperature: undefined,
      status: 'Good',
    };

    const initialData: StorageData = {
      id: 'storage-main',
      name: 'Storage',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      usedPercent: 0,
      usedGB: 0,
      freeGB: 0,
      partitions: [],
      smart: defaultSMART,
      performance: {
        currentRead: 0,
        currentWrite: 0,
        peakRead: 0,
        peakWrite: 0,
        baselineRead: 0,
        baselineWrite: 0,
      },
      history: {
        read: [],
        write: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private initializeHistory(): void {

  }

  validate(): boolean {
    const { usedPercent, usedGB, specs, smart } = this._data;
    return usedPercent >= 0 && usedPercent <= 100 &&
      usedGB >= 0 && usedGB <= specs.totalCapacity &&
      smart.healthPercent >= 0 && smart.healthPercent <= 100;
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        read: this.getHistory('read'),
        write: this.getHistory('write'),
      },
    };
  }

  refresh(): void {
    // Data được update từ HardwareDeviceService
  }

  getStatus(): StatusLevel {
    const { usedPercent, smart } = this._data;
    if (smart.healthPercent < 60 || usedPercent > 95) return 'danger';
    if (smart.healthPercent < 80 || usedPercent > 85) return 'warn';
    return 'ok';
  }

  getSMARTStatus(): 'Good' | 'Warning' | 'Bad' {
    const health = this._data.smart.healthPercent;
    if (health >= 80) return 'Good';
    if (health >= 60) return 'Warning';
    return 'Bad';
  }
}

