import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { assertHouseholdFeature } from '../_shared/entitlements.ts';

const supabase = createServiceClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseRequiredText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value.trim();
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
      householdId?: string;
      rows?: Array<{
        date?: string;
        description?: string;
        amount?: number;
      }>;
    };

    const householdId = parseRequiredText(body.householdId, 'El hogar');
    await assertHouseholdFeature(supabase, householdId, 'csv_import');

    const { data: actorMember, error: actorMemberError } = await supabase
      .from('household_members')
      .select('id')
      .eq('household_id', householdId)
      .eq('user_id', user.id)
      .eq('invitation_status', 'accepted')
      .maybeSingle();

    if (actorMemberError || !actorMember) {
      throw new Error('No tienes acceso a este hogar.');
    }

    const rows = Array.isArray(body.rows) ? body.rows : [];
    if (rows.length === 0) {
      throw new Error('No hay filas para importar.');
    }

    const inserts = rows.map((row) => ({
      household_id: householdId,
      created_by: user.id,
      paid_by_member_id: actorMember.id,
      type: 'expense' as const,
      scope: 'shared' as const,
      assigned_to_member_id: null,
      amount_clp: Number(row.amount) || 0,
      category_id: null,
      description: parseRequiredText(row.description, 'La descripción'),
      occurred_on: parseRequiredText(row.date, 'La fecha'),
      expense_type: 'variable' as const,
      is_recurring_instance: false,
      recurring_source_id: null,
      notes: null,
    }));

    const { error } = await supabase.from('transactions').insert(inserts);
    if (error) throw error;

    return new Response(JSON.stringify({ imported: inserts.length }), {
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
