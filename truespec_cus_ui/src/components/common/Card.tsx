// ============================================================================
// CARD COMPONENT - Reusable card with glass effect
// ============================================================================

import React from 'react';
import clsx from 'clsx';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

interface CardTitleProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
}) => {
  return (
    <div
      className={clsx(
        styles.card,
        styles[`variant-${variant}`],
        styles[`padding-${padding}`],
        hoverable && styles.hoverable,
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.glowOverlay} />
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className,
  action,
}) => {
  return (
    <header className={clsx(styles.cardHeader, className)}>
      <div className={styles.headerContent}>{children}</div>
      {action && <div className={styles.headerAction}>{action}</div>}
    </header>
  );
};

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  icon,
  subtitle,
}) => {
  return (
    <div className={styles.titleWrapper}>
      <h3 className={styles.cardTitle}>
        {icon && <span className={styles.titleIcon}>{icon}</span>}
        {children}
      </h3>
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <div className={clsx(styles.cardContent, className)}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => {
  return <footer className={clsx(styles.cardFooter, className)}>{children}</footer>;
};

