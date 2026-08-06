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
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!formData.email.trim()) newErrors.email = 'O e-mail é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Digite um e-mail válido.';
    if (!formData.password) newErrors.password = 'A senha é obrigatória.';
    else if (formData.password.length < 6) newErrors.password = 'Mínimo 6 caracteres.';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirme sua senha.';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem.';
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
      if (onSuccess) onSuccess();
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
        setServerError('Não foi possível conectar ao servidor.');
      } else {
        setServerError(err.message || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-150 min-h-[42px]';
  const inputNormal =
    'border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none';
  const inputError =
    'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20 outline-none';

  const goals = [
    { key: 'perder_peso', label: 'Emagrecer', icon: <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" /> },
    { key: 'manter_peso', label: 'Manter', icon: <Target className="w-4 h-4 text-sky-400" aria-hidden="true" /> },
    { key: 'ganhar_massa', label: 'Ganhar massa', icon: <TrendingUp className="w-4 h-4 text-violet-400" aria-hidden="true" /> },
  ] as const;

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
      {serverError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="register-name" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Nome
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <User className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="register-name"
            type="text"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            placeholder="Seu nome"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
          />
        </div>
        {errors.name && (
          <p id="register-name-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="register-email" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          E-mail
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Mail className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            id="register-email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData({ ...formData, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: undefined });
            }}
            placeholder="seu@email.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
          />
        </div>
        {errors.email && (
          <p id="register-email-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
        )}
      </div>

      {/* Goal */}
      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Objetivo
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {goals.map(({ key, label, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFormData({ ...formData, goal: key })}
              className={`p-2 rounded-lg border text-center flex flex-col items-center gap-1 transition-all text-xs font-medium min-h-[56px] ${
                formData.goal === key
                  ? 'border-indigo-300 dark:border-indigo-500/60 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="register-password" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Lock className="w-4 h-4" aria-hidden="true" />
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
          <p id="register-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="register-confirm-password" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
          Confirmar senha
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <Lock className="w-4 h-4" aria-hidden="true" />
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
            className={`${inputBase} pr-9 ${errors.confirmPassword ? inputError : inputNormal}`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="register-confirm-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.confirmPassword}</p>
        )}
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
          <>
            <span>Criar conta</span>
            <UserPlus className="w-4 h-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
};
