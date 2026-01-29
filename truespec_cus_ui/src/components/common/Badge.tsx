// ============================================================================
// BADGE & CHIP COMPONENTS
// ============================================================================

import React from 'react';
import clsx from 'clsx';
import styles from './Badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
}) => {
  return (
    <span className={clsx(styles.badge, styles[`variant-${variant}`], styles[`size-${size}`], className)}>
      {children}
    </span>
  );
};

// Chip - for tags, filters, etc.
interface ChipProps {
  children: React.ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
  color?: 'default' | 'blue' | 'green' | 'yellow' | 'red';
  icon?: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

export const Chip: React.FC<ChipProps> = ({
  children,
  variant = 'default',
  color = 'default',
  icon,
  onRemove,
  className,
}) => {
  return (
    <span className={clsx(styles.chip, styles[`chipVariant-${variant}`], styles[`chipColor-${color}`], className)}>
      {icon && <span className={styles.chipIcon}>{icon}</span>}
      <span className={styles.chipText}>{children}</span>
      {onRemove && (
        <button className={styles.chipRemove} onClick={onRemove} aria-label="Remove">
          ×
        </button>
      )}
    </span>
  );
};

// Status Dot
interface StatusDotProps {
  status: 'online' | 'offline' | 'warning' | 'error';
  pulse?: boolean;
  size?: 'sm' | 'md';
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  pulse = false,
  size = 'md',
}) => {
  return (
    <span
      className={clsx(
        styles.statusDot,
        styles[`status-${status}`],
        styles[`dotSize-${size}`],
        pulse && styles.pulse
      )}
    />
  );
};

// Status Pill (badge + dot)
interface StatusPillProps {
  children: React.ReactNode;
  status?: 'ok' | 'warn' | 'danger';
  showDot?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  children,
  status = 'ok',
  showDot = true,
}) => {
  const dotStatus = status === 'ok' ? 'online' : status === 'warn' ? 'warning' : 'error';
  
  return (
    <span className={clsx(styles.statusPill, styles[`pillStatus-${status}`])}>
      {showDot && <StatusDot status={dotStatus} size="sm" pulse />}
      {children}
    </span>
  );
};

