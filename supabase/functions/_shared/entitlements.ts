import {
  hasFeature,
  resolvePlanTier,
  type FeatureKey,
  type PlanTier,
} from '../../../shared/plans.ts';

type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options: { ascending: boolean }) => {
          limit: (value: number) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
          };
        };
      };
    };
  };
};

export async function getHouseholdPlanTier(supabase: SupabaseLike, householdId: string): Promise<PlanTier> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan_code, status')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return resolvePlanTier(data as { plan_code?: string | null; status?: string | null } | null);
}

export async function assertHouseholdFeature(
  supabase: SupabaseLike,
  householdId: string,
  feature: FeatureKey,
) {
  const planTier = await getHouseholdPlanTier(supabase, householdId);

  if (!hasFeature(planTier, feature)) {
    throw new Error(`Esta función no está disponible en el plan ${planTier}.`);
  }

  return planTier;
}
