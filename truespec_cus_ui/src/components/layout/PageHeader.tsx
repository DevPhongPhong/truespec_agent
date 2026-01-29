// ============================================================================
// PAGE HEADER COMPONENT - Breadcrumbs, page title, status & quick actions
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Scan,
  FileText,
  Leaf,
  Zap
} from 'lucide-react';
import { StatusPill, Button } from '../common';
import { StatusLevel } from '../../types';
import styles from './PageHeader.module.css';

interface Breadcrumb {
  label: string;
  path?: string;
}

interface TopIssue {
  label: string;
  severity: StatusLevel;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  status?: StatusLevel;
  statusLabel?: string;
  action?: React.ReactNode;
  // New props
  uptime?: string;
  lastUpdate?: string;
  topIssues?: TopIssue[];
  showQuickActions?: boolean;
  onQuickScan?: () => void;
  onExportReport?: () => void;
  onEcoMode?: () => void;
  onPerformanceMode?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  status,
  statusLabel,
  action,
  uptime,
  lastUpdate,
  topIssues,
  showQuickActions = false,
  onQuickScan,
  onExportReport,
  onEcoMode,
  onPerformanceMode,
}) => {
  return (
    <div className={styles.header}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {crumb.path ? (
                <Link to={crumb.path} className={styles.crumbLink}>
                  {crumb.label}
                </Link>
              ) : (
                <span className={styles.crumbCurrent}>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && (
                <ChevronRight size={14} className={styles.crumbSep} />
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title Row */}
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{title}</h1>
          {status && statusLabel && (
            <StatusPill status={status}>{statusLabel}</StatusPill>
          )}
        </div>
        {action && <div className={styles.action}>{action}</div>}
      </div>

      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}

      {/* Info Bar: Uptime, Last Update, Top Issues */}
      {(uptime || lastUpdate || (topIssues && topIssues.length > 0)) && (
        <div className={styles.infoBar}>
          {/* Uptime & Last Update */}
          <div className={styles.timeInfo}>
            {uptime && (
              <div className={styles.timeItem}>
                <Clock size={14} className={styles.timeIcon} />
                <span>Đã chạy liên tục {uptime}</span>
              </div>
            )}
            {lastUpdate && (
              <div className={styles.timeItem}>
                <RefreshCw size={14} className={styles.timeIcon} />
                <span>Cập nhật lần cuối {lastUpdate}</span>
              </div>
            )}
          </div>

          {/* Top Issues Today */}
          {topIssues && topIssues.length > 0 && (
            <div className={styles.issuesRow}>
              <div className={styles.issuesLabel}>
                <AlertTriangle size={14} />
                <span>Cần chú ý:</span>
              </div>
              <div className={styles.issuesList}>
                {topIssues.map((issue, idx) => (
                  <span 
                    key={idx} 
                    className={`${styles.issueChip} ${styles[`issue-${issue.severity}`]}`}
                  >
                    {issue.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && (
        <div className={styles.quickActions}>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Scan size={15} />}
            onClick={onQuickScan}
          >
            Quét nhanh
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<FileText size={15} />}
            onClick={onExportReport}
          >
            Xuất báo cáo
          </Button>
          <div className={styles.actionDivider} />
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Leaf size={15} />}
            onClick={onEcoMode}
            className={styles.ecoBtn}
          >
            Tiết kiệm
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            icon={<Zap size={15} />}
            onClick={onPerformanceMode}
            className={styles.perfBtn}
          >
            Hiệu năng
          </Button>
        </div>
      )}
    </div>
  );
};
