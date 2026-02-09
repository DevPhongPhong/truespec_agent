// ============================================================================
// NETWORK MODEL - OOP Model for Network data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { NetworkData, NetworkAdapter, NetworkConnection, StatusLevel, WiFiStandard, WiFiFrequencyBand, DNSStatus } from '../types';

export class NetworkModel extends ObservableModel<NetworkData> {
  constructor() {
    // Khởi tạo với dữ liệu minimal, sẽ được update từ API
    const defaultConnection: NetworkConnection = {
      ssid: '',
      type: 'Ethernet',
      security: '',
      status: 'Offline',
      ipv4: '',
      gateway: '',
      dns: '',
      publicIP: '',
      linkSpeed: 0,
      signalStrength: 0,
      adapterName: '',
      wifiStandard: WiFiStandard.WIFI_5,
      frequencyBand: WiFiFrequencyBand.BAND_2_4_GHZ,
      rssi: 0,
      jitter: 0,
      dnsStatus: DNSStatus.UNKNOWN,
    };

    const initialData: NetworkData = {
      id: 'network-main',
      name: 'Network',
      lastUpdated: new Date(),
      connection: defaultConnection,
      adapters: [],
      ping: 0,
      currentDownload: 0,
      currentUpload: 0,
      totalReceived: 0,
      totalSent: 0,
      packetLoss: 0,
      natType: 'Unknown',
      history: {
        download: [],
        upload: [],
      },
    };

    super(initialData);
    this.initializeHistory();
  }

  private initializeHistory(): void {
  }

  validate(): boolean {
    const { ping, currentDownload, currentUpload, packetLoss } = this._data;
    return ping >= 0 &&
      currentDownload >= 0 &&
      currentUpload >= 0 &&
      packetLoss >= 0 && packetLoss <= 100;
  }

  toJSON(): object {
    return {
      ...this._data,
      history: {
        download: this.getHistory('download'),
        upload: this.getHistory('upload'),
      },
    };
  }

  refresh(): void {
    // Data được update từ HardwareDeviceService
  }

  getStatus(): StatusLevel {
    const { ping, packetLoss, connection } = this._data;
    if (connection.status === 'Offline' || packetLoss > 10) return 'danger';
    if (ping > 100 || packetLoss > 2 || connection.status === 'Limited') return 'warn';
    return 'ok';
  }

  isOnline(): boolean {
    return this._data.connection.status === 'Online';
  }

  formatTotalReceived(): string {
    const mb = this._data.totalReceived;
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  }

  formatTotalSent(): string {
    const mb = this._data.totalSent;
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  }
}

