// ============================================================================
// MONITOR SERVICE - Central service for all hardware monitoring
// ============================================================================

import { BaseService } from './BaseService';
import { 
  CPUModel, 
  GPUModel, 
  RAMModel, 
  StorageModel, 
  NetworkModel, 
  BatteryModel, 
  FanModel 
} from '../models';
import { DeviceInfo, SystemStatus, StatusLevel, DeviceType } from '../types';

type MonitorCallback = () => void;

export class MonitorService extends BaseService {
  private static instance: MonitorService | null = null;
  
  // Models
  public readonly cpu: CPUModel;
  public readonly gpu: GPUModel;
  public readonly ram: RAMModel;
  public readonly storage: StorageModel;
  public readonly network: NetworkModel;
  public readonly battery: BatteryModel;
  public readonly fan: FanModel;

  // Device info
  private deviceInfo: DeviceInfo;

  // Callbacks
  private onUpdateCallbacks: Set<MonitorCallback> = new Set();

  private constructor() {
    super();
    this.cpu = new CPUModel();
    this.gpu = new GPUModel();
    this.ram = new RAMModel();
    this.storage = new StorageModel();
    this.network = new NetworkModel();
    this.battery = new BatteryModel();
    this.fan = new FanModel();

    this.deviceInfo = {
      id: 'device-001',
      name: 'My Laptop',
      type: DeviceType.LAPTOP,
      os: 'Windows 11 Home SL',
      osVersion: '22H2',
      architecture: '64-bit',
      manufacturer: 'HP',
      model: 'HP Laptop 15',
    };
  }

  static getInstance(): MonitorService {
    if (!MonitorService.instance) {
      MonitorService.instance = new MonitorService();
    }
    return MonitorService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Simulate initial data fetch
    await this.delay(100);
    this.isInitialized = true;
  }

  async refresh(): Promise<void> {
    // Generate và cập nhật mock metrics cho tất cả models
    this.updateCPUMetrics();
    this.updateGPUMetrics();
    this.updateRAMMetrics();
    this.updateStorageMetrics();
    this.updateNetworkMetrics();
    this.updateBatteryMetrics();
    this.updateFanMetrics();

    // Notify subscribers
    this.notifyUpdate();
  }

  // ============================================================================
  // MOCK DATA GENERATORS - Generate realistic mock metrics
  // ============================================================================

  private updateCPUMetrics(): void {
    const currentLoad = this.cpu.data.load || 0;
    const baseClock = this.cpu.data.specs.baseClock || 2.0;
    const turboClock = this.cpu.data.specs.turboClock || 3.5;
    const threads = this.cpu.data.specs.threads || 8;

    // Generate realistic CPU load (20-80% với một số spike)
    const newLoad = Math.max(0, Math.min(100, currentLoad + (Math.random() - 0.5) * 15));
    
    // Temperature phụ thuộc vào load và base temp
    const baseTemp = 35;
    const newTemp = Math.max(30, Math.min(95, baseTemp + (newLoad / 100) * 50 + (Math.random() - 0.5) * 5));
    
    // Clock speed phụ thuộc vào load
    const clockRange = turboClock - baseClock;
    const newClock = baseClock + (newLoad / 100) * clockRange * 0.8 + (Math.random() - 0.5) * 0.2;
    
    // Power consumption (TDP * load percentage)
    const tdp = this.cpu.data.specs.tdp || 15;
    const newPower = (tdp * newLoad / 100) + (Math.random() - 0.5) * 2;

    // Generate core data with individual load for each core
    const coreLoads: number[] = [];
    const coreData = Array.from({ length: threads }, (_, i) => {
      const coreLoad = Math.max(0, Math.min(100, newLoad + (Math.random() - 0.5) * 20));
      coreLoads.push(Math.round(coreLoad));
      
      return {
        coreIndex: i,
        load: coreLoad,
        clock: Math.max(baseClock, Math.min(turboClock, newClock + (Math.random() - 0.5) * 0.3)),
        temperature: Math.max(30, Math.min(95, newTemp + (Math.random() - 0.5) * 5)),
      };
    });

    // Generate mock processes
    const processNames = ['chrome.exe', 'Code.exe', 'VMware.exe', 'discord.exe', 'explorer.exe'];
    const topProcesses = Array.from({ length: Math.min(5, processNames.length) }, (_, i) => ({
      pid: 1000 + i,
      name: processNames[i],
      cpuUsage: Math.random() * 15,
      percentage: Math.random() * 15,
    })).sort((a, b) => b.cpuUsage - a.cpuUsage);

    // Throttling logic
    const thermalThrottling = newTemp > 85;
    const powerThrottling = newPower > tdp * 0.9;

    this.cpu.update({
      load: Math.round(newLoad),
      coreLoads: coreLoads, // Array of load for each core/thread
      temperature: Math.round(newTemp),
      power: Math.max(0, parseFloat(newPower.toFixed(1))),
      currentClock: parseFloat(newClock.toFixed(2)),
      coreData,
      topProcesses,
      throttling: {
        thermal: thermalThrottling,
        power: powerThrottling,
        isThrottling: thermalThrottling || powerThrottling,
      },
      lastUpdated: new Date(),
    });

    // Add to history
    this.cpu.addHistoryPoint('usage', newLoad);
    this.cpu.addHistoryPoint('clock', newClock);
    this.cpu.addHistoryPoint('temp', newTemp);
  }

  private updateGPUMetrics(): void {
    const currentLoad = this.gpu.data.load || 0;
    const vramTotal = this.gpu.data.vramTotal || 2048;
    const baseClock = this.gpu.data.specs.baseClock || 1122;
    const boostClock = this.gpu.data.specs.boostClock || 1242;

    // Generate realistic GPU load
    const newLoad = Math.max(0, Math.min(100, currentLoad + (Math.random() - 0.5) * 20));
    
    // Temperature phụ thuộc vào load
    const baseTemp = 40;
    const newTemp = Math.max(35, Math.min(90, baseTemp + (newLoad / 100) * 45 + (Math.random() - 0.5) * 5));
    
    // VRAM usage
    const vramPercent = newLoad / 100;
    const newVramUsed = Math.max(0, Math.min(vramTotal, vramTotal * vramPercent + (Math.random() - 0.5) * 200));
    
    // Clock speed
    const clockRange = boostClock - baseClock;
    const newClock = baseClock + (newLoad / 100) * clockRange * 0.7 + (Math.random() - 0.5) * 50;
    
    // Fan speed phụ thuộc vào temperature
    const maxFanSpeed = 2600;
    const minFanSpeed = 800;
    const newFanSpeed = Math.max(minFanSpeed, Math.min(maxFanSpeed, minFanSpeed + ((newTemp - 35) / 55) * (maxFanSpeed - minFanSpeed)));
    
    // Power consumption
    const tdp = this.gpu.data.specs.tdp || 25;
    const newPower = (tdp * newLoad / 100) + (Math.random() - 0.5) * 3;

    // Generate mock processes
    const processNames = ['chrome.exe', 'game.exe', 'render.exe'];
    const topProcesses = Array.from({ length: Math.min(3, processNames.length) }, (_, i) => ({
      pid: 2000 + i,
      name: processNames[i],
      gpuUsage: Math.random() * 30,
      vramUsage: Math.random() * 512,
      percentage: Math.random() * 30,
    })).sort((a, b) => b.gpuUsage - a.gpuUsage);

    this.gpu.update({
      load: Math.round(newLoad),
      temperature: Math.round(newTemp),
      fanSpeed: Math.round(newFanSpeed),
      vramUsed: Math.round(newVramUsed),
      currentClock: Math.round(newClock),
      power: Math.max(0, parseFloat(newPower.toFixed(1))),
      topProcesses,
      lastUpdated: new Date(),
    });

    // Add to history
    this.gpu.addHistoryPoint('usage', newLoad);
    this.gpu.addHistoryPoint('vram', (newVramUsed / vramTotal) * 100);
    this.gpu.addHistoryPoint('temp', newTemp);
    this.gpu.addHistoryPoint('power', newPower);
  }

  private updateRAMMetrics(): void {
    const totalSize = this.ram.data.specs.totalSize || 16;
    const currentUsedPercent = this.ram.data.usedPercent || 0;

    // Generate realistic RAM usage (dao động nhẹ)
    const newUsedPercent = Math.max(20, Math.min(95, currentUsedPercent + (Math.random() - 0.5) * 5));
    const newUsedGB = (totalSize * newUsedPercent) / 100;
    const newFreeGB = totalSize - newUsedGB;
    const newAvailableGB = newFreeGB + (Math.random() * 2); // Cached memory
    const newCacheGB = Math.random() * 3;
    const newCachePercent = (newCacheGB / totalSize) * 100;

    // Generate mock processes
    const processNames = ['chrome.exe', 'Code.exe', 'VMware.exe', 'discord.exe', 'explorer.exe'];
    const topProcesses = Array.from({ length: Math.min(5, processNames.length) }, (_, i) => ({
      pid: 3000 + i,
      name: processNames[i],
      memoryUsage: Math.random() * 3,
      percentage: Math.random() * 20,
    })).sort((a, b) => b.memoryUsage - a.memoryUsage);

    this.ram.update({
      usedPercent: parseFloat(newUsedPercent.toFixed(1)),
      usedGB: parseFloat(newUsedGB.toFixed(2)),
      freeGB: parseFloat(newFreeGB.toFixed(2)),
      availableGB: parseFloat(newAvailableGB.toFixed(2)),
      cachePercent: parseFloat(newCachePercent.toFixed(1)),
      cacheGB: parseFloat(newCacheGB.toFixed(2)),
      topProcesses,
      lastUpdated: new Date(),
    });

    // Add to history
    this.ram.addHistoryPoint('usage', newUsedPercent);
    this.ram.addHistoryPoint('cache', newCachePercent);
  }

  private updateStorageMetrics(): void {
    const currentUsedPercent = this.storage.data.usedPercent || 0;
    const totalCapacity = this.storage.data.specs.totalCapacity || 512;
    
    // Storage usage thay đổi chậm hơn
    const newUsedPercent = Math.max(0, Math.min(100, currentUsedPercent + (Math.random() - 0.5) * 0.5));
    const newUsedGB = (totalCapacity * newUsedPercent) / 100;
    const newFreeGB = totalCapacity - newUsedGB;

    // Update partitions
    const partitions = this.storage.data.partitions.map(p => ({
      ...p,
      usedPercent: p.totalGB > 0 ? (p.usedGB / p.totalGB) * 100 : 0,
    }));

    // Mock I/O performance
    const baselineRead = this.storage.data.performance.baselineRead || 3500;
    const baselineWrite = this.storage.data.performance.baselineWrite || 3000;
    const newCurrentRead = Math.max(0, baselineRead * (0.05 + Math.random() * 0.1));
    const newCurrentWrite = Math.max(0, baselineWrite * (0.03 + Math.random() * 0.08));

    this.storage.update({
      usedPercent: parseFloat(newUsedPercent.toFixed(1)),
      usedGB: parseFloat(newUsedGB.toFixed(2)),
      freeGB: parseFloat(newFreeGB.toFixed(2)),
      partitions,
      performance: {
        ...this.storage.data.performance,
        currentRead: parseFloat(newCurrentRead.toFixed(0)),
        currentWrite: parseFloat(newCurrentWrite.toFixed(0)),
      },
      lastUpdated: new Date(),
    });

    // Add to history
    this.storage.addHistoryPoint('read', newCurrentRead);
    this.storage.addHistoryPoint('write', newCurrentWrite);
  }

  private updateNetworkMetrics(): void {
    const currentDownload = this.network.data.currentDownload || 0;
    const currentUpload = this.network.data.currentUpload || 0;
    const currentPing = this.network.data.ping || 0;

    // Network metrics dao động nhiều
    const newDownload = Math.max(0, currentDownload + (Math.random() - 0.5) * 5);
    const newUpload = Math.max(0, currentUpload + (Math.random() - 0.5) * 2);
    const newPing = Math.max(5, Math.min(200, currentPing + (Math.random() - 0.5) * 10));
    
    // Total received/sent tăng dần
    const totalReceived = this.network.data.totalReceived || 0;
    const totalSent = this.network.data.totalSent || 0;
    const newTotalReceived = totalReceived + (newDownload / 1024); // MB
    const newTotalSent = totalSent + (newUpload / 1024); // MB

    // Packet loss (thường rất thấp)
    const newPacketLoss = Math.random() < 0.1 ? Math.random() * 0.5 : 0;

    // Update connection status based on ping
    const isOnline = newPing < 150;
    const connection = {
      ...this.network.data.connection,
      status: isOnline ? 'Online' as const : 'Limited' as const,
    };

    this.network.update({
      ping: Math.round(newPing),
      currentDownload: parseFloat(newDownload.toFixed(2)),
      currentUpload: parseFloat(newUpload.toFixed(2)),
      totalReceived: parseFloat(newTotalReceived.toFixed(2)),
      totalSent: parseFloat(newTotalSent.toFixed(2)),
      packetLoss: parseFloat(newPacketLoss.toFixed(2)),
      connection,
      lastUpdated: new Date(),
    });

    // Add to history
    this.network.addHistoryPoint('download', newDownload);
    this.network.addHistoryPoint('upload', newUpload);
  }

  private updateBatteryMetrics(): void {
    const currentPercent = this.battery.data.percent || 78;
    const isPlugged = this.battery.data.isPlugged || false;
    const powerDraw = this.battery.data.powerDraw || 9.8;

    let newPercent = currentPercent;
    let newState: 'Charging' | 'Discharging' | 'Full' | 'NotCharging' = this.battery.data.state;
    let newPowerDraw = powerDraw;
    let newChargingRate = 0;
    let newDischargingRate = 0;
    let newTimeRemaining = 0;
    let newTimeToFullCharge = 0;

    if (isPlugged) {
      // Charging
      if (currentPercent < 100) {
        newState = 'Charging';
        newChargingRate = 15 + Math.random() * 10; // 15-25W charging rate
        newPowerDraw = newChargingRate;
        newPercent = Math.min(100, currentPercent + (Math.random() * 0.5));
        const energyRemaining = (100 - newPercent) / 100 * this.battery.data.health.fullChargeCapacity;
        newTimeToFullCharge = Math.round((energyRemaining / newChargingRate) * 60);
      } else {
        newState = 'Full';
        newChargingRate = 0;
        newPowerDraw = 5 + Math.random() * 3; // Trickle charge/maintenance
      }
    } else {
      // Discharging
      newState = 'Discharging';
      newDischargingRate = 8 + Math.random() * 8; // 8-16W discharge rate
      newPowerDraw = newDischargingRate;
      newPercent = Math.max(0, currentPercent - (Math.random() * 0.3));
      const energyRemaining = (newPercent / 100) * this.battery.data.health.fullChargeCapacity;
      newTimeRemaining = Math.round((energyRemaining / newDischargingRate) * 60);
    }

    // Update scenarios với runtime mới
    const energyWh = (newPercent / 100) * this.battery.data.health.fullChargeCapacity;
    const newScenarios = this.battery.data.scenarios.map(scenario => ({
      ...scenario,
      estimatedRuntime: Math.round((energyWh / scenario.estimatedDraw) * 60),
    }));

    this.battery.update({
      percent: parseFloat(newPercent.toFixed(1)),
      state: newState,
      powerDraw: parseFloat(newPowerDraw.toFixed(1)),
      dischargingRate: parseFloat(newDischargingRate.toFixed(1)),
      chargingRate: parseFloat(newChargingRate.toFixed(1)),
      timeRemainingMinutes: newTimeRemaining,
      timeToFullChargeMinutes: newTimeToFullCharge,
      scenarios: newScenarios,
      lastUpdated: new Date(),
    });

    // Add to history
    this.battery.addHistoryPoint('level', newPercent);
  }

  private updateFanMetrics(): void {
    const cpuTemp = this.cpu.data.temperature || 0;
    const gpuTemp = this.gpu.data.temperature || 0;
    
    // Update fan RPM dựa trên temperature
    const fans = this.fan.data.fans.map(fan => {
      let targetTemp = 0;
      if (fan.tempSource.includes('CPU')) {
        targetTemp = cpuTemp;
      } else if (fan.tempSource.includes('GPU')) {
        targetTemp = gpuTemp;
      } else {
        targetTemp = (cpuTemp + gpuTemp) / 2; // System temp
      }

      // Calculate RPM based on temperature và mode
      let newRpm = fan.rpm;
      let newPwm = fan.pwm;

      if (fan.mode === 'AUTO') {
        // Auto mode: RPM tăng theo temperature
        const tempRatio = Math.max(0, Math.min(1, (targetTemp - 30) / 60)); // 30-90°C range
        newPwm = Math.max(20, Math.min(100, 20 + tempRatio * 80));
        const rpmRange = fan.maxRpm - fan.minRpm;
        newRpm = Math.max(fan.minRpm, Math.min(fan.maxRpm, fan.minRpm + tempRatio * rpmRange));
      } else {
        // Manual mode: RPM giữ nguyên nhưng có thể dao động nhẹ
        newRpm = Math.max(fan.minRpm, Math.min(fan.maxRpm, fan.rpm + (Math.random() - 0.5) * 50));
      }

      // Add some natural variation
      newRpm = Math.max(fan.minRpm, Math.min(fan.maxRpm, newRpm + (Math.random() - 0.5) * 30));

      return {
        ...fan,
        rpm: Math.round(newRpm),
        pwm: Math.round(newPwm),
        status: this.getFanStatusForRPM(fan, newRpm, newPwm),
      };
    });

    this.fan.update({
      fans,
      lastUpdated: new Date(),
    });

    // Add to history (cho selected fan)
    const selectedFan = fans.find(f => f.id === this.fan.data.selectedFanId);
    if (selectedFan) {
      this.fan.addHistoryPoint('rpm', selectedFan.rpm);
      this.fan.addHistoryPoint('pwm', selectedFan.pwm);
    }
  }

  private getFanStatusForRPM(fan: any, rpm: number, pwm: number): 'ok' | 'warn' | 'danger' {
    if (!fan.tachOk) return 'danger';
    if (pwm >= 25 && rpm <= 80) return 'danger';
    if (fan.minRpm > 0 && rpm < fan.minRpm * 0.6) return 'warn';
    return 'ok';
  }

  dispose(): void {
    this.stopAutoRefresh();
    this.onUpdateCallbacks.clear();
    MonitorService.instance = null;
  }

  // Subscribe to updates
  onUpdate(callback: MonitorCallback): () => void {
    this.onUpdateCallbacks.add(callback);
    return () => this.onUpdateCallbacks.delete(callback);
  }

  notifyUpdate(): void {
    this.onUpdateCallbacks.forEach(cb => cb());
  }

  // Getters
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  getSystemStatus(): SystemStatus {
    const statuses: StatusLevel[] = [
      this.cpu.getStatus(),
      this.gpu.getStatus(),
      this.ram.getStatus(),
      this.storage.getStatus(),
      this.network.getStatus(),
      this.battery.getStatus(),
      this.fan.getOverallStatus(),
    ];

    let overall: StatusLevel = 'ok';
    let label = 'Ổn định';
    let description = 'Máy đang chạy ổn định';

    if (statuses.some(s => s === 'danger')) {
      overall = 'danger';
      label = 'Nguy hiểm';
      description = 'Có vấn đề nghiêm trọng cần xử lý';
    } else if (statuses.some(s => s === 'warn')) {
      overall = 'warn';
      label = 'Cảnh báo';
      description = 'Có một số vấn đề cần lưu ý';
    }

    return {
      overall,
      label,
      description,
      uptimeDays: 10,
      lastCheck: new Date(),
    };
  }

  // Quick metrics for overview
  getQuickMetrics() {
    return {
      cpuLoad: this.cpu.data.load,
      cpuTemp: this.cpu.data.temperature,
      ramUsage: this.ram.data.usedPercent,
      gpuLoad: this.gpu.data.load,
      gpuTemp: this.gpu.data.temperature,
      storageUsed: this.storage.data.usedPercent,
      batteryPercent: this.battery.data.percent,
      batteryPlugged: this.battery.data.isPlugged,
      networkOnline: this.network.isOnline(),
      networkPing: this.network.data.ping,
    };
  }
}

export const monitorService = MonitorService.getInstance();

