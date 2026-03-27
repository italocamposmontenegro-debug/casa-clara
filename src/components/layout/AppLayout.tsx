// ============================================
// Casa Clara — App Layout (Sidebar + Header) — Stitch M3 Edition
// ============================================

import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useHousehold } from '../../hooks/useHousehold';
import { useSubscription } from '../../hooks/useSubscription';
import { APP_NAME } from '../../lib/constants';
import { AlertBanner } from '../ui';
import { PlanBadge } from '../ui';
import {
  LayoutDashboard, ArrowUpDown, Tags, Scale, CalendarClock,
  Target, BarChart3, FileSpreadsheet, Repeat, GitCompare,
  ClipboardCheck, Settings, CreditCard, LogOut, Menu, X,
  Home, PanelLeftClose, PanelLeftOpen, MoreHorizontal,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useEffect, useState, type ComponentType } from 'react';
import type { FeatureKey } from '../../lib/constants';

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  feature?: FeatureKey;
};

const PRIMARY_NAV_ITEMS: NavItem[] = [
  { to: '/app/dashboard',    label: 'Panel general', icon: LayoutDashboard },
  { to: '/app/movimientos',  label: 'Movimientos',   icon: ArrowUpDown },
  { to: '/app/calendario',   label: 'Calendario',    icon: CalendarClock },
  { to: '/app/metas',        label: 'Metas',         icon: Target },
  { to: '/app/resumen',      label: 'Resumen',       icon: BarChart3 },
];

const SECONDARY_NAV_ITEMS: NavItem[] = [
  { to: '/app/categorias',   label: 'Categorías',     icon: Tags },
  { to: '/app/reparto',      label: 'Reparto',        icon: Scale,         feature: 'split_manual' as FeatureKey },
  { to: '/app/cierre',       label: 'Cierre mensual', icon: ClipboardCheck, feature: 'monthly_close_simple' as FeatureKey },
  { to: '/app/configuracion',label: 'Configuración',  icon: Settings },
  { to: '/app/suscripcion',  label: 'Suscripción',    icon: CreditCard },
  { to: '/app/csv',          label: 'Importar CSV',   icon: FileSpreadsheet, feature: 'csv_import' as FeatureKey },
  { to: '/app/recurrencias', label: 'Recurrencias',   icon: Repeat,        feature: 'recurring_transactions' as FeatureKey },
  { to: '/app/comparacion',  label: 'Comparación',    icon: GitCompare,    feature: 'monthly_comparison' as FeatureKey },
];

// ─── CSS variable shortcuts ────────────────────────────────────────────────────
const C = {
  bg:               'var(--color-m3-background)',
  surface:          'var(--color-m3-surface-container-low)',
  surfaceHigh:      'var(--color-m3-surface-container)',
  surfaceLowest:    'var(--color-m3-surface-container-lowest)',
  outline:          'var(--color-m3-outline-variant)',
  onSurface:        'var(--color-m3-on-surface)',
  onSurfaceVariant: 'var(--color-m3-on-surface-variant)',
  primary:          'var(--color-m3-primary)',
  onPrimary:        'var(--color-m3-on-primary)',
  primaryContainer: 'var(--color-m3-primary-container)',
  onPrimaryContainer: 'var(--color-m3-on-primary-container)',
  secondaryContainer: 'var(--color-m3-secondary-container)',
  onSecondaryContainer: 'var(--color-m3-on-secondary-container)',
  error:            'var(--color-m3-error)',
  fontHeadline:     'var(--font-headline)',
  fontSans:         'var(--font-sans)',
};

export function AppLayout() {
  const { profile, signOut } = useAuth();
  const { household } = useHousehold();
  const { isRestricted, ctaMessage, ctaAction, ctaRoute, hasFeature, planName } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen]               = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('compas-hogar:sidebar-collapsed') === '1';
  });
  const [sidebarPreviewOpen, setSidebarPreviewOpen] = useState(false);
  const [secondaryNavOpen, setSecondaryNavOpen]     = useState(false);

  useEffect(() => {
    window.localStorage.setItem('compas-hogar:sidebar-collapsed', sidebarCollapsed ? '1' : '0');
  }, [sidebarCollapsed]);

  const isSidebarExpanded = !sidebarCollapsed || sidebarPreviewOpen;

  const handleSidebarToggle     = () => { setSidebarPreviewOpen(false); setSidebarCollapsed(v => !v); };
  const handleSidebarFocusEnter = () => { if (sidebarCollapsed) setSidebarPreviewOpen(true); };
  const handleSidebarFocusLeave = (e: React.FocusEvent<HTMLElement>) => {
    if (!sidebarCollapsed) return;
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSidebarPreviewOpen(false);
  };
  const handleSidebarMouseEnter = () => { if (sidebarCollapsed) setSidebarPreviewOpen(true); };
  const handleSidebarMouseLeave = () => { if (sidebarCollapsed) setSidebarPreviewOpen(false); };
  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const visiblePrimary   = PRIMARY_NAV_ITEMS.filter(i => !i.feature || hasFeature(i.feature));
  const visibleSecondary = SECONDARY_NAV_ITEMS.filter(i => !i.feature || hasFeature(i.feature));
  const isSecondaryRoute = visibleSecondary.some(i => location.pathname.startsWith(i.to));

  const toggleSecondaryNav = () => {
    if (!isSidebarExpanded) { setSidebarCollapsed(false); setSecondaryNavOpen(true); return; }
    setSecondaryNavOpen(v => !v);
  };

  const initials = (profile?.full_name || 'U').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  // Reusable NavEntry renderer
  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={() => setSidebarOpen(false)}
      title={!isSidebarExpanded ? item.label : undefined}
      aria-label={item.label}
      className={({ isActive }) =>
        `group flex items-center rounded-2xl text-sm transition-all ${
          isSidebarExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'
        } ${isActive ? 'font-semibold' : 'font-medium'}`
      }
      style={({ isActive }) =>
        isActive
          ? { background: C.secondaryContainer, color: C.onSecondaryContainer }
          : { color: C.onSurfaceVariant }
      }
    >
      {({ isActive }) => (
        <>
          <span className={`inline-flex items-center justify-center rounded-full shrink-0 transition-colors ${
            isSidebarExpanded ? 'h-9 w-9' : 'h-10 w-10'
          } ${!isActive ? 'group-hover:bg-black/5' : ''}`}>
            <item.icon className="h-[18px] w-[18px]" />
          </span>
          {isSidebarExpanded && <span className="truncate">{item.label}</span>}
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen flex" style={{ background: C.bg, color: C.onSurface }}>

      {/* ── Mobile overlay ──────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        onFocusCapture={handleSidebarFocusEnter}
        onBlurCapture={handleSidebarFocusLeave}
        className={`fixed lg:relative inset-y-0 left-0 z-50 overflow-visible flex flex-col
          transform transition-[transform,width] duration-200 ease-out lg:translate-x-0
          ${isSidebarExpanded ? 'lg:w-72' : 'lg:w-20'} w-72
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: C.surface, borderRight: `1px solid ${C.outline}` }}
      >
        {/* Invisible collapse hit-zone */}
        <button
          type="button"
          onClick={handleSidebarToggle}
          onMouseEnter={handleSidebarMouseEnter}
          onFocus={handleSidebarFocusEnter}
          className="hidden lg:block absolute inset-y-0 right-0 z-30 w-6 cursor-pointer"
          title={sidebarCollapsed ? 'Mantener menú abierto' : 'Contraer menú'}
          aria-label={sidebarCollapsed ? 'Mantener menú abierto' : 'Contraer menú'}
        />
        {/* Collapse visual indicator */}
        <div
          className="pointer-events-none hidden lg:flex absolute right-1 top-1/2 z-20 h-12 w-8
            -translate-y-1/2 items-center justify-center rounded-xl shadow-sm"
          style={{ background: C.surfaceLowest, border: `1px solid ${C.outline}`, color: C.onSurfaceVariant }}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-3.5 w-3.5" /> : <PanelLeftClose className="h-3.5 w-3.5" />}
        </div>

        {/* ── Brand ─────────────────────────────────────────── */}
        <div
          className={`flex items-center gap-3 border-b ${isSidebarExpanded ? 'px-5 py-5' : 'px-3 py-5 justify-center'}`}
          style={{ borderColor: C.outline }}
        >
          {isSidebarExpanded ? (
            <>
              <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: C.primary, color: C.onPrimary }}>
                <Home className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-sm truncate"
                  style={{ fontFamily: C.fontHeadline, color: C.onSurface }}>
                  {APP_NAME}
                </h1>
                <p className="text-xs truncate max-w-[160px]" style={{ color: C.onSurfaceVariant }}>
                  {household?.name || 'Mi hogar'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={handleSidebarToggle}
                  className="hidden lg:inline-flex items-center justify-center rounded-xl p-2 transition cursor-pointer hover:bg-black/5"
                  style={{ color: C.onSurfaceVariant }} title="Contraer menú" aria-label="Contraer menú">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
                <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg cursor-pointer hover:bg-black/5"
                  style={{ color: C.onSurfaceVariant }}>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </>
          ) : (
            <button type="button" onClick={() => setSidebarCollapsed(false)}
              className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm transition cursor-pointer"
              style={{ background: C.primary, color: C.onPrimary }} title="Abrir menú" aria-label="Abrir menú">
              <Home className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ── Plan badge ────────────────────────────────────── */}
        {isSidebarExpanded && (
          <div className="px-5 py-2">
            <PlanBadge>{planName}</PlanBadge>
          </div>
        )}

        {/* ── Navigation ────────────────────────────────────── */}
        <nav className={`flex-1 overflow-y-auto py-3 ${isSidebarExpanded ? 'px-3' : 'px-2'}`}>
          <div className="space-y-0.5">
            {visiblePrimary.map(renderNavItem)}
          </div>

          {/* Secondary nav toggle */}
          <div className="mt-1">
            <button type="button" onClick={toggleSecondaryNav}
              title={!isSidebarExpanded ? 'Más opciones' : undefined}
              aria-label="Más opciones"
              className={`group flex w-full items-center rounded-2xl text-sm font-medium transition-all hover:bg-black/5 ${
                isSidebarExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-3'
              }`}
              style={{ color: C.onSurfaceVariant }}>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full shrink-0">
                <MoreHorizontal className="h-[18px] w-[18px]" />
              </span>
              {isSidebarExpanded && (
                <>
                  <span className="truncate">Más</span>
                  <span className="ml-auto">
                    {secondaryNavOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </>
              )}
            </button>
          </div>

          {(secondaryNavOpen || isSecondaryRoute) && (
            <div className="mt-0.5 space-y-0.5">
              {visibleSecondary.map(renderNavItem)}
            </div>
          )}
        </nav>

        {/* ── User profile ──────────────────────────────────── */}
        <div className={`border-t ${isSidebarExpanded ? 'p-4' : 'p-3'}`} style={{ borderColor: C.outline }}>
          <div
            className={`rounded-2xl flex ${isSidebarExpanded ? 'items-center gap-3 px-3 py-2.5' : 'flex-col items-center gap-2 px-1.5 py-2'}`}
            style={{ background: C.surfaceHigh, border: `1px solid ${C.outline}` }}
          >
            <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: C.primaryContainer, color: C.onPrimaryContainer, fontFamily: C.fontSans }}
              title={profile?.full_name || 'Usuario'}>
              {initials}
            </div>
            {isSidebarExpanded ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: C.onSurface }}>
                    {profile?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs truncate" style={{ color: C.onSurfaceVariant }}>
                    {profile?.email}
                  </p>
                </div>
                <button onClick={handleSignOut}
                  className="p-1.5 rounded-lg transition cursor-pointer shrink-0 hover:opacity-70"
                  style={{ color: C.error }} title="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <button onClick={handleSignOut}
                className="p-1.5 rounded-lg transition cursor-pointer hover:opacity-70"
                style={{ color: C.error }} title="Cerrar sesión" aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main className="flex-1 min-w-0">

        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
          style={{ background: C.surface, borderBottom: `1px solid ${C.outline}`, backdropFilter: 'blur(8px)' }}>
          <button onClick={() => setSidebarOpen(true)} className="cursor-pointer p-1" style={{ color: C.onSurfaceVariant }}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center shadow-xs"
              style={{ background: C.primary, color: C.onPrimary }}>
              <Home className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-sm font-semibold"
                style={{ fontFamily: C.fontHeadline, color: C.onSurface }}>
                {APP_NAME}
              </span>
              <span className="block text-[11px]" style={{ color: C.onSurfaceVariant }}>{planName}</span>
            </div>
          </div>
        </header>

        {/* Restricted mode banner */}
        {isRestricted && ctaMessage && (
          <div className="px-4 lg:px-8 pt-4">
            <AlertBanner
              type="warning"
              message={ctaMessage}
              action={{ label: ctaAction, onClick: () => navigate(ctaRoute) }}
            />
          </div>
        )}

        {/* Page content */}
        <div className="p-4 lg:p-8 page-enter">
          <Outlet />
        </div>

      </main>
    </div>
  );
}
