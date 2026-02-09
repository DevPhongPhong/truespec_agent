// ============================================================================
// STORAGE PAGE - Detailed Storage monitoring
// ============================================================================

import React, { useMemo, useState } from 'react';
import { HardDrive, Activity, AlertTriangle, Thermometer, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, ProgressBar, Table, SpecList, SpecRow, Badge } from '../components/common';
import { AreaChart, mergeTimeSeriesForChart } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useHardwareStorage } from '../hooks';
import { Partition } from '../types';
import styles from './DetailPage.module.css';

export const StoragePage: React.FC = () => {
  const { data: storageArray, loading, error } = useHardwareStorage();
  const [selectedStorageIndex] = useState(0);

  // Tổng hợp tất cả partitions từ tất cả storage devices (phải gọi trước early return)
  const allPartitions = useMemo(() => {
    if (!storageArray || storageArray.length === 0) return [];
    const partitions: Partition[] = [];
    storageArray.forEach((storage) => {
      if (storage.data.partitions) {
        partitions.push(...storage.data.partitions);
      }
    });
    return partitions;
  }, [storageArray]);

  // Tính tổng dung lượng và sử dụng của tất cả storage (phải gọi trước early return)
  const totalStorage = useMemo(() => {
    if (!storageArray || storageArray.length === 0) {
      return { total: 0, used: 0, free: 0, usedPercent: 0 };
    }
    const total = storageArray.reduce((sum, s) => sum + s.data.specs.totalCapacity, 0);
    const used = storageArray.reduce((sum, s) => sum + s.data.usedGB, 0);
    return {
      total,
      used,
      free: total - used,
      usedPercent: total > 0 ? (used / total) * 100 : 0,
    };
  }, [storageArray]);

  // Các hooks phụ thuộc vào data phải được gọi với giá trị mặc định để đảm bảo số lượng hooks nhất quán
  const selectedModel = storageArray.length > 0 ? storageArray[selectedStorageIndex] : null;
  const data = selectedModel?.data;

  // Detect PCIe Gen from interface string (luôn gọi với giá trị mặc định)
  const pcieGen = useMemo(() => {
    if (!data?.specs) return null;
    if (data.specs.pcieGen) return data.specs.pcieGen;
    const interfaceLower = data.specs.interface.toLowerCase();
    if (interfaceLower.includes('gen5') || interfaceLower.includes('pcie 5')) return 'Gen5';
    if (interfaceLower.includes('gen4') || interfaceLower.includes('pcie 4')) return 'Gen4';
    if (interfaceLower.includes('gen3') || interfaceLower.includes('pcie 3')) return 'Gen3';
    return null;
  }, [data?.specs]);

  // Format interface display (luôn gọi với giá trị mặc định)
  const interfaceDisplay = useMemo(() => {
    if (!data?.specs) return '';
    const parts: string[] = [data.specs.type];
    if (pcieGen) parts.push(`PCIe ${pcieGen}`);
    else if (data.specs.interface) parts.push(data.specs.interface);
    return parts.join(' - ');
  }, [data?.specs, pcieGen]);

  // Contextual warnings and notes (luôn gọi với giá trị mặc định)
  const smartWarning = useMemo(() => {
    if (!data) return [];
    const { smart, usedPercent } = data;
    const warnings: string[] = [];

    if (smart.status === 'Bad' || smart.healthPercent < 60) {
      warnings.push('SMART trạng thái xấu. Nên sao lưu dữ liệu ngay và cân nhắc thay ổ cứng.');
    } else if (smart.status === 'Warning' || smart.healthPercent < 80) {
      warnings.push('SMART có cảnh báo. Nên theo dõi và chuẩn bị sao lưu dữ liệu.');
    }

    if (smart.reallocatedSectors > 0 || (smart.pendingSectors && smart.pendingSectors > 0)) {
      warnings.push(`Có ${smart.reallocatedSectors} sector đã được tái phân bổ${smart.pendingSectors ? ` và ${smart.pendingSectors} sector đang chờ` : ''}.`);
    }

    if (smart.mediaErrors > 0) {
      warnings.push(`Phát hiện ${smart.mediaErrors} lỗi media.`);
    }

    if (usedPercent > 90) {
      warnings.push('Dung lượng đĩa gần đầy (>90%). Nên giải phóng không gian.');
    } else if (usedPercent > 80) {
      warnings.push('Khuyến nghị giữ ít nhất 20% dung lượng trống để đảm bảo hiệu suất tốt.');
    }

    return warnings;
  }, [data]);

  // Calculate baseline performance percentage (luôn gọi với giá trị mặc định)
  const readPerformancePercent = useMemo(() => {
    if (!data?.performance?.baselineRead) return null;
    return Math.round((data.performance.currentRead / data.performance.baselineRead) * 100);
  }, [data?.performance]);

  const writePerformancePercent = useMemo(() => {
    if (!data?.performance?.baselineWrite) return null;
    return Math.round((data.performance.currentWrite / data.performance.baselineWrite) * 100);
  }, [data?.performance]);

  // Early return nếu không có storage (sau khi đã gọi tất cả hooks)
  if (loading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Storage Detail" breadcrumbs={[{ label: 'Tổng quan', path: '/overview' }, { label: 'Storage' }]} />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Đang tải dữ liệu Storage...
        </div>
      </div>
    );
  }

  if (error || storageArray.length === 0 || !selectedModel || !data) {
    return (
      <div className={styles.page}>
        <PageHeader title="Storage Detail" breadcrumbs={[{ label: 'Tổng quan', path: '/overview' }, { label: 'Storage' }]} />
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          {error ? `Lỗi: ${error.message}` : 'Không tìm thấy Storage'}
        </div>
      </div>
    );
  }

  const chartData = mergeTimeSeriesForChart([
    { key: 'read', points: selectedModel.getHistory('read') },
    { key: 'write', points: selectedModel.getHistory('write') },
  ]);

  const partitionColumns = [
    { key: 'letter', header: 'Drive', width: '60px' },
    { key: 'label', header: 'Label' },
    { key: 'fileSystem', header: 'FS', width: '60px', align: 'center' as const },
    {
      key: 'usedPercent',
      header: 'Usage',
      render: (_: unknown, row: Partition) => (
        <ProgressBar value={row.usedPercent} color="auto" size="sm" />
      )
    },
    { key: 'usedGB', header: 'Used', align: 'right' as const, render: (v: unknown) => `${v} GB` },
    { key: 'totalGB', header: 'Total', align: 'right' as const, render: (v: unknown) => `${v} GB` },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Storage Detail"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'Storage' },
        ]}
        status={selectedModel.getStatus()}
        statusLabel={`${storageArray.length} device(s)`}
      />

      <div className={styles.grid}>
        {/* Overview Card */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<HardDrive size={18} />}>Disk Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.storageMain}>
              <div className={styles.storageCircle}>
                <svg viewBox="0 0 100 100" className={styles.storageSvg}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(31,41,55,0.8)" strokeWidth="10" />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="var(--accent-cyan)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - data.usedPercent / 100)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className={styles.storageCenter}>
                  <span className={styles.storagePercent}>{data.usedPercent}%</span>
                  <span className={styles.storageLabel}>Used</span>
                </div>
              </div>
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Used</span>
                <span className={styles.quickValue}>{data.usedGB} GB</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Free</span>
                <span className={styles.quickValue}>{data.freeGB} GB</span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Total</span>
                <span className={styles.quickValue}>{data.specs.totalCapacity} GB</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Partitions Overview */}
        <div className={styles.gridCol2}>
          <Card className={styles.tableCard}>
            <CardHeader>
              <CardTitle>Tất cả Partitions ({allPartitions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table<Partition & Record<string, unknown>>
                columns={partitionColumns}
                data={allPartitions as (Partition & Record<string, unknown>)[]}
                keyExtractor={(row) => `${row.letter}-${row.label}`}
              />

              {allPartitions.some(p => p.usedPercent > 80) && (
                <div className={`${styles.contextualNote} ${styles.contextualNoteWithMargin}`}>
                  <strong>
                    <Info size={14} className={styles.iconInline} />
                    Khuyến nghị:
                  </strong>
                  {' '}Một số partition đang gần đầy (&#62;80%). Nên giải phóng không gian để đảm bảo hiệu suất tốt.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Drive Info & Specs */}
        <div className={styles.gridCol3}>
          <Card className={styles.specsCard}>
            <CardHeader>
              <CardTitle>Drive Info & Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <SpecList>
                <SpecRow label="Model (Full Code)" value={data.specs.model} />
                <SpecRow label="Name" value={data.specs.name} />
                <SpecRow label="Type" value={interfaceDisplay} />
                {data.smart.temperature !== undefined && (
                  <SpecRow
                    label="Temperature"
                    value={
                      <span className={styles.iconInline}>
                        <Thermometer size={14} />
                        {data.smart.temperature}°C
                      </span>
                    }
                  />
                )}
                <SpecRow label="Total Capacity" value={`${data.specs.totalCapacity} GB`} />
              </SpecList>
            </CardContent>
          </Card>
        </div>

        {/* I/O Chart */}
        <div className={`${styles.gridCol1_3}`}>
          <Card className={styles.chartCard}>
            <CardHeader>
              <CardTitle icon={<Activity size={18} />}>Disk I/O Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.ioStats}>
                <div className={styles.ioStat}>
                  <span className={styles.ioLabel}>Read (Current)</span>
                  <span className={styles.ioValue}>{data.performance.currentRead} MB/s</span>
                  {data.performance.baselineRead && (
                    <span className={styles.baselineInfo}>
                      Baseline: {data.performance.baselineRead} MB/s
                      {readPerformancePercent !== null && ` (${readPerformancePercent}%)`}
                    </span>
                  )}
                </div>
                <div className={styles.ioStat}>
                  <span className={styles.ioLabel}>Write (Current)</span>
                  <span className={styles.ioValue}>{data.performance.currentWrite} MB/s</span>
                  {data.performance.baselineWrite && (
                    <span className={styles.baselineInfo}>
                      Baseline: {data.performance.baselineWrite} MB/s
                      {writePerformancePercent !== null && ` (${writePerformancePercent}%)`}
                    </span>
                  )}
                </div>
              </div>
              {data.performance.baselineRead && (
                <div className={styles.peakInfo}>
                  <span>Peak: {data.performance.peakRead} / {data.performance.peakWrite} MB/s</span>
                </div>
              )}
              <AreaChart
                data={chartData}
                series={[
                  { dataKey: 'read', name: 'Read MB/s', color: '#4ade80' },
                  { dataKey: 'write', name: 'Write MB/s', color: '#fb7185' },
                ]}
                height={160}
                showLegend
                yAxisDomain={[0, Math.max(500, data.performance.baselineRead || data.performance.peakRead || 500)]}
              />
            </CardContent>
          </Card>
        </div>

        {/* SMART Highlights */}
        <div className={styles.gridCol3}>
          <Card className={styles.specsCard}>
            <CardHeader>
              <CardTitle>SMART Highlights</CardTitle>
              <Badge variant={data.smart.status === 'Good' ? 'success' : data.smart.status === 'Warning' ? 'warning' : 'danger'}>
                {data.smart.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <SpecList>
                <SpecRow label="Health" value={`${data.smart.healthPercent}%`} />
                <SpecRow label="Power On Hours" value={`${data.smart.powerOnHours.toLocaleString()} hrs`} />
                <SpecRow label="TBW / Total Written" value={`${data.smart.totalBytesWritten} TB`} />
                <SpecRow
                  label="Reallocated Sectors"
                  value={
                    <span className={data.smart.reallocatedSectors > 0 ? styles.statusDanger : ''}>
                      {data.smart.reallocatedSectors}
                    </span>
                  }
                />
                {data.smart.pendingSectors !== undefined && (
                  <SpecRow
                    label="Pending Sectors"
                    value={
                      <span className={data.smart.pendingSectors > 0 ? styles.statusDanger : ''}>
                        {data.smart.pendingSectors}
                      </span>
                    }
                  />
                )}
                <SpecRow
                  label="Media Errors"
                  value={
                    <span className={data.smart.mediaErrors > 0 ? styles.statusDanger : ''}>
                      {data.smart.mediaErrors}
                    </span>
                  }
                />
                <SpecRow label="Power Cycles" value={data.smart.powerCycles.toLocaleString()} />
              </SpecList>

              {smartWarning.length > 0 && (
                <div className={`${styles.contextualNote} ${styles.contextualNoteWithMargin} ${data.smart.status === 'Bad' ? styles.contextualNoteBorderDanger : styles.contextualNoteBorderWarning}`}>
                  <strong>
                    <AlertTriangle size={14} className={styles.iconInline} />
                    Cảnh báo:
                  </strong>
                  <ul className={styles.noteList}>
                    {smartWarning.map((warning, idx) => (
                      <li key={idx} className={styles.noteListItem}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};


