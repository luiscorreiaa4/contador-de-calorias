import React, { useState } from 'react';
import { Link } from 'react-router';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RegisterFormData } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/auth.service';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'O nome é obrigatório.'),
    email: z
      .string()
      .trim()
      .min(1, 'O email é obrigatório.')
      .email('Digite um email válido.'),
    password: z
      .string()
      .min(1, 'A senha é obrigatória.')
      .refine(
        (val) => val.length >= 8 && /(?=.*[a-zA-Z])(?=.*[0-9])/.test(val),
        { message: 'Mínimo 8 caracteres com letra e número.' }
      ),
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
    acceptTerms: z.boolean().refine((value) => value === true, {
      message: 'Aceite os Termos de Uso e a Política de Privacidade para continuar.',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  });

type RegisterFormInputs = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { setAuthSession } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: RegisterFormData) => registerUser(data),
    onSuccess: (response) => {
      setAuthSession(response.user, response.token);
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
        setServerError('Não foi possível conectar ao servidor.');
      } else {
        setServerError(errorMsg || 'Erro ao realizar cadastro. Tente novamente.');
      }
    },
  });

  const onSubmit = (data: RegisterFormInputs) => {
    setServerError(null);
    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      acceptTerms: data.acceptTerms,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {serverError && (
        <div className="p-4 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="register-name">Nome</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <User className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            id="register-name"
            type="text"
            placeholder="NOME COMPLETO"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className={`pl-10 ${errors.name ? 'border-destructive focus-visible:border-destructive' : ''}`}
            {...register('name')}
          />
        </div>
        {errors.name && (
          <p id="register-name-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            id="register-email"
            type="email"
            placeholder="SEU@EMAIL.COM"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={`pl-10 ${errors.email ? 'border-destructive focus-visible:border-destructive' : ''}`}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p id="register-email-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password">Senha</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="MÍNIMO 6 CARACTERES"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            className={`pl-10 pr-10 font-mono tracking-widest ${errors.password ? 'border-destructive focus-visible:border-destructive' : ''}`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id="register-password-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Confirmar senha</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="REPITA SUA SENHA"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            className={`pl-10 pr-10 font-mono tracking-widest ${errors.confirmPassword ? 'border-destructive focus-visible:border-destructive' : ''}`}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="register-confirm-password-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* Consentimento dos termos */}
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            id="register-terms"
            type="checkbox"
            aria-invalid={!!errors.acceptTerms}
            aria-describedby={errors.acceptTerms ? 'register-terms-error' : undefined}
            className={`mt-0.5 h-4 w-4 shrink-0 rounded-none border-2 bg-background accent-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${errors.acceptTerms ? 'border-destructive' : 'border-border'}`}
            {...register('acceptTerms')}
          />
          <label htmlFor="register-terms" className="text-[11px] font-medium leading-relaxed text-muted-foreground">
            Li e aceito os{' '}
            <Link
              to="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary uppercase underline underline-offset-2 hover:text-primary/80"
            >
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              to="/privacidade"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-primary uppercase underline underline-offset-2 hover:text-primary/80"
            >
              Política de Privacidade
            </Link>
            .
          </label>
        </div>
        {errors.acceptTerms && (
          <p id="register-terms-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={registerMutation.isPending} className="w-full mt-4 group">
        {registerMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>Criar Conta</span>
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>
    </form>
  );
};
