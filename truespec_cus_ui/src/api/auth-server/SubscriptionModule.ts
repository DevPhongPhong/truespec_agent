// ============================================================================
// SUBSCRIPTION MODULE - Subscription and billing operations
// ============================================================================

import { authHttpClient } from './httpClient';
import {
  UpgradeSubscriptionReqDTO,
  CancelSubscriptionReqDTO,
  AddDeviceReqDTO,
  RemoveDeviceReqDTO,
  PricingPlanResDTO,
  SubscriptionUpgradeResDTO,
  BillingHistoryResDTO,
  SubscriptionResDTO,
  UserDeviceResDTO,
} from '../../dtos/auth';
import { ApiResponseDTO, PaginationResDTO, PaginationReqDTO } from '../../dtos/common';

/**
 * SubscriptionModule - Handles subscription and device management
 * 
 * Responsibilities:
 * - View and manage subscription
 * - Upgrade/downgrade plans
 * - Device management
 * - Billing history
 */
class SubscriptionModule {
  private static instance: SubscriptionModule;

  private constructor() {}

  static getInstance(): SubscriptionModule {
    if (!SubscriptionModule.instance) {
      SubscriptionModule.instance = new SubscriptionModule();
    }
    return SubscriptionModule.instance;
  }

  // ============================================================================
  // PLANS
  // ============================================================================

  /**
   * Get available pricing plans
   */
  async getPlans(): Promise<ApiResponseDTO<PricingPlanResDTO[]>> {
    return authHttpClient.get<PricingPlanResDTO[]>('/subscriptions/plans');
  }

  /**
   * Get specific plan details
   */
  async getPlan(planId: string): Promise<ApiResponseDTO<PricingPlanResDTO>> {
    return authHttpClient.get<PricingPlanResDTO>(`/subscriptions/plans/${planId}`);
  }

  // ============================================================================
  // SUBSCRIPTION
  // ============================================================================

  /**
   * Get current subscription
   */
  async getCurrentSubscription(): Promise<ApiResponseDTO<SubscriptionResDTO>> {
    return authHttpClient.get<SubscriptionResDTO>('/subscriptions/current');
  }

  /**
   * Upgrade subscription
   */
  async upgrade(data: UpgradeSubscriptionReqDTO): Promise<ApiResponseDTO<SubscriptionUpgradeResDTO>> {
    return authHttpClient.post<SubscriptionUpgradeResDTO>('/subscriptions/upgrade', data);
  }

  /**
   * Cancel subscription
   */
  async cancel(data: CancelSubscriptionReqDTO): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/subscriptions/cancel', data);
  }

  /**
   * Resume cancelled subscription
   */
  async resume(): Promise<ApiResponseDTO<SubscriptionResDTO>> {
    return authHttpClient.post<SubscriptionResDTO>('/subscriptions/resume');
  }

  /**
   * Toggle auto-renewal
   */
  async setAutoRenew(enabled: boolean): Promise<ApiResponseDTO<SubscriptionResDTO>> {
    return authHttpClient.patch<SubscriptionResDTO>('/subscriptions/current', { autoRenew: enabled });
  }

  // ============================================================================
  // DEVICES
  // ============================================================================

  /**
   * Get registered devices
   */
  async getDevices(): Promise<ApiResponseDTO<UserDeviceResDTO[]>> {
    return authHttpClient.get<UserDeviceResDTO[]>('/subscriptions/devices');
  }

  /**
   * Add new device
   */
  async addDevice(data: AddDeviceReqDTO): Promise<ApiResponseDTO<UserDeviceResDTO>> {
    return authHttpClient.post<UserDeviceResDTO>('/subscriptions/devices', data);
  }

  /**
   * Remove device
   */
  async removeDevice(data: RemoveDeviceReqDTO): Promise<ApiResponseDTO<void>> {
    return authHttpClient.delete<void>(`/subscriptions/devices/${data.deviceId}`);
  }

  /**
   * Rename device
   */
  async renameDevice(deviceId: string, name: string): Promise<ApiResponseDTO<UserDeviceResDTO>> {
    return authHttpClient.patch<UserDeviceResDTO>(`/subscriptions/devices/${deviceId}`, { name });
  }

  /**
   * Check device limit
   */
  async checkDeviceLimit(): Promise<ApiResponseDTO<{ current: number; max: number; canAdd: boolean }>> {
    return authHttpClient.get<{ current: number; max: number; canAdd: boolean }>('/subscriptions/devices/limit');
  }

  // ============================================================================
  // BILLING
  // ============================================================================

  /**
   * Get billing history
   */
  async getBillingHistory(
    pagination?: PaginationReqDTO
  ): Promise<ApiResponseDTO<PaginationResDTO<BillingHistoryResDTO>>> {
    return authHttpClient.get<PaginationResDTO<BillingHistoryResDTO>>('/subscriptions/billing', pagination);
  }

  /**
   * Get invoice
   */
  async getInvoice(invoiceId: string): Promise<ApiResponseDTO<{ downloadUrl: string }>> {
    return authHttpClient.get<{ downloadUrl: string }>(`/subscriptions/billing/${invoiceId}`);
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(paymentMethodId: string): Promise<ApiResponseDTO<void>> {
    return authHttpClient.post<void>('/subscriptions/payment-method', { paymentMethodId });
  }

  // ============================================================================
  // COUPON
  // ============================================================================

  /**
   * Validate coupon code
   */
  async validateCoupon(code: string): Promise<ApiResponseDTO<{ valid: boolean; discount: number; description: string }>> {
    return authHttpClient.post<{ valid: boolean; discount: number; description: string }>('/subscriptions/coupon/validate', { code });
  }

  /**
   * Apply coupon to subscription
   */
  async applyCoupon(code: string): Promise<ApiResponseDTO<SubscriptionResDTO>> {
    return authHttpClient.post<SubscriptionResDTO>('/subscriptions/coupon/apply', { code });
  }
}

export const subscriptionModule = SubscriptionModule.getInstance();
export default SubscriptionModule;

