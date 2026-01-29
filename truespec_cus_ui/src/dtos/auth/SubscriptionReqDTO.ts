// ============================================================================
// SUBSCRIPTION REQUEST DTOs
// ============================================================================

/**
 * Upgrade subscription request
 */
export interface UpgradeSubscriptionReqDTO {
  planId: string;
  paymentMethod: 'card' | 'paypal' | 'bank_transfer';
  billingCycle: 'monthly' | 'yearly';
  couponCode?: string;
}

/**
 * Cancel subscription request
 */
export interface CancelSubscriptionReqDTO {
  reason?: string;
  feedback?: string;
  cancelImmediately?: boolean;
}

/**
 * Add device to subscription request
 */
export interface AddDeviceReqDTO {
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'macos' | 'linux';
  osVersion: string;
}

/**
 * Remove device from subscription request
 */
export interface RemoveDeviceReqDTO {
  deviceId: string;
}

