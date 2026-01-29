// ============================================================================
// BATTERY PAGE - Battery monitoring
// ============================================================================

import React, { useMemo } from 'react';
import { Battery, Zap, Heart, Clock, Laptop, TrendingUp, TrendingDown, AlertTriangle, Info, Power } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Table, SpecList, SpecRow, Badge, ProgressBar } from '../components/common';
import { AreaChart, formatTimeSeriesForChart } from '../components/charts';
import { PageHeader } from '../components/layout';
import { useBattery } from '../hooks';
import { UsageScenario, BatteryDrainApp } from '../types';
import styles from './DetailPage.module.css';

export const BatteryPage: React.FC = () => {
  const { data, model } = useBattery();

  const chartData = formatTimeSeriesForChart(model.getHistory('level'), 'level');

  // Calculate degradation
  const degradationPercent = model.getDegradationPercent();
  const capacityRatio = data.health.designCapacity > 0 
    ? (data.health.fullChargeCapacity / data.health.designCapacity) * 100 
    : 0;

  // Charging/Discharging rate
  const currentRate = data.isPlugged ? model.getChargingRate() : model.getDischargingRate();
  const rateLabel = data.isPlugged ? 'Charging Rate' : 'Discharging Rate';
  const rateIcon = data.isPlugged ? <TrendingUp size={14} /> : <TrendingDown size={14} />;

  // Recommendations
  const recommendations = useMemo(() => {
    const recs: { type: 'info' | 'warning' | 'danger'; message: string }[] = [];
    
    // Battery health warnings
    if (data.health.healthPercent < 60) {
      recs.push({
        type: 'danger',
        message: `Pin đã chai nghiêm trọng (${data.health.healthPercent}%). Nên cân nhắc thay pin để đảm bảo hiệu suất.`,
      });
    } else if (data.health.healthPercent < 80) {
      recs.push({
        type: 'warning',
        message: `Pin đã chai ${degradationPercent.toFixed(1)}%. Nên theo dõi và chuẩn bị thay pin trong tương lai.`,
      });
    }

    // Charging recommendations
    if (data.isPlugged) {
      if (data.percent >= 80 && !data.chargingLimitEnabled) {
        recs.push({
          type: 'info',
          message: 'Pin đã trên 80%. Nên bật chế độ giới hạn sạc 80% để bảo vệ pin lâu dài.',
        });
      }
      if (data.percent >= 100) {
        recs.push({
          type: 'warning',
          message: 'Pin đã đầy. Nên rút sạc để tránh pin bị chai nhanh.',
        });
      }
    } else {
      // Discharging recommendations
      if (data.percent < 20) {
        recs.push({
          type: 'warning',
          message: 'Pin sắp hết. Nên cắm sạc sớm để tránh tắt máy đột ngột.',
        });
      }
      if (data.percent < 10) {
        recs.push({
          type: 'danger',
          message: 'Pin rất thấp! Nên cắm sạc ngay lập tức.',
        });
      }
      if (data.powerDraw > 20) {
        recs.push({
          type: 'info',
          message: `Mức tiêu thụ điện cao (${data.powerDraw.toFixed(1)}W). Kiểm tra các ứng dụng đang chạy để tiết kiệm pin.`,
        });
      }
    }

    // Cycle count warning
    if (data.health.cycleCount > 1000) {
      recs.push({
        type: 'warning',
        message: `Pin đã qua ${data.health.cycleCount} chu kỳ sạc. Tuổi thọ pin có thể giảm đáng kể.`,
      });
    }

    return recs;
  }, [data, degradationPercent]);

  const scenarioColumns = [
    { key: 'name', header: 'Scenario' },
    { key: 'estimatedDraw', header: 'Power Draw', align: 'center' as const, render: (v: unknown) => `${v} W` },
    { 
      key: 'estimatedRuntime', 
      header: 'Est. Runtime', 
      align: 'right' as const, 
      render: (v: unknown) => {
        const mins = v as number;
        const hrs = Math.floor(mins / 60);
        const m = mins % 60;
        return `${hrs}h ${m}m`;
      }
    },
  ];

  const drainAppColumns = [
    { key: 'name', header: 'Ứng dụng' },
    { 
      key: 'powerDraw', 
      header: 'Tiêu thụ', 
      align: 'right' as const, 
      render: (v: unknown) => `${(v as number).toFixed(1)} W`
    },
    { 
      key: 'percentage', 
      header: '%', 
      align: 'right' as const, 
      render: (v: unknown) => (
        <div className={styles.drainAppRow}>
          <div className={styles.drainAppProgress}>
            <ProgressBar 
              value={v as number} 
              color="auto" 
              size="sm"
            />
          </div>
          <span className={styles.drainAppPercent}>{(v as number).toFixed(1)}%</span>
        </div>
      )
    },
  ];

  return (
    <div className={styles.page}>
      <PageHeader
        title="Battery Detail"
        breadcrumbs={[
          { label: 'Tổng quan', path: '/overview' },
          { label: 'Battery' },
        ]}
        status={model.getStatus()}
        statusLabel={data.state}
      />

      <div className={styles.grid}>
        {/* Battery Status */}
        <Card className={styles.gaugeCard}>
          <CardHeader>
            <CardTitle icon={<Battery size={18} />}>Battery Status</CardTitle>
            <Badge variant={data.isPlugged ? 'info' : 'default'}>
              {data.isPlugged ? '⚡ Charging' : '🔋 Battery'}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={styles.batteryBig}>
              <div className={styles.batteryIcon}>
                <svg viewBox="0 0 100 100" className={styles.batterySvgBig}>
                  <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(31,41,55,0.8)" strokeWidth="8" />
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="44" 
                    fill="none" 
                    stroke={data.percent > 20 ? 'var(--accent-green)' : 'var(--accent-red)'} 
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 44}
                    strokeDashoffset={2 * Math.PI * 44 * (1 - data.percent / 100)}
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <span className={styles.batteryPercentBig}>{data.percent}%</span>
              </div>
            </div>
            <div className={styles.quickStats}>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>
                  {data.isPlugged ? 'Time to Full' : 'Time Remaining'}
                </span>
                <span className={styles.quickValue}>
                  {data.isPlugged 
                    ? (data.timeToFullChargeMinutes ? model.formatTimeToFullCharge() : 'N/A')
                    : model.formatTimeRemaining()}
                </span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>{rateLabel}</span>
                <span className={`${styles.quickValue} ${styles.rateValue}`}>
                  {rateIcon}
                  {currentRate.toFixed(1)} W
                </span>
              </div>
              <div className={styles.quickStat}>
                <span className={styles.quickLabel}>Power Mode</span>
                <span className={styles.quickValue}>{data.powerMode}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History Chart */}
        <Card className={styles.chartCard}>
          <CardHeader>
            <CardTitle icon={<Clock size={18} />}>Battery History</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaChart
              data={chartData}
              series={[
                { dataKey: 'level', name: 'Battery %', color: '#4ade80' },
              ]}
              height={180}
            />
          </CardContent>
        </Card>

        {/* Health Card */}
        <Card className={styles.specsCard}>
          <CardHeader>
            <CardTitle icon={<Heart size={18} />}>Battery Health</CardTitle>
            <Badge variant={model.getHealthStatus() === 'Good' ? 'success' : model.getHealthStatus() === 'Fair' ? 'warning' : 'danger'}>
              {model.getHealthStatus()}
            </Badge>
          </CardHeader>
          <CardContent>
            <SpecList>
              <SpecRow label="Health" value={`${data.health.healthPercent}%`} />
              <SpecRow label="Design Capacity" value={`${data.health.designCapacity} Wh`} />
              <SpecRow label="Full Charge Capacity" value={`${data.health.fullChargeCapacity} Wh`} />
              <SpecRow label="Cycle Count" value={data.health.cycleCount} />
              <SpecRow label="Wear Level" value={`${data.health.wearLevel}%`} />
              <SpecRow label="Last Full Charge" value={data.health.lastFullCharge} />
            </SpecList>
          </CardContent>
        </Card>

        {/* Battery Capacity Card */}
        <Card className={styles.specsCard}>
          <CardHeader>
            <CardTitle icon={<Laptop size={18} />}>Battery Capacity</CardTitle>
            <Badge variant={degradationPercent < 10 ? 'success' : degradationPercent < 20 ? 'warning' : 'danger'}>
              {degradationPercent.toFixed(1)}% chai
            </Badge>
          </CardHeader>
          <CardContent>
            <div className={styles.capacitySection}>
              <div className={styles.capacityHeader}>
                <span className={styles.capacityHeaderLabel}>Design Capacity</span>
                <span className={styles.capacityHeaderValue}>{data.health.designCapacity} Wh</span>
              </div>
              <div className={styles.capacityBar}>
                <ProgressBar 
                  value={100} 
                  color="auto" 
                  size="sm"
                />
              </div>
              
              <div className={styles.capacityHeader}>
                <span className={styles.capacityHeaderLabel}>Full Charge Capacity</span>
                <span className={styles.capacityHeaderValue}>{data.health.fullChargeCapacity} Wh</span>
              </div>
              <ProgressBar 
                value={capacityRatio} 
                color={capacityRatio > 90 ? 'green' : capacityRatio > 80 ? 'yellow' : 'red'} 
                size="sm"
              />
              
              <div className={styles.capacityFooter}>
                <div className={styles.capacityFooterRow}>
                  <span>Cycle Count:</span>
                  <span className={styles.capacityFooterValue}>{data.health.cycleCount}</span>
                </div>
                <div className={styles.capacityFooterRow}>
                  <span>Wear Level:</span>
                  <span className={styles.capacityFooterValue}>{data.health.wearLevel}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charging Limit Card */}
        {data.chargingLimitSupported && (
          <Card className={styles.specsCard}>
            <CardHeader>
              <CardTitle icon={<Power size={18} />}>Charging Limit</CardTitle>
              <Badge variant={data.chargingLimitEnabled ? 'success' : 'default'}>
                {data.chargingLimitEnabled ? 'Bật (80%)' : 'Tắt'}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className={styles.chargingLimitSection}>
                <p className={styles.chargingLimitText}>
                  Giới hạn sạc ở mức 80% giúp bảo vệ pin và kéo dài tuổi thọ pin.
                </p>
              </div>
              <div 
                className={styles.chargingLimitToggle}
                onClick={() => model.toggleChargingLimit()}
              >
                <span className={styles.chargingLimitToggleText}>Bật giới hạn sạc 80%</span>
                <div className={`${styles.chargingLimitSwitch} ${data.chargingLimitEnabled ? styles.chargingLimitSwitchActive : ''}`}>
                  <div className={`${styles.chargingLimitSwitchThumb} ${data.chargingLimitEnabled ? styles.chargingLimitSwitchThumbActive : ''}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Battery Drain Apps */}
        {data.topDrainApps && data.topDrainApps.length > 0 && (
          <Card className={styles.tableCard}>
            <CardHeader>
              <CardTitle icon={<Zap size={18} />}>Ứng dụng ngốn pin</CardTitle>
            </CardHeader>
            <CardContent>
              <Table<BatteryDrainApp & Record<string, unknown>>
                columns={drainAppColumns}
                data={data.topDrainApps as (BatteryDrainApp & Record<string, unknown>)[]}
                keyExtractor={(row) => row.name as string}
                compact
              />
            </CardContent>
          </Card>
        )}

        {/* Usage Profile */}
        <Card className={styles.tableCard}>
          <CardHeader>
            <CardTitle icon={<Zap size={18} />}>Usage Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Table<UsageScenario & Record<string, unknown>>
              columns={scenarioColumns}
              data={data.scenarios as (UsageScenario & Record<string, unknown>)[]}
              keyExtractor={(row) => row.name as string}
            />
          </CardContent>
        </Card>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card className={styles.contextualNoteCard}>
            <CardHeader>
              <CardTitle icon={<AlertTriangle size={18} />}>Khuyến nghị</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={styles.recommendationsList}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`${styles.contextualNote} ${styles.recommendationItem} ${
                      rec.type === 'danger' ? styles.contextualNoteBorderDanger : 
                      rec.type === 'warning' ? styles.contextualNoteBorderWarning : 
                      styles.contextualNoteBorderInfo
                    }`}
                  >
                    {rec.type === 'danger' && <AlertTriangle size={16} className={`${styles.recommendationIcon} ${styles.recommendationIconDanger}`} />}
                    {rec.type === 'warning' && <AlertTriangle size={16} className={`${styles.recommendationIcon} ${styles.recommendationIconWarning}`} />}
                    {rec.type === 'info' && <Info size={16} className={`${styles.recommendationIcon} ${styles.recommendationIconInfo}`} />}
                    <span>{rec.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

