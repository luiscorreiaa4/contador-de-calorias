import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '../../services/api';
import { resendVerificationCode, verifyEmail } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { AuthPageShell } from '../../components/auth/AuthPageShell';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

interface VerifyEmailLocationState {
  email?: string;
  codeSent?: boolean;
  rememberMe?: boolean;
}

const GENERIC_RESEND_MESSAGE =
  'Se os dados estiverem corretos, enviaremos uma nova mensagem para o e-mail informado.';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, setAuthSession } = useAuth();

  const state = (location.state ?? {}) as VerifyEmailLocationState;
  const initialEmail = typeof state.email === 'string' ? state.email.trim() : '';

  const [email, setEmail] = useState(initialEmail);
  const [showEmailField, setShowEmailField] = useState(!initialEmail);
  const [code, setCode] = useState('');
  const [seconds, setSeconds] = useState(state.codeSent ? 60 : 0);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (seconds <= 0) return;
    const timeout = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [seconds]);

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmail({ email: email.trim(), code }),
    onSuccess: (response) => {
      setAuthSession(response.user, response.token, state.rememberMe ?? true);
      navigate('/', { replace: true });
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationCode(email.trim()),
    onSuccess: () => {
      setSeconds(60);
      setNotice(GENERIC_RESEND_MESSAGE);
    },
  });

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    setNotice(null);

    if (!email.trim()) {
      setFieldError('Informe o e-mail da conta.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setFieldError('Informe o código de 6 dígitos.');
      return;
    }

    verifyMutation.mutate();
  };

  const verifyError = verifyMutation.error;
  const verifyErrorMessage =
    verifyError instanceof ApiError && verifyError.code === 'INVALID_VERIFICATION_CODE'
      ? 'Código inválido ou expirado. Confira o código e tente novamente.'
      : verifyError instanceof Error
        ? verifyError.message
        : null;

  const resendError = resendMutation.error;
  const resendErrorMessage =
    resendError instanceof Error ? resendError.message : null;

  return (
    <AuthPageShell
      title="Confirme seu e-mail"
      description="Falta pouco para liberar seu acesso"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="flex items-start gap-3 border-2 border-border bg-secondary p-4">
          <ShieldCheck className="w-5 h-5 shrink-0 text-primary-ink" aria-hidden="true" />
          <p className="text-xs font-medium leading-relaxed text-secondary-foreground">
            Enviamos um código numérico de 6 dígitos. Ele expira em 15 minutos e pode ser usado
            apenas uma vez.
          </p>
        </div>

        {notice && (
          <div
            role="status"
            className="flex items-start gap-2 border-2 border-border bg-background p-4 text-xs font-bold uppercase tracking-widest text-foreground"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-primary-ink" aria-hidden="true" />
            <span>{notice}</span>
          </div>
        )}

        {email && !showEmailField ? (
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Código enviado para
            </p>
            <p className="font-mono text-sm text-foreground break-all">{email}</p>
            <button
              type="button"
              onClick={() => setShowEmailField(true)}
              className="text-[10px] font-bold uppercase tracking-widest text-primary-ink underline underline-offset-2 hover:text-primary-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="verify-email">E-mail da conta</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </div>
              <Input
                id="verify-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError(null);
                }}
                placeholder="SEU@EMAIL.COM"
                className="pl-10"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="verify-code">Código de 6 dígitos</Label>
          <Input
            id="verify-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
              setFieldError(null);
            }}
            placeholder="000000"
            aria-invalid={!!fieldError}
            aria-describedby={fieldError ? 'verify-code-error' : undefined}
            className="text-center font-mono text-2xl tracking-[0.5em]"
          />
        </div>

        {(fieldError || verifyErrorMessage) && (
          <div
            id="verify-code-error"
            role="alert"
            className="flex items-start gap-2 border-2 border-destructive p-4 text-xs font-bold uppercase tracking-widest text-destructive"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{fieldError ?? verifyErrorMessage}</span>
          </div>
        )}

        {resendErrorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 border-2 border-destructive p-4 text-xs font-bold uppercase tracking-widest text-destructive"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{resendErrorMessage}</span>
          </div>
        )}

        <Button type="submit" disabled={verifyMutation.isPending} className="w-full group">
          {verifyMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            <>
              <span>Confirmar e-mail</span>
              <ArrowRight
                className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => {
            setNotice(null);
            resendMutation.mutate();
          }}
          disabled={seconds > 0 || resendMutation.isPending || !email.trim()}
          className="w-full border-2 border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {resendMutation.isPending
            ? 'Enviando...'
            : seconds > 0
              ? `Reenviar código em ${seconds}s`
              : 'Reenviar código'}
        </button>
      </form>

      <div className="mt-6 border-t-2 border-border pt-4 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-ink hover:text-primary-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="w-3 h-3" aria-hidden="true" />
          Voltar para o login
        </Link>
      </div>
    </AuthPageShell>
  );
};
