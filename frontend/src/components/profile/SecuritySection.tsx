import React, { useState } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Lock, Eye, EyeOff } from 'lucide-react';
import type { PasswordFormInputs } from '../../types/profile';

interface SecuritySectionProps {
  register: UseFormRegister<PasswordFormInputs>;
  errors: FieldErrors<PasswordFormInputs>;
  hasNewPassword: boolean;
}

const inputBase =
  'w-full min-w-0 h-12 pl-10 pr-12 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground outline-none transition-colors';
const inputNormal =
  'border-border hover:border-foreground focus:border-ring focus:outline-none focus-visible:border-ring focus-visible:outline-none';
const inputError =
  'border-destructive bg-destructive/10 text-destructive focus:border-destructive';

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  register,
  errors,
  hasNewPassword,
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2">
        SEGURANÇA
      </h2>

      {/* Grid de 2 colunas com larguras estritamente idênticas no desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
        {/* Senha Atual */}
        <div className="w-full min-w-0">
          <label
            htmlFor="edit-current-password"
            className="block sm:min-h-10 sm:flex sm:flex-wrap sm:items-end sm:content-end sm:gap-x-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2"
          >
            SENHA ATUAL{' '}
            <span className="text-primary-ink">*</span>
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-current-password"
              autoComplete="current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="DIGITE A SENHA ATUAL"
              className={`${inputBase} ${errors.currentPassword ? inputError : inputNormal}`}
              aria-invalid={!!errors.currentPassword}
              {...register('currentPassword')}
            />
            <button
              type="button"
              aria-label={showCurrentPassword ? 'Ocultar senha atual' : 'Mostrar senha atual'}
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* Nova Senha */}
        <div className="w-full min-w-0">
          <label
            htmlFor="edit-new-password"
            className="block sm:min-h-10 sm:flex sm:flex-wrap sm:items-end sm:content-end sm:gap-x-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2"
          >
            NOVA SENHA <span className="text-primary-ink">*</span>
          </label>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-new-password"
              autoComplete="new-password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="NOVA SENHA"
              className={`${inputBase} ${errors.newPassword ? inputError : inputNormal}`}
              aria-invalid={!!errors.newPassword}
              {...register('newPassword')}
            />
            <button
              type="button"
              aria-label={showNewPassword ? 'Ocultar nova senha' : 'Mostrar nova senha'}
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
            >
              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Confirmar Nova Senha (apenas quando nova senha estiver preenchida) */}
      {hasNewPassword && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
          <div className="hidden sm:block" aria-hidden="true" />
          <div className="w-full">
            <label
              htmlFor="edit-confirm-new-password"
              className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2"
            >
              CONFIRMAR NOVA SENHA
            </label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                <Lock className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="edit-confirm-new-password"
                autoComplete="new-password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                placeholder="REPITA A SENHA"
                className={`${inputBase} ${errors.confirmNewPassword ? inputError : inputNormal}`}
                aria-invalid={!!errors.confirmNewPassword}
                {...register('confirmNewPassword')}
              />
              <button
                type="button"
                aria-label={showConfirmNewPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
