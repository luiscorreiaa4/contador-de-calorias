import React from 'react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { createCustomFoodSchema, type CreateCustomFoodDTO } from '@caloriesync/shared';
import { SegmentedToggle } from '../common/SegmentedToggle';

type CustomFoodInput = z.input<typeof createCustomFoodSchema>;

interface CustomFoodFormProps {
  /** Termo buscado sem resultado; vira o nome inicial. */
  initialName?: string;
  isPending: boolean;
  onSubmit: (data: CreateCustomFoodDTO) => void;
  onCancel: () => void;
}

const UNIT_OPTIONS = [
  { value: 'g', label: 'G', ariaLabel: 'Gramas' },
  { value: 'ml', label: 'ML', ariaLabel: 'Mililitros' },
] as const;

const labelClass =
  'block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 truncate';
const inputClass =
  'w-full min-w-0 h-10 px-3 bg-background border-2 border-border text-xs font-black uppercase text-foreground placeholder:text-muted-foreground outline-none focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const legendClass = 'text-[10px] font-black uppercase tracking-widest text-foreground mb-2';

// Macro vazio vale 0 (placeholder "0"); porção vazia fica fora do payload.
const zeroIfEmpty = (v: unknown) => (v === '' || v == null ? 0 : Number(v));
const undefinedIfEmpty = (v: unknown) => (v === '' || v == null ? undefined : Number(v));

const FieldError: React.FC<{
  errors: FieldErrors<CustomFoodInput>;
  name: keyof CustomFoodInput;
}> = ({ errors, name }) =>
  errors[name] ? (
    <p role="alert" className="mt-1 text-[10px] font-bold uppercase text-destructive">
      {errors[name]?.message}
    </p>
  ) : null;

const MACROS = [
  { name: 'calories', label: 'KCAL' },
  { name: 'proteins', label: 'PROT (G)' },
  { name: 'carbs', label: 'CARB (G)' },
  { name: 'fats', label: 'GORD (G)' },
] as const;

export const CustomFoodForm: React.FC<CustomFoodFormProps> = ({
  initialName = '',
  isPending,
  onSubmit,
  onCancel,
}) => {
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomFoodInput, unknown, CreateCustomFoodDTO>({
    resolver: zodResolver(createCustomFoodSchema),
    defaultValues: {
      name: initialName.toUpperCase(),
      base_unit: 'g',
      serving_weight: 100,
      unit_name: '',
    },
  });
  const baseUnit = useWatch({ control, name: 'base_unit' }) ?? 'g';

  const submit = handleSubmit((data) =>
    onSubmit({ ...data, unit_name: data.unit_name || undefined }),
  );

  return (
    // Não é <form>: fica aninhado no formulário da refeição; Enter salva o alimento, não a refeição.
    <div
      className="space-y-4"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
          e.preventDefault();
          void submit();
        }
      }}
    >
      <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground border-b-2 border-border pb-2">
        CADASTRAR ALIMENTO
      </h3>

      <div className="flex items-end gap-2">
        <div className="flex-1 min-w-0">
          <label htmlFor="custom-food-name" className={labelClass}>
            NOME DO ALIMENTO *
          </label>
          <input
            id="custom-food-name"
            type="text"
            placeholder="EX: WHEY PROTEIN CASEIRO..."
            aria-invalid={!!errors.name}
            className={inputClass}
            {...register('name', {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                setValue('name', e.target.value.toUpperCase()),
            })}
          />
        </div>
        <SegmentedToggle
          options={[...UNIT_OPTIONS]}
          value={baseUnit}
          onChange={(v) => setValue('base_unit', v)}
          ariaLabel="Unidade base"
          disabled={isPending}
        />
      </div>
      <FieldError errors={errors} name="name" />

      <fieldset>
        <legend className={legendClass}>VALORES POR 100{baseUnit.toUpperCase()}</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MACROS.map(({ name, label }) => (
            <div key={name} className="min-w-0">
              <label htmlFor={`custom-food-${name}`} className={labelClass}>
                {label}
              </label>
              <input
                id={`custom-food-${name}`}
                type="number"
                step="any"
                min={0}
                inputMode="decimal"
                placeholder="0"
                aria-invalid={!!errors[name]}
                className={`${inputClass} text-center`}
                {...register(name, { setValueAs: zeroIfEmpty })}
              />
              <FieldError errors={errors} name={name} />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendClass}>
          PORÇÃO CASEIRA <span className="text-muted-foreground">(OPCIONAL)</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label htmlFor="custom-food-unit-name" className={labelClass}>
              NOME DA PORÇÃO
            </label>
            <input
              id="custom-food-unit-name"
              type="text"
              placeholder="EX: SCOOP, FATIA"
              className={inputClass}
              {...register('unit_name')}
            />
            <FieldError errors={errors} name="unit_name" />
          </div>
          <div className="min-w-0">
            <label htmlFor="custom-food-unit-weight" className={labelClass}>
              PESO DA PORÇÃO ({baseUnit.toUpperCase()})
            </label>
            <input
              id="custom-food-unit-weight"
              type="number"
              step="any"
              min={0}
              inputMode="decimal"
              placeholder="EX: 30"
              aria-invalid={!!errors.unit_weight}
              className={`${inputClass} text-center`}
              {...register('unit_weight', { setValueAs: undefinedIfEmpty })}
            />
            <FieldError errors={errors} name="unit_weight" />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 px-4 bg-background border-2 border-border text-xs font-black uppercase tracking-wider text-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          CANCELAR
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => void submit()}
          className="h-10 px-4 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:bg-primary/90 border-2 border-edge disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isPending ? 'SALVANDO...' : 'CADASTRAR E SELECIONAR'}
        </button>
      </div>
    </div>
  );
};
