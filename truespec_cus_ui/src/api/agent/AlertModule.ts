// ============================================================================
// ALERT MODULE - System alerts management
// ============================================================================

import { agentHttpClient } from './httpClient';
import { ApiResponseDTO } from '../../dtos/common';
import {
  AlertListResDTO,
  AlertResDTO,
  AlertRuleResDTO,
  GetAlertsReqDTO,
  AcknowledgeAlertReqDTO,
  DismissAlertReqDTO,
  BulkUpdateAlertsReqDTO,
  CreateAlertRuleReqDTO,
  UpdateAlertRuleReqDTO,
} from '../../dtos/agent';

export type AlertHandler = (alert: AlertResDTO, action: 'created' | 'updated' | 'resolved') => void;

/**
 * AlertModule - System alerts and rules management
 * 
 * Responsibilities:
 * - Fetch and manage alerts
 * - Real-time alert notifications
 * - Alert rules configuration
 */
class AlertModule {
  private static instance: AlertModule;
  private alertHandlers = new Set<AlertHandler>();
  private unsubscribe: (() => void) | null = null;

  private constructor() { }

  static getInstance(): AlertModule {
    if (!AlertModule.instance) {
      AlertModule.instance = new AlertModule();
    }
    return AlertModule.instance;
  }

  // ============================================================================
  // REAL-TIME ALERTS
  // ============================================================================

  /**
   * Unsubscribe from real-time alerts
   */
  unsubscribeFromAlerts(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Add alert handler
   */
  onAlert(handler: AlertHandler): () => void {
    this.alertHandlers.add(handler);
    return () => this.alertHandlers.delete(handler);
  }

  // ============================================================================
  // ALERT CRUD
  // ============================================================================

  /**
   * Get alerts list
   */
  async getAlerts(params?: GetAlertsReqDTO): Promise<ApiResponseDTO<AlertListResDTO>> {
    return agentHttpClient.get<AlertListResDTO>('/alerts', params as Record<string, unknown>);
  }

  /**
   * Get single alert detail
   */
  async getAlert(alertId: string): Promise<ApiResponseDTO<AlertResDTO>> {
    return agentHttpClient.get<AlertResDTO>(`/alerts/${alertId}`);
  }

  /**
   * Mark alert as read
   */
  async markAsRead(alertId: string): Promise<ApiResponseDTO<void>> {
    return agentHttpClient.post<void>(`/alerts/${alertId}/read`);
  }

  /**
   * Acknowledge alert
   */
  async acknowledge(data: AcknowledgeAlertReqDTO): Promise<ApiResponseDTO<void>> {
    return agentHttpClient.post<void>(`/alerts/${data.alertId}/acknowledge`, { note: data.note });
  }

  /**
   * Dismiss alert
   */
  async dismiss(data: DismissAlertReqDTO): Promise<ApiResponseDTO<void>> {
    return agentHttpClient.post<void>(`/alerts/${data.alertId}/dismiss`, { reason: data.reason });
  }

  /**
   * Bulk update alerts
   */
  async bulkUpdate(data: BulkUpdateAlertsReqDTO): Promise<ApiResponseDTO<{ updated: number }>> {
    return agentHttpClient.post<{ updated: number }>('/alerts/bulk', data);
  }

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<ApiResponseDTO<{ count: number }>> {
    return agentHttpClient.get<{ count: number }>('/alerts/unread-count');
  }

  // ============================================================================
  // ALERT RULES
  // ============================================================================

  /**
   * Get all alert rules
   */
  async getRules(): Promise<ApiResponseDTO<AlertRuleResDTO[]>> {
    return agentHttpClient.get<AlertRuleResDTO[]>('/alerts/rules');
  }

  /**
   * Get single rule
   */
  async getRule(ruleId: string): Promise<ApiResponseDTO<AlertRuleResDTO>> {
    return agentHttpClient.get<AlertRuleResDTO>(`/alerts/rules/${ruleId}`);
  }

  /**
   * Create new rule
   */
  async createRule(data: CreateAlertRuleReqDTO): Promise<ApiResponseDTO<AlertRuleResDTO>> {
    return agentHttpClient.post<AlertRuleResDTO>('/alerts/rules', data);
  }

  /**
   * Update rule
   */
  async updateRule(data: UpdateAlertRuleReqDTO): Promise<ApiResponseDTO<AlertRuleResDTO>> {
    return agentHttpClient.put<AlertRuleResDTO>(`/alerts/rules/${data.id}`, data);
  }

  /**
   * Delete rule
   */
  async deleteRule(ruleId: string): Promise<ApiResponseDTO<void>> {
    return agentHttpClient.delete<void>(`/alerts/rules/${ruleId}`);
  }

  /**
   * Toggle rule enabled state
   */
  async toggleRule(ruleId: string, enabled: boolean): Promise<ApiResponseDTO<AlertRuleResDTO>> {
    return agentHttpClient.put<AlertRuleResDTO>(`/alerts/rules/${ruleId}`, { enabled });
  }
}

export const alertModule = AlertModule.getInstance();
export default AlertModule;

