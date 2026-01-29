// ============================================================================
// SPARKLINE COMPONENT - Small trend indicator
// ============================================================================

import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { TimeSeriesPoint } from '../../types';
import styles from './Chart.module.css';

interface SparklineProps {
  data: TimeSeriesPoint[];
  height?: number;
  color?: string;
  showTrend?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  height = 30,
  color = '#37d0ff',
  showTrend = true,
  className,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={className} style={{ height, display: 'flex', alignItems: 'center', color: '#666' }}>
        <span style={{ fontSize: '11px' }}>Không có dữ liệu</span>
      </div>
    );
  }

  // Get trend direction (last 30s/2m = last 6-12 points)
  const recentPoints = data.slice(-12);
  const trend = recentPoints.length >= 2
    ? recentPoints[recentPoints.length - 1].value - recentPoints[0].value
    : 0;

  const chartData = data.map((point, index) => ({
    index,
    value: point.value,
  }));

  return (
    <div className={className} style={{ position: 'relative', height }}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {showTrend && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '10px',
            color: trend > 0 ? '#ef4444' : trend < 0 ? '#4ade80' : '#9ca3af',
            fontWeight: 600,
          }}
        >
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
        </div>
      )}
    </div>
  );
};

