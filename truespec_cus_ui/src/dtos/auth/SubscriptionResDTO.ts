// ============================================================================
// SUBSCRIPTION RESPONSE DTOs
// ============================================================================

/**
 * Available pricing plan
 */
export interface PricingPlanResDTO {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  maxDevices: number;
  features: PlanFeatureResDTO[];
  isRecommended: boolean;
  isEnterprise: boolean;
}

/**
 * Plan feature detail
 */
export interface PlanFeatureResDTO {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

/**
 * Subscription upgrade result
 */
export interface SubscriptionUpgradeResDTO {
  subscriptionId: string;
  planId: string;
  planName: string;
  status: 'active' | 'pending' | 'requires_payment';
  startDate: string;
  endDate: string;
  paymentUrl?: string; // For external payment processing
  invoiceId?: string;
}

/**
 * Billing history item
 */
export interface BillingHistoryResDTO {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  invoiceUrl?: string;
}

