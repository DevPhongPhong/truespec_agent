// ============================================================================
// GPU PAGE - Detailed GPU monitoring
// ============================================================================

import React, { useMemo } from 'react';
import { Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Gauge, Table, SpecList, SpecRow, Badge, ProgressBar } from '../components/common';
import { AreaChart, mergeTimeSeriesForChart, Sparkline } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useHardwareGPU } from '../hooks';
import { GPUEngine, GPUProcess, TimeSeriesPoint } from '../types';
import styles from './DetailPage.module.css';

export const GPUPage: React.FC = () => {
  const { data: gpuArray, models, loading, error } = useHardwareGPU();
  
  // Lấy GPU đầu tiên để hiển thị (hoặc có thể hiển thị tất cả)
  const model = gpuArray.length > 0 ? gpuArray[0] : null;
  const data = model?.data;

  // Early return nếu không có GPU
  if (!model || !data) {
    return (
      <div className={styles.page}>
        <PageHeader title="GPU Detail" breadcrumbs={[{ label: 'Tổng quan', path: '/overview' }, { label: 'GPU' }]} />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {loading ? 'Đang tải dữ liệu GPU...' : error ? `Lỗi: ${error.message}` : 'Không tìm thấy GPU'}
        </div>
      </div>
    );
  }

  const chartData = mergeTimeSeriesForChart([
    { key: 'usage', points: model.getHistory('usage') },
    { key: 'vram', points: model.getHistory('vram') },
  ]);

  // Get last 30 seconds of data (approximately 6 points if updating every 5s)
  const getLast30sData = (points: TimeSeriesPoint[]): TimeSeriesPoint[] => {
    const now = Date.now();
    const thirtySecondsAgo = now - 30000;
    return points.filter(p => p.timestamp >= thirtySecondsAgo);
  };

  const loadTrend = useMemo(() => getLast30sData(model.getHistory('usage')), [model]);
  const tempTrend = useMemo(() => getLast30sData(model.getHistory('temp')), [model]);
  const powerTrend = useMemo(() => getLast30sData(model.getHistory('power')), [model]);

  // VRAM usage percentage and warning
  const vramPercent = useMemo(() => (data.vramUsed / data.vramTotal) * 100, [data.vramUsed, data.vramTotal]);
  const vramWarning = vramPercent > 90;
  const vramPressure = vramPercent > 80;

  // Contextual note based on status
  const contextualNote = useMemo(() => {
    const { load, temperature, power, specs } = data;
    if (temperature > 85) {
      return `Nhiệt độ GPU cao (${temperature}°C). Nên kiểm tra hệ thống làm mát hoặc giảm tải.`;
    }
    if (load > 95) {
      return `GPU đang hoạt động gần công suất tối đa (${load}%). Có thể gây lag trong game/app render.`;
    }
    if (vramPercent > 90) {
      return `VRAM gần đầy (${vramPercent.toFixed(1)}%). Nên giảm setting hoặc đóng ứng dụng không cần thiết.`;
    }
    if (power > specs.tdp * 0.9) {
      return `GPU đang tiêu thụ công suất cao (${power.toFixed(1)}W/${specs.tdp}W). Nên kiểm tra driver hoặc giảm setting.`;
    }
    if (load > 80) {
      const topApp = data.topProcesses[0]?.name || 'ứng dụng';
      return `Tải GPU cao (${load}%) do ${topApp}. Mức này bình thường khi chơi game hoặc render video.`;
    }
    if (temperature > 70 && load > 50) {
      return `Nhiệt độ GPU ${temperature}°C khi tải ${load}%. Mức này bình thường khi chơi game hoặc render.`;
    }
    return 'GPU hoạt động bình thường. Không có vấn đề cần chú ý.';
  }, [data, vramPercent]);

  const engineColumns = [
    { key: 'name', header: 'Engine', width: '140px' },
    { key: 'usage', header: 'Usage', align: 'center' as const, render: (v: unknown) => `${v}%` },
    { key: 'clock', header: 'Clock', align: 'center' as const, render: (v: unknown) => `${v} GHz` },
    { key: 'temperature', header: 'Temp', align: 'right' as const, render: (v: unknown) => `${v}°C` },
  ];

  const processColumns = [
    { key: 'name', header: 'Process' },
    { key: 'pid', header: 'PID', width: '70px', align: 'center' as const },
    { key: 'gpuUsage', header: 'GPU %', align: 'center' as const, render: (v: unknown) => `${(v as number).toFixed(1)}%` },
    { key: 'vramUsage', header: 'VRAM', align: 'center' as const, render: (v: unknown) => `${(v as number)} MB` },
    { key: 'percentage', header: 'Total %', align: 'right' as const, render: (v: unknown) => `${(v as number).toFixed(1)}%` },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="GPU Detail"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'GPU' },
        ]}
        status={model.getStatus()}
        statusLabel={model.getStatusLabel()}
      />

      <div className={styles.grid}>
        {/* Gauge Card */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<Monitor size={18} />}>GPU Load</CardTitle>
          </CardHeader>
          <CardContent>
            {/* GPU Type and Active GPU */}
            <div className={styles.gpuActiveInfo}>
              <Badge variant={data.gpuType === 'dGPU' ? 'info' : data.gpuType === 'iGPU' ? 'default' : 'warning'}>
                {data.gpuType}
              </Badge>
              <span className={styles.gpuActiveLabel}>
                GPU đang active: <strong className={styles.gpuActiveValue}>{data.activeGPU}</strong>
              </span>
            </div>

            {/* Full GPU Name + Driver */}
            <div className={styles.gpuSection}>
              <div className={styles.gpuSectionLabel}>
                Tên GPU đầy đủ:
              </div>
              <div className={styles.gpuSectionValue}>
                {data.specs.name}
              </div>
              <div className={styles.gpuSectionDescription}>
                Driver: {data.specs.driverVersion}
              </div>
            </div>

            <div className={styles.gaugeCenter}>
              <Gauge value={data.load} size="lg" color="auto" label="Load" />
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Nhiệt độ</span>
                <span className={styles.quickValue}>{data.temperature}°C</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Clock</span>
                <span className={styles.quickValue}>{data.currentClock} MHz</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Power</span>
                <span className={styles.quickValue}>{data.power.toFixed(1)} W</span>
              </div>
            </div>

            {/* VRAM with warning */}
            <div className={styles.gpuSection}>
              <div className={styles.gpuSectionHeader}>
                <span className={styles.gpuSectionLabel}>VRAM</span>
                {vramPressure && (
                  <Badge variant={vramWarning ? 'danger' : 'warning'} size="sm">
                    {vramWarning ? 'Gần đầy!' : 'GPU memory pressure'}
                  </Badge>
                )}
              </div>
              <ProgressBar value={vramPercent} color={vramWarning ? 'red' : vramPressure ? 'yellow' : 'auto'} size="sm" />
              <div className={styles.gpuSectionFooter}>
                <span>{data.vramUsed} MB</span>
                <span>{data.vramTotal} MB ({vramPercent.toFixed(1)}%)</span>
              </div>
            </div>

            {/* Trends 30s */}
            <div className={styles.gpuSection}>
              <div className={styles.gpuSubsectionTitle}>
                Trend (30s):
              </div>
              <div className={styles.trendItem}>
                <span className={styles.trendLabel}>Load</span>
                <div className={styles.trendSparkline}>
                  <Sparkline data={loadTrend} height={20} color="#37d0ff" />
                </div>
                <span className={styles.trendValue}>{data.load}%</span>
              </div>
              <div className={styles.trendItem}>
                <span className={styles.trendLabel}>Temp</span>
                <div className={styles.trendSparkline}>
                  <Sparkline data={tempTrend} height={20} color="#ef4444" />
                </div>
                <span className={styles.trendValue}>{data.temperature}°C</span>
              </div>
              <div className={styles.trendItem}>
                <span className={styles.trendLabel}>Power</span>
                <div className={styles.trendSparkline}>
                  <Sparkline data={powerTrend} height={20} color="#fbbf24" />
                </div>
                <span className={styles.trendValue}>{data.power.toFixed(1)}W</span>
              </div>
            </div>

            {/* Contextual Note */}
            <div className={styles.contextualNote}>
              {contextualNote}
            </div>
          </CardContent>
        </Card>

        {/* Chart Card */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Biểu đồ</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={chartData}
              series={[
                { dataKey: 'usage', name: 'GPU %', color: '#37d0ff' },
                { dataKey: 'vram', name: 'VRAM %', color: '#fbbf24' },
              ]}
              height={180}
              showLegend
            />
          </CardContent>
        </Card>

        {/* Top Processes Card */}
        <Card className={styles.processCard}>
          <CardHeader>
            <CardTitle>Top 3 Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<GPUProcess & Record<string, unknown>>
              columns={processColumns}
              data={data.topProcesses.slice(0, 3) as (GPUProcess & Record<string, unknown>)[]}
              keyExtractor={(row) => `proc-${row.pid}`}
              compact
            />
          </CardContent>
        </Card>

        {/* Specs Card */}
        <Card className={styles.specsCard}>
          <CardHeader>
            <CardTitle>Thông số kỹ thuật</CardTitle>
          </CardHeader>
          <CardContent>
            <SpecList>
              <SpecRow label="Tên" value={data.specs.name} />
              <SpecRow label="Loại" value={data.gpuType} />
              <SpecRow label="Kiến trúc" value={data.specs.architecture} />
              <SpecRow label="VRAM" value={`${data.specs.vramSize} MB ${data.specs.vramType}`} />
              <SpecRow label="Bus Width" value={`${data.specs.busWidth}-bit`} />
              <SpecRow label="Base Clock" value={`${data.specs.baseClock} MHz`} />
              <SpecRow label="Boost Clock" value={`${data.specs.boostClock} MHz`} />
              <SpecRow label="Current Clock" value={`${data.currentClock} MHz`} />
              <SpecRow label="CUDA Cores" value={data.specs.cudaCores || 'N/A'} />
              <SpecRow label="TDP" value={`${data.specs.tdp} W`} />
              <SpecRow label="Current Power" value={`${data.power.toFixed(1)} W`} />
              <SpecRow label="Technology" value={data.specs.technology} />
              <SpecRow label="Driver" value={data.specs.driverVersion} />
            </SpecList>
          </CardContent>
        </Card>

        {/* Per-Engine Table */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <CardTitle>Per-Engine Load</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<GPUEngine & Record<string, unknown>>
              columns={engineColumns}
              data={data.engines as (GPUEngine & Record<string, unknown>)[]}
              keyExtractor={(row) => `engine-${row.engineIndex}`}
              compact
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

