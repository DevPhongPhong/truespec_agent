// ============================================================================
// STORAGE MODEL - OOP Model for Storage data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { StorageData, Partition, SMARTData, StorageSpecs, StatusLevel } from '../types';

export class StorageModel extends ObservableModel<StorageData> {
  constructor(specs?: Partial<StorageSpecs>) {
    const defaultSpecs: StorageSpecs = {
      name: 'Samsung NVMe SSD',
      model: 'MZHPV5120GL',
      type: 'NVMe',
      interface: 'PCIe NVMe',
      pcieGen: 'Gen4',
      totalCapacity: 512,
      ...specs,
    };

    const defaultPartitions: Partition[] = [
      { letter: 'C:', label: 'System', fileSystem: 'NTFS', usedGB: 86, totalGB: 153, usedPercent: 56 },
      { letter: 'D:', label: 'Data', fileSystem: 'NTFS', usedGB: 200, totalGB: 359, usedPercent: 56 },
    ];

    const defaultSMART: SMARTData = {
      healthPercent: 96,
      powerOnHours: 3200,
      powerCycles: 680,
      totalBytesWritten: 18.4,
      reallocatedSectors: 0,
      pendingSectors: 0,
      mediaErrors: 0,
      temperature: 42,
      status: 'Good',
    };

    const initialData: StorageData = {
      id: 'storage-main',
      name: 'Storage',
      lastUpdated: new Date(),
      specs: defaultSpecs,
      usedPercent: 56,
      usedGB: 286,
      freeGB: 226,
      partitions: defaultPartitions,
      smart: defaultSMART,
      performance: {
        currentRead: 220,
        currentWrite: 110,
        peakRead: 1800,
        peakWrite: 1200,
        baselineRead: 3500,
        baselineWrite: 3000,
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

