// ============================================================================
// GAUGE COMPONENT - Circular gauge for metrics display
// ============================================================================

import React, { useMemo } from 'react';
import clsx from 'clsx';
import styles from './Gauge.module.css';

interface GaugeProps {
  value: number;
  max?: number;
  label?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'green' | 'yellow' | 'red' | 'auto';
  showValue?: boolean;
  className?: string;
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  max = 100,
  label,
  unit = '%',
  size = 'md',
  color = 'default',
  showValue = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const actualColor = useMemo(() => {
    if (color !== 'auto') return color;
    if (percentage > 85) return 'red';
    if (percentage > 70) return 'yellow';
    return 'green';
  }, [color, percentage]);

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={clsx(styles.gaugeWrapper, styles[`size-${size}`], className)}>
      <svg className={styles.gauge} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          className={styles.backgroundCircle}
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          className={clsx(styles.progressCircle, styles[`color-${actualColor}`])}
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      
      <div className={styles.gaugeInner}>
        {showValue && (
          <>
            <span className={styles.gaugeValue}>
              {Math.round(value)}{unit}
            </span>
            {label && <span className={styles.gaugeLabel}>{label}</span>}
          </>
        )}
      </div>
    </div>
  );
};

// Linear Gauge / Progress Bar
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'default' | 'green' | 'yellow' | 'red' | 'auto' | 'gradient';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'default',
  size = 'md',
  showLabel = false,
  label,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const actualColor = useMemo(() => {
    if (color !== 'auto') return color;
    if (percentage > 85) return 'red';
    if (percentage > 70) return 'yellow';
    return 'green';
  }, [color, percentage]);

  return (
    <div className={clsx(styles.progressWrapper, className)}>
      {showLabel && (
        <div className={styles.progressLabel}>
          <span>{label || 'Usage'}</span>
          <span className={styles.progressValue}>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={clsx(styles.progressBar, styles[`barSize-${size}`])}>
        <div
          className={clsx(styles.progressFill, styles[`barColor-${actualColor}`])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

