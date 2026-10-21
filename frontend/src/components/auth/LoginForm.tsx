import React, { useState } from 'react';
import { Link } from 'react-router';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import type { LoginFormData, FormErrors } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/auth.service';
import { ApiError } from '../../services/api';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface LoginFormProps {
  onSuccess?: () => void;
  onEmailNotVerified?: (email: string, rememberMe: boolean) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onEmailNotVerified }) => {
  const { setAuthSession } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => loginUser(data),
    onSuccess: (response) => {
      setAuthSession(response.user, response.token, formData.rememberMe);
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.code === 'EMAIL_NOT_VERIFIED') {
        onEmailNotVerified?.(formData.email.trim(), formData.rememberMe);
        return;
      }

      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
        setServerError('Não foi possível conectar ao servidor.');
      } else {
        setServerError(errorMsg || 'Erro ao realizar login. Tente novamente.');
      }
      setFormData((prev) => ({ ...prev, password: '' }));
    },
  });

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) newErrors.email = 'O email é obrigatório.';
    if (!formData.password) newErrors.password = 'A senha é obrigatória.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    loginMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {serverError && (
        <div className="p-4 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="SEU@EMAIL.COM"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={`pl-10 ${errors.email ? 'border-destructive focus-visible:border-destructive' : ''}`}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="text-xs font-bold text-destructive uppercase">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            className={`pl-10 pr-10 font-mono tracking-widest ${errors.password ? 'border-destructive focus-visible:border-destructive' : ''}`}
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
          <p id="login-password-error" className="text-xs font-bold text-destructive uppercase">
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <input
            id="remember-me"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
            className="w-4 h-4 rounded-none border-2 border-border bg-background accent-primary-ink cursor-pointer"
          />
          <Label htmlFor="remember-me" className="cursor-pointer select-none">
            Lembrar-me
          </Label>
        </div>
        <Link
          to="/esqueci-senha"
          className="text-xs font-bold uppercase tracking-widest text-primary-ink hover:text-primary-ink/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Esqueci minha senha
        </Link>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={loginMutation.isPending} className="w-full mt-4 group">
        {loginMutation.isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>Acessar Dashboard</span>
            <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </Button>
    </form>
  );
};
