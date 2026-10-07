import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import type { RegisterFormData, FormErrors } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/auth.service';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

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
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleFocus = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof RegisterFormData) => {
    if (field === 'name') {
      if (!formData.name.trim()) {
        setErrors((prev) => ({ ...prev, name: 'O nome é obrigatório.' }));
      }
    } else if (field === 'email') {
      if (!formData.email.trim()) {
        setErrors((prev) => ({ ...prev, email: 'O email é obrigatório.' }));
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setErrors((prev) => ({ ...prev, email: 'Digite um email válido.' }));
      }
    } else if (field === 'password') {
      if (!formData.password) {
        setErrors((prev) => ({ ...prev, password: 'A senha é obrigatória.' }));
      } else if (formData.password.length < 6) {
        setErrors((prev) => ({ ...prev, password: 'Mínimo 6 caracteres.' }));
      }
      if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'As senhas não coincidem.' }));
      }
    } else if (field === 'confirmPassword') {
      if (!formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'Confirme sua senha.' }));
      } else if (formData.password !== formData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: 'As senhas não coincidem.' }));
      }
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!formData.email.trim()) newErrors.email = 'O email é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Digite um email válido.';

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
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('fetch')) {
        setServerError('Não foi possível conectar ao servidor.');
      } else {
        setServerError(errorMsg || 'Erro ao realizar cadastro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onFocus={() => handleFocus('name')}
            onBlur={() => handleBlur('name')}
            placeholder="NOME COMPLETO"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            className={`pl-10 uppercase ${errors.name ? 'border-destructive focus-visible:border-destructive' : ''}`}
          />
        </div>
        {errors.name && (
          <p id="register-name-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.name}</p>
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
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onFocus={() => handleFocus('email')}
            onBlur={() => handleBlur('email')}
            placeholder="SEU@EMAIL.COM"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            className={`pl-10 uppercase ${errors.email ? 'border-destructive focus-visible:border-destructive' : ''}`}
          />
        </div>
        {errors.email && (
          <p id="register-email-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.email}</p>
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
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onFocus={() => handleFocus('password')}
            onBlur={() => handleBlur('password')}
            placeholder="MÍNIMO 6 CARACTERES"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            className={`pl-10 pr-10 font-mono tracking-widest uppercase ${errors.password ? 'border-destructive focus-visible:border-destructive' : ''}`}
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
          <p id="register-password-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.password}</p>
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
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            onFocus={() => handleFocus('confirmPassword')}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="REPITA SUA SENHA"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'register-confirm-password-error' : undefined}
            className={`pl-10 pr-10 font-mono tracking-widest uppercase ${errors.confirmPassword ? 'border-destructive focus-visible:border-destructive' : ''}`}
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
          <p id="register-confirm-password-error" className="text-xs font-bold text-red-500 dark:text-red-400 uppercase">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" disabled={isLoading} className="w-full mt-4 group">
        {isLoading ? (
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
