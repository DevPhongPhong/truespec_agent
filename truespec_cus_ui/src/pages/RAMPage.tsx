// ============================================================================
// RAM PAGE - Detailed RAM monitoring
// ============================================================================

import React, { useMemo } from 'react';
import { MemoryStick, AlertTriangle, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Gauge, Table, SpecList, SpecRow, ProgressBar, Badge } from '../components/common';
import { AreaChart, mergeTimeSeriesForChart } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useRAM } from '../hooks';
import { RAMModule, RAMProcess } from '../types';
import styles from './DetailPage.module.css';

export const RAMPage: React.FC = () => {
  const { data, model } = useRAM();

  const chartData = mergeTimeSeriesForChart([
    { key: 'usage', points: model.getHistory('usage') },
    { key: 'cache', points: model.getHistory('cache') },
  ]);

  // Calculate slot information
  const slotInfo = useMemo(() => {
    const modules = data.specs.modules;
    const usedSlots = modules.length;
    const slotSizes = modules.map((m) => `${m.size}GB`).join(' + ');
    const totalSlots = 4; // Typically 4 slots on desktop, 2 on laptop
    return {
      usedSlots,
      totalSlots,
      slotSizes,
      slotsText: `Slot ${modules.map((_, i) => i + 1).join('/')} (${slotSizes})`,
    };
  }, [data.specs.modules]);

  // Speed display with MT/s and mode
  const speedDisplay = useMemo(() => {
    const speedMTs = data.specs.speedMTs || (data.specs.speed * 2); // DDR = 2x MHz
    const mode = data.specs.speedMode || 'JEDEC';
    return {
      mts: speedMTs,
      mode,
      display: `${speedMTs} MT/s (${mode})`,
    };
  }, [data.specs]);

  // Contextual note based on RAM usage
  const contextualNote = useMemo(() => {
    const { usedPercent, isSwapping, swapUsedGB, topProcesses } = data;
    
    if (isSwapping && swapUsedGB && swapUsedGB > 0.5) {
      return `⚠️ Hệ thống đang swap (${swapUsedGB.toFixed(1)}GB). RAM cao sẽ gây lag nghiêm trọng. Nên đóng ứng dụng không cần thiết hoặc nâng cấp RAM.`;
    }
    if (usedPercent > 90) {
      const topApp = topProcesses[0]?.name || 'ứng dụng';
      return `RAM đang đầy (${usedPercent}%). ${topApp} đang sử dụng nhiều RAM nhất. Nên đóng ứng dụng không cần thiết hoặc nâng cấp RAM.`;
    }
    if (usedPercent > 75) {
      return `RAM đang cao (${usedPercent}%). Nên theo dõi và đóng ứng dụng không cần thiết để tránh lag.`;
    }
    return 'RAM hoạt động bình thường. Không có vấn đề cần chú ý.';
  }, [data]);

  const moduleColumns = [
    { key: 'slot', header: 'Slot', width: '80px' },
    { key: 'brand', header: 'Brand' },
    { key: 'size', header: 'Size', align: 'center' as const, render: (v: unknown) => `${v} GB` },
    { key: 'speed', header: 'Speed', align: 'right' as const, render: (v: unknown) => `${v} MHz` },
  ];

  const processColumns = [
    { key: 'name', header: 'Process' },
    { key: 'pid', header: 'PID', width: '70px', align: 'center' as const },
    { key: 'memoryUsage', header: 'Memory', align: 'center' as const, render: (v: unknown) => `${(v as number).toFixed(1)} GB` },
    { key: 'percentage', header: '%', align: 'right' as const, render: (v: unknown) => `${(v as number).toFixed(1)}%` },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="RAM Detail"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'RAM' },
        ]}
        status={model.getStatus()}
        statusLabel={model.getStatusLabel()}
      />

      <div className={styles.grid}>
        {/* Gauge Card */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<MemoryStick size={18} />}>
              <span className={styles.titleWithBadge}>
                Memory Usage
                <Badge 
                  variant={data.specs.channels === 'Dual' ? 'success' : data.specs.channels === 'Quad' ? 'info' : 'default'}
                >
                  {data.specs.channels}-channel
                </Badge>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.gaugeCenter}>
              <Gauge value={data.usedPercent} size="lg" color="auto" label="Used" />
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Used</span>
                <span className={styles.quickValue}>{data.usedGB} GB</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Available</span>
                <span className={styles.quickValue}>{data.availableGB?.toFixed(1) || data.freeGB} GB</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Cache</span>
                <span className={styles.quickValue}>{data.cacheGB?.toFixed(1) || data.cachePercent} {data.cacheGB ? 'GB' : '%'}</span>
              </div>
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
                { dataKey: 'usage', name: 'Memory %', color: '#37d0ff' },
                { dataKey: 'cache', name: 'Cache %', color: '#a78bfa' },
              ]}
              height={180}
              showLegend
            />
          </CardContent>
        </Card>

        {/* Specs & Modules Card */}
        <Card className={styles.specsCard}>
          <CardHeader>
            <CardTitle>Thông số</CardTitle>
          </CardHeader>
          <CardContent>
            <SpecList>
              <SpecRow label="Total" value={`${data.specs.totalSize} GB`} />
              <SpecRow label="Type" value={data.specs.type} />
              <SpecRow label="Speed" value={`${data.specs.speed} MHz / ${speedDisplay.display}`} />
              <SpecRow label="Channels" value={data.specs.channels} />
              <SpecRow label="Slots" value={`${slotInfo.usedSlots}/${slotInfo.totalSlots} (${slotInfo.slotSizes})`} />
            </SpecList>
            
            <h4 className={styles.subTitle}>Physical Modules</h4>
            <Table<RAMModule & Record<string, unknown>>
              columns={moduleColumns}
              data={data.specs.modules as (RAMModule & Record<string, unknown>)[]}
              keyExtractor={(row) => row.slot as string}
              compact
            />
          </CardContent>
        </Card>

        {/* Memory Breakdown Card */}
        <Card className={styles.memoryBreakdownCard}>
          <CardHeader>
            <CardTitle>Memory Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.memoryBreakdownList}>
              <div className={styles.memoryBreakdownItem}>
                <div className={styles.memoryBreakdownHeader}>
                  <span className={styles.memoryBreakdownLabel}>Used</span>
                  <span className={styles.memoryBreakdownValue}>{data.usedGB} GB</span>
                </div>
                <ProgressBar value={data.usedPercent} color="auto" size="sm" />
                <div className={styles.memoryBreakdownDescription}>
                  Bộ nhớ đang được sử dụng bởi ứng dụng
                </div>
              </div>

              <div className={styles.memoryBreakdownItem}>
                <div className={styles.memoryBreakdownHeader}>
                  <span className={styles.memoryBreakdownLabel}>Available</span>
                  <span className={styles.memoryBreakdownValue}>{data.availableGB?.toFixed(1) || data.freeGB} GB</span>
                </div>
                <div className={styles.memoryBreakdownDescription}>
                  Bộ nhớ có thể sử dụng ngay (Free + Cached có thể giải phóng)
                </div>
              </div>

              <div className={styles.memoryBreakdownItem}>
                <div className={styles.memoryBreakdownHeader}>
                  <span className={styles.memoryBreakdownLabel}>Cached</span>
                  <span className={styles.memoryBreakdownValue}>{data.cacheGB?.toFixed(1) || (data.cachePercent * data.specs.totalSize / 100).toFixed(1)} GB</span>
                </div>
                <div className={styles.memoryBreakdownDescription}>
                  Bộ nhớ cache (có thể giải phóng khi cần)
                </div>
              </div>

              {data.compressedGB !== undefined && data.compressedGB > 0 && (
                <div className={styles.memoryBreakdownItem}>
                  <div className={styles.memoryBreakdownHeader}>
                    <span className={styles.memoryBreakdownLabel}>Compressed</span>
                    <span className={styles.memoryBreakdownValue}>{data.compressedGB.toFixed(1)} GB</span>
                  </div>
                  <div className={styles.memoryBreakdownDescription}>
                    Bộ nhớ đã nén (Windows Memory Compression)
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Swap/Pagefile Card */}
        <Card className={styles.swapCard}>
          <CardHeader>
            <CardTitle>
              <span className={styles.titleWithBadge}>
                Swap/Pagefile
                {data.isSwapping && (
                  <Badge variant="danger">
                    <span className={styles.badgeInline}>
                      <AlertTriangle size={12} />
                      Swapping
                    </span>
                  </Badge>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.swapTotalGB !== undefined ? (
              <div className={styles.memoryBreakdownList}>
                <div className={styles.memoryBreakdownItem}>
                  <div className={styles.memoryBreakdownHeader}>
                    <span className={styles.memoryBreakdownLabel}>Used</span>
                    <span className={`${styles.memoryBreakdownValue} ${data.isSwapping ? styles.memoryBreakdownValueDanger : ''}`}>
                      {data.swapUsedGB?.toFixed(1) || 0} GB
                    </span>
                  </div>
                  <ProgressBar 
                    value={data.swapTotalGB > 0 ? ((data.swapUsedGB || 0) / data.swapTotalGB) * 100 : 0} 
                    color={data.isSwapping ? 'red' : 'auto'} 
                    size="sm" 
                  />
                </div>
                <div className={styles.memoryBreakdownItem}>
                  <div className={styles.memoryBreakdownHeader}>
                    <span className={styles.memoryBreakdownLabel}>Total</span>
                    <span className={styles.memoryBreakdownValue}>{data.swapTotalGB} GB</span>
                  </div>
                </div>
                {data.isSwapping && (
                  <div className={styles.swapWarning}>
                    <strong className={styles.swapWarningStrong}>⚠️ Cảnh báo:</strong> Hệ thống đang swap sang ổ cứng. 
                    Điều này sẽ gây lag nghiêm trọng. Nên đóng ứng dụng hoặc nâng cấp RAM.
                  </div>
                )}
                <div className={styles.swapInfo}>
                  {data.isSwapping 
                    ? 'Swap đang hoạt động - RAM đã đầy, hệ thống đang dùng ổ cứng làm RAM'
                    : 'Swap không hoạt động - RAM đủ cho hệ thống'}
                </div>
              </div>
            ) : (
              <div className={styles.swapUnavailable}>
                Thông tin swap không khả dụng
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Processes */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <CardTitle>Top Memory Processes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<RAMProcess & Record<string, unknown>>
              columns={processColumns}
              data={data.topProcesses as (RAMProcess & Record<string, unknown>)[]}
              keyExtractor={(row) => `proc-${row.pid}`}
              compact
            />
          </CardContent>
        </Card>

        {/* Contextual Note */}
        <Card className={styles.contextualNoteCard}>
          <CardContent>
            <div className={styles.contextualNote}>
              <div className={styles.infoNote}>
                <Info size={16} className={styles.infoNoteIcon} />
                <div>
                  <strong>Lưu ý:</strong> {contextualNote}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

