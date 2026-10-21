import React from 'react';
import type { UseFormRegister, FieldErrors, UseFormSetValue } from 'react-hook-form';
import { User, Mail } from 'lucide-react';
import { DatePickerInput } from '../common/DatePickerInput';
import type { PersonalInfoFormInputs } from '../../types/profile';

interface PersonalInfoSectionProps {
  register: UseFormRegister<PersonalInfoFormInputs>;
  errors: FieldErrors<PersonalInfoFormInputs>;
  setValue: UseFormSetValue<PersonalInfoFormInputs>;
  birthDateValue: string;
  isEmailChanged: boolean;
}

const inputBase =
  'w-full pl-10 pr-4 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground outline-none transition-colors min-h-[48px]';
const inputNormal =
  'border-border hover:border-foreground focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const inputError =
  'border-destructive bg-destructive/10 text-destructive focus:border-destructive';

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  register,
  errors,
  setValue,
  birthDateValue,
  isEmailChanged,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2">
        INFORMAÇÕES PESSOAIS
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Nome */}
        <div>
          <label htmlFor="edit-name" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            NOME COMPLETO
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-name"
              type="text"
              placeholder="SEU NOME"
              className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
              aria-invalid={!!errors.name}
              {...register('name')}
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* E-mail */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="edit-email" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              E-MAIL
            </label>
            {isEmailChanged && (
              <span className="text-[10px] font-bold tracking-widest text-primary-ink uppercase">
                *EXIGE SENHA
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Mail className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-email"
              type="email"
              placeholder="SEU@EMAIL.COM"
              className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
              aria-invalid={!!errors.email}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Sexo biológico */}
        <div>
          <label htmlFor="edit-sex" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            SEXO BIOLÓGICO
          </label>
          <select
            id="edit-sex"
            className={`w-full pl-4 pr-10 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground uppercase outline-none transition-colors min-h-[48px] appearance-none cursor-pointer ${
              errors.sex ? inputError : inputNormal
            }`}
            aria-invalid={!!errors.sex}
            {...register('sex')}
          >
            <option value="masculino">MASCULINO</option>
            <option value="feminino">FEMININO</option>
            <option value="prefiro_nao_responder">NÃO RESPONDER</option>
          </select>
          {errors.sex && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.sex.message}
            </p>
          )}
        </div>

        {/* Data de Nascimento */}
        <div>
          <label htmlFor="edit-birth-date" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            NASCIMENTO (DD/MM/AAAA)
          </label>
          <DatePickerInput
            id="edit-birth-date"
            value={birthDateValue || ''}
            onChange={(val) => setValue('birthDate', val, { shouldValidate: true, shouldDirty: true })}
            error={errors.birthDate?.message}
          />
          {errors.birthDate && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.birthDate.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
