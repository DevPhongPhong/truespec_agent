// ============================================================================
// FAN MODEL - OOP Model for Fan data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { FanData, Fan, FanCurvePoint, FanMode, StatusLevel } from '../types';

export interface FanAnomaly {
  type: 'rpm_drop' | 'no_response_to_temp' | 'stuck' | 'none';
  severity: StatusLevel;
  message: string;
}

export interface FanRpmStats {
  min: number;
  max: number;
  avg: number;
  windowMinutes: number;
}

export type FanType = 'CPU' | 'GPU' | 'Case' | 'Other';

export class FanModel extends ObservableModel<FanData> {
  private rpmStatsCache: Map<string, FanRpmStats> = new Map();
  private anomalyCache: Map<string, FanAnomaly> = new Map();
  private readonly RPM_WINDOW_MINUTES = 2;
  private readonly RPM_WINDOW_POINTS = 120; // 2 minutes at 1 point per second

  constructor() {
    const defaultFans: Fan[] = [
      { id: 'cpu_fan', name: 'CPU Fan', rpm: 1180, minRpm: 500, maxRpm: 2100, pwm: 45, mode: 'AUTO', tempSource: 'CPU Package', tachOk: true, status: 'ok' },
      { id: 'case_fan_1', name: 'Case Fan #1', rpm: 920, minRpm: 400, maxRpm: 1500, pwm: 40, mode: 'AUTO', tempSource: 'System', tachOk: true, status: 'ok' },
      { id: 'case_fan_2', name: 'Case Fan #2', rpm: 880, minRpm: 400, maxRpm: 1500, pwm: 38, mode: 'AUTO', tempSource: 'System', tachOk: true, status: 'ok' },
      { id: 'gpu_fan', name: 'GPU Fan', rpm: 1050, minRpm: 0, maxRpm: 2600, pwm: 35, mode: 'AUTO', tempSource: 'GPU Hotspot', tachOk: true, status: 'ok' },
    ];

    const defaultCurve: FanCurvePoint[] = [
      { temperature: 35, pwmDuty: 25 },
      { temperature: 45, pwmDuty: 35 },
      { temperature: 55, pwmDuty: 50 },
      { temperature: 65, pwmDuty: 70 },
      { temperature: 80, pwmDuty: 90 },
    ];

    const initialData: FanData = {
      id: 'fan-controller',
      name: 'Fan Controller',
      lastUpdated: new Date(),
      provider: 'LibreHardwareMonitor',
      fans: defaultFans,
      selectedFanId: 'cpu_fan',
      curve: defaultCurve,
      history: {
        rpm: [],
        pwm: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private initializeHistory(): void {
  }

  validate(): boolean {
    return this._data.fans.every(fan =>
      fan.rpm >= 0 && fan.rpm <= fan.maxRpm &&
      fan.pwm >= 0 && fan.pwm <= 100
    );
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        rpm: this.getHistory('rpm'),
        pwm: this.getHistory('pwm'),
      },
    };
  }

  getSelectedFan(): Fan | undefined {
    return this._data.fans.find(f => f.id === this._data.selectedFanId);
  }

  getFanType(fanId: string): FanType {
    const fan = this._data.fans.find(f => f.id === fanId);
    if (!fan) return 'Other';
    const name = fan.name.toLowerCase();
    const id = fanId.toLowerCase();
    if (name.includes('cpu') || id.includes('cpu')) return 'CPU';
    if (name.includes('gpu') || id.includes('gpu')) return 'GPU';
    if (name.includes('case') || name.includes('chassis') || id.includes('case')) return 'Case';
    return 'Other';
  }

  getRpmStats(fanId: string): FanRpmStats {
    const cached = this.rpmStatsCache.get(fanId);
    if (cached) return cached;

    const rpmHistory = this.getHistory('rpm');
    if (fanId !== this._data.selectedFanId || rpmHistory.length === 0) {
      const fan = this._data.fans.find(f => f.id === fanId);
      return {
        min: fan?.rpm || 0,
        max: fan?.rpm || 0,
        avg: fan?.rpm || 0,
        windowMinutes: this.RPM_WINDOW_MINUTES,
      };
    }

    // Get last 2 minutes of data (120 points at 1 point per second)
    const recentRpm = rpmHistory.slice(-this.RPM_WINDOW_POINTS).map(p => p.value);
    if (recentRpm.length === 0) {
      const fan = this._data.fans.find(f => f.id === fanId);
      return {
        min: fan?.rpm || 0,
        max: fan?.rpm || 0,
        avg: fan?.rpm || 0,
        windowMinutes: this.RPM_WINDOW_MINUTES,
      };
    }

    const stats: FanRpmStats = {
      min: Math.min(...recentRpm),
      max: Math.max(...recentRpm),
      avg: Math.round(recentRpm.reduce((a, b) => a + b, 0) / recentRpm.length),
      windowMinutes: this.RPM_WINDOW_MINUTES,
    };

    this.rpmStatsCache.set(fanId, stats);
    return stats;
  }

  detectAnomaly(fanId: string, currentTemp?: number): FanAnomaly {
    const cached = this.anomalyCache.get(fanId);
    if (cached && cached.type !== 'none') return cached;

    const fan = this._data.fans.find(f => f.id === fanId);
    if (!fan) {
      return { type: 'none', severity: 'ok', message: '' };
    }

    const rpmHistory = this.getHistory('rpm');
    if (rpmHistory.length < 10) {
      return { type: 'none', severity: 'ok', message: '' };
    }

    const recentRpm = rpmHistory.slice(-30).map(p => p.value);
    const currentRpm = fan.rpm;
    const avgRpm = recentRpm.reduce((a, b) => a + b, 0) / recentRpm.length;

    // Check for sudden RPM drop (>30% drop)
    if (recentRpm.length >= 5) {
      const last5Avg = recentRpm.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const prev5Avg = recentRpm.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
      if (prev5Avg > 0 && (last5Avg / prev5Avg) < 0.7) {
        const anomaly: FanAnomaly = {
          type: 'rpm_drop',
          severity: 'warn',
          message: `RPM giảm đột ngột từ ${Math.round(prev5Avg)} xuống ${Math.round(last5Avg)} RPM`,
        };
        this.anomalyCache.set(fanId, anomaly);
        return anomaly;
      }
    }

    // Check for no response to temperature increase
    if (currentTemp !== undefined && fan.mode === 'AUTO') {
      const pwmHistory = this.getHistory('pwm');
      if (pwmHistory.length >= 10) {
        const recentPwm = pwmHistory.slice(-10).map(p => p.value);
        const avgPwm = recentPwm.reduce((a, b) => a + b, 0) / recentPwm.length;
        // If temp is high (>70) but PWM/RPM is low (<40%), might be stuck
        if (currentTemp > 70 && avgPwm < 40 && currentRpm < fan.maxRpm * 0.4) {
          const anomaly: FanAnomaly = {
            type: 'no_response_to_temp',
            severity: 'danger',
            message: `Nhiệt độ cao (${currentTemp}°C) nhưng quạt không tăng tốc`,
          };
          this.anomalyCache.set(fanId, anomaly);
          return anomaly;
        }
      }
    }

    // Check for stuck fan (RPM variation < 5%)
    if (recentRpm.length >= 20) {
      const rpmVariation = (Math.max(...recentRpm) - Math.min(...recentRpm)) / avgRpm;
      if (rpmVariation < 0.05 && avgRpm > fan.minRpm * 1.2) {
        const anomaly: FanAnomaly = {
          type: 'stuck',
          severity: 'warn',
          message: `RPM không dao động (có thể bị kẹt hoặc điều khiển cố định)`,
        };
        this.anomalyCache.set(fanId, anomaly);
        return anomaly;
      }
    }

    const anomaly: FanAnomaly = { type: 'none', severity: 'ok', message: '' };
    this.anomalyCache.set(fanId, anomaly);
    return anomaly;
  }

  setFanControlMode(fanId: string, mode: 'auto' | 'boost' | 'custom'): void {
    const fan = this._data.fans.find(f => f.id === fanId);
    if (!fan) return;

    if (mode === 'auto') {
      this.setFanMode(fanId, 'AUTO');
    } else if (mode === 'boost') {
      this.setFanMode(fanId, 'MANUAL');
      this.setFanPWM(fanId, 100);
    } else {
      // Custom - keep current mode
    }
  }

  selectFan(fanId: string): void {
    this.update({ selectedFanId: fanId });
    // Reset history for new fan
    this.clearHistory();
    const fan = this.getSelectedFan();
    if (fan) {

    }
  }

  setFanMode(fanId: string, mode: FanMode): void {
    const fans = this._data.fans.map(fan =>
      fan.id === fanId ? { ...fan, mode } : fan
    );
    this.update({ fans });
  }

  setFanPWM(fanId: string, pwm: number): void {
    const fans = this._data.fans.map(fan =>
      fan.id === fanId ? { ...fan, pwm: Math.min(100, Math.max(0, pwm)) } : fan
    );
    this.update({ fans });
  }

  setCurve(curve: FanCurvePoint[]): void {
    this.update({ curve });
  }

  applyPreset(preset: 'quiet' | 'balanced' | 'performance'): void {
    const presets: Record<string, FanCurvePoint[]> = {
      quiet: [
        { temperature: 35, pwmDuty: 18 },
        { temperature: 45, pwmDuty: 25 },
        { temperature: 55, pwmDuty: 35 },
        { temperature: 65, pwmDuty: 50 },
        { temperature: 80, pwmDuty: 70 },
      ],
      balanced: [
        { temperature: 35, pwmDuty: 25 },
        { temperature: 45, pwmDuty: 35 },
        { temperature: 55, pwmDuty: 50 },
        { temperature: 65, pwmDuty: 70 },
        { temperature: 80, pwmDuty: 90 },
      ],
      performance: [
        { temperature: 30, pwmDuty: 35 },
        { temperature: 40, pwmDuty: 55 },
        { temperature: 50, pwmDuty: 70 },
        { temperature: 60, pwmDuty: 85 },
        { temperature: 75, pwmDuty: 100 },
      ],
    };
    this.setCurve(presets[preset]);
  }

  refresh(): void {
  }

  private getFanStatus(fan: Fan, rpm: number, pwm: number): StatusLevel {
    if (!fan.tachOk) return 'danger';
    if (pwm >= 25 && rpm <= 80) return 'danger';
    if (fan.minRpm > 0 && rpm < fan.minRpm * 0.6) return 'warn';
    return 'ok';
  }

  getOverallStatus(): StatusLevel {
    const statuses = this._data.fans.map(f => f.status);
    if (statuses.some(s => s === 'danger')) return 'danger';
    if (statuses.some(s => s === 'warn')) return 'warn';
    return 'ok';
  }

  getStatusLabel(): string {
    const status = this.getOverallStatus();
    if (status === 'danger') return 'Nguy hiểm';
    if (status === 'warn') return 'Cảnh báo';
    return 'Ổn định';
  }
}

