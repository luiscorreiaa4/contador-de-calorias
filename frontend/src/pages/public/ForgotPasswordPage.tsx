import React, { useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { emailSchema } from '@caloriesync/shared';
import { forgotPassword } from '../../services/auth.service';
import { AuthPageShell } from '../../components/auth/AuthPageShell';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const forgotMutation = useMutation({
    mutationFn: (value: string) => forgotPassword(value),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Digite um e-mail válido.');
      return;
    }

    forgotMutation.mutate(parsed.data);
  };

  const serverError = forgotMutation.error instanceof Error ? forgotMutation.error.message : null;

  return (
    <AuthPageShell
      title="Recuperar senha"
      description="Enviaremos um link seguro para redefinir seu acesso"
    >
      {forgotMutation.isSuccess ? (
        <div className="space-y-6">
          <div
            role="status"
            className="flex items-start gap-3 border-2 border-border bg-secondary p-4"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-primary-ink" aria-hidden="true" />
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                Verifique seu e-mail
              </p>
              <p className="text-xs font-medium leading-relaxed text-secondary-foreground">
                Se os dados estiverem corretos, enviaremos uma mensagem para o e-mail informado com
                as instruções para redefinir sua senha. O link expira em 30 minutos.
              </p>
            </div>
          </div>

          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            Não encontrou a mensagem? Confira a caixa de spam ou aguarde alguns minutos antes de
            solicitar um novo envio.
          </p>

          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center border-2 border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
            Voltar para o login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="space-y-2">
            <Label htmlFor="forgot-email">E-mail da conta</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Mail className="w-4 h-4" aria-hidden="true" />
              </div>
              <Input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setFieldError(null);
                }}
                placeholder="SEU@EMAIL.COM"
                aria-invalid={!!fieldError}
                aria-describedby={fieldError ? 'forgot-email-error' : undefined}
                className={`pl-10 ${fieldError ? 'border-destructive focus-visible:border-destructive' : ''}`}
              />
            </div>
            {fieldError && (
              <p id="forgot-email-error" className="text-xs font-bold text-destructive uppercase">
                {fieldError}
              </p>
            )}
          </div>

          <p className="text-xs font-medium leading-relaxed text-muted-foreground">
            Por segurança, não informamos se um e-mail está cadastrado. A resposta é sempre a mesma.
          </p>

          {serverError && (
            <div
              role="alert"
              className="flex items-start gap-2 border-2 border-destructive p-4 text-xs font-bold uppercase tracking-widest text-destructive"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{serverError}</span>
            </div>
          )}

          <Button type="submit" disabled={forgotMutation.isPending} className="w-full group">
            {forgotMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            ) : (
              <>
                <span>Enviar link de recuperação</span>
                <ArrowRight
                  className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </>
            )}
          </Button>
        </form>
      )}

      {!forgotMutation.isSuccess && (
        <div className="mt-6 border-t-2 border-border pt-4 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-ink hover:text-primary-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="w-3 h-3" aria-hidden="true" />
            Voltar para o login
          </Link>
        </div>
      )}
    </AuthPageShell>
  );
};
