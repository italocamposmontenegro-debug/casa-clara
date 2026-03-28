import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, PlanBadge } from '../../components/ui';
import { APP_NAME, APP_TAGLINE, PUBLIC_PLAN_INFO, type PlanTier } from '../../lib/constants';
import { trackEvent } from '../../lib/analytics';
import { formatCLP } from '../../utils/format-clp';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle,
  ChevronDown,
  CircleDollarSign,
  Compass,
  Home,
  PiggyBank,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

const PLAN_STAGES: Array<{
  tier: PlanTier;
  eyebrow: string;
  question: string;
  summary: string;
  bullets: string[];
}> = [
  {
    tier: 'free',
    eyebrow: 'Empezar con claridad',
    question: '¿Cómo empiezo a ordenar mi hogar sin fricción?',
    summary: 'Da el primer paso con una lectura simple del mes, una meta visible y los movimientos esenciales en un mismo lugar.',
    bullets: ['Movimientos manuales', '1 meta visible', 'Calendario básico'],
  },
  {
    tier: 'essential',
    eyebrow: 'Orden cotidiano',
    question: '¿Cómo mantengo orden y seguimiento real?',
    summary: 'Ordena el funcionamiento del hogar con categorías propias, reparto, seguimiento real y una base clara para conversar el mes.',
    bullets: ['Categorías propias', 'Múltiples metas', 'Reparto y cierre simple'],
  },
  {
    tier: 'strategic',
    eyebrow: 'Dirección compartida',
    question: '¿Cómo tomo decisiones con visión y planificación?',
    summary: 'Añade anticipación, alertas y análisis para decidir antes de que el mes se desordene y sostener mejor las metas del hogar.',
    bullets: ['Recurrencias e importación', 'Comparación y proyección', 'Alertas e insights'],
  },
];

const COMPARISON_ROWS: Array<{ label: string; free: boolean; essential: boolean; strategic: boolean }> = [
  { label: 'Lectura básica del hogar', free: true, essential: true, strategic: true },
  { label: 'Categorías personalizadas', free: false, essential: true, strategic: true },
  { label: 'Múltiples metas', free: false, essential: true, strategic: true },
  { label: 'Reparto y quién pagó qué', free: false, essential: true, strategic: true },
  { label: 'Recurrencias e importación CSV', free: false, essential: false, strategic: true },
  { label: 'Comparación entre meses', free: false, essential: false, strategic: true },
  { label: 'Proyección, alertas y recomendaciones', free: false, essential: false, strategic: true },
];

const PROBLEM_POINTS = [
  {
    icon: CircleDollarSign,
    title: 'Gastos que aparecen tarde',
    description: 'El mes se desordena cuando cada gasto vive en conversaciones sueltas, memoria o capturas dispersas.',
  },
  {
    icon: Target,
    title: 'Metas sin seguimiento',
    description: 'Ahorrar se vuelve difuso cuando el hogar no tiene una referencia clara para medir avances y prioridades.',
  },
  {
    icon: Users,
    title: 'Acuerdos sin base común',
    description: 'La fricción crece cuando cada persona mira el hogar desde una versión distinta del mismo mes.',
  },
  {
    icon: Compass,
    title: 'Decisiones sin dirección',
    description: 'Sin visibilidad compartida, decidir qué ajustar, qué pagar o qué postergar se vuelve más incierto.',
  },
];

const VALUE_PILLARS = [
  {
    icon: BarChart3,
    title: 'Ve el mes con una sola lectura',
    description: 'Ingresos, gastos, metas y vencimientos quedan en una misma referencia, sin planillas ni conversaciones perdidas.',
  },
  {
    icon: Users,
    title: 'Coordina el hogar con menos fricción',
    description: 'Cada miembro ve el mismo panorama y puede seguir acuerdos, aportes y prioridades desde un mismo espacio.',
  },
  {
    icon: PiggyBank,
    title: 'Sostén metas con criterio',
    description: 'Las metas dejan de ser intenciones vagas y pasan a tener avance, contexto y prioridad dentro del mes real.',
  },
  {
    icon: TrendingUp,
    title: 'Decide con más calma',
    description: 'Cuando el hogar madura, Compás Hogar añade anticipación para que decidir no dependa de urgencias de último minuto.',
  },
];

const OUTCOMES = [
  {
    icon: Sparkles,
    title: 'Menos ruido doméstico',
    description: 'Menos memoria improvisada, menos doble registro y menos conversaciones reactivas sobre lo mismo.',
  },
  {
    icon: Shield,
    title: 'Más confianza para decidir',
    description: 'Una lectura clara del hogar da seguridad para priorizar pagos, metas y acuerdos sin rigidez ni drama.',
  },
  {
    icon: Home,
    title: 'Una vida del hogar mejor conducida',
    description: 'No se trata solo de registrar gastos. Se trata de darle dirección cotidiana al hogar con una herramienta habitable.',
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(true);

  function handlePrimaryCta(context: string) {
    trackEvent('landing_cta_primary_click', { context });
    navigate('/registro');
  }

  function handlePlansCta(context: string) {
    trackEvent('landing_cta_plans_click', { context });
    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-surface/88 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-lg font-bold text-text">{APP_NAME}</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-text-light">Claridad compartida para el hogar</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Button>
            <Button variant="primary" size="sm" onClick={() => handlePrimaryCta('header')}>
              Crear cuenta
            </Button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-8 pb-20 pt-16 lg:px-16 lg:pb-32 lg:pt-28">
        <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top_left,_rgba(184,130,47,0.14),_transparent_30%),radial-gradient(circle_at_82%_14%,_rgba(47,115,133,0.12),_transparent_26%),linear-gradient(180deg,transparent,rgba(255,253,249,0.45))]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-3xl">
            <div className="eyebrow mb-6">
              <Sparkles className="h-4 w-4" />
              Sistema de claridad compartida
            </div>
            <h1 className="display-heading text-5xl leading-[0.94] text-text lg:text-7xl">
              Ordena el hogar con más claridad,
              <span className="mt-2 block text-primary">acuerdos y dirección compartida.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-text-secondary lg:text-xl">
              {APP_TAGLINE} {APP_NAME} reúne ingresos, gastos, metas y seguimiento del hogar en una experiencia serena, elegante y fácil de compartir.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="lg" onClick={() => handlePrimaryCta('hero')}>
                Crear mi hogar <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => handlePlansCta('hero')}>
                Ver planes
              </Button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <HeroSignal
                icon={<CircleDollarSign className="h-5 w-5" />}
                title="Una lectura común"
                description="El hogar deja de depender de recuerdos sueltos y conversaciones a medias."
              />
              <HeroSignal
                icon={<Users className="h-5 w-5" />}
                title="Acuerdos más claros"
                description="Cada persona ve el mismo mes y puede coordinar mejor pagos, aportes y metas."
              />
              <HeroSignal
                icon={<TrendingUp className="h-5 w-5" />}
                title="Decisiones con contexto"
                description="Empieza simple y suma visión cuando el hogar necesite anticiparse mejor."
              />
            </div>
          </div>

          <div className="paper-panel surface-glow rounded-[2.5rem] p-8 lg:p-12 shadow-ambient">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Vista del hogar</p>
                <h2 className="display-heading mt-3 text-3xl text-text">Una referencia que acompaña el mes</h2>
              </div>
              <PlanBadge>{annual ? 'Anual' : 'Mensual'}</PlanBadge>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <MetricCard icon={<CircleDollarSign className="h-5 w-5" />} label="Saldo del mes" value="$312.000" tone="primary" />
              <MetricCard icon={<PiggyBank className="h-5 w-5" />} label="Meta principal" value="62%" tone="accent" />
              <MetricCard icon={<CalendarCheck className="h-5 w-5" />} label="Pagos abiertos" value="3" tone="warning" />
              <MetricCard icon={<Target className="h-5 w-5" />} label="Ahorro posible" value="$120.000" tone="success" />
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-border bg-bg/85 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Cómo crece contigo</p>
                  <p className="mt-2 text-base font-semibold text-text">De ordenar el presente a conducir mejor el siguiente paso del hogar.</p>
                </div>
                <Compass className="h-5 w-5 text-primary" />
              </div>

              <div className="mt-8 space-y-6">
                {PLAN_STAGES.map((stage, index) => (
                  <div key={stage.tier} className="rounded-3xl border border-border bg-surface px-6 py-5 shadow-xs transition-colors hover:bg-surface-muted">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-bg text-primary text-sm font-bold shadow-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-text-light">{stage.eyebrow}</p>
                          <p className="text-sm font-semibold text-text">{PUBLIC_PLAN_INFO[stage.tier].name}</p>
                        </div>
                      </div>
                      {stage.tier === 'essential' && <PlanBadge>Más elegido</PlanBadge>}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-text-muted">{stage.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/86 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow mb-4">La tensión cotidiana</p>
            <h2 className="display-heading text-4xl text-text">Cuando el hogar depende de la memoria, todo se vuelve más difuso.</h2>
            <p className="mt-4 text-base leading-7 text-text-muted">
              Compás Hogar parte de una verdad simple: la fricción doméstica crece cuando el dinero, los pagos y las metas viven repartidos entre memoria, chats y conversaciones sueltas.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {PROBLEM_POINTS.map((item) => (
              <EditorialCard key={item.title} icon={<item.icon className="h-5 w-5" />} title={item.title} description={item.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow mb-4">Lo que propone</p>
              <h2 className="display-heading text-4xl text-text">Un sistema sereno para ordenar la vida cotidiana del hogar.</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-text-muted">
              No es una planilla bonita ni un dashboard financiero genérico. Es una referencia compartida para ver el mes, sostener acuerdos y decidir mejor.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {VALUE_PILLARS.map((pillar) => (
              <div key={pillar.title} className="paper-panel rounded-[1.8rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-bg text-primary">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-text">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-7 text-text-muted">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/82 px-4 py-20 lg:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="eyebrow mx-auto mb-4">Planes</p>
            <h2 className="display-heading text-4xl text-text">Tres etapas para conducir mejor el hogar</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-text-muted">
              Cada plan responde a una etapa distinta. Free te deja empezar sin fricción. Esencial ordena el funcionamiento real del mes. Estratégico añade anticipación y criterio para decidir mejor.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PLAN_STAGES.map((stage) => {
              const plan = PUBLIC_PLAN_INFO[stage.tier];
              const isEssential = stage.tier === 'essential';
              const isStrategic = stage.tier === 'strategic';

              return (
                <div
                  key={stage.tier}
                  className={`surface-glow rounded-[2.5rem] border p-10 shadow-sm ${
                    isEssential
                      ? 'border-primary/30 bg-linear-to-br from-primary-bg/82 to-surface shadow-[0_20px_45px_rgba(23,59,69,0.10)] lg:-translate-y-2'
                      : isStrategic
                        ? 'border-border bg-linear-to-br from-surface to-primary-bg/35'
                        : 'border-border bg-surface'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">{stage.eyebrow}</p>
                      <h3 className="display-heading mt-3 text-3xl text-text">{plan.name}</h3>
                    </div>
                    {isEssential ? <PlanBadge>Más razonable</PlanBadge> : isStrategic ? <PlanBadge>Más visión</PlanBadge> : null}
                  </div>

                  <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-primary">{plan.promise}</p>
                  <p className="mt-4 text-sm font-medium text-text">{stage.question}</p>
                  <p className="mt-3 text-sm leading-7 text-text-muted">{stage.summary}</p>

                  <ul className="mt-6 space-y-3">
                    {stage.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-text-secondary">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="planes" className="px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="eyebrow mx-auto mb-4">Precios</p>
            <h2 className="display-heading text-4xl text-text">Elige la etapa correcta para tu hogar</h2>
            <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-text-muted">
              La mejor opción para la mayoría es Esencial. Estratégico vale el salto cuando el hogar ya necesita anticiparse, no solo registrar.
            </p>
          </div>
          <PricingCards annual={annual} setAnnual={setAnnual} onSelect={(tier) => handlePrimaryCta(`pricing-${tier}`)} />
        </div>
      </section>

      <section className="border-y border-border bg-surface/85 px-8 py-20 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow mb-4">Qué cambia en cada etapa</p>
            <h2 className="display-heading text-4xl text-text">La diferencia entre planes se entiende en segundos.</h2>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-sm">
            <div className="grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] border-b border-border bg-bg/75 text-sm font-semibold text-text">
              <div className="px-5 py-4">Capacidad</div>
              <div className="px-5 py-4 text-center">Free</div>
              <div className="px-5 py-4 text-center">Esencial</div>
              <div className="px-5 py-4 text-center">Estratégico</div>
            </div>
            {COMPARISON_ROWS.map((row) => (
              <div key={row.label} className="grid grid-cols-[1.3fr_repeat(3,minmax(0,1fr))] border-b border-border/70 text-sm last:border-b-0">
                <div className="px-5 py-4 text-text-secondary">{row.label}</div>
                <ComparisonCell enabled={row.free} />
                <ComparisonCell enabled={row.essential} />
                <ComparisonCell enabled={row.strategic} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="eyebrow mb-4">Lo que se siente</p>
            <h2 className="display-heading text-4xl text-text">Más que una app de gastos: una forma más clara de conducir el hogar.</h2>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {OUTCOMES.map((outcome) => (
              <EditorialCard key={outcome.title} icon={<outcome.icon className="h-5 w-5" />} title={outcome.title} description={outcome.description} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface/85 px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="eyebrow mx-auto mb-4">Preguntas frecuentes</p>
            <h2 className="display-heading text-4xl text-text">Lo necesario antes de empezar</h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: `¿Puedo usar ${APP_NAME} si todavía no invito a mi pareja?`,
                a: 'Sí. Puedes crear tu hogar, ordenar el mes y compartir el acceso cuando tenga sentido.',
              },
              {
                q: '¿Free sirve de verdad o es solo una demo?',
                a: 'Free sirve para empezar con una lectura básica del mes, crear una primera meta y formar el hábito de mirar el hogar con claridad.',
              },
              {
                q: '¿Cuándo conviene subir a Esencial?',
                a: 'Cuando el hogar ya necesita categorías propias, más de una meta, reparto manual y seguimiento más real del mes.',
              },
              {
                q: '¿Cuándo vale la pena Estratégico?',
                a: 'Cuando ya no basta con registrar: el hogar necesita comparar, anticiparse y tomar decisiones con más contexto.',
              },
              {
                q: '¿Puedo cambiar de plan después?',
                a: 'Sí. Puedes moverte entre Free, Esencial y Estratégico desde la suscripción del hogar.',
              },
            ].map((faq) => (
              <FAQItem key={faq.q} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-8 py-24 lg:px-16">
        <div className="mx-auto max-w-5xl rounded-[2.2rem] border border-primary/20 bg-linear-to-br from-primary to-primary-light px-8 py-12 text-center text-white shadow-[0_24px_60px_rgba(23,59,69,0.18)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/70">{APP_NAME}</p>
          <h2 className="display-heading mt-4 text-4xl text-white">Empieza con claridad. Crece con más criterio cuando el hogar lo pida.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-white/82">
            Crea el hogar, ordena el primer mes y deja que la herramienta crezca contigo a medida que el hogar necesite más seguimiento o más visión.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" onClick={() => handlePrimaryCta('closing-cta')} className="!bg-white !text-primary hover:!bg-white/92">
              Crear cuenta <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => handlePlansCta('closing-cta')} className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/16">
              Ver planes
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface/80 px-4 py-8 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white">
              <Home className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-sm font-semibold text-text">{APP_NAME}</span>
              <span className="block text-[11px] uppercase tracking-[0.18em] text-text-light">Claridad compartida para el hogar</span>
            </div>
          </div>
          <p className="text-xs text-text-muted">© {new Date().getFullYear()} {APP_NAME}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

function PricingCards({
  annual,
  setAnnual,
  onSelect,
}: {
  annual: boolean;
  setAnnual: (annual: boolean) => void;
  onSelect: (tier: PlanTier) => void;
}) {
  const planQuestions: Record<PlanTier, string> = {
    free: 'Para empezar a ordenar sin fricción.',
    essential: 'Para darle seguimiento real al funcionamiento cotidiano del hogar.',
    strategic: 'Para decidir con visión, planificación y criterio.',
  };

  return (
    <div>
      <div className="mb-10 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!annual ? 'text-text' : 'text-text-muted'}`}>Mensual</span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative h-6 w-12 rounded-full transition-colors cursor-pointer ${annual ? 'bg-primary' : 'bg-border'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${annual ? 'translate-x-6.5' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-text' : 'text-text-muted'}`}>
          Anual
          <span className="ml-1.5 text-xs font-semibold text-success">Mejor precio</span>
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {(['free', 'essential', 'strategic'] as const).map((tier: PlanTier) => {
          const plan = PUBLIC_PLAN_INFO[tier];
          const price = annual ? plan.prices.yearly : plan.prices.monthly;
          const isFree = tier === 'free';
          const isEssential = tier === 'essential';
          const isStrategic = tier === 'strategic';

          return (
            <div
              key={tier}
              className={`surface-glow rounded-[2rem] border p-8 shadow-sm transition-all ${
                isEssential
                  ? 'border-primary/35 bg-linear-to-br from-primary-bg/86 to-surface shadow-[0_20px_45px_rgba(23,59,69,0.12)] lg:-translate-y-3'
                  : isStrategic
                    ? 'border-border bg-linear-to-br from-surface to-primary-bg/35'
                    : 'border-border bg-surface'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">
                    {isFree ? 'Primer paso' : isEssential ? 'Recomendado' : 'Más visión'}
                  </p>
                  <h3 className="display-heading mt-3 text-3xl text-text">{plan.name}</h3>
                </div>
                {isEssential ? <PlanBadge>Más elegido</PlanBadge> : isStrategic ? <PlanBadge>Premium</PlanBadge> : null}
              </div>

              <p className="mt-4 text-sm font-semibold uppercase tracking-[0.08em] text-primary">{plan.promise}</p>
              <p className="mt-3 text-sm font-medium text-text">{planQuestions[tier]}</p>
              <p className="mt-3 min-h-[88px] text-sm leading-7 text-text-muted">{plan.description}</p>

              <div className="mt-6 rounded-[1.4rem] border border-border bg-bg/75 px-5 py-4">
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

              <Button variant={isEssential ? 'primary' : 'secondary'} className="mt-8 w-full" onClick={() => onSelect(tier)}>
                {isFree ? 'Empezar gratis' : isEssential ? 'Elegir Esencial' : 'Subir a Estratégico'}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeroSignal({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-border bg-surface/88 p-8 shadow-xs hover:shadow-ambient transition-all">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-bg text-primary shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-sm font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}

function EditorialCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="paper-panel rounded-[2rem] p-10 lg:p-12 shadow-sm hover:shadow-ambient transition-all">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-bg text-primary">
        {icon}
      </div>
      <h3 className="mt-5 text-lg font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}

function ComparisonCell({ enabled }: { enabled: boolean }) {
  return (
    <div className="flex items-center justify-center px-5 py-4">
      {enabled ? (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-success-bg text-success">
          <CheckCircle className="h-4 w-4" />
        </span>
      ) : (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-danger-bg text-danger">
          <Shield className="h-4 w-4 rotate-45" />
        </span>
      )}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: 'primary' | 'accent' | 'warning' | 'success';
}) {
  const toneClass = {
    primary: 'bg-primary-bg text-primary',
    accent: 'bg-[rgba(184,130,47,0.15)] text-[var(--color-accent)]',
    warning: 'bg-warning-bg text-warning',
    success: 'bg-success-bg text-success',
  }[tone];

  return (
    <div className="rounded-[1.8rem] border border-border bg-white/80 p-8 shadow-xs hover:shadow-ambient transition-all">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${toneClass}`}>{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-text-light">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-bg/70">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-surface-hover cursor-pointer"
      >
        <span className="text-sm font-semibold text-text">{question}</span>
        <ChevronDown className={`h-4 w-4 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-4">
          <p className="text-sm leading-6 text-text-muted">{answer}</p>
        </div>
      )}
    </div>
  );
}
