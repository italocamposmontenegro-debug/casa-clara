import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { getHouseholdPlanTier } from '../_shared/entitlements.ts';
import { canCreateGoal } from '../../../shared/plans.ts';

const supabase = createServiceClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'create' | 'update' | 'set-primary' | 'set-status';
type GoalStatus = 'active' | 'completed' | 'cancelled';

function parseRequiredText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value.trim();
}

function parseAmount(value: unknown, label: string) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} debe ser un numero igual o mayor a 0.`);
  }

  return parsed;
}

function parseGoalStatus(value: unknown): GoalStatus {
  if (value === 'active' || value === 'completed' || value === 'cancelled') {
    return value;
  }

  throw new Error('Estado de meta invalido.');
}

async function getAuthenticatedUser(token: string) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Unauthorized');
  }

  return user;
}

async function assertHouseholdAccess(householdId: string, userId: string) {
  const { data, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .eq('invitation_status', 'accepted')
    .maybeSingle();

  if (error || !data) {
    throw new Error('No tienes acceso a este hogar.');
  }
}

async function loadGoals(householdId: string) {
  const { data, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('household_id', householdId);

  if (error) throw error;
  return data || [];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const user = await getAuthenticatedUser(authHeader.replace('Bearer ', ''));
    const body = await req.json() as {
      action?: Action;
      householdId?: string;
      goalId?: string;
      name?: unknown;
      targetAmountClp?: unknown;
      currentAmountClp?: unknown;
      targetDate?: unknown;
      nextStatus?: unknown;
    };

    const action = body.action || 'create';

    if (action === 'create') {
      const householdId = parseRequiredText(body.householdId, 'El hogar');
      await assertHouseholdAccess(householdId, user.id);

      const planTier = await getHouseholdPlanTier(supabase, householdId);
      const existingGoals = await loadGoals(householdId);
      const activeGoalsCount = existingGoals.filter((goal) => goal.status === 'active').length;
      if (!canCreateGoal(planTier, activeGoalsCount)) {
        throw new Error('Tu plan actual permite solo una meta activa.');
      }

      const { data, error } = await supabase
        .from('savings_goals')
        .insert({
          household_id: householdId,
          name: parseRequiredText(body.name, 'El nombre'),
          target_amount_clp: parseAmount(body.targetAmountClp, 'El monto objetivo'),
          current_amount_clp: parseAmount(body.currentAmountClp, 'El ahorro actual'),
          target_date: parseRequiredText(body.targetDate, 'La fecha objetivo'),
          status: 'active',
          is_primary: !existingGoals.some((goal) => goal.status === 'active' && goal.is_primary),
        })
        .select('*')
        .single();

      if (error || !data) {
        throw error ?? new Error('No pudimos crear la meta.');
      }

      return new Response(JSON.stringify({ goal: data }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const goalId = parseRequiredText(body.goalId, 'La meta');
    const { data: goal, error: goalError } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', goalId)
      .maybeSingle();

    if (goalError || !goal) {
      throw new Error('No encontramos esa meta.');
    }

    await assertHouseholdAccess(goal.household_id, user.id);
    const planTier = await getHouseholdPlanTier(supabase, goal.household_id);
    const existingGoals = await loadGoals(goal.household_id);

    if (action === 'set-primary') {
      if (goal.status !== 'active') {
        throw new Error('Solo una meta activa puede quedar como principal.');
      }

      const { error: clearError } = await supabase
        .from('savings_goals')
        .update({ is_primary: false })
        .eq('household_id', goal.household_id);

      if (clearError) throw clearError;

      const { data, error } = await supabase
        .from('savings_goals')
        .update({ is_primary: true })
        .eq('id', goal.id)
        .select('*')
        .single();

      if (error || !data) {
        throw error ?? new Error('No pudimos actualizar la meta principal.');
      }

      return new Response(JSON.stringify({ goal: data }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (action === 'set-status') {
      const nextStatus = parseGoalStatus(body.nextStatus);
      const otherActiveGoals = existingGoals.filter((existing) => existing.id !== goal.id && existing.status === 'active');

      if (nextStatus === 'active' && goal.status !== 'active' && !canCreateGoal(planTier, otherActiveGoals.length)) {
        throw new Error('Tu plan actual permite solo una meta activa.');
      }

      const nextPrimary = nextStatus === 'active'
        ? (goal.is_primary || !otherActiveGoals.some((existing) => existing.is_primary))
        : false;

      const { data, error } = await supabase
        .from('savings_goals')
        .update({
          status: nextStatus,
          is_primary: nextPrimary,
        })
        .eq('id', goal.id)
        .select('*')
        .single();

      if (error || !data) {
        throw error ?? new Error('No pudimos actualizar el estado de la meta.');
      }

      if (nextStatus !== 'active' && goal.is_primary) {
        const fallbackGoal = otherActiveGoals[0] ?? null;
        if (fallbackGoal) {
          const { error: fallbackError } = await supabase
            .from('savings_goals')
            .update({ is_primary: true })
            .eq('id', fallbackGoal.id);

          if (fallbackError) throw fallbackError;
        }
      }

      return new Response(JSON.stringify({ goal: data }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data, error } = await supabase
      .from('savings_goals')
      .update({
        name: parseRequiredText(body.name, 'El nombre'),
        target_amount_clp: parseAmount(body.targetAmountClp, 'El monto objetivo'),
        current_amount_clp: parseAmount(body.currentAmountClp, 'El ahorro actual'),
        target_date: parseRequiredText(body.targetDate, 'La fecha objetivo'),
      })
      .eq('id', goal.id)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('No pudimos actualizar la meta.');
    }

    return new Response(JSON.stringify({ goal: data }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      status: message === 'Unauthorized' ? 401 : 400,
    });
  }
});
