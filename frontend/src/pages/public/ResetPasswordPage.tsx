import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { strongPasswordSchema } from '@caloriesync/shared';
import { ApiError } from '../../services/api';
import { resetPassword } from '../../services/auth.service';
import { useAuth } from '../../context/AuthContext';
import { AuthPageShell } from '../../components/auth/AuthPageShell';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';

const resetPasswordFormSchema = z
  .object({
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

type ResetPasswordFormInputs = z.infer<typeof resetPasswordFormSchema>;

/**
 * Lê o token do fragmento (`#token=...`), que nunca é enviado ao servidor
 * em requisições de navegação nem aparece em logs de acesso.
 */
function readResetToken(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return null;
  const token = new URLSearchParams(hash).get('token')?.trim();
  if (!token || token.length < 20 || token.length > 200) return null;
  return token;
}

export const ResetPasswordPage: React.FC = () => {
  const { logout } = useAuth();
  const [token] = useState<string | null>(readResetToken);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Remove o token da barra de endereços/histórico assim que ele é lido.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.location.hash) return;
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}`
    );
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInputs>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: 'onTouched',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const resetMutation = useMutation({
    mutationFn: (password: string) => {
      if (!token) throw new Error('Link inválido ou expirado.');
      return resetPassword(token, password);
    },
    onSuccess: () => {
      // O reset incrementa token_version e revoga todas as sessões (A7/A8).
      logout();
    },
  });

  const handleFormSubmit = (data: ResetPasswordFormInputs) => {
    resetMutation.mutate(data.password);
  };

  if (!token) {
    return (
      <AuthPageShell
        title="Redefinir senha"
        description="Link de recuperação"
      >
        <div className="space-y-6">
          <div
            role="alert"
            className="flex items-start gap-3 border-2 border-destructive p-4 text-destructive"
          >
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest">Link inválido ou expirado</p>
              <p className="text-xs font-medium leading-relaxed">
                O link de redefinição é de uso único e expira em 30 minutos. Solicite uma nova
                recuperação de senha.
              </p>
            </div>
          </div>

          <Link
            to="/esqueci-senha"
            className="w-full inline-flex items-center justify-center border-2 border-black bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-primary-foreground shadow-hard-fill transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Solicitar novo link
          </Link>
        </div>

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
  }

  if (resetMutation.isSuccess) {
    return (
      <AuthPageShell
        title="Senha redefinida"
        description="Sua nova senha já está ativa"
      >
        <div className="space-y-6">
          <div
            role="status"
            className="flex items-start gap-3 border-2 border-border bg-secondary p-4"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 text-primary-ink" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary-foreground">
                Tudo certo
              </p>
              <p className="text-xs font-medium leading-relaxed text-secondary-foreground">
                Por segurança, encerramos as sessões antigas. Entre novamente com a nova senha.
              </p>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center border-2 border-border bg-background px-4 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ir para o login
          </Link>
        </div>
      </AuthPageShell>
    );
  }

  const resetError = resetMutation.error;
  const invalidToken = resetError instanceof ApiError && resetError.code === 'INVALID_RESET_TOKEN';
  const resetErrorMessage = invalidToken
    ? 'Link inválido ou expirado. Solicite uma nova redefinição de senha.'
    : resetError instanceof Error
      ? resetError.message
      : null;

  return (
    <AuthPageShell
      title="Definir nova senha"
      description="Escolha uma senha forte e única"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="reset-password">Nova senha</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <Input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="MÍNIMO 8 CARACTERES COM LETRA E NÚMERO"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'reset-password-error' : undefined}
              className={`pl-10 pr-10 font-mono tracking-widest ${errors.password ? 'border-destructive focus-visible:border-destructive' : ''}`}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p id="reset-password-error" className="text-xs font-bold text-destructive uppercase">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Confirmar nova senha</Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <Input
              id="reset-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="REPITA A NOVA SENHA"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? 'reset-confirm-password-error' : undefined}
              className={`pl-10 pr-10 font-mono tracking-widest ${errors.confirmPassword ? 'border-destructive focus-visible:border-destructive' : ''}`}
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {showConfirmPassword ? (
                <EyeOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Eye className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              id="reset-confirm-password-error"
              className="text-xs font-bold text-destructive uppercase"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <p className="text-xs font-medium leading-relaxed text-muted-foreground">
          Use pelo menos 8 caracteres, incluindo letras e números. Ao concluir, todas as sessões
          antigas serão encerradas.
        </p>

        {resetErrorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 border-2 border-destructive p-4 text-xs font-bold uppercase tracking-widest text-destructive"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{resetErrorMessage}</span>
          </div>
        )}

        <Button type="submit" disabled={resetMutation.isPending} className="w-full">
          {resetMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          ) : (
            'Redefinir senha'
          )}
        </Button>

        {invalidToken && (
          <Link
            to="/esqueci-senha"
            className="block text-center text-[10px] font-bold uppercase tracking-widest text-primary-ink underline underline-offset-2 hover:text-primary-ink/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Solicitar novo link
          </Link>
        )}
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
