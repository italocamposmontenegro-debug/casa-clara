// ============================================
// Casa Clara — useSubscription hook
// ============================================

import { useHousehold } from './useHousehold';
import {
  getFeatureRequiredPlan,
  getFeatureUpgradeCopy,
  getPlanCapabilities,
  getPlanName,
  getSubscriptionCTA,
  hasFeature,
  resolvePlanTier,
  type BillingPlanCode,
  type BillingCycle,
  type FeatureKey,
  type PlanTier,
  type SubscriptionStatus,
} from '../lib/constants';

export interface UseSubscriptionResult {
  status: SubscriptionStatus | null;
  planCode: BillingPlanCode | null;
  billingCycle: BillingCycle | null;
  planTier: PlanTier;
  planName: string;
  isActivePaidPlan: boolean;
  isRestricted: boolean;
  canWrite: boolean;
  hasFeature: (feature: FeatureKey) => boolean;
  getRequiredPlan: (feature: FeatureKey) => PlanTier;
  getUpgradeCopy: (feature: FeatureKey) => ReturnType<typeof getFeatureUpgradeCopy>;
  maxGoals: number | null;
  maxMembers: number;
  ctaMessage: string;
  ctaAction: string;
  ctaRoute: string;
}

export function useSubscription(): UseSubscriptionResult {
  const { subscription } = useHousehold();

  const status = (subscription?.status as SubscriptionStatus) ?? null;
  const planCode = (subscription?.plan_code as BillingPlanCode) ?? null;
  const billingCycle = subscription?.billing_cycle ?? null;
  const planTier = resolvePlanTier(subscription);
  const isActivePaidPlan = planTier !== 'free';
  const isRestricted = status !== null && status !== 'active';
  const capabilities = getPlanCapabilities(planTier);
  const canWrite = hasFeature(planTier, 'transactions_manual');

  const cta = getSubscriptionCTA(status);

  return {
    status,
    planCode,
    billingCycle,
    planTier,
    planName: getPlanName(planTier),
    isActivePaidPlan,
    isRestricted,
    canWrite,
    hasFeature: (feature: FeatureKey) => hasFeature(planTier, feature),
    getRequiredPlan: (feature: FeatureKey) => getFeatureRequiredPlan(feature),
    getUpgradeCopy: (feature: FeatureKey) => getFeatureUpgradeCopy(feature),
    maxGoals: capabilities.limits.maxGoals,
    maxMembers: capabilities.limits.maxMembers,
    ctaMessage: cta.message,
    ctaAction: cta.action,
    ctaRoute: cta.route,
  };
}
