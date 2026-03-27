export type PlanTier = 'free' | 'essential' | 'strategic';
export type BillingPlanCode = 'base' | 'plus' | 'admin';
export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'pending' | 'cancelled' | 'expired' | 'failed' | 'inactive';

export type FeatureKey =
  | 'dashboard_basic'
  | 'dashboard_full'
  | 'transactions_manual'
  | 'transactions_edit_delete'
  | 'categories_system'
  | 'categories_custom'
  | 'budget_general'
  | 'budget_by_category'
  | 'goals_single'
  | 'goals_multiple'
  | 'calendar_basic'
  | 'calendar_full'
  | 'split_manual'
  | 'monthly_summary_basic'
  | 'monthly_summary_full'
  | 'monthly_close_simple'
  | 'export_basic'
  | 'export_advanced'
  | 'recurring_transactions'
  | 'csv_import'
  | 'monthly_comparison'
  | 'monthly_projection'
  | 'smart_alerts'
  | 'recommendations'
  | 'guided_close_advanced'
  | 'insights_financial_health';

export type PlanFeatureMatrix = Record<PlanTier, Record<FeatureKey, boolean>>;

export const PLAN_FEATURES: PlanFeatureMatrix = {
  free: {
    dashboard_basic: true,
    dashboard_full: false,
    transactions_manual: true,
    transactions_edit_delete: true,
    categories_system: true,
    categories_custom: false,
    budget_general: true,
    budget_by_category: false,
    goals_single: true,
    goals_multiple: false,
    calendar_basic: true,
    calendar_full: false,
    split_manual: false,
    monthly_summary_basic: true,
    monthly_summary_full: false,
    monthly_close_simple: false,
    export_basic: false,
    export_advanced: false,
    recurring_transactions: false,
    csv_import: false,
    monthly_comparison: false,
    monthly_projection: false,
    smart_alerts: false,
    recommendations: false,
    guided_close_advanced: false,
    insights_financial_health: false,
  },
  essential: {
    dashboard_basic: true,
    dashboard_full: true,
    transactions_manual: true,
    transactions_edit_delete: true,
    categories_system: true,
    categories_custom: true,
    budget_general: true,
    budget_by_category: true,
    goals_single: true,
    goals_multiple: true,
    calendar_basic: true,
    calendar_full: true,
    split_manual: true,
    monthly_summary_basic: true,
    monthly_summary_full: true,
    monthly_close_simple: true,
    export_basic: true,
    export_advanced: false,
    recurring_transactions: false,
    csv_import: false,
    monthly_comparison: false,
    monthly_projection: false,
    smart_alerts: false,
    recommendations: false,
    guided_close_advanced: false,
    insights_financial_health: false,
  },
  strategic: {
    dashboard_basic: true,
    dashboard_full: true,
    transactions_manual: true,
    transactions_edit_delete: true,
    categories_system: true,
    categories_custom: true,
    budget_general: true,
    budget_by_category: true,
    goals_single: true,
    goals_multiple: true,
    calendar_basic: true,
    calendar_full: true,
    split_manual: true,
    monthly_summary_basic: true,
    monthly_summary_full: true,
    monthly_close_simple: true,
    export_basic: true,
    export_advanced: true,
    recurring_transactions: true,
    csv_import: true,
    monthly_comparison: true,
    monthly_projection: true,
    smart_alerts: true,
    recommendations: true,
    guided_close_advanced: true,
    insights_financial_health: true,
  },
};

export interface PlanLimits {
  maxGoals: number | null;
  maxMembers: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    maxGoals: 1,
    maxMembers: 2,
  },
  essential: {
    maxGoals: null,
    maxMembers: 2,
  },
  strategic: {
    maxGoals: null,
    maxMembers: 2,
  },
};

export interface PublicPlanInfo {
  tier: PlanTier;
  billingPlanCode: Exclude<BillingPlanCode, 'admin'> | null;
  name: string;
  promise: string;
  description: string;
  featureHighlights: string[];
  prices: {
    monthly: number | null;
    yearly: number | null;
  };
  savings: {
    yearly: number;
  };
}

interface FeatureUpgradeContent {
  title: string;
  description: string;
  highlights: string[];
}

export const PUBLIC_PLAN_INFO: Record<PlanTier, PublicPlanInfo> = {
  free: {
    tier: 'free',
    billingPlanCode: null,
    name: 'Free',
    promise: 'Empieza con claridad.',
    description: 'Para dar el primer paso sin fricción y convertir el mes en una conversación más clara.',
    featureHighlights: [
      'Registra ingresos y gastos sin complejidad',
      'Ten una vista básica del mes y sus vencimientos',
      'Mantén una primera meta de ahorro visible',
    ],
    prices: {
      monthly: null,
      yearly: null,
    },
    savings: {
      yearly: 0,
    },
  },
  essential: {
    tier: 'essential',
    billingPlanCode: 'base',
    name: 'Esencial',
    promise: 'Ordena el funcionamiento cotidiano del hogar.',
    description: 'Para hogares que ya necesitan seguimiento real, acuerdos más claros y una operación mensual bien conducida.',
    featureHighlights: [
      'Categorías propias y lectura más completa del mes',
      'Múltiples metas, calendario completo y presupuesto por categoría',
      'Reparto manual, quién pagó qué y cierre mensual simple',
    ],
    prices: {
      monthly: 2990,
      yearly: 29900,
    },
    savings: {
      yearly: 5980,
    },
  },
  strategic: {
    tier: 'strategic',
    billingPlanCode: 'plus',
    name: 'Estratégico',
    promise: 'Conduce el hogar con visión y criterio.',
    description: 'Para hogares que quieren anticiparse, comparar escenarios del mes y decidir mejor con más contexto.',
    featureHighlights: [
      'Recurrencias e importación CSV para reducir fricción operativa',
      'Comparación mensual y proyección de cierre para anticiparte',
      'Alertas, recomendaciones y salud financiera del hogar',
    ],
    prices: {
      monthly: 4990,
      yearly: 49900,
    },
    savings: {
      yearly: 9980,
    },
  },
};

const FEATURE_UPGRADE_CONTENT: Record<FeatureKey, FeatureUpgradeContent> = {
  dashboard_basic: {
    title: 'Panel general básico',
    description: 'Visualiza los números esenciales del hogar desde un solo lugar.',
    highlights: ['Saldo del mes', 'Ingresos y gastos', 'Pagos próximos'],
  },
  dashboard_full: {
    title: 'Panel completo del hogar',
    description: 'Desbloquea una lectura más útil del mes con más contexto para decidir.',
    highlights: ['Vista ampliada por categorías', 'Aportes compartidos', 'Balance mensual más claro'],
  },
  transactions_manual: {
    title: 'Registro manual de movimientos',
    description: 'Empieza a ordenar el hogar registrando ingresos y gastos.',
    highlights: ['Ingresos', 'Gastos', 'Historial del mes'],
  },
  transactions_edit_delete: {
    title: 'Edición y limpieza de movimientos',
    description: 'Corrige errores y mantén tus números consistentes.',
    highlights: ['Editar montos', 'Eliminar duplicados', 'Mantener trazabilidad'],
  },
  categories_system: {
    title: 'Categorías base del sistema',
    description: 'Ordena lo esencial sin configurar nada antes.',
    highlights: ['Categorías listas para usar', 'Orden inmediato', 'Criterio simple'],
  },
  categories_custom: {
    title: 'Categorías personalizadas',
    description: 'Crea categorías propias para que el análisis se parezca a tu hogar.',
    highlights: ['Categorías nuevas', 'Edición de categorías', 'Presupuesto más preciso'],
  },
  budget_general: {
    title: 'Presupuesto general del mes',
    description: 'Ten una referencia simple para no perder el control del mes.',
    highlights: ['Visión mensual', 'Control operativo', 'Lectura rápida'],
  },
  budget_by_category: {
    title: 'Presupuesto por categoría',
    description: 'Controla mejor el gasto donde más se te escapa el dinero.',
    highlights: ['Topes por categoría', 'Seguimiento más fino', 'Decisiones más concretas'],
  },
  goals_single: {
    title: 'Meta principal de ahorro',
    description: 'Empieza con una meta clara para crear hábito.',
    highlights: ['1 meta activa', 'Seguimiento simple', 'Progreso visible'],
  },
  goals_multiple: {
    title: 'Múltiples metas de ahorro',
    description: 'Trabaja varios objetivos al mismo tiempo sin perder foco.',
    highlights: ['Más de una meta activa', 'Priorizar objetivos', 'Organización más realista'],
  },
  calendar_basic: {
    title: 'Calendario básico de vencimientos',
    description: 'Revisa pagos pendientes y evita olvidos del mes.',
    highlights: ['Vencimientos', 'Estado básico', 'Control rápido'],
  },
  calendar_full: {
    title: 'Calendario completo',
    description: 'Gestiona pagos programados con edición, categorías y seguimiento completo.',
    highlights: ['Crear pagos programados', 'Editar vencimientos', 'Mantener calendario al día'],
  },
  split_manual: {
    title: 'Reparto manual y quién pagó qué',
    description: 'Ajusta el reparto del hogar con más justicia y transparencia.',
    highlights: ['Reglas flexibles', 'Quién pagó qué', 'Aportes compartidos más claros'],
  },
  monthly_summary_basic: {
    title: 'Resumen mensual simple',
    description: 'Cierra el mes con una lectura básica de lo que pasó.',
    highlights: ['Ingresos', 'Gastos', 'Lectura rápida del mes'],
  },
  monthly_summary_full: {
    title: 'Resumen mensual ampliado',
    description: 'Entiende mejor cómo cerró el mes y dónde estuvo la presión del hogar.',
    highlights: ['Más detalle', 'Lectura por categorías', 'Balance más útil'],
  },
  monthly_close_simple: {
    title: 'Cierre mensual simple',
    description: 'Guarda una foto del mes para revisar después con contexto.',
    highlights: ['Guardar el cierre', 'Historial mensual', 'Proceso guiado simple'],
  },
  export_basic: {
    title: 'Exportación básica',
    description: 'Saca tus datos cuando necesites revisarlos fuera de la app.',
    highlights: ['Datos exportables', 'Seguimiento externo', 'Más control'],
  },
  export_advanced: {
    title: 'Exportación ampliada',
    description: 'Trabaja con tus datos en mayor profundidad cuando el hogar ya está más maduro.',
    highlights: ['Más detalle', 'Uso avanzado', 'Análisis externo'],
  },
  recurring_transactions: {
    title: 'Movimientos recurrentes',
    description: 'Reduce trabajo operativo dejando listos los gastos que se repiten todos los meses.',
    highlights: ['Reglas recurrentes', 'Pagos automáticos del mes', 'Menos carga manual'],
  },
  csv_import: {
    title: 'Importación por CSV',
    description: 'Carga muchos movimientos de una vez cuando el hogar ya necesita más velocidad.',
    highlights: ['Importación masiva', 'Menos digitación', 'Arranque más rápido'],
  },
  monthly_comparison: {
    title: 'Comparación entre meses',
    description: 'Detecta si mejoraron o empeoraron y en qué categorías se movió el hogar.',
    highlights: ['Mes actual vs anterior', 'Cambios por categoría', 'Aprendizaje real'],
  },
  monthly_projection: {
    title: 'Proyección de cierre del mes',
    description: 'Anticípate antes de llegar tarde al final del mes.',
    highlights: ['Cierre estimado', 'Pagos pendientes', 'Prevención temprana'],
  },
  smart_alerts: {
    title: 'Alertas inteligentes',
    description: 'Recibe señales tempranas cuando el hogar se empieza a desordenar.',
    highlights: ['Sobre gasto', 'Vencimientos críticos', 'Desvíos del presupuesto'],
  },
  recommendations: {
    title: 'Recomendaciones personalizadas',
    description: 'Convierte tus datos en acciones concretas para el siguiente paso.',
    highlights: ['Sugerencias accionables', 'Ajustes por categoría', 'Mejor criterio de decisión'],
  },
  guided_close_advanced: {
    title: 'Cierre guiado avanzado',
    description: 'Cierra el mes con más contexto y mejor lectura para decidir el siguiente.',
    highlights: ['Proceso más completo', 'Contexto premium', 'Mejor seguimiento'],
  },
  insights_financial_health: {
    title: 'Salud financiera del hogar',
    description: 'Mide de forma simple si el hogar está ordenado, tensionado o en riesgo.',
    highlights: ['Semáforo financiero', 'Lectura rápida', 'Contexto premium'],
  },
};

export const PLAN_TIER_ORDER: readonly PlanTier[] = ['free', 'essential', 'strategic'] as const;

export function getPlanRank(plan: PlanTier) {
  return PLAN_TIER_ORDER.indexOf(plan);
}

export function isPlanAtLeast(currentPlan: PlanTier, requiredPlan: PlanTier) {
  return getPlanRank(currentPlan) >= getPlanRank(requiredPlan);
}

export function hasFeature(plan: PlanTier, feature: FeatureKey) {
  return PLAN_FEATURES[plan][feature];
}

export function getPlanCapabilities(plan: PlanTier) {
  return {
    tier: plan,
    features: PLAN_FEATURES[plan],
    limits: PLAN_LIMITS[plan],
    info: PUBLIC_PLAN_INFO[plan],
  };
}

export function mapBillingPlanCodeToTier(planCode: BillingPlanCode | null | undefined): PlanTier {
  switch (planCode) {
    case 'base':
      return 'essential';
    case 'plus':
    case 'admin':
      return 'strategic';
    default:
      return 'free';
  }
}

export function resolvePlanTier(subscription: {
  plan_code?: string | null;
  status?: string | null;
} | null | undefined): PlanTier {
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  return mapBillingPlanCodeToTier(subscription.plan_code as BillingPlanCode | null | undefined);
}

export function getFeatureRequiredPlan(feature: FeatureKey): PlanTier {
  for (const tier of PLAN_TIER_ORDER) {
    if (PLAN_FEATURES[tier][feature]) {
      return tier;
    }
  }

  return 'strategic';
}

export function getUpgradePlanForFeature(feature: FeatureKey): Exclude<PlanTier, 'free'> | null {
  const required = getFeatureRequiredPlan(feature);
  return required === 'free' ? null : required;
}

export function getPlanName(plan: PlanTier) {
  return PUBLIC_PLAN_INFO[plan].name;
}

export function getPlanDescription(plan: PlanTier) {
  return PUBLIC_PLAN_INFO[plan].description;
}

export function getPlanPromise(plan: PlanTier) {
  return PUBLIC_PLAN_INFO[plan].promise;
}

export function getPlanMaxGoals(plan: PlanTier) {
  return PLAN_LIMITS[plan].maxGoals;
}

export function getPlanMaxMembers(plan: PlanTier) {
  return PLAN_LIMITS[plan].maxMembers;
}

export function canCreateGoal(plan: PlanTier, activeGoalsCount: number) {
  const maxGoals = getPlanMaxGoals(plan);
  return maxGoals === null || activeGoalsCount < maxGoals;
}

export function getFeatureUpgradeCopy(feature: FeatureKey) {
  const requiredPlan = getUpgradePlanForFeature(feature);
  if (!requiredPlan) {
    return {
      requiredPlan: null,
      badge: '',
      message: '',
      actionLabel: '',
      route: '/app/suscripcion',
      title: '',
      description: '',
      highlights: [] as string[],
    };
  }

  const content = FEATURE_UPGRADE_CONTENT[feature];

  return {
    requiredPlan,
    badge: `Disponible en ${getPlanName(requiredPlan)}`,
    message: `Actualiza tu plan para usar esta función.`,
    actionLabel: `Ver ${getPlanName(requiredPlan)}`,
    route: `/app/suscripcion?plan=${requiredPlan}&feature=${feature}`,
    title: content.title,
    description: content.description,
    highlights: content.highlights,
  };
}
