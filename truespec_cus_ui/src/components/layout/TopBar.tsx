// ============================================================================
// TOP BAR COMPONENT - Main navigation header
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RefreshCw, Moon, Sun, Settings, Bell, User } from 'lucide-react';
import clsx from 'clsx';
import { IconButton } from '../common';
import { useTheme, useMonitor } from '../../hooks';
import styles from './TopBar.module.css';

interface NavItem {
  path: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/overview', label: 'Tổng quan' },
  { path: '/cpu', label: 'CPU' },
  { path: '/gpu', label: 'GPU' },
  { path: '/ram', label: 'RAM' },
  { path: '/storage', label: 'Storage' },
  { path: '/network', label: 'Network' },
  { path: '/battery', label: 'Battery' },
  { path: '/fan', label: 'Fan' },
];

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme, isDark } = useTheme();
  const { manualRefresh, systemStatus } = useMonitor();

  return (
    <header className={styles.topBar}>
      <div className={styles.brand}>
        <span className={styles.logo}>⚡</span>
        <span className={styles.brandText}>Luna Monitor</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={clsx(
              styles.navLink,
              location.pathname === item.path && styles.active
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className={styles.actions}>
        <div className={clsx(styles.statusBadge, styles[`status-${systemStatus.overall}`])}>
          <span className={styles.statusDot} />
          {systemStatus.label}
        </div>

        <IconButton
          icon={<RefreshCw size={16} />}
          label="Refresh"
          onClick={manualRefresh}
        />

        <IconButton
          icon={isDark ? <Sun size={16} /> : <Moon size={16} />}
          label={isDark ? 'Light mode' : 'Dark mode'}
          onClick={toggleTheme}
        />

        <IconButton
          icon={<Bell size={16} />}
          label="Notifications"
        />

        <Link to="/settings">
          <IconButton
            icon={<User size={16} />}
            label="Settings"
          />
        </Link>
      </div>
    </header>
  );
};

