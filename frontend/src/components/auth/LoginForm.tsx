import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { LoginFormData, FormErrors } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/auth.service';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { setAuthSession } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.email.trim()) newErrors.email = 'O e-mail é obrigatório.';
    if (!formData.password) newErrors.password = 'A senha é obrigatória.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      const response = await loginUser(formData);
      setAuthSession(response.user, response.token);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        setServerError('Não foi possível conectar ao servidor.');
      } else {
        setServerError(err.message || 'Erro ao realizar login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-150 min-h-[42px]';
  const inputNormal = 'border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none';
  const inputError = 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20 outline-none';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="login-email" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          E-mail
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="login-email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
          />
        </div>
        {errors.email && (
          <p id="login-email-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="login-password" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Senha
          </label>
          <a
            href="#forgot-password"
            onClick={(e) => e.preventDefault()}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors focus:outline-none focus:underline"
          >
            Esqueceu?
          </a>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Lock className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
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
            className={`${inputBase} pr-9 ${errors.password ? inputError : inputNormal}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id="login-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      {/* Remember Me */}
      <div className="flex items-center gap-2">
        <input
          id="remember-me"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
          className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-600 text-indigo-600 focus:ring-indigo-500 dark:bg-zinc-800 cursor-pointer"
        />
        <label htmlFor="remember-me" className="text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
          Lembrar-me
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <span>Entrar</span>
        )}
      </button>
    </form>
  );
};
