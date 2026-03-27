// ============================================
// Casa Clara — Shared UI Components
// ============================================

import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react';
import { Loader2, X, AlertTriangle, CheckCircle, Info, Lock, ArrowRight } from 'lucide-react';
import { APP_NAME } from '../../lib/constants';
import { clearPersistedSupabaseSession } from '../../lib/supabase';
import { trackEvent, trackOnce } from '../../lib/analytics';

// ============================================
// Button
// ============================================
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-light focus:ring-primary shadow-sm',
    secondary: 'bg-surface text-text border border-border hover:bg-surface-hover focus:ring-primary',
    ghost: 'text-text-muted hover:bg-surface-hover focus:ring-primary',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-danger',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ============================================
// Input
// ============================================
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function InputField({ label, error, hint, className = '', id, ...props }: InputFieldProps) {
  const inputId = id || label.toLowerCase().replace(/\s/g, '_');
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full px-3 py-2.5 rounded-lg border bg-surface text-text placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
          error ? 'border-danger' : 'border-border'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

// ============================================
// Select
// ============================================
interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export function SelectField({ label, value, onChange, options, error, placeholder }: SelectFieldProps) {
  const inputId = label.toLowerCase().replace(/\s/g, '_');
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary">
        {label}
      </label>
      <select
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2.5 rounded-lg border bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer ${
          error ? 'border-danger' : 'border-border'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

// ============================================
// Card
// ============================================
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddings = { sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={`bg-surface border border-border rounded-xl shadow-xs ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
}

// ============================================
// Modal
// ============================================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface rounded-xl shadow-lg w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-surface-hover cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Alert Banner
// ============================================
interface AlertBannerProps {
  type: 'info' | 'warning' | 'danger' | 'success';
  message: string;
  action?: { label: string; onClick: () => void };
  onClose?: () => void;
}

export function AlertBanner({ type, message, action, onClose }: AlertBannerProps) {
  const styles = {
    info: 'bg-info-bg border-info/20 text-info',
    warning: 'bg-warning-bg border-warning/20 text-warning',
    danger: 'bg-danger-bg border-danger/20 text-danger',
    success: 'bg-success-bg border-success/20 text-success',
  };

  const icons = {
    info: <Info className="h-4 w-4 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 shrink-0" />,
    danger: <AlertTriangle className="h-4 w-4 shrink-0" />,
    success: <CheckCircle className="h-4 w-4 shrink-0" />,
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${styles[type]}`}>
      {icons[type]}
      <p className="text-sm flex-1">{message}</p>
      {action && (
        <button onClick={action.onClick} className="text-sm font-semibold underline cursor-pointer">
          {action.label}
        </button>
      )}
      {onClose && (
        <button onClick={onClose} className="p-0.5 cursor-pointer">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ============================================
// Loading Spinner
// ============================================
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={`${sizes[size]} animate-spin text-primary`} />
    </div>
  );
}

// ============================================
// Loading Page
// ============================================
export function LoadingPage() {
  const [stalled, setStalled] = useState(false);

  const resetSession = () => {
    clearPersistedSupabaseSession();
    window.location.assign('/');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setStalled(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="surface-glow w-full max-w-lg rounded-[2rem] border border-border bg-surface px-8 py-10 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary-bg text-primary">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <p className="mt-6 text-[11px] uppercase tracking-[0.18em] text-text-light">Cargando</p>
        <h2 className="display-heading mt-3 text-3xl text-text">{APP_NAME} está preparando tu hogar</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-text-muted">
          Estamos recuperando tu sesion, tu hogar y el estado del mes para que vuelvas al punto correcto.
        </p>
        {stalled && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-text-muted max-w-xs mx-auto">
              La carga tardó más de lo normal. Puedes reintentar sin cerrar la ventana.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="sm" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
              <Button size="sm" variant="secondary" onClick={resetSession}>
                Restablecer sesión
              </Button>
              <Button size="sm" variant="ghost" onClick={() => window.location.assign('/')}>
                Ir al inicio
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Empty State
// ============================================
interface EmptyStateProps {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  secondaryText?: string;
  action?: { label: string; onClick: () => void };
}

interface BlockingStatePageProps {
  title: string;
  description: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export function BlockingStatePage({ title, description, primaryAction, secondaryAction }: BlockingStatePageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="surface-glow max-w-lg w-full bg-surface border border-border rounded-[2rem] p-8 text-center shadow-sm">
        <div className="h-14 w-14 rounded-3xl bg-warning-bg flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="h-6 w-6 text-warning" />
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Estado bloqueado</p>
        <h2 className="display-heading text-3xl text-text mt-3 mb-3">{title}</h2>
        <p className="text-sm text-text-muted mb-6 leading-6">{description}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction && (
            <Button onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, eyebrow, title, description, secondaryText, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      {icon && <div className="flex justify-center mb-4 text-text-light">{icon}</div>}
      {eyebrow && <p className="text-[11px] uppercase tracking-[0.18em] text-text-light mb-3">{eyebrow}</p>}
      <h3 className="text-lg font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-muted mb-6 max-w-md mx-auto">{description}</p>
      {secondaryText && <p className="text-xs text-text-light mb-6 max-w-sm mx-auto">{secondaryText}</p>}
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================
// Stat Card
// ============================================
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
  onClick?: () => void;
}

export function StatCard({ label, value, subValue, trend, icon, onClick }: StatCardProps) {
  const trendColors = {
    up: 'text-success',
    down: 'text-danger',
    neutral: 'text-text-muted',
  };

  const content = (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-text-muted">{label}</span>
        {icon && <span className="text-text-light">{icon}</span>}
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      {subValue && (
        <p className={`text-xs mt-1 ${trend ? trendColors[trend] : 'text-text-muted'}`}>
          {subValue}
        </p>
      )}
    </>
  );

  if (!onClick) {
    return (
      <div className="bg-surface border border-border rounded-xl p-5 shadow-xs">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface border border-border rounded-xl p-5 shadow-xs text-left w-full cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all"
    >
      {content}
    </button>
  );
}

// ============================================
// Restricted Banner (modo restringido)
// ============================================
export function RestrictedBanner({ message, actionLabel, onAction }: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="surface-glow bg-linear-to-br from-warning-bg to-surface border border-warning/20 rounded-[1.6rem] p-6 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-3xl bg-warning-bg">
        <AlertTriangle className="h-6 w-6 text-warning" />
      </div>
      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-warning">Funcion restringida</p>
      <p className="mt-3 text-sm text-warning font-medium mb-4">{message}</p>
      <Button variant="primary" size="sm" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

export function PlanBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary-bg px-3 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  );
}

export function UpgradePromptCard({
  badge,
  title,
  description,
  highlights = [],
  actionLabel,
  onAction,
  compact = false,
  trackingContext,
}: {
  badge: string;
  title: string;
  description: string;
  highlights?: string[];
  actionLabel: string;
  onAction: () => void;
  compact?: boolean;
  trackingContext?: string;
}) {
  function handleAction() {
    trackEvent('upgrade_cta_clicked', {
      context: trackingContext || title,
      badge,
      action_label: actionLabel,
    });
    onAction();
  }

  return (
    <div className={`rounded-2xl border border-primary/20 bg-linear-to-br from-primary-bg/70 to-surface ${compact ? 'p-5' : 'p-6'} shadow-sm`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <PlanBadge>{badge}</PlanBadge>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className={`${compact ? 'text-base' : 'text-lg'} font-bold text-text`}>{title}</h3>
            </div>
          </div>
          <p className="mt-3 text-sm text-text-muted max-w-xl">{description}</p>
          {highlights.length > 0 && (
            <ul className="mt-4 space-y-2">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                  <CheckCircle className="h-4 w-4 shrink-0 text-success mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="shrink-0 lg:self-center">
          <Button onClick={handleAction} size={compact ? 'sm' : 'md'}>
            {actionLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tabs
// ============================================
interface Tab {
  id: string;
  label: string;
}

export function Tabs({ tabs, activeTab, onChange }: {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-surface-hover rounded-lg border border-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${
            activeTab === tab.id
              ? 'bg-surface text-text shadow-xs'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// FeatureGate
// ============================================
import { useSubscription } from '../../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import type { FeatureKey } from '../../lib/constants';

export function FeatureGate({ feature, children, fallback }: {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasFeature, getUpgradeCopy, planTier } = useSubscription();
  const navigate = useNavigate();
  const isAllowed = hasFeature(feature);

  useEffect(() => {
    if (isAllowed) return;
    trackOnce(
      `limit-reached:${planTier}:${feature}`,
      'limit_reached_viewed',
      { feature, plan: planTier, route: window.location.pathname },
      'session',
    );
  }, [feature, isAllowed, planTier]);

  if (!isAllowed) {
    const upgrade = getUpgradeCopy(feature);
    return fallback ?? (
      <UpgradePromptCard
        badge={upgrade.badge || 'Disponible con un plan superior'}
        title={upgrade.title || 'Función bloqueada'}
        description={upgrade.description || upgrade.message || 'Esta función no está disponible con tu plan actual.'}
        highlights={upgrade.highlights || []}
        actionLabel={upgrade.actionLabel || 'Ver planes'}
        onAction={() => navigate(upgrade.route || '/app/suscripcion')}
        trackingContext={`feature-gate-${feature}`}
      />
    );
  }

  return <>{children}</>;
}

// ============================================
// WriteGuard
// ============================================
export function WriteGuard({ children, fallback }: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canWrite, ctaMessage, ctaAction, ctaRoute } = useSubscription();
  const navigate = useNavigate();

  if (!canWrite) {
    return fallback ?? (
      <RestrictedBanner
        message={ctaMessage || 'Tu suscripción no está activa.'}
        actionLabel={ctaAction || 'Ver suscripción'}
        onAction={() => navigate(ctaRoute || '/app/suscripcion')}
      />
    );
  }

  return <>{children}</>;
}

// ============================================
// Confirm Dialog
// ============================================
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', loading = false }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
