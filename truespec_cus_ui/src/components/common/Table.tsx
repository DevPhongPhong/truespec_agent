// ============================================================================
// TABLE COMPONENT - Reusable data table
// ============================================================================

import React from 'react';
import clsx from 'clsx';
import styles from './Table.module.css';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  selectedKey?: string;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedKey,
  emptyMessage = 'Không có dữ liệu',
  className,
  compact = false,
}: TableProps<T>) {
  return (
    <div className={clsx(styles.tableWrapper, className)}>
      <table className={clsx(styles.table, compact && styles.compact)}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={clsx(styles.th, col.align && styles[`align-${col.align}`])}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.emptyRow}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = keyExtractor(row, index);
              const isSelected = selectedKey === key;
              
              return (
                <tr
                  key={key}
                  className={clsx(
                    styles.tr,
                    onRowClick && styles.clickable,
                    isSelected && styles.selected
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx(styles.td, col.align && styles[`align-${col.align}`])}
                    >
                      {col.render
                        ? col.render(row[col.key], row, index)
                        : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

// Spec Row - for key-value display
interface SpecRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export const SpecRow: React.FC<SpecRowProps> = ({ label, value, className }) => {
  return (
    <div className={clsx(styles.specRow, className)}>
      <dt className={styles.specLabel}>{label}</dt>
      <dd className={styles.specValue}>{value}</dd>
    </div>
  );
};

// Spec List wrapper
interface SpecListProps {
  children: React.ReactNode;
  className?: string;
}

export const SpecList: React.FC<SpecListProps> = ({ children, className }) => {
  return <dl className={clsx(styles.specList, className)}>{children}</dl>;
};

