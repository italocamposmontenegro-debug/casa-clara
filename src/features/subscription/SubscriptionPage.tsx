import { useCallback, useEffect, useMemo, useState } from 'react';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { useSearchParams } from 'react-router-dom';
import { useHousehold } from '../../hooks/useHousehold';
import { useSubscription } from '../../hooks/useSubscription';
import { AlertBanner, Button, Card, PlanBadge, UpgradePromptCard } from '../../components/ui';
import { trackEvent, trackOnce } from '../../lib/analytics';
import {
  APP_NAME,
  PUBLIC_PLAN_INFO,
  SUBSCRIPTION_STATUS_LABELS,
  getFeatureUpgradeCopy,
  mapBillingPlanCodeToTier,
  getPlanName,
  getPlanPromise,
  type BillingPlanCode,
  type FeatureKey,
  type PlanTier,
} from '../../lib/constants';
import { formatCLP } from '../../utils/format-clp';
import { formatDateLong } from '../../utils/dates-chile';
import { supabase } from '../../lib/supabase';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

export function SubscriptionPage() {
  const { subscription, household, currentMember, refetch } = useHousehold();
  const { status, billingCycle, planTier, isActivePaidPlan } = useSubscription();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [annual, setAnnual] = useState(true);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [autoSyncedSubscriptionId, setAutoSyncedSubscriptionId] = useState<string | null>(null);
  const isOwner = currentMember?.role === 'owner';
  const currentPlanName = getPlanName(planTier);
  const currentCycleLabel = billingCycle === 'monthly' ? 'Mensual' : billingCycle === 'yearly' ? 'Anual' : '—';
  const currentPlanPromise = getPlanPromise(planTier);
  const featureUpgrade = useMemo(() => {
    const feature = searchParams.get('feature') as FeatureKey | null;
    return feature ? getFeatureUpgradeCopy(feature) : null;
  }, [searchParams]);
  const requestedPlan = searchParams.get('plan');

  useEffect(() => {
    if (subscription?.billing_cycle) {
      setAnnual(subscription.billing_cycle === 'yearly');
    }
  }, [subscription?.billing_cycle]);

  useEffect(() => {
    if (!household) return;
    trackOnce(
      `subscription-view:${household.id}`,
      'subscription_page_viewed',
      { household_id: household.id, plan: planTier, status: status || 'free' },
      'session',
    );
  }, [household, planTier, status]);

  async function readResponseBody(response: Response) {
    const cloned = response.clone();
    const payload = await cloned.json().catch(() => null) as { error?: string; message?: string } | null;
    if (payload?.error) return payload.error;
    if (payload?.message) return payload.message;

    const text = await response.text().catch(() => '');
    return text || null;
  }

  const resolveSubscriptionError = useCallback(async (error: unknown) => {
    if (error instanceof FunctionsHttpError || (error instanceof Error && error.name === 'FunctionsHttpError')) {
      const response = error instanceof FunctionsHttpError ? error.context as Response : (error as { context?: Response }).context;
      if (response instanceof Response) {
        return (await readResponseBody(response)) ?? error.message;
      }
      return error.message;
    }

    if (error instanceof FunctionsRelayError || (error instanceof Error && error.name === 'FunctionsRelayError')) {
      return 'Supabase relay no pudo completar la invocacion de la Edge Function.';
    }

    if (error instanceof FunctionsFetchError || (error instanceof Error && error.name === 'FunctionsFetchError')) {
      return 'No se pudo contactar la Edge Function desde el navegador.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Error al actualizar la suscripción.';
  }, []);

  async function handleSelectPlan(plan: BillingPlanCode) {
    if (!household || !isOwner) return;
    setLoading(true);
    setSyncMessage(null);
    const targetTier = mapBillingPlanCodeToTier(plan);
    const targetCycle = annual ? 'yearly' : 'monthly';

    trackEvent('upgrade_cta_clicked', {
      context: 'subscription-plan-card',
      household_id: household.id,
      current_plan: planTier,
      target_plan: targetTier,
      billing_cycle: targetCycle,
    });

    try {
      const action = isActivePaidPlan && subscription ? 'update-subscription' : 'create-subscription';
      const { data, error } = await supabase.functions.invoke(action, {
        body: {
          household_id: household.id,
          plan_code: plan,
          billing_cycle: targetCycle,
        },
      });

      if (error) throw error;
      if (data?.init_point) {
        trackEvent('checkout_started', {
          household_id: household.id,
          current_plan: planTier,
          target_plan: targetTier,
          billing_cycle: targetCycle,
        });
        window.location.href = data.init_point;
      } else {
        await refetch();
      }
    } catch (error) {
      alert(await resolveSubscriptionError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDowngradeToFree() {
    if (!household || !isOwner) return;
    setLoading(true);
    setSyncMessage(null);

    try {
      const { error } = await supabase.functions.invoke('cancel-subscription', {
        body: { household_id: household.id },
      });
      if (error) throw error;
      await refetch();
      setSyncMessage('Tu hogar volvio al plan Free.');
    } catch (error) {
      alert(await resolveSubscriptionError(error));
    } finally {
      setLoading(false);
    }
  }

  const syncSubscriptionStatus = useCallback(async (silent = false) => {
    if (!household) return;
    setSyncing(true);
    if (!silent) setSyncMessage(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-subscription-status', {
        body: { household_id: household.id },
      });

      if (error) throw error;
      await refetch();

      const providerStatus = typeof data?.provider_status === 'string' ? data.provider_status : 'desconocido';
      const localStatus = typeof data?.status === 'string' ? data.status : 'pending';

      if (localStatus === 'active') {
        trackOnce(
          `upgrade-completed:${subscription?.provider_subscription_id || household.id}:${subscription?.plan_code || planTier}`,
          'upgrade_completed',
          {
            household_id: household.id,
            provider_status: providerStatus,
            plan: subscription?.plan_code || planTier,
          },
          'local',
        );
      }

      if (!silent) {
        setSyncMessage(`Estado sincronizado. Mercado Pago: ${providerStatus}. ${APP_NAME}: ${localStatus}.`);
      }
    } catch (error) {
      const message = await resolveSubscriptionError(error);
      if (!silent) setSyncMessage(message);
    } finally {
      setSyncing(false);
    }
  }, [household, planTier, refetch, resolveSubscriptionError, subscription?.plan_code, subscription?.provider_subscription_id]);

  useEffect(() => {
    if (!household || !isOwner || subscription?.status !== 'pending' || !subscription.provider_subscription_id) {
      return;
    }

    if (autoSyncedSubscriptionId === subscription.provider_subscription_id) {
      return;
    }

    setAutoSyncedSubscriptionId(subscription.provider_subscription_id);
    void syncSubscriptionStatus(true);
  }, [autoSyncedSubscriptionId, household, isOwner, subscription?.provider_subscription_id, subscription?.status, syncSubscriptionStatus]);

  return (
    <div className="space-y-6">
      <section className="paper-panel surface-glow overflow-hidden rounded-[2rem] shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="px-6 py-7 lg:px-8 lg:py-8">
            <div className="flex flex-wrap items-center gap-3">
              <PlanBadge>{currentPlanName}</PlanBadge>
              <span className="text-xs uppercase tracking-[0.18em] text-text-light">
                {status ? SUBSCRIPTION_STATUS_LABELS[status] : 'Plan Free'}
              </span>
            </div>
            <h1 className="display-heading mt-5 text-4xl text-text lg:text-5xl">Plan y dirección del hogar</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-text-muted">
              {currentPlanPromise} Desde aquí ves en qué etapa está el hogar, qué desbloquea cada plan y cuándo tiene sentido subir de nivel para ganar más seguimiento o más visión.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              <SubscriptionSignal
                label="Plan actual"
                value={currentPlanName}
                description={planTier === 'free' ? 'Visibilidad básica y hábito inicial.' : PUBLIC_PLAN_INFO[planTier].promise}
              />
              <SubscriptionSignal
                label="Ciclo"
                value={isActivePaidPlan ? currentCycleLabel : '—'}
                description={isActivePaidPlan ? 'La renovacion sigue este ciclo.' : 'No hay ciclo de cobro activo.'}
              />
              <SubscriptionSignal
                label="Precio"
                value={subscription?.price_amount_clp ? formatCLP(subscription.price_amount_clp) : 'Gratis'}
                description={subscription?.current_period_end ? `Vigente hasta ${formatDateLong(subscription.current_period_end)}` : 'Puedes empezar gratis y subir despues.'}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {isActivePaidPlan && isOwner ? (
                <Button variant="secondary" onClick={handleDowngradeToFree} loading={loading}>
                  Volver a Free
                </Button>
              ) : (
                <Button variant="primary" onClick={() => document.getElementById('planes-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  Ver planes <ArrowRight className="h-4 w-4" />
                </Button>
              )}
              {subscription?.status === 'pending' && isOwner && (
                <Button variant="secondary" onClick={() => { void syncSubscriptionStatus(); }} loading={syncing}>
                  Sincronizar estado
                </Button>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-bg/70 px-6 py-7 lg:border-l lg:border-t-0 lg:px-7 lg:py-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Lectura rápida</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.5rem] border border-border bg-surface px-5 py-5 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-text-light">Etapa actual del hogar</p>
                    <p className="mt-2 text-base font-semibold text-text">{currentPlanPromise}</p>
                  </div>
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <ul className="mt-4 space-y-2">
                  {PUBLIC_PLAN_INFO[planTier].featureHighlights.slice(0, 3).map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-border bg-surface px-5 py-5 shadow-xs">
                <p className="text-xs uppercase tracking-[0.18em] text-text-light">Cómo se gestiona</p>
                <p className="mt-2 text-base font-semibold text-text">{isOwner ? 'Owner del hogar' : 'Solo el owner'}</p>
                <p className="mt-2 text-sm leading-6 text-text-muted">
                  {isOwner
                    ? `Desde esta pantalla puedes subir, bajar o sincronizar la suscripción de ${APP_NAME} sin salir del flujo del hogar.`
                    : `Puedes revisar el plan activo y su valor, pero el cambio de suscripción lo hace el owner del hogar.`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {!isOwner && (
        <AlertBanner type="info" message="Solo el owner puede cambiar la suscripción." />
      )}

      <Card className="rounded-[1.8rem] border-border-light bg-surface/92">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Progresión del hogar</p>
            <h2 className="display-heading mt-2 text-3xl text-text">
              {planTier === 'free'
                ? 'El hogar ya empezó con una lectura básica.'
                : planTier === 'essential'
                  ? 'El hogar ya tiene orden operativo real.'
                  : 'El hogar ya está en la etapa más alta disponible.'}
            </h2>
            <p className="mt-3 text-sm leading-7 text-text-muted">
              {planTier === 'free'
                ? 'El siguiente salto natural es Esencial cuando el hogar ya necesita categorías propias, seguimiento más claro y más de una meta para sostener el mes.'
                : planTier === 'essential'
                  ? 'El siguiente salto natural es Estratégico cuando ya no basta con registrar: conviene anticiparse, comparar y decidir con más contexto.'
                  : 'Ahora el foco no está en subir de plan, sino en aprovechar mejor la proyección, las alertas y las recomendaciones para conducir el hogar con continuidad.'}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-bg/75 px-5 py-4 lg:w-80">
            <p className="text-xs uppercase tracking-[0.18em] text-text-light">Siguiente paso útil</p>
            <p className="mt-2 text-base font-semibold text-text">
              {planTier === 'free'
                ? 'Subir a Esencial cuando el mes ya pide más seguimiento.'
                : planTier === 'essential'
                  ? 'Subir a Estratégico cuando el hogar necesita anticiparse.'
                  : 'Mantener continuidad y usar mejor las señales del mes.'}
            </p>
            <p className="mt-2 text-sm leading-6 text-text-muted">
              {planTier === 'strategic'
                ? 'Revisa con frecuencia las alertas, la proyección y la comparación mensual para convertir continuidad en criterio.'
                : 'La suscripción no es solo un cobro. Es la etapa desde la que el hogar puede ordenar mejor o decidir mejor.'}
            </p>
          </div>
        </div>
      </Card>

      {featureUpgrade && (
        <UpgradePromptCard
          badge={featureUpgrade.badge}
          title={featureUpgrade.title}
          description={featureUpgrade.description}
          highlights={featureUpgrade.highlights}
          actionLabel={featureUpgrade.actionLabel || 'Ver planes'}
          onAction={() => document.getElementById('planes-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          compact
          trackingContext={`subscription-feature-${searchParams.get('feature') || 'unknown'}`}
        />
      )}

      {!featureUpgrade && requestedPlan && (requestedPlan === 'essential' || requestedPlan === 'strategic') && (
        <AlertBanner
          type="info"
          message={`Actualiza a ${getPlanName(requestedPlan as PlanTier)} para desbloquear esta funcion.`}
        />
      )}

      {syncMessage && (
        <AlertBanner
          type={planTier === 'free' ? 'info' : 'success'}
          message={syncMessage}
          onClose={() => setSyncMessage(null)}
        />
      )}

      {planTier === 'free' && (
        <UpgradePromptCard
          badge="Disponible al subir de plan"
          title="Free sirve para partir. El siguiente salto es ordenar el mes."
          description="Sube a Esencial si ya necesitas categorías propias, reparto y múltiples metas. Sube a Estratégico si además quieres comparación, proyección y alertas."
          highlights={['Categorías personalizadas', 'Calendario completo', 'Comparación y proyección']}
          actionLabel="Ver planes"
          onAction={() => document.getElementById('planes-disponibles')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          trackingContext="subscription-free-upgrade"
        />
      )}

      {subscription?.status === 'pending' && isOwner && (
        <AlertBanner
          type="warning"
          message="La suscripción sigue pendiente. Si ya terminaste el pago en Mercado Pago, sincroniza el estado."
          action={{ label: syncing ? 'Sincronizando...' : 'Sincronizar ahora', onClick: () => { void syncSubscriptionStatus(); } }}
        />
      )}

      <section className="rounded-[1.8rem] border border-border bg-surface/88 px-6 py-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Planes disponibles</p>
            <h2 className="display-heading mt-2 text-3xl text-text">
              {isActivePaidPlan ? 'Cambia tu plan' : 'Elige un plan para comenzar'}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
              Free sirve para empezar con claridad. Esencial ordena el funcionamiento cotidiano del hogar. Estratégico añade anticipación, alertas y mejor criterio para decidir.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-sm ${!annual ? 'font-semibold text-text' : 'text-text-muted'}`}>Mensual</span>
            <button
              onClick={() => setAnnual(!annual)}
              className={`relative h-6 w-12 rounded-full transition-colors cursor-pointer ${annual ? 'bg-primary' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm ${annual ? 'font-semibold text-text' : 'text-text-muted'}`}>
              Anual <span className="text-xs text-success">Mejor precio</span>
            </span>
          </div>
        </div>
      </section>

      <div id="planes-disponibles" className="grid gap-6 lg:grid-cols-3">
        {(['free', 'essential', 'strategic'] as const).map((tier: PlanTier) => {
          const plan = PUBLIC_PLAN_INFO[tier];
          const price = annual ? plan.prices.yearly : plan.prices.monthly;
          const isStrategic = tier === 'strategic';
          const isEssential = tier === 'essential';
          const currentCycle = annual ? 'yearly' : 'monthly';
          const isCurrent = tier === planTier && (tier === 'free' || billingCycle === currentCycle);
          const billingPlanCode = plan.billingPlanCode as BillingPlanCode | null;

          return (
            <Card
              key={tier}
              className={`rounded-[2rem] p-7 ${isStrategic ? 'border-primary/35 bg-linear-to-br from-primary-bg/86 to-surface shadow-[0_20px_45px_rgba(23,59,69,0.10)]' : 'bg-surface'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">
                    {tier === 'free' ? 'Primer paso' : isEssential ? 'Recomendado' : 'Más visión'}
                  </p>
                  <h3 className="display-heading mt-3 text-3xl text-text">{plan.name}</h3>
                </div>
                {isCurrent ? <PlanBadge>Actual</PlanBadge> : isEssential ? <PlanBadge>Más razonable</PlanBadge> : isStrategic ? <PlanBadge>Premium</PlanBadge> : null}
              </div>

              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-primary">{plan.promise}</p>
              <p className="mt-3 min-h-[88px] text-sm leading-7 text-text-muted">{plan.description}</p>

              <div className="mt-6 rounded-[1.5rem] border border-border bg-bg/75 px-5 py-4">
                <span className="text-4xl font-bold text-text">{price === null ? 'Gratis' : formatCLP(price)}</span>
                {price !== null && <span className="ml-1 text-sm text-text-muted">/{annual ? 'año' : 'mes'}</span>}
                {annual && price !== null && (
                  <p className="mt-2 text-xs font-semibold text-success">Ahorras {formatCLP(plan.savings.yearly)} al año</p>
                )}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.featureHighlights.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <Button variant="secondary" className="mt-8 w-full" disabled>
                  Plan actual
                </Button>
              ) : tier === 'free' ? (
                <Button
                  variant="secondary"
                  className="mt-8 w-full"
                  onClick={handleDowngradeToFree}
                  loading={loading}
                  disabled={!isOwner || !isActivePaidPlan}
                >
                  Volver a Free
                </Button>
              ) : (
                <Button
                  variant={isStrategic ? 'primary' : 'secondary'}
                  className="mt-8 w-full"
                  onClick={() => billingPlanCode && handleSelectPlan(billingPlanCode)}
                  loading={loading}
                  disabled={!isOwner}
                >
                  {isActivePaidPlan ? `Cambiar a ${plan.name}` : `Elegir ${plan.name}`} <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SubscriptionSignal({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-border bg-bg/72 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-text-light">{label}</p>
      <p className="mt-2 text-2xl font-bold text-text">{value}</p>
      <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}
