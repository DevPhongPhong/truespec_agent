// ============================================================================
// NETWORK MODEL - OOP Model for Network data management
// ============================================================================

import { ObservableModel } from './BaseModel';
import { NetworkData, NetworkAdapter, NetworkConnection, StatusLevel, WiFiStandard, WiFiFrequencyBand, DNSStatus } from '../types';

export class NetworkModel extends ObservableModel<NetworkData> {
  constructor() {
    const defaultConnection: NetworkConnection = {
      ssid: 'Home_5G',
      type: 'Wi-Fi',
      security: 'WPA2',
      status: 'Online',
      ipv4: '192.168.42.8',
      gateway: '192.168.42.1',
      dns: '8.8.8.8',
      publicIP: '203.0.113.42',
      linkSpeed: 300,
      signalStrength: 82,
      adapterName: 'Intel Wi-Fi',
      wifiStandard: WiFiStandard.WIFI_6,
      frequencyBand: WiFiFrequencyBand.BAND_5_GHZ,
      rssi: -45, // dBm
      jitter: 2.5, // ms
      dnsStatus: DNSStatus.WORKING,
    };

    const defaultAdapters: NetworkAdapter[] = [
      { name: 'Intel Wi-Fi', type: 'Wi-Fi', status: 'up', ipv4: '192.168.42.8', mac: 'AA:BB:CC:DD:EE:FF' },
      { name: 'Ethernet', type: 'Ethernet', status: 'down', mac: '11:22:33:44:55:66' },
      { name: 'VMware Network Adapter', type: 'Virtual', status: 'up', ipv4: '192.168.100.1' },
      { name: 'Bluetooth PAN', type: 'Bluetooth', status: 'down' },
    ];

    const initialData: NetworkData = {
      id: 'network-main',
      name: 'Network',
      lastUpdated: new Date(),
      connection: defaultConnection,
      adapters: defaultAdapters,
      ping: 23,
      currentDownload: 3.2,
      currentUpload: 0.6,
      totalReceived: 1.8 * 1024, // MB
      totalSent: 620,
      packetLoss: 0.2,
      natType: 'Moderate',
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

