import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { assertHouseholdFeature } from '../_shared/entitlements.ts';

const supabase = createServiceClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parsePositiveInt(value: unknown, field: string) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${field} no es valido.`);
  }
  return parsed;
}

function parseAmount(value: unknown, field: string) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${field} no es valido.`);
  }
  return parsed;
}

async function getAcceptedMember(userId: string, householdId: string) {
  const { data, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', userId)
    .eq('invitation_status', 'accepted')
    .maybeSingle();

  if (error || !data) {
    throw new Error('No tienes acceso a ese hogar.');
  }
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

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) throw new Error('Unauthorized');

    const body = await req.json() as {
      householdId?: string;
      year?: unknown;
      month?: unknown;
      totalIncome?: unknown;
      totalExpenses?: unknown;
      totalSavings?: unknown;
      summaryData?: Record<string, unknown> | null;
    };

    const householdId = body.householdId;
    if (!householdId) throw new Error('Hogar requerido.');

    const year = parsePositiveInt(body.year, 'El anio');
    const month = parsePositiveInt(body.month, 'El mes');
    if (month < 1 || month > 12) throw new Error('El mes no es valido.');

    await getAcceptedMember(user.id, householdId);
    await assertHouseholdFeature(supabase, householdId, 'monthly_close_simple');

    const totalIncome = parseAmount(body.totalIncome, 'El total de ingresos');
    const totalExpenses = parseAmount(body.totalExpenses, 'El total de gastos');
    const totalSavings = parseAmount(body.totalSavings, 'El total de ahorro');

    const { data, error } = await supabase
      .from('monthly_reviews')
      .upsert({
        household_id: householdId,
        year,
        month,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        total_savings: totalSavings,
        created_by: user.id,
        summary_data: body.summaryData ?? {},
      }, {
        onConflict: 'household_id,year,month',
      })
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('No pudimos guardar el cierre mensual.');
    }

    return new Response(JSON.stringify({ review: data }), {
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
