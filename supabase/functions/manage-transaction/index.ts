import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { getHouseholdPlanTier } from '../_shared/entitlements.ts';
import { hasFeature } from '../../../shared/plans.ts';

const supabase = createServiceClient();

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'create' | 'update' | 'delete';
type TransactionType = 'income' | 'expense';
type TransactionScope = 'personal' | 'shared';
type ExpenseType = 'fixed' | 'variable' | null;

function parseRequiredText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} es obligatorio.`);
  }

  return value.trim();
}

function parseAmount(value: unknown) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error('El monto debe ser un numero mayor a 0.');
  }

  return parsed;
}

function parseType(value: unknown): TransactionType {
  if (value === 'income' || value === 'expense') return value;
  throw new Error('Tipo de movimiento invalido.');
}

function parseScope(value: unknown): TransactionScope {
  return value === 'personal' ? 'personal' : 'shared';
}

function parseExpenseType(value: unknown): ExpenseType {
  if (value === null || value === undefined || value === '') return null;
  if (value === 'fixed' || value === 'variable') return value;
  throw new Error('Tipo de gasto invalido.');
}

function getTodayChile() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
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

async function getTransaction(transactionId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    throw new Error('No encontramos ese movimiento.');
  }

  return data;
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

  return data;
}

async function getCategory(householdId: string, categoryId: string | null) {
  if (!categoryId) return null;

  const { data, error } = await supabase
    .from('categories')
    .select('id, is_default')
    .eq('household_id', householdId)
    .eq('id', categoryId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error || !data) {
    throw new Error('No encontramos la categoria seleccionada.');
  }

  return data;
}

async function assertMember(householdId: string, memberId: string) {
  const { data, error } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('id', memberId)
    .eq('invitation_status', 'accepted')
    .maybeSingle();

  if (error || !data) {
    throw new Error('No encontramos al miembro seleccionado.');
  }
}

async function assertCategoryAllowed(householdId: string, categoryId: string | null, canUseCustomCategories: boolean) {
  const category = await getCategory(householdId, categoryId);
  if (!category) return;
  if (!canUseCustomCategories && !category.is_default) {
    throw new Error('Las categorías personalizadas están disponibles desde el plan Esencial.');
  }
}

async function getLinkedPaymentItem(transactionId: string) {
  const { data, error } = await supabase
    .from('payment_calendar_items')
    .select('*')
    .eq('paid_transaction_id', transactionId)
    .maybeSingle();

  if (error) throw error;
  return data;
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
      transactionId?: string;
      type?: unknown;
      description?: unknown;
      amountClp?: unknown;
      categoryId?: string | null;
      occurredOn?: unknown;
      paidByMemberId?: string;
      scope?: unknown;
      expenseType?: unknown;
      notes?: unknown;
    };

    if (!body.action) throw new Error('Accion requerida.');

    if (body.action === 'create') {
      if (!body.householdId) throw new Error('Hogar requerido.');

      const actorMember = await assertHouseholdAccess(body.householdId, user.id);
      const planTier = await getHouseholdPlanTier(supabase, body.householdId);
      const nextType = parseType(body.type);
      const nextDescription = parseRequiredText(body.description, 'La descripcion');
      const nextAmount = parseAmount(body.amountClp);
      const nextOccurredOn = parseRequiredText(body.occurredOn, 'La fecha');
      const canUseSplitManual = hasFeature(planTier, 'split_manual');
      const canUseCustomCategories = hasFeature(planTier, 'categories_custom');
      const nextPaidByMemberId = canUseSplitManual
        ? parseRequiredText(body.paidByMemberId, 'Quien pago')
        : actorMember.id;
      const nextScope = canUseSplitManual ? parseScope(body.scope) : 'shared';
      const nextExpenseType = nextType === 'expense'
        ? (canUseSplitManual ? parseExpenseType(body.expenseType) : 'variable')
        : null;
      const nextCategoryId = body.categoryId ?? null;
      const nextNotes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;

      await assertMember(body.householdId, nextPaidByMemberId);
      await assertCategoryAllowed(body.householdId, nextCategoryId, canUseCustomCategories);

      const { data: createdTransaction, error: createError } = await supabase
        .from('transactions')
        .insert({
          household_id: body.householdId,
          created_by: user.id,
          type: nextType,
          paid_by_member_id: nextPaidByMemberId,
          scope: nextScope,
          assigned_to_member_id: null,
          amount_clp: nextAmount,
          category_id: nextType === 'expense' ? nextCategoryId : null,
          description: nextDescription,
          occurred_on: nextOccurredOn,
          expense_type: nextExpenseType,
          is_recurring_instance: false,
          recurring_source_id: null,
          notes: nextNotes,
        })
        .select('*')
        .single();

      if (createError || !createdTransaction) {
        throw createError ?? new Error('No pudimos crear el movimiento.');
      }

      return new Response(JSON.stringify({ transaction: createdTransaction }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (!body.transactionId) throw new Error('Movimiento requerido.');

    const transaction = await getTransaction(body.transactionId);
    const actorMember = await assertHouseholdAccess(transaction.household_id, user.id);
    const planTier = await getHouseholdPlanTier(supabase, transaction.household_id);
    const canUseSplitManual = hasFeature(planTier, 'split_manual');
    const canUseCustomCategories = hasFeature(planTier, 'categories_custom');
    const linkedPaymentItem = await getLinkedPaymentItem(transaction.id);

    if (body.action === 'delete') {
      const { error: deleteError } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', transaction.id)
        .is('deleted_at', null);

      if (deleteError) throw deleteError;

      if (linkedPaymentItem) {
        const nextStatus = linkedPaymentItem.due_date < getTodayChile() ? 'overdue' : 'pending';
        const { error: paymentError } = await supabase
          .from('payment_calendar_items')
          .update({
            status: nextStatus,
            paid_transaction_id: null,
          })
          .eq('id', linkedPaymentItem.id);

        if (paymentError) throw paymentError;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const nextType = parseType(body.type);
    const nextDescription = parseRequiredText(body.description, 'La descripcion');
    const nextAmount = parseAmount(body.amountClp);
    const nextOccurredOn = parseRequiredText(body.occurredOn, 'La fecha');
    const nextPaidByMemberId = canUseSplitManual
      ? parseRequiredText(body.paidByMemberId, 'Quien pago')
      : transaction.paid_by_member_id || actorMember.id;
    const nextScope = canUseSplitManual ? parseScope(body.scope) : transaction.scope;
    const nextExpenseType = nextType === 'expense'
      ? (canUseSplitManual ? parseExpenseType(body.expenseType) : transaction.expense_type ?? 'variable')
      : null;
    const nextCategoryId = body.categoryId ?? null;
    const nextNotes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null;

    await assertMember(transaction.household_id, nextPaidByMemberId);
    await assertCategoryAllowed(transaction.household_id, nextCategoryId, canUseCustomCategories);

    if (linkedPaymentItem && nextType !== 'expense') {
      throw new Error('No puedes convertir en ingreso un gasto asociado a un pago programado.');
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        type: nextType,
        description: nextDescription,
        amount_clp: nextAmount,
        category_id: nextCategoryId,
        occurred_on: nextOccurredOn,
        paid_by_member_id: nextPaidByMemberId,
        scope: nextScope,
        expense_type: nextExpenseType,
        notes: nextNotes,
      })
      .eq('id', transaction.id)
      .is('deleted_at', null)
      .select('*')
      .single();

    if (updateError || !updatedTransaction) {
      throw updateError ?? new Error('No pudimos actualizar el movimiento.');
    }

    if (linkedPaymentItem) {
      const { error: paymentError } = await supabase
        .from('payment_calendar_items')
        .update({
          description: nextDescription,
          amount_clp: nextAmount,
          category_id: nextCategoryId,
        })
        .eq('id', linkedPaymentItem.id);

      if (paymentError) throw paymentError;
    }

    return new Response(JSON.stringify({ transaction: updatedTransaction }), {
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
