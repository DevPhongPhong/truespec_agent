// ============================================================================
// NETWORK PAGE - Network monitoring
// ============================================================================

import React, { useMemo } from 'react';
import { Wifi, Globe, Router, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Table, SpecList, SpecRow, Badge, StatusDot } from '../components/common';
import { AreaChart, mergeTimeSeriesForChart } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useNetwork } from '../hooks';
import { NetworkAdapter, WiFiFrequencyBand, DNSStatus } from '../types';
import styles from './DetailPage.module.css';

export const NetworkPage: React.FC = () => {
  const { data, model } = useNetwork();

  const chartData = mergeTimeSeriesForChart([
    { key: 'download', points: model.getHistory('download') },
    { key: 'upload', points: model.getHistory('upload') },
  ]);

  // Detect Virtual adapters and VPN
  const virtualAdapters = useMemo(() => {
    return data.adapters.filter(adapter => 
      adapter.type === 'Virtual' && adapter.status === 'up'
    );
  }, [data.adapters]);

  const hasVPN = useMemo(() => {
    return virtualAdapters.some(adapter => 
      adapter.name.toLowerCase().includes('vpn') || 
      adapter.name.toLowerCase().includes('tunnel') ||
      adapter.name.toLowerCase().includes('openvpn') ||
      adapter.name.toLowerCase().includes('wireguard')
    );
  }, [virtualAdapters]);

  // High ping explanation and suggestions
  const pingAnalysis = useMemo(() => {
    const ping = data.ping;
    const reasons: string[] = [];
    const suggestions: string[] = [];

    if (ping > 100) {
      if (hasVPN || virtualAdapters.length > 0) {
        reasons.push(`Virtual adapter/VPN đang hoạt động (${virtualAdapters.length} adapter)`);
        suggestions.push('Tắt VPN hoặc Virtual adapter để giảm độ trễ');
      }
      
      if (data.connection.type === 'Wi-Fi') {
        if (data.connection.signalStrength && data.connection.signalStrength < 50) {
          reasons.push(`Tín hiệu Wi-Fi yếu (${data.connection.signalStrength}%)`);
          suggestions.push('Di chuyển gần router hoặc đổi kênh Wi-Fi');
        }
        if (data.connection.frequencyBand === WiFiFrequencyBand.BAND_2_4_GHZ) {
          reasons.push('Đang dùng băng tần 2.4 GHz (dễ nhiễu)');
          suggestions.push('Chuyển sang băng tần 5 GHz hoặc 6 GHz');
        }
        suggestions.push('Đổi kênh Wi-Fi sang kênh ít nhiễu hơn');
      } else {
        suggestions.push('Kiểm tra cáp LAN và switch/router');
      }

      if (data.packetLoss > 2) {
        reasons.push(`Packet loss cao (${data.packetLoss}%)`);
        suggestions.push('Kiểm tra kết nối vật lý và driver adapter');
      }

      if (data.connection.dnsStatus === DNSStatus.SLOW || data.connection.dnsStatus === DNSStatus.FAILED) {
        reasons.push(`DNS ${data.connection.dnsStatus === DNSStatus.SLOW ? 'chậm' : 'lỗi'}`);
        suggestions.push('Đổi DNS server (ví dụ: 8.8.8.8, 1.1.1.1)');
      }
    }

    return { reasons, suggestions, isHigh: ping > 100 };
  }, [data, virtualAdapters, hasVPN]);

  const adapterColumns = [
    { 
      key: 'status', 
      header: '', 
      width: '30px',
      render: (v: unknown) => <StatusDot status={v === 'up' ? 'online' : 'offline'} />
    },
    { key: 'name', header: 'Adapter' },
    { key: 'type', header: 'Type', width: '90px' },
    { key: 'ipv4', header: 'IPv4', render: (v: unknown) => (v ? String(v) : '-') },
    { key: 'mac', header: 'MAC', render: (v: unknown) => (v ? String(v) : '-') },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Network Detail"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'Network' },
        ]}
        status={model.getStatus()}
        statusLabel={model.isOnline() ? 'Online' : 'Offline'}
      />

      <div className={styles.grid}>
        {/* Connection Info */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<Wifi size={18} />}>Connection</CardTitle>
            <Badge variant={model.isOnline() ? 'success' : 'danger'}>
              {data.connection.status}
            </Badge>
          </CardHeader>
          <CardContent>
            <SpecList>
              {/* Connection Type + Adapter Name */}
              <SpecRow 
                label="Loại kết nối" 
                value={
                  data.connection.type === 'Wi-Fi' 
                    ? `Wi-Fi${data.connection.adapterName ? ` • ${data.connection.adapterName}` : ''}`
                    : `Ethernet${data.connection.adapterName ? ` • ${data.connection.adapterName}` : ''}`
                } 
              />
              
              {/* Wi-Fi Standard + Frequency + Link Speed */}
              {data.connection.type === 'Wi-Fi' && (
                <>
                  <SpecRow 
                    label="Chuẩn Wi-Fi" 
                    value={
                      data.connection.wifiStandard || '-'
                    } 
                  />
                  <SpecRow 
                    label="Băng tần" 
                    value={
                      data.connection.frequencyBand || '-'
                    } 
                  />
                </>
              )}
              
              <SpecRow label="SSID" value={data.connection.ssid || '-'} />
              <SpecRow label="Security" value={data.connection.security} />
              <SpecRow label="Link Speed" value={`${data.connection.linkSpeed} Mbps`} />
              
              {/* Signal (RSSI) + Quality (Jitter, Packet Loss) */}
              {data.connection.type === 'Wi-Fi' && (
                <>
                  <SpecRow 
                    label="RSSI" 
                    value={
                      data.connection.rssi 
                        ? `${data.connection.rssi} dBm${data.connection.rssi > -50 ? ' (Tuyệt vời)' : data.connection.rssi > -70 ? ' (Tốt)' : ' (Yếu)'}`
                        : data.connection.signalStrength 
                          ? `${data.connection.signalStrength}%`
                          : '-'
                    } 
                  />
                </>
              )}
              
              <SpecRow 
                label="Jitter" 
                value={
                  data.connection.jitter 
                    ? `${data.connection.jitter.toFixed(1)} ms${data.connection.jitter < 5 ? ' (Tốt)' : data.connection.jitter < 15 ? ' (Chấp nhận được)' : ' (Cao)'}`
                    : '-'
                } 
              />
              <SpecRow 
                label="Packet Loss" 
                value={
                  `${data.packetLoss}%${data.packetLoss < 1 ? ' (Tốt)' : data.packetLoss < 3 ? ' (Chấp nhận được)' : ' (Cao)'}`
                } 
              />
              
              {/* Public IP/Local IP + DNS Status */}
              <SpecRow label="Local IP" value={data.connection.ipv4} />
              <SpecRow label="Public IP" value={data.connection.publicIP || '-'} />
              <SpecRow label="Gateway" value={data.connection.gateway} />
              <SpecRow 
                label="DNS" 
                value={
                  `${data.connection.dns}${data.connection.dnsStatus ? ` • ${data.connection.dnsStatus}` : ''}`
                } 
              />
              <SpecRow 
                label="DNS Status" 
                value={
                  data.connection.dnsStatus 
                    ? <Badge 
                        variant={
                          data.connection.dnsStatus === DNSStatus.WORKING ? 'success' :
                          data.connection.dnsStatus === DNSStatus.SLOW ? 'warning' :
                          data.connection.dnsStatus === DNSStatus.FAILED ? 'danger' : 'default'
                        }
                        size="sm"
                      >
                        {data.connection.dnsStatus}
                      </Badge>
                    : '-'
                } 
              />
            </SpecList>
            
            {/* Virtual Adapter/VPN Warning */}
            {(hasVPN || virtualAdapters.length > 0) && (
              <div className={`${styles.contextualNote} ${styles.networkWarning}`}>
                <AlertTriangle size={14} className={styles.iconInline} />
                <strong>Cảnh báo:</strong> Phát hiện {hasVPN ? 'VPN' : 'Virtual adapter'} đang hoạt động 
                ({virtualAdapters.map(a => a.name).join(', ')}). 
                Điều này có thể làm tăng ping và độ trễ mạng.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bandwidth Chart */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle icon={<Globe size={18} />}>Bandwidth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.bandwidthStats}>
              <div className={styles.bandwidthItem}>
                <span className={styles.bandwidthLabel}>↓ Download</span>
                <span className={styles.bandwidthValue}>{data.currentDownload.toFixed(1)} Mbps</span>
              </div>
              <div className={styles.bandwidthItem}>
                <span className={styles.bandwidthLabel}>↑ Upload</span>
                <span className={styles.bandwidthValue}>{data.currentUpload.toFixed(1)} Mbps</span>
              </div>
              <div className={styles.bandwidthItem}>
                <span className={styles.bandwidthLabel}>Ping</span>
                <span className={styles.bandwidthValue}>{data.ping} ms</span>
              </div>
            </div>
            <AreaChart
              data={chartData}
              series={[
                { dataKey: 'download', name: 'Download Mbps', color: '#4ade80' },
                { dataKey: 'upload', name: 'Upload Mbps', color: '#fbbf24' },
              ]}
              height={160}
              showLegend
              yAxisDomain={[0, 50]}
            />
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className={styles.specsCard}>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <SpecList>
              <SpecRow label="Total Received" value={model.formatTotalReceived()} />
              <SpecRow label="Total Sent" value={model.formatTotalSent()} />
              <SpecRow label="Packet Loss" value={`${data.packetLoss}%`} />
              <SpecRow label="NAT Type" value={data.natType || 'Unknown'} />
            </SpecList>
          </CardContent>
        </Card>

        {/* Adapters */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <CardTitle icon={<Router size={18} />}>Network Adapters</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<NetworkAdapter & Record<string, unknown>>
              columns={adapterColumns}
              data={data.adapters as (NetworkAdapter & Record<string, unknown>)[]}
              keyExtractor={(row) => row.name as string}
            />
          </CardContent>
        </Card>

        {/* High Ping Analysis & Suggestions */}
        {pingAnalysis.isHigh && (
          <Card className={styles.contextualNoteCard}>
            <CardHeader>
              <CardTitle icon={<AlertTriangle size={18} />}>Phân tích Ping cao</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`${styles.contextualNote} ${styles.networkWarning}`}>
                <div className={styles.networkWarningContent}>
                  <strong>Ping hiện tại: {data.ping} ms</strong>
                </div>
                
                {pingAnalysis.reasons.length > 0 && (
                  <div className={styles.networkWarningContent}>
                    <strong>Nguyên nhân có thể:</strong>
                    <ul className={styles.networkWarningList}>
                      {pingAnalysis.reasons.map((reason, idx) => (
                        <li key={idx} className={styles.networkWarningListItem}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {pingAnalysis.suggestions.length > 0 && (
                  <div>
                    <strong>Gợi ý:</strong>
                    <ul className={styles.networkWarningList}>
                      {pingAnalysis.suggestions.map((suggestion, idx) => (
                        <li key={idx} className={styles.networkWarningListItem}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

