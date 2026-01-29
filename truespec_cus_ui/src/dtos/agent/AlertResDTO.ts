// ============================================================================
// ALERT DTOs - System alerts and notifications from Agent
// ============================================================================

import { StatusLevel } from '../common';

/**
 * Alert list response
 */
export interface AlertListResDTO {
  alerts: AlertResDTO[];
  total: number;
  unreadCount: number;
}

/**
 * Single alert detail
 */
export interface AlertResDTO {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: AlertTypeResDTO;
  title: string;
  message: string;
  code: string;
  source: string;
  deviceId: string;
  deviceName: string;
  detectedAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  isRead: boolean;
  isDismissed: boolean;
  metadata: Record<string, unknown>;
  reasons: AlertReasonResDTO[];
  suggestedActions: string[];
}

/**
 * Alert type enumeration
 */
export type AlertTypeResDTO =
  | 'cpu_high_temp'
  | 'cpu_high_load'
  | 'gpu_high_temp'
  | 'gpu_high_load'
  | 'ram_high_usage'
  | 'storage_low_space'
  | 'storage_smart_warning'
  | 'network_disconnected'
  | 'network_high_latency'
  | 'battery_low'
  | 'battery_health_degraded'
  | 'fan_failure'
  | 'fan_high_rpm'
  | 'system_crash'
  | 'driver_issue'
  | 'security_threat'
  | 'update_available'
  | 'custom';

/**
 * Alert reason detail
 */
export interface AlertReasonResDTO {
  reason: string;
  detail: string;
  value?: number | string;
  threshold?: number | string;
  status: StatusLevel;
}

/**
 * Alert rule configuration
 */
export interface AlertRuleResDTO {
  id: string;
  name: string;
  type: AlertTypeResDTO;
  enabled: boolean;
  condition: AlertConditionResDTO;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown: number; // seconds between alerts
  notifyMethods: ('app' | 'email' | 'push')[];
}

/**
 * Alert condition
 */
export interface AlertConditionResDTO {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  duration?: number; // seconds the condition must persist
}

