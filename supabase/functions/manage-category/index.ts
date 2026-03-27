import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { assertHouseholdFeature } from '../_shared/entitlements.ts';

const supabase = createServiceClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'create' | 'update';

function parseRequiredText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value.trim();
}

function parseColor(value: unknown) {
  const color = parseRequiredText(value, 'El color');
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error('El color debe usar formato hexadecimal.');
  }

  return color;
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
      categoryId?: string;
      name?: unknown;
      icon?: unknown;
      color?: unknown;
    };

    const action = body.action || 'create';
    const name = parseRequiredText(body.name, 'El nombre');
    const icon = parseRequiredText(body.icon, 'El ícono');
    const color = parseColor(body.color);

    if (action === 'create') {
      const householdId = parseRequiredText(body.householdId, 'El hogar');
      await assertHouseholdAccess(householdId, user.id);
      await assertHouseholdFeature(supabase, householdId, 'categories_custom');

      const { count } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', householdId)
        .is('deleted_at', null);

      const { data, error } = await supabase
        .from('categories')
        .insert({
          household_id: householdId,
          name,
          icon,
          color,
          is_default: false,
          sort_order: count ?? 0,
        })
        .select('*')
        .single();

      if (error || !data) {
        throw error ?? new Error('No pudimos crear la categoría.');
      }

      return new Response(JSON.stringify({ category: data }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const categoryId = parseRequiredText(body.categoryId, 'La categoría');
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .is('deleted_at', null)
      .maybeSingle();

    if (categoryError || !category) {
      throw new Error('No encontramos esa categoría.');
    }

    await assertHouseholdAccess(category.household_id, user.id);
    await assertHouseholdFeature(supabase, category.household_id, 'categories_custom');

    if (category.is_default) {
      throw new Error('Las categorías base no se pueden editar.');
    }

    const { data, error } = await supabase
      .from('categories')
      .update({ name, icon, color })
      .eq('id', category.id)
      .select('*')
      .single();

    if (error || !data) {
      throw error ?? new Error('No pudimos actualizar la categoría.');
    }

    return new Response(JSON.stringify({ category: data }), {
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
