// ============================================================================
// CPU PAGE - Detailed CPU monitoring
// ============================================================================

import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Cpu, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Gauge, Table, SpecList, SpecRow } from '../components/common';
import { AreaChart, mergeTimeSeriesForChart, Sparkline } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useCPU } from '../hooks';
import { CPUCore, CPUProcess } from '../types';
import styles from './DetailPage.module.css';

export const CPUPage: React.FC = () => {
  const { data, model } = useCPU();

  const chartData = mergeTimeSeriesForChart([
    { key: 'usage', points: model.getHistory('usage') },
    { key: 'clock', points: model.getHistory('clock') },
  ]);

  // Get CPU series info (U/H/Desktop) from generation
  const cpuSeries = useMemo(() => {
    const name = data.specs.name.toLowerCase();
    if (name.includes('u') || name.includes('ultra low')) return 'U (Ultra Low Power)';
    if (name.includes('h') || name.includes('hx')) return 'H (High Performance)';
    if (name.includes('k') || name.includes('f')) return 'Desktop';
    return 'Standard';
  }, [data.specs.name]);

  // Contextual note based on status
  const contextualNote = useMemo(() => {
    const { load, temperature, throttling } = data;
    if (throttling.isThrottling) {
      if (throttling.thermal) {
        return 'CPU đang bị giới hạn do nhiệt độ cao. Nên kiểm tra hệ thống làm mát hoặc giảm tải.';
      }
      if (throttling.power) {
        return 'CPU đang bị giới hạn do công suất. Nên kiểm tra nguồn điện hoặc giảm tải.';
      }
    }
    if (load > 80) {
      return `Tải CPU cao (${load}%) do ${data.topProcesses.slice(0, 2).map(p => p.name).join(', ')}. Có thể đóng các ứng dụng không cần thiết.`;
    }
    if (temperature > 70) {
      return `Nhiệt độ CPU cao (${temperature}°C). Nên kiểm tra hệ thống làm mát.`;
    }
    return 'CPU hoạt động bình thường. Không có vấn đề cần chú ý.';
  }, [data]);

  const coreColumns = [
    { key: 'coreIndex', header: 'Core', width: '60px', render: (v: unknown) => `Core ${v as number}` },
    { key: 'load', header: 'Load', align: 'center' as const, render: (v: unknown) => `${v}%` },
    { key: 'clock', header: 'Clock', align: 'center' as const, render: (v: unknown) => `${v} GHz` },
    { key: 'temperature', header: 'Temp', align: 'right' as const, render: (v: unknown) => `${v}°C` },
  ];

  const processColumns = [
    { key: 'name', header: 'Process' },
    { key: 'pid', header: 'PID', width: '70px', align: 'center' as const },
    { key: 'cpuUsage', header: 'CPU %', align: 'center' as const, render: (v: unknown) => `${(v as number).toFixed(1)}%` },
    { key: 'percentage', header: 'Total %', align: 'right' as const, render: (v: unknown) => `${(v as number).toFixed(1)}%` },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="CPU Detail"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'CPU' },
        ]}
        status={model.getStatus()}
        statusLabel={model.getStatusLabel()}
      />

      <div className={styles.grid}>
        {/* Gauge Card */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<Cpu size={18} />}>CPU Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.gaugeCenter}>
              <Gauge value={data.load} size="lg" color="auto" label="Load" />
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Nhiệt độ</span>
                <span className={styles.quickValue}>{data.temperature}°C</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Công suất</span>
                <span className={styles.quickValue}>{data.power.toFixed(1)} W</span>
              </div>
            </div>

            {/* Clock Info */}
            <div className={styles.clockInfo}>
              <div className={styles.clockRow}>
                <span className={styles.clockLabel}>Xung nhịp hiện tại:</span>
                <span className={styles.clockValue}>{data.currentClock.toFixed(2)} GHz</span>
              </div>
              <div className={styles.clockRow}>
                <span className={styles.clockLabel}>Base / Turbo:</span>
                <span className={styles.clockValue}>
                  {data.specs.baseClock} / {data.specs.turboClock} GHz
                </span>
              </div>
            </div>

            {/* Throttling Status */}
            <div className={styles.throttlingStatus}>
              <div className={styles.throttlingItem}>
                <span className={styles.throttlingLabel}>
                  <AlertTriangle size={12} className={styles.iconInline} />
                  Thermal Throttling:
                </span>
                <span className={clsx(styles.throttlingValue, data.throttling.thermal && styles.throttlingValueActive)}>
                  {data.throttling.thermal ? 'Đang bị giới hạn' : 'Bình thường'}
                </span>
              </div>
              <div className={styles.throttlingItem}>
                <span className={styles.throttlingLabel}>
                  <Zap size={12} className={styles.iconInline} />
                  Power Throttling:
                </span>
                <span className={clsx(styles.throttlingValue, data.throttling.power && styles.throttlingValueActive)}>
                  {data.throttling.power ? 'Đang bị giới hạn' : 'Bình thường'}
                </span>
              </div>
            </div>

            {/* Trend Sparklines */}
            <div className={styles.trendSection}>
              <div className={styles.trendItem}>
                <span className={styles.trendLabel}>Load trend:</span>
                <div className={styles.trendSparkline}>
                  <Sparkline data={model.getHistory('usage')} height={24} color="#37d0ff" />
                </div>
                <span className={styles.trendValue}>{data.load}%</span>
              </div>
              <div className={styles.trendItem}>
                <span className={styles.trendLabel}>Temp trend:</span>
                <div className={styles.trendSparkline}>
                  <Sparkline data={model.getHistory('temp')} height={24} color="#ef4444" />
                </div>
                <span className={styles.trendValue}>{data.temperature}°C</span>
              </div>
            </div>

            {/* Contextual Note */}
            <div className={styles.contextualNote}>
              <strong>Ghi chú:</strong> {contextualNote}
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
                { dataKey: 'usage', name: 'Usage %', color: '#37d0ff' },
                { dataKey: 'clock', name: 'Clock %', color: '#4ade80' },
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
            <Table<CPUProcess & Record<string, unknown>>
              columns={processColumns}
              data={data.topProcesses.slice(0, 3) as (CPUProcess & Record<string, unknown>)[]}
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
              <SpecRow label="Model CPU" value={data.specs.name} />
              <SpecRow label="Thế hệ / Series" value={`${data.specs.generation} (${cpuSeries})`} />
              <SpecRow label="Kiến trúc" value={data.specs.architecture} />
              <SpecRow label="Cores / Threads" value={`${data.specs.cores} cores / ${data.specs.threads} threads`} />
              <SpecRow label="Base Clock" value={`${data.specs.baseClock} GHz`} />
              <SpecRow label="Turbo Clock" value={`${data.specs.turboClock} GHz`} />
              <SpecRow label="Socket" value={data.specs.socket} />
              <SpecRow label="TDP" value={`${data.specs.tdp} W`} />
              <SpecRow label="L1 Cache" value={data.specs.l1Cache} />
              <SpecRow label="L2 Cache" value={data.specs.l2Cache} />
              <SpecRow label="L3 Cache" value={data.specs.l3Cache} />
            </SpecList>
          </CardContent>
        </Card>

        {/* Per-Core Table */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <CardTitle>Per-Core Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<CPUCore & Record<string, unknown>>
              columns={coreColumns}
              data={data.coreData as (CPUCore & Record<string, unknown>)[]}
              keyExtractor={(row) => `core-${row.coreIndex}`}
              compact
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

