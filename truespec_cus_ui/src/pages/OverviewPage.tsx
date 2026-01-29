// ============================================================================
// OVERVIEW PAGE - System summary dashboard
// ============================================================================

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Database, HardDrive, Wifi, Battery, Fan, Thermometer, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Gauge, ProgressBar, Badge } from '../components/common';
import { PageHeader } from '../components/layout';
import { Sparkline } from '../components/charts';
import { useMonitor } from '../hooks';
import styles from './OverviewPage.module.css';
import { DeviceTypeLabel, TimeSeriesPoint } from '../types';

export const OverviewPage: React.FC = () => {
  const { cpu, gpu, ram, storage, network, battery, fan, deviceInfo, systemStatus } = useMonitor();

  // Helper: Get temperature data from last 10 minutes
  const getLast10MinData = (history: TimeSeriesPoint[]): TimeSeriesPoint[] => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return history.filter(point => point.timestamp >= tenMinutesAgo);
  };

  // Helper: Calculate max temperature in last 10 minutes
  const getMaxTemp10Min = (history: TimeSeriesPoint[], currentTemp: number): number => {
    const recentData = getLast10MinData(history);
    if (recentData.length === 0) return currentTemp;
    return Math.max(...recentData.map(p => p.value), currentTemp);
  };

  // Helper: Calculate temperature trend
  const getTempTrend = (history: TimeSeriesPoint[]): 'up' | 'down' | 'stable' => {
    const recentData = getLast10MinData(history);
    if (recentData.length < 2) return 'stable';
    const first = recentData[0].value;
    const last = recentData[recentData.length - 1].value;
    const diff = last - first;
    if (diff > 2) return 'up';
    if (diff < -2) return 'down';
    return 'stable';
  };

  // Helper: Get cause suggestion for temperature
  const getTempCause = (sensor: string, temp: number, trend: 'up' | 'down' | 'stable', relatedData: any): string | null => {
    if (temp < 50) return null; // Normal temp, no cause needed

    if (sensor === 'CPU') {
      if (temp > 80 && relatedData.load > 80) {
        return 'CPU nóng do tải cao (render/video encoding)';
      }
      if (temp > 75 && trend === 'up') {
        return 'CPU đang tăng nhiệt độ';
      }
      if (temp > 70) {
        return 'CPU nóng do workload cao';
      }
    }

    if (sensor === 'GPU') {
      if (temp > 85 && relatedData.load > 70) {
        return 'GPU nóng do gaming/rendering';
      }
      if (temp > 80 && trend === 'up') {
        return 'GPU đang tăng nhiệt độ';
      }
    }

    if (sensor === 'SSD') {
      if (temp > 60 && relatedData.writeRate > 500) {
        return 'SSD nóng do copy file/ghi dữ liệu';
      }
      if (temp > 55 && relatedData.readRate > 1000) {
        return 'SSD nóng do đọc dữ liệu lớn';
      }
    }

    if (sensor === 'PCH' || sensor === 'Mainboard') {
      if (temp > 65) {
        return 'Mainboard nóng do CPU/GPU tỏa nhiệt';
      }
    }

    return null;
  };

  // Helper: Get cooling suggestion
  const getCoolingSuggestion = (sensor: string, _temp: number, status: 'ok' | 'warn' | 'danger'): string => {
    if (status === 'ok') {
      return 'Nhiệt độ an toàn';
    }
    if (status === 'warn') {
      return 'Cần theo dõi - Kiểm tra hệ thống làm mát';
    }
    // danger
    if (sensor === 'CPU' || sensor === 'GPU') {
      return 'Cần làm mát ngay - Tăng tốc quạt hoặc giảm tải';
    }
    return 'Cần làm mát ngay - Kiểm tra hệ thống làm mát';
  };

  // Temperature sensor data
  const tempSensors = useMemo(() => {
    const cpuTempHistory = cpu.getHistory('temp');
    const gpuTempHistory = gpu.getHistory('temp');
    const ssdTemp = storage.data.smart.temperature ?? 38;
    const systemTemp = 42; // PCH/Mainboard temp (could be enhanced with actual sensor data)

    const cpuMax10Min = getMaxTemp10Min(cpuTempHistory, cpu.data.temperature);
    const gpuMax10Min = getMaxTemp10Min(gpuTempHistory, gpu.data.temperature);
    
    const cpuTrend = getTempTrend(cpuTempHistory);
    const gpuTrend = getTempTrend(gpuTempHistory);

    const getStatus = (temp: number, thresholds: { warn: number; danger: number }): 'ok' | 'warn' | 'danger' => {
      if (temp >= thresholds.danger) return 'danger';
      if (temp >= thresholds.warn) return 'warn';
      return 'ok';
    };

    return [
      {
        name: 'CPU',
        label: 'CPU',
        current: cpu.data.temperature,
        max10Min: cpuMax10Min,
        trend: cpuTrend,
        status: getStatus(cpu.data.temperature, { warn: 65, danger: 80 }),
        thresholds: { min: 30, warn: 65, danger: 80 },
        cause: getTempCause('CPU', cpu.data.temperature, cpuTrend, { load: cpu.data.load }),
        cooling: getCoolingSuggestion('CPU', cpu.data.temperature, getStatus(cpu.data.temperature, { warn: 65, danger: 80 })),
        history: cpuTempHistory,
      },
      {
        name: 'GPU',
        label: 'GPU',
        current: gpu.data.temperature,
        max10Min: gpuMax10Min,
        trend: gpuTrend,
        status: getStatus(gpu.data.temperature, { warn: 75, danger: 85 }),
        thresholds: { min: 30, warn: 75, danger: 85 },
        cause: getTempCause('GPU', gpu.data.temperature, gpuTrend, { load: gpu.data.load }),
        cooling: getCoolingSuggestion('GPU', gpu.data.temperature, getStatus(gpu.data.temperature, { warn: 75, danger: 85 })),
        history: gpuTempHistory,
      },
      {
        name: 'SSD',
        label: 'SSD',
        current: ssdTemp,
        max10Min: ssdTemp,
        trend: 'stable' as const,
        status: getStatus(ssdTemp, { warn: 55, danger: 70 }),
        thresholds: { min: 25, warn: 55, danger: 70 },
        cause: getTempCause('SSD', ssdTemp, 'stable', { 
          writeRate: storage.data.performance.currentWrite,
          readRate: storage.data.performance.currentRead 
        }),
        cooling: getCoolingSuggestion('SSD', ssdTemp, getStatus(ssdTemp, { warn: 55, danger: 70 })),
        history: [],
      },
      {
        name: 'PCH',
        label: 'PCH/Mainboard',
        current: systemTemp,
        max10Min: systemTemp,
        trend: 'stable' as const,
        status: getStatus(systemTemp, { warn: 60, danger: 75 }),
        thresholds: { min: 30, warn: 60, danger: 75 },
        cause: getTempCause('PCH', systemTemp, 'stable', {}),
        cooling: getCoolingSuggestion('PCH', systemTemp, getStatus(systemTemp, { warn: 60, danger: 75 })),
        history: [],
      },
    ];
  }, [cpu, gpu, storage]);

  // Determine top issues based on current metrics
  const getTopIssues = () => {
    const issues: { label: string; severity: 'ok' | 'warn' | 'danger' }[] = [];
    
    if (ram.data.usedPercent > 85) {
      issues.push({ label: 'RAM cao', severity: ram.data.usedPercent > 95 ? 'danger' : 'warn' });
    }
    if (storage.data.usedPercent > 85) {
      issues.push({ label: 'SSD gần đầy', severity: storage.data.usedPercent > 95 ? 'danger' : 'warn' });
    }
    if (network.data.ping > 100) {
      issues.push({ label: 'Ping cao', severity: network.data.ping > 200 ? 'danger' : 'warn' });
    }
    if (cpu.data.temperature > 80) {
      issues.push({ label: 'CPU nóng', severity: cpu.data.temperature > 90 ? 'danger' : 'warn' });
    }
    if (battery.data.health.healthPercent < 50) {
      issues.push({ label: 'Pin chai', severity: 'warn' });
    }
    
    return issues;
  };

  const topIssues = getTopIssues();

  // Quick action handlers
  const handleQuickScan = () => {
    console.log('Quick scan triggered');
    // TODO: Implement quick scan via commandModule
  };

  const handleExportReport = () => {
    console.log('Export report triggered');
    // TODO: Implement export via commandModule.exportHardware()
  };

  const handleEcoMode = () => {
    console.log('Eco mode triggered');
    // TODO: Implement eco mode - reduce fan speeds, limit CPU
  };

  const handlePerformanceMode = () => {
    console.log('Performance mode triggered');
    // TODO: Implement performance mode - max fans, unlock CPU
  };

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tổng quan hệ thống"
        subtitle={`${DeviceTypeLabel[deviceInfo.type]} • ${deviceInfo.name} • ${deviceInfo.os} ${deviceInfo.osVersion}`}
        status={systemStatus.overall}
        statusLabel={systemStatus.label}
        uptime="10 ngày 5 giờ"
        lastUpdate="vừa xong"
        topIssues={topIssues.length > 0 ? topIssues : undefined}
        showQuickActions
        onQuickScan={handleQuickScan}
        onExportReport={handleExportReport}
        onEcoMode={handleEcoMode}
        onPerformanceMode={handlePerformanceMode}
      />

      <div className={styles.grid}>
        {/* CPU Card */}
        <Link to="/cpu" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<Cpu size={18} />}>CPU</CardTitle>
              <Badge variant={cpu.getStatus() === 'ok' ? 'success' : cpu.getStatus() === 'warn' ? 'warning' : 'danger'} size="sm">
                {cpu.getStatusLabel()}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={styles.gaugeRow}>
                <Gauge value={cpu.data.load} size="md" color="auto" label="Tải" />
                <div className={styles.statsCol}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Nhiệt độ</span>
                    <span className={styles.statValue}>{cpu.data.temperature}°C</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Công suất</span>
                    <span className={styles.statValue}>{cpu.data.power.toFixed(1)} W</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Cores</span>
                    <span className={styles.statValue}>{cpu.data.specs.cores}C/{cpu.data.specs.threads}T</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* GPU Card */}
        <Link to="/gpu" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<Activity size={18} />}>GPU</CardTitle>
              <Badge variant={gpu.getStatus() === 'ok' ? 'success' : 'warning'} size="sm">
                {gpu.data.temperature}°C
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={styles.gaugeRow}>
                <Gauge value={gpu.data.load} size="md" color="auto" label="Tải" />
                <div className={styles.statsCol}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>VRAM</span>
                    <span className={styles.statValue}>{gpu.data.vramUsed}/{gpu.data.vramTotal} MB</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Fan</span>
                    <span className={styles.statValue}>{gpu.data.fanSpeed} RPM</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Model</span>
                    <span className={styles.statValue} title={gpu.data.specs.name}>{gpu.data.specs.name.split(' ').slice(-2).join(' ')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* RAM Card */}
        <Link to="/ram" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<Database size={18} />}>RAM</CardTitle>
              <Badge variant={ram.getStatus() === 'ok' ? 'success' : ram.getStatus() === 'warn' ? 'warning' : 'danger'} size="sm">
                {ram.data.usedGB}/{ram.data.specs.totalSize} GB
              </Badge>
            </CardHeader>
            <CardContent>
              <ProgressBar 
                value={ram.data.usedPercent} 
                color="auto" 
                showLabel 
                label={`${ram.data.specs.type} ${ram.data.specs.speed} MHz`} 
              />
              <div className={styles.ramStats}>
                <span>Used: {ram.data.usedGB} GB</span>
                <span>Free: {ram.data.freeGB} GB</span>
                <span>Cache: {ram.data.cachePercent}%</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Storage Card */}
        <Link to="/storage" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<HardDrive size={18} />}>Storage</CardTitle>
              <Badge variant={storage.getStatus() === 'ok' ? 'success' : 'warning'} size="sm">
                {storage.getSMARTStatus()}
              </Badge>
            </CardHeader>
            <CardContent>
              <ProgressBar 
                value={storage.data.usedPercent} 
                color="auto" 
                showLabel 
                label={storage.data.specs.name}
              />
              <div className={styles.storageStats}>
                <span>Used: {storage.data.usedGB} GB</span>
                <span>Free: {storage.data.freeGB} GB</span>
                <span>Health: {storage.data.smart.healthPercent}%</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Network Card */}
        <Link to="/network" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<Wifi size={18} />}>Network</CardTitle>
              <Badge variant={network.isOnline() ? 'success' : 'danger'} size="sm">
                {network.data.connection.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={styles.networkStats}>
                <div className={styles.networkRow}>
                  <span className={styles.networkLabel}>↓ Download</span>
                  <span className={styles.networkValue}>{network.data.currentDownload.toFixed(1)} Mbps</span>
                </div>
                <div className={styles.networkRow}>
                  <span className={styles.networkLabel}>↑ Upload</span>
                  <span className={styles.networkValue}>{network.data.currentUpload.toFixed(1)} Mbps</span>
                </div>
                <div className={styles.networkRow}>
                  <span className={styles.networkLabel}>Ping</span>
                  <span className={styles.networkValue}>{network.data.ping} ms</span>
                </div>
                <div className={styles.networkRow}>
                  <span className={styles.networkLabel}>IP</span>
                  <span className={styles.networkValue}>{network.data.connection.ipv4}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Battery Card */}
        <Link to="/battery" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<Battery size={18} />}>Battery</CardTitle>
              <Badge variant={battery.getStatus() === 'ok' ? 'success' : battery.getStatus() === 'warn' ? 'warning' : 'danger'} size="sm">
                {battery.data.state}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={styles.batteryMain}>
                <div className={styles.batteryCircle}>
                  <svg viewBox="0 0 100 100" className={styles.batterySvg}>
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(31,41,55,0.8)" strokeWidth="8" />
                    <circle 
                      cx="50" 
                      cy="50" 
                      r="44" 
                      fill="none" 
                      stroke={battery.data.percent > 20 ? 'var(--accent-green)' : 'var(--accent-red)'} 
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - battery.data.percent / 100)}
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <span className={styles.batteryPercent}>{battery.data.percent}%</span>
                </div>
                <div className={styles.batteryStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Time</span>
                    <span className={styles.statValue}>{battery.formatTimeRemaining()}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Health</span>
                    <span className={styles.statValue}>{battery.data.health.healthPercent}%</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Power</span>
                    <span className={styles.statValue}>{battery.data.powerDraw.toFixed(1)} W</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Fan Card */}
        <Link to="/fan" className={styles.cardLink}>
          <Card className={styles.metricCard} hoverable>
            <CardHeader>
              <CardTitle icon={<Fan size={18} />}>Fan Control</CardTitle>
              <Badge variant={fan.getOverallStatus() === 'ok' ? 'success' : 'warning'} size="sm">
                {fan.getStatusLabel()}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={styles.fanList}>
                {fan.data.fans.slice(0, 4).map((f) => (
                  <div key={f.id} className={styles.fanRow}>
                    <span className={styles.fanName}>{f.name}</span>
                    <span className={styles.fanRpm}>{f.rpm} RPM</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Temperature Summary */}
        <Card className={styles.metricCard}>
          <CardHeader>
            <CardTitle icon={<Thermometer size={18} />}>Nhiệt độ (Sensors)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.tempSensors}>
              {tempSensors.map((sensor) => (
                <div key={sensor.name} className={styles.tempSensorItem}>
                  <div className={styles.tempSensorHeader}>
                    <span className={styles.tempSensorLabel}>{sensor.label}</span>
                    <Badge 
                      variant={sensor.status === 'ok' ? 'success' : sensor.status === 'warn' ? 'warning' : 'danger'} 
                      size="sm"
                    >
                      {sensor.status === 'ok' ? 'An toàn' : sensor.status === 'warn' ? 'Cảnh báo' : 'Nguy hiểm'}
                    </Badge>
                  </div>
                  
                  <div className={styles.tempSensorMain}>
                    <div className={styles.tempSensorValue}>
                      <span className={styles.tempCurrent} data-status={sensor.status}>
                        {sensor.current}°C
                      </span>
                      {sensor.max10Min > sensor.current && (
                        <span className={styles.tempMax}>
                          Max 10p: {sensor.max10Min}°C
                        </span>
                      )}
                    </div>
                    
                    {sensor.history.length > 0 && (
                      <div className={styles.tempTrend}>
                        <Sparkline 
                          data={sensor.history} 
                          height={24} 
                          color={sensor.status === 'ok' ? '#4ade80' : sensor.status === 'warn' ? '#fbbf24' : '#ef4444'} 
                        />
                        <span className={styles.tempTrendIcon}>
                          {sensor.trend === 'up' && <TrendingUp size={14} />}
                          {sensor.trend === 'down' && <TrendingDown size={14} />}
                          {sensor.trend === 'stable' && <Minus size={14} />}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Thresholds visualization */}
                  <div className={styles.tempThresholds}>
                    <div className={styles.tempThresholdBar}>
                      <div 
                        className={styles.tempThresholdSegment}
                        style={{ 
                          width: `${((sensor.thresholds.warn - sensor.thresholds.min) / (sensor.thresholds.danger - sensor.thresholds.min)) * 100}%`,
                          backgroundColor: 'var(--accent-green)'
                        }}
                      />
                      <div 
                        className={styles.tempThresholdSegment}
                        style={{ 
                          width: `${((sensor.thresholds.danger - sensor.thresholds.warn) / (sensor.thresholds.danger - sensor.thresholds.min)) * 100}%`,
                          backgroundColor: 'var(--accent-yellow)'
                        }}
                      />
                      <div 
                        className={styles.tempThresholdSegment}
                        style={{ 
                          flex: 1,
                          backgroundColor: 'var(--accent-red)'
                        }}
                      />
                      <div 
                        className={styles.tempIndicator}
                        style={{ 
                          left: `${Math.min(100, Math.max(0, ((sensor.current - sensor.thresholds.min) / (sensor.thresholds.danger - sensor.thresholds.min)) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className={styles.tempThresholdLabels}>
                      <span>{sensor.thresholds.min}°C</span>
                      <span>{sensor.thresholds.warn}°C</span>
                      <span>{sensor.thresholds.danger}°C</span>
                    </div>
                  </div>

                  {/* Cause and cooling suggestion */}
                  {(sensor.cause || sensor.status !== 'ok') && (
                    <div className={styles.tempInfo}>
                      {sensor.cause && (
                        <div className={styles.tempCause}>
                          <span className={styles.tempCauseLabel}>Nguyên nhân:</span>
                          <span className={styles.tempCauseText}>{sensor.cause}</span>
                        </div>
                      )}
                      <div className={styles.tempCooling}>
                        <span className={styles.tempCoolingLabel}>Kết luận:</span>
                        <span className={styles.tempCoolingText} data-status={sensor.status}>
                          {sensor.cooling}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

