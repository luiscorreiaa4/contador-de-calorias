import React from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Weight, Ruler, ActivitySquare } from 'lucide-react';
import type { EditProfileFormInputs } from '../../types/profile';

interface BiometricsSectionProps {
  register: UseFormRegister<EditProfileFormInputs>;
  errors: FieldErrors<EditProfileFormInputs>;
}

const inputBase =
  'w-full pl-10 pr-4 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground outline-none transition-colors min-h-[48px]';
const inputNormal =
  'border-border hover:border-foreground focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const inputError =
  'border-destructive bg-destructive/10 text-destructive focus:border-destructive';

export const BiometricsSection: React.FC<BiometricsSectionProps> = ({
  register,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2">
        MEDIDAS CORPORAIS
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Peso */}
        <div>
          <label htmlFor="edit-weight" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            PESO ATUAL (KG)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Weight className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-weight"
              type="number"
              step="0.1"
              placeholder="EX: 75.5"
              className={`${inputBase} ${errors.weight ? inputError : inputNormal}`}
              aria-invalid={!!errors.weight}
              {...register('weight')}
            />
          </div>
          {errors.weight && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.weight.message}
            </p>
          )}
        </div>

        {/* Altura */}
        <div>
          <label htmlFor="edit-height" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            ALTURA (CM)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Ruler className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-height"
              type="number"
              placeholder="EX: 175"
              className={`${inputBase} ${errors.height ? inputError : inputNormal}`}
              aria-invalid={!!errors.height}
              {...register('height')}
            />
          </div>
          {errors.height && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.height.message}
            </p>
          )}
        </div>

        {/* Gordura */}
        <div>
          <label htmlFor="edit-bodyfat" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            GORDURA (%) <span className="opacity-50">(OPCIONAL)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <ActivitySquare className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-bodyfat"
              type="number"
              step="0.1"
              placeholder="EX: 18.5"
              className={`${inputBase} ${inputNormal}`}
              {...register('bodyFat')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
