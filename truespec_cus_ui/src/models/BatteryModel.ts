// ============================================================================
// BATTERY MODEL - OOP Model for Battery data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { BatteryData, BatteryHealth, BatteryState, UsageScenario, StatusLevel, BatteryDrainApp } from '../types';

export class BatteryModel extends ObservableModel<BatteryData> {
  constructor() {
    const defaultHealth: BatteryHealth = {
      healthPercent: 86,
      designCapacity: 41,
      fullChargeCapacity: 35.3,
      cycleCount: 421,
      wearLevel: 14,
      status: 'Good',
      lastFullCharge: 'Hôm qua · 22:17',
    };

    const defaultScenarios: UsageScenario[] = [
      { name: 'Văn phòng / lướt web', estimatedDraw: 8.0, estimatedRuntime: 0 },
      { name: 'Xem video FHD', estimatedDraw: 10.5, estimatedRuntime: 0 },
      { name: 'Dev + nhiều tab', estimatedDraw: 12.5, estimatedRuntime: 0 },
      { name: 'Game nhẹ', estimatedDraw: 20.0, estimatedRuntime: 0 },
    ];

    const defaultTopDrainApps: BatteryDrainApp[] = [
      { name: 'Chrome', powerDraw: 3.2, percentage: 32.7 },
      { name: 'Visual Studio Code', powerDraw: 2.1, percentage: 21.4 },
      { name: 'Windows Explorer', powerDraw: 1.5, percentage: 15.3 },
      { name: 'Discord', powerDraw: 0.8, percentage: 8.2 },
      { name: 'Spotify', powerDraw: 0.6, percentage: 6.1 },
    ];

    const initialData: BatteryData = {
      id: 'battery-main',
      name: 'Battery',
      lastUpdated: new Date(),
      percent: 78,
      state: 'Discharging',
      isPlugged: false,
      powerMode: 'Balanced',
      powerDraw: 9.8,
      dischargingRate: 9.8,
      chargingRate: 0,
      timeRemainingMinutes: 192,
      timeToFullChargeMinutes: 0,
      chargingLimitEnabled: false,
      chargingLimitSupported: true,
      health: defaultHealth,
      scenarios: defaultScenarios,
      topDrainApps: defaultTopDrainApps,
      history: {
        level: [],
      },
    };

    super(initialData);
    this.initializeHistory();
    this.calculateScenarioRuntimes();
  }

  private initializeHistory(): void {
  }

  private calculateScenarioRuntimes(): void {
    const energyWh = (this._data.percent / 100) * this._data.health.fullChargeCapacity;
    const newScenarios = this._data.scenarios.map(scenario => ({
      ...scenario,
      estimatedRuntime: Math.round((energyWh / scenario.estimatedDraw) * 60), // in minutes
    }));
    this._data.scenarios = newScenarios;
  }

  validate(): boolean {
    const { percent, powerDraw, health } = this._data;
    return percent >= 0 && percent <= 100 &&
      powerDraw >= 0 &&
      health.healthPercent >= 0 && health.healthPercent <= 100;
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        level: this.getHistory('level'),
      },
    };
  }

  refresh(): void {
  }

  getStatus(): StatusLevel {
    const { percent, health } = this._data;
    if (percent < 10 || health.healthPercent < 60) return 'danger';
    if (percent < 20 || health.healthPercent < 80) return 'warn';
    return 'ok';
  }

  getHealthStatus(): 'Good' | 'Fair' | 'Poor' {
    const health = this._data.health.healthPercent;
    if (health >= 80) return 'Good';
    if (health >= 60) return 'Fair';
    return 'Poor';
  }

  formatTimeRemaining(): string {
    const minutes = this._data.timeRemainingMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  getPowerSourceText(): string {
    return this._data.isPlugged ? 'Plugged in' : 'On battery';
  }

  formatTimeToFullCharge(): string {
    if (!this._data.timeToFullChargeMinutes || this._data.timeToFullChargeMinutes === 0) {
      return 'N/A';
    }
    const minutes = this._data.timeToFullChargeMinutes;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  getChargingRate(): number {
    return this._data.chargingRate || 0;
  }

  getDischargingRate(): number {
    return this._data.dischargingRate || this._data.powerDraw;
  }

  toggleChargingLimit(): void {
    if (this._data.chargingLimitSupported) {
      this.update({
        chargingLimitEnabled: !this._data.chargingLimitEnabled,
      });
    }
  }

  getDegradationPercent(): number {
    const { designCapacity, fullChargeCapacity } = this._data.health;
    if (designCapacity === 0) return 0;
    return ((designCapacity - fullChargeCapacity) / designCapacity) * 100;
  }
}

