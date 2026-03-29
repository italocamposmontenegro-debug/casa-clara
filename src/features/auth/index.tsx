// ============================================
// Casa Clara — Auth Pages
// ============================================

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button, InputField, AlertBanner } from '../../components/ui';
import { APP_NAME, APP_TAGLINE } from '../../lib/constants';
import { trackEvent } from '../../lib/analytics';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators';
import { Home, ArrowLeft, Sparkles, Shield, Users } from 'lucide-react';

const AUTH_LAYOUT_TEXTS = {
  login: {
    eyebrow: 'Bienvenido',
    title: 'Retoma el orden del hogar.',
    description: 'Accede para ver el estado de tus cuentas y metas.',
  },
  register: {
    eyebrow: 'Comienza hoy',
    title: 'Crea tu hogar con claridad.',
    description: 'Un solo espacio para ingresos, gastos y acuerdos.',
  },
  forgotPassword: {
    eyebrow: 'Recuperación',
    title: 'Recupera tu acceso.',
    description: 'Te enviaremos un enlace para recuperar tu clave.',
  },
  resetPassword: {
    eyebrow: 'Nueva clave',
    title: 'Actualiza tu seguridad.',
    description: 'Elige una contraseña nueva para tu cuenta.',
  },
};

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg px-4 py-8 lg:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <div className="paper-panel hidden rounded-[2.2rem] px-8 py-8 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="eyebrow">
              <Sparkles className="h-4 w-4" />
              Claridad compartida para el hogar
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-text">{APP_NAME}</p>
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-light">Sistema de claridad compartida</p>
              </div>
            </div>
            <h1 className="display-heading mt-8 text-5xl leading-[0.98] text-text">
              Una entrada serena a la vida cotidiana del hogar.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-text-muted">
              {APP_TAGLINE}
            </p>
          </div>

          <div className="space-y-4">
            <AuthSignal icon={<Users className="h-4 w-4" />} title="Mismo hogar, misma lectura" description="Cada persona ve el mismo mes, con menos espacio para confusiones y supuestos." />
            <AuthSignal icon={<Shield className="h-4 w-4" />} title="Orden antes que fricción" description="Empieza con una base clara y suma más visión solo cuando el hogar realmente lo necesite." />
          </div>
        </div>

        <div className="w-full max-w-md lg:max-w-none lg:self-center lg:justify-self-end">
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-text">{APP_NAME}</span>
          </div>
          <div className="paper-panel rounded-[2rem] p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthSignal({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-white/72 px-4 py-4 shadow-xs">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary-bg text-primary">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
    </div>
  );
}

// ============================================
// Login
// ============================================
export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const redirect = searchParams.get('redirect');
  const redirectTarget = redirect && redirect.startsWith('/') ? redirect : '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return setError(emailCheck.error!);
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return setError(pwCheck.error!);

    setLoading(true);
    try {
      const { error: authError } = await signIn(email, password);

      if (authError) {
        setError(authError === 'Invalid login credentials' ? 'Email o contraseña incorrectos' : authError);
      } else {
        navigate(redirectTarget);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text mb-2">{AUTH_LAYOUT_TEXTS.login.title}</h2>
      <p className="text-sm text-text-muted mb-6">{AUTH_LAYOUT_TEXTS.login.description}</p>

      {error && <div className="mb-4"><AlertBanner type="danger" message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
        <InputField label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        <div className="text-right">
          <Link to="/recuperar-clave" className="text-xs text-primary hover:text-primary-light">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={loading}>Iniciar sesión</Button>
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        ¿No tienes cuenta?{' '}
        <Link to={`/registro${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary font-medium hover:text-primary-light">Regístrate</Link>
      </p>
    </AuthLayout>
  );
}

// ============================================
// Register
// ============================================
export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const redirect = searchParams.get('redirect');
  const redirectTarget = redirect && redirect.startsWith('/') ? redirect : '/onboarding';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const nameCheck = validateRequired(fullName, 'Tu nombre');
    if (!nameCheck.valid) return setError(nameCheck.error!);
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return setError(emailCheck.error!);
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) return setError(pwCheck.error!);

    trackEvent('signup_started', { source: 'register-page', redirect: redirectTarget });
    setLoading(true);
    try {
      const { error: authError, needsEmailConfirmation } = await signUp(email, password, fullName);

      if (authError) {
        setError(authError);
      } else if (needsEmailConfirmation) {
        trackEvent('signup_completed', { source: 'register-page', confirmation_required: true });
        setSuccess(true);
      } else {
        trackEvent('signup_completed', { source: 'register-page', confirmation_required: false });
        navigate(redirectTarget);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
            <Home className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Revisa tu correo</h2>
          <p className="text-sm text-text-muted mb-6">
            Te enviamos un enlace de verificación a <strong>{email}</strong>.
          </p>
          <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary text-sm font-medium hover:text-primary-light">
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text mb-2">{AUTH_LAYOUT_TEXTS.register.title}</h2>
      <p className="text-sm text-text-muted mb-6">{AUTH_LAYOUT_TEXTS.register.description}</p>

      {error && <div className="mb-4"><AlertBanner type="danger" message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Nombre completo" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ej: Ana Pérez" />
        <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
        <InputField label="Contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" hint="Mínimo 8 caracteres" />

        <Button type="submit" className="w-full" loading={loading}>Crear cuenta</Button>
      </form>

      <p className="text-sm text-text-muted text-center mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary font-medium hover:text-primary-light">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}

// ============================================
// Forgot Password
// ============================================
export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const check = validateEmail(email);
    if (!check.valid) return setError(check.error!);

    setLoading(true);
    try {
      const { error: err } = await resetPassword(email);

      if (err) setError(err);
      else setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Link>

      {sent ? (
        <div className="text-center">
          <h2 className="text-xl font-bold text-text mb-2">Revisa tu correo</h2>
          <p className="text-sm text-text-muted">
            Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para recuperar tu acceso.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-text mb-2">{AUTH_LAYOUT_TEXTS.forgotPassword.title}</h2>
          <p className="text-sm text-text-muted mb-6">{AUTH_LAYOUT_TEXTS.forgotPassword.description}</p>

          {error && <div className="mb-4"><AlertBanner type="danger" message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" />
            <Button type="submit" className="w-full" loading={loading}>Enviar enlace</Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

// ============================================
// Reset Password
// ============================================
export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const check = validatePassword(password);
    if (!check.valid) return setError(check.error!);
    if (password !== confirm) return setError('Las contraseñas no coinciden');

    setLoading(true);
    try {
      const { error: err } = await updatePassword(password);

      if (err) setError(err);
      else navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-xl font-bold text-text mb-2">{AUTH_LAYOUT_TEXTS.resetPassword.title}</h2>
      <p className="text-sm text-text-muted mb-6">{AUTH_LAYOUT_TEXTS.resetPassword.description}</p>

      {error && <div className="mb-4"><AlertBanner type="danger" message={error} /></div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Nueva contraseña" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        <InputField label="Confirmar contraseña" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetir contraseña" />
        <Button type="submit" className="w-full" loading={loading}>Guardar contraseña</Button>
      </form>
    </AuthLayout>
  );
}

// ============================================
// Verify Email
// ============================================
export function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const redirectTarget = redirect && redirect.startsWith('/') ? redirect : '/login';

  return (
    <AuthLayout>
      <div className="text-center">
        <div className="h-16 w-16 rounded-full bg-success-bg flex items-center justify-center mx-auto mb-4">
          <Home className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Correo verificado</h2>
        <p className="text-sm text-text-muted mb-6">
          Tu cuenta ya está lista. Ya puedes entrar a {APP_NAME}.
        </p>
        <Button onClick={() => navigate(redirectTarget)}>Iniciar sesión</Button>
      </div>
    </AuthLayout>
  );
}
