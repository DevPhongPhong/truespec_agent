// ============================================================================
// AREA CHART COMPONENT - Using Recharts library
// ============================================================================

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TimeSeriesPoint } from '../../types';
import styles from './Chart.module.css';

interface ChartSeries {
  dataKey: string;
  name: string;
  color: string;
  fillOpacity?: number;
}

interface AreaChartProps {
  data: Record<string, unknown>[];
  series: ChartSeries[];
  height?: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  yAxisDomain?: [number, number];
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  series,
  height = 200,
  showXAxis = false,
  showYAxis = true,
  showGrid = true,
  showLegend = false,
  yAxisDomain,
  className,
}) => {
  return (
    <div className={className} style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <RechartsAreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(74, 163, 255, 0.1)"
              vertical={false}
            />
          )}
          {showXAxis && (
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: 'rgba(233, 241, 255, 0.5)' }}
              axisLine={{ stroke: 'rgba(74, 163, 255, 0.15)' }}
              tickLine={false}
            />
          )}
          {showYAxis && (
            <YAxis
              domain={yAxisDomain || [0, 100]}
              tick={{ fontSize: 10, fill: 'rgba(233, 241, 255, 0.5)' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              iconType="square"
            />
          )}
          {series.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? 0.15}
              strokeWidth={2}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}> = ({ active, payload }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className={styles.tooltip}>
      {payload.map((entry, index) => (
        <div key={index} className={styles.tooltipItem}>
          <span
            className={styles.tooltipDot}
            style={{ backgroundColor: entry.color }}
          />
          <span className={styles.tooltipLabel}>{entry.name}:</span>
          <span className={styles.tooltipValue}>{entry.value.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

// Helper to convert TimeSeriesPoint[] to chart data
export function formatTimeSeriesForChart(
  points: TimeSeriesPoint[],
  label: string
): Record<string, unknown>[] {
  return points.map((p, i) => ({
    time: i,
    [label]: p.value,
  }));
}

// Merge multiple series into single data array
export function mergeTimeSeriesForChart(
  seriesData: { key: string; points: TimeSeriesPoint[] }[]
): Record<string, unknown>[] {
  const maxLength = Math.max(...seriesData.map(s => s.points.length));
  const result: Record<string, unknown>[] = [];

  for (let i = 0; i < maxLength; i++) {
    const entry: Record<string, unknown> = { time: i };
    seriesData.forEach(({ key, points }) => {
      entry[key] = points[i]?.value ?? 0;
    });
    result.push(entry);
  }

  return result;
}

