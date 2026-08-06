import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Flame, Target, TrendingUp, AlertCircle } from 'lucide-react';
import type { RegisterFormData, FormErrors } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/auth.service';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { setAuthSession } = useAuth();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    goal: 'perder_peso',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'O nome completo é obrigatório.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'O e-mail é obrigatório.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Digite um e-mail válido.';
    }

    if (!formData.password) {
      newErrors.password = 'A senha é obrigatória.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'A senha deve ter no mínimo 6 caracteres.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsLoading(true);

    try {
      const response = await registerUser(formData);
      setAuthSession(response.user, response.token);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        setServerError('Não foi possível conectar ao servidor. Certifique-se de que o backend está rodando (npm run server).');
      } else {
        setServerError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {serverError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label
          htmlFor="register-name"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
        >
          Nome Completo
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <User className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            id="register-name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="Seu Nome"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border ${
              errors.name
                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100'
            } placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors min-h-[44px]`}
          />
        </div>
        {errors.name && (
          <p id="register-name-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="register-email"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
        >
          E-mail
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Mail className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            id="register-email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="seu.email@exemplo.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={`w-full pl-11 pr-4 py-2.5 rounded-xl border ${
              errors.email
                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100'
            } placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors min-h-[44px]`}
          />
        </div>
        {errors.email && (
          <p id="register-email-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.email}
          </p>
        )}
      </div>

      {/* Goal Selection */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Seu Objetivo Principal
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, goal: 'perder_peso' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
              formData.goal === 'perder_peso'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-center">Emagrecer</span>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, goal: 'manter_peso' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
              formData.goal === 'manter_peso'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
            }`}
          >
            <Target className="w-4 h-4 text-blue-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-center">Manter</span>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, goal: 'ganhar_massa' })}
            className={`p-2.5 rounded-xl border text-left flex flex-col items-center justify-center gap-1 transition-all ${
              formData.goal === 'ganhar_massa'
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-purple-500" aria-hidden="true" />
            <span className="text-xs font-semibold text-center">Ganhar Massa</span>
          </button>
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="register-password"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
        >
          Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            placeholder="Mínimo 6 caracteres"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            className={`w-full pl-11 pr-11 py-2.5 rounded-xl border ${
              errors.password
                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100'
            } placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors min-h-[44px]`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[44px] justify-center transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="register-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div>
        <label
          htmlFor="register-confirm-password"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1"
        >
          Confirmar Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>
          <input
            id="register-confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={formData.confirmPassword}
            onChange={(e) => {
              setFormData({ ...formData, confirmPassword: e.target.value });
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
            }}
            placeholder="Repita sua senha"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            className={`w-full pl-11 pr-11 py-2.5 rounded-xl border ${
              errors.confirmPassword
                ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-900 dark:text-red-200'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100'
            } placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-colors min-h-[44px]`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-w-[44px] justify-center transition-colors"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Eye className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="register-confirm-password-error" className="mt-1 text-xs text-red-600 dark:text-red-400 font-medium">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-600/25 transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <span>Criar Minha Conta</span>
            <UserPlus className="w-5 h-5" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
};
