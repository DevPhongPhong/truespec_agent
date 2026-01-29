// ============================================================================
// FAN PAGE - Fan control and monitoring
// ============================================================================

import React, { useState, useMemo } from 'react';
import { Fan as FanIcon, Thermometer, Settings, AlertTriangle, Zap, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Table, Button, Badge } from '../components/common';
import { AreaChart, mergeTimeSeriesForChart } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useFan, useMonitor } from '../hooks';
import { Fan } from '../types';
import styles from './DetailPage.module.css';
import fanStyles from './FanPage.module.css';

export const FanPage: React.FC = () => {
  const { data, model } = useFan();
  const { cpu, gpu } = useMonitor();
  const [selectedPreset, setSelectedPreset] = useState<'quiet' | 'balanced' | 'performance'>('balanced');
  const [controlMode, setControlMode] = useState<'auto' | 'boost' | 'custom'>('auto');
  const [customPwm, setCustomPwm] = useState(50);

  const selectedFan = model.getSelectedFan();
  const fanType = selectedFan ? model.getFanType(selectedFan.id) : 'Other';
  const rpmStats = selectedFan ? model.getRpmStats(selectedFan.id) : null;

  // Get temperature based on fan's temp source
  const currentTemp = useMemo(() => {
    if (!selectedFan) return undefined;
    const source = selectedFan.tempSource.toLowerCase();
    if (source.includes('cpu')) return cpu.data.temperature;
    if (source.includes('gpu')) return gpu.data.temperature;
    return undefined;
  }, [selectedFan, cpu.data.temperature, gpu.data.temperature]);

  const anomaly = selectedFan ? model.detectAnomaly(selectedFan.id, currentTemp) : null;

  const chartData = mergeTimeSeriesForChart([
    { key: 'rpm', points: model.getHistory('rpm') },
    { key: 'pwm', points: model.getHistory('pwm') },
  ]);

  // Enhanced fan columns with type and sensor mapping
  const fanColumns = [
    { 
      key: 'status', 
      header: '', 
      width: '30px',
      render: (_: unknown, row: Fan) => (
        <span className={fanStyles.statusDot} data-status={row.status} />
      )
    },
    { 
      key: 'type', 
      header: 'Loại',
      width: '80px',
      render: (_: unknown, row: Fan) => {
        const type = model.getFanType(row.id);
        const typeLabels: Record<string, string> = {
          'CPU': 'CPU',
          'GPU': 'GPU',
          'Case': 'Case',
          'Other': 'Khác',
        };
        return <Badge variant="default">{typeLabels[type]}</Badge>;
      }
    },
    { key: 'name', header: 'Fan' },
    { 
      key: 'rpm', 
      header: 'RPM', 
      align: 'center' as const, 
      render: (v: unknown) => `${v}` 
    },
    { 
      key: 'pwm', 
      header: 'PWM', 
      align: 'center' as const, 
      render: (v: unknown) => `${v}%` 
    },
    { 
      key: 'mode', 
      header: 'Mode', 
      align: 'center' as const,
      render: (v: unknown) => {
        const mode = v as string;
        return mode === 'AUTO' ? 'Tự động' : 'Thủ công';
      }
    },
    { 
      key: 'tempSource', 
      header: 'Sensor', 
      align: 'right' as const,
      render: (v: unknown) => {
        const source = v as string;
        return <span className={fanStyles.sensorLabel}>{source}</span>;
      }
    },
  ];

  const handlePresetChange = (preset: 'quiet' | 'balanced' | 'performance') => {
    setSelectedPreset(preset);
    model.applyPreset(preset);
  };

  const handleControlModeChange = (mode: 'auto' | 'boost' | 'custom') => {
    setControlMode(mode);
    if (selectedFan) {
      model.setFanControlMode(selectedFan.id, mode);
      if (mode === 'custom') {
        model.setFanPWM(selectedFan.id, customPwm);
      }
    }
  };

  const handleCustomPwmChange = (value: number) => {
    setCustomPwm(value);
    if (selectedFan && controlMode === 'custom') {
      model.setFanPWM(selectedFan.id, value);
    }
  };

  // Contextual note based on fan status and anomaly
  const contextualNote = useMemo(() => {
    if (!selectedFan) return '';
    
    const reasons: string[] = [];
    
    // Check for high RPM
    if (selectedFan.rpm > selectedFan.maxRpm * 0.8) {
      if (currentTemp && currentTemp > 75) {
        reasons.push(`Quạt chạy nhanh (${selectedFan.rpm} RPM) do nhiệt độ cao (${currentTemp}°C)`);
      } else {
        reasons.push(`Quạt chạy nhanh (${selectedFan.rpm} RPM) do tải hệ thống cao`);
      }
    }

    // Check for anomaly
    if (anomaly && anomaly.type !== 'none') {
      reasons.push(`⚠️ ${anomaly.message}`);
    }

    // Recommendations
    if (selectedFan.pwm > 80 && selectedFan.rpm > selectedFan.maxRpm * 0.7) {
      reasons.push(`Nếu tiếng ồn kéo dài, nên kiểm tra hệ thống làm mát hoặc giảm tải`);
    }

    if (reasons.length === 0) {
      return 'Quạt hoạt động bình thường. Không có vấn đề cần chú ý.';
    }

    return reasons.join('. ') + '.';
  }, [selectedFan, currentTemp, anomaly]);

  return (
    <div className={styles.page}>
      <PageHeader
        title="Fan Control"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'Fan' },
        ]}
        status={model.getOverallStatus()}
        statusLabel={model.getStatusLabel()}
      />

      <div className={styles.grid}>
        {/* Fan Status Card - Enhanced */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<FanIcon size={18} />}>Fan Status</CardTitle>
            <Badge variant={model.getOverallStatus() === 'ok' ? 'success' : 'warning'}>
              {data.provider}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={fanStyles.fanOverview}>
              <div className={fanStyles.fanIcon}>
                <FanIcon size={64} className={fanStyles.spinningFan} />
              </div>
              <div className={fanStyles.fanInfo}>
                <div className={fanStyles.fanHeader}>
                  <span className={fanStyles.fanName}>{selectedFan?.name || 'No Fan Selected'}</span>
                  <Badge variant="default" className={fanStyles.fanTypeBadge}>
                    {fanType}
                  </Badge>
                </div>
                <span className={fanStyles.fanRpm}>{selectedFan?.rpm || 0} RPM</span>
                <span className={fanStyles.fanPwm}>PWM: {selectedFan?.pwm || 0}%</span>
                
                {/* Sensor Mapping */}
                {selectedFan && (
                  <div className={fanStyles.sensorMapping}>
                    <Thermometer size={12} />
                    <span>Sensor: {selectedFan.tempSource}</span>
                    {currentTemp !== undefined && (
                      <span className={fanStyles.tempValue}>{currentTemp}°C</span>
                    )}
                  </div>
                )}

                {/* RPM Stats */}
                {rpmStats && (
                  <div className={fanStyles.rpmStats}>
                    <div className={fanStyles.rpmStatItem}>
                      <span className={fanStyles.rpmStatLabel}>Min</span>
                      <span className={fanStyles.rpmStatValue}>{rpmStats.min}</span>
                    </div>
                    <div className={fanStyles.rpmStatItem}>
                      <span className={fanStyles.rpmStatLabel}>Max</span>
                      <span className={fanStyles.rpmStatValue}>{rpmStats.max}</span>
                    </div>
                    <div className={fanStyles.rpmStatItem}>
                      <span className={fanStyles.rpmStatLabel}>Avg</span>
                      <span className={fanStyles.rpmStatValue}>{rpmStats.avg}</span>
                    </div>
                    <div className={fanStyles.rpmStatWindow}>
                      ({rpmStats.windowMinutes} phút)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Anomaly Warning */}
            {anomaly && anomaly.type !== 'none' && (
              <div className={fanStyles.anomalyWarning} data-severity={anomaly.severity}>
                <AlertTriangle size={16} />
                <span>{anomaly.message}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Card */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle>Selected Fan History</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={chartData}
              series={[
                { dataKey: 'rpm', name: 'RPM', color: '#37d0ff' },
                { dataKey: 'pwm', name: 'PWM %', color: '#fbbf24' },
              ]}
              height={180}
              showLegend
              yAxisDomain={[0, selectedFan?.maxRpm || 2500]}
            />
          </CardContent>
        </Card>

        {/* Control Card - Enhanced */}
        <Card className={styles.specsCard}>
          <CardHeader>
            <CardTitle icon={<Settings size={18} />}>Fan Control</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Action Buttons */}
            <div className={fanStyles.actionButtons}>
              <h4 className={fanStyles.presetsTitle}>Chế độ điều khiển</h4>
              <div className={fanStyles.presetButtons}>
                <Button
                  variant={controlMode === 'auto' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleControlModeChange('auto')}
                  icon={<RotateCcw size={14} />}
                >
                  Tự động
                </Button>
                <Button
                  variant={controlMode === 'boost' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleControlModeChange('boost')}
                  icon={<Zap size={14} />}
                >
                  Boost
                </Button>
                <Button
                  variant={controlMode === 'custom' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleControlModeChange('custom')}
                  icon={<Settings size={14} />}
                >
                  Custom
                </Button>
              </div>
            </div>

            {/* Custom PWM Slider */}
            {controlMode === 'custom' && selectedFan && (
              <div className={fanStyles.customSlider}>
                <label className={fanStyles.sliderLabel}>
                  PWM Duty: {customPwm}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={customPwm}
                  onChange={(e) => handleCustomPwmChange(Number(e.target.value))}
                  className={fanStyles.slider}
                />
                <div className={fanStyles.sliderLabels}>
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>
            )}

            {/* Curve Presets */}
            <div className={fanStyles.presets}>
              <h4 className={fanStyles.presetsTitle}>Fan Curve Presets</h4>
              <div className={fanStyles.presetButtons}>
                <Button
                  variant={selectedPreset === 'quiet' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handlePresetChange('quiet')}
                >
                  🤫 Silent
                </Button>
                <Button
                  variant={selectedPreset === 'balanced' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handlePresetChange('balanced')}
                >
                  ⚖️ Balanced
                </Button>
                <Button
                  variant={selectedPreset === 'performance' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handlePresetChange('performance')}
                >
                  🚀 Performance
                </Button>
              </div>
            </div>

            {/* Curve Preview with % duty */}
            <div className={fanStyles.curvePreview}>
              <h4 className={fanStyles.presetsTitle}>Fan Curve</h4>
              <div className={fanStyles.curvePoints}>
                {data.curve.map((point, i) => (
                  <div key={i} className={fanStyles.curvePoint}>
                    <span className={fanStyles.curveTemp}>{point.temperature}°C</span>
                    <div className={fanStyles.curveBar}>
                      <div 
                        className={fanStyles.curveFill} 
                        style={{ height: `${point.pwmDuty}%` }}
                      />
                    </div>
                    <span className={fanStyles.curvePwm}>{point.pwmDuty}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fan Table */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <CardTitle>All Fans</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<Fan & Record<string, unknown>>
              columns={fanColumns}
              data={data.fans as (Fan & Record<string, unknown>)[]}
              keyExtractor={(row) => row.id as string}
              onRowClick={(row) => model.selectFan(row.id as string)}
              selectedKey={data.selectedFanId}
            />
          </CardContent>
        </Card>

        {/* Contextual Note Card */}
        {contextualNote && (
          <Card className={styles.contextualNoteCard}>
            <CardContent>
              <div className={styles.contextualNote}>
                <strong>Ghi chú:</strong> {contextualNote}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
