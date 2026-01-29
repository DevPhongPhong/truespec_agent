// ============================================================================
// ALERT REQUEST DTOs
// ============================================================================

/**
 * Get alerts request
 */
export interface GetAlertsReqDTO {
  deviceId?: string;
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  type?: string[];
  isRead?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * Acknowledge alert request
 */
export interface AcknowledgeAlertReqDTO {
  alertId: string;
  note?: string;
}

/**
 * Dismiss alert request
 */
export interface DismissAlertReqDTO {
  alertId: string;
  reason?: string;
}

/**
 * Bulk update alerts request
 */
export interface BulkUpdateAlertsReqDTO {
  alertIds: string[];
  action: 'read' | 'unread' | 'acknowledge' | 'dismiss';
}

/**
 * Create alert rule request
 */
export interface CreateAlertRuleReqDTO {
  name: string;
  type: string;
  enabled: boolean;
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    duration?: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldown?: number;
  notifyMethods?: ('app' | 'email' | 'push')[];
}

/**
 * Update alert rule request
 */
export interface UpdateAlertRuleReqDTO extends Partial<CreateAlertRuleReqDTO> {
  id: string;
}

