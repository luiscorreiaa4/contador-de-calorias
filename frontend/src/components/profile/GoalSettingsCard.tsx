import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateGoalsSchema, type UpdateGoalsDTO } from '@caloriesync/shared';
import { getActiveGoal, updateGoals, previewGoals, type UserGoal, type EnergyTargets } from '../../services/goals.service';
import type { UserProfile } from '../../services/auth.service';
import { getLocalDateString } from '../../utils/date';
import { SectionCard } from '../common/SectionCard';
import { SegmentedToggle } from '../common/SegmentedToggle';
import { ProfileQueryBoundary } from './ProfileQueryBoundary';
import { ProfileFormFeedback } from './ProfileFormFeedback';

const MODE_OPTIONS = [
  { value: 'auto', label: 'AUTOMÁTICO' },
  { value: 'manual', label: 'MANUAL' },
] as const;

const NUMBER_KEYS = ['calories', 'proteins', 'carbs', 'fats'] as const;
type NumberKey = (typeof NUMBER_KEYS)[number];

const FIELD_LABELS: Record<NumberKey, string> = {
  calories: 'CALORIAS (KCAL)',
  proteins: 'PROTEÍNAS (G)',
  carbs: 'CARBOIDRATOS (G)',
  fats: 'GORDURAS (G)',
};

const labelClass = 'block text-[10px] sm:text-xs font-bold uppercase tracking-wider leading-tight';

/**
 * AUTOMÁTICO é só visualização: nunca grava sozinho. MANUAL exige "Aplicar metas".
 * Se a meta salva é manual, escolher AUTOMÁTICO exibe o cálculo e pede confirmação em
 * "Usar metas automáticas"; trocar de modo descarta o rascunho e volta ao salvo/calculado.
 */
function GoalForm({ goal, preview, date }: { goal: UserGoal; preview: EnergyTargets; date: string }) {
  const queryClient = useQueryClient();
  const { register, control, setValue, handleSubmit, reset, formState: { errors } } = useForm<UpdateGoalsDTO>({
    resolver: zodResolver(updateGoalsSchema),
    defaultValues: {
      calories: goal.calories,
      proteins: goal.proteins,
      carbs: goal.carbs,
      fats: goal.fats,
      mode: goal.mode,
    },
  });
  const selectedMode = useWatch({ control, name: 'mode' });
  const isAuto = selectedMode === 'auto';
  const savedManual = goal.mode === 'manual';
  const mutation = useMutation({
    mutationFn: updateGoals,
    onSuccess: updated => {
      reset(updated);
      queryClient.setQueryData(['active-goal', date], updated);
      for (const key of ['active-goal', 'mealStats', 'todayMeals']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
  const automatic: Record<NumberKey, number> = { calories: preview.suggestedCalories, ...preview.suggestedMacros };

  const chooseMode = (mode: 'auto' | 'manual') => {
    if (mode === selectedMode) return;
    mutation.reset();
    setValue('mode', mode);
    // Manual parte do que está salvo; automático mostra o cálculo. Qualquer rascunho é descartado.
    const source: Record<NumberKey, number> = mode === 'manual' ? goal : automatic;
    for (const key of NUMBER_KEYS) setValue(key, source[key]);
  };

  const onSubmit = (data: UpdateGoalsDTO) => {
    mutation.reset();
    const payload: UpdateGoalsDTO = data.mode === 'auto'
      ? { ...automatic, mode: 'auto' }
      : {
          calories: Number(data.calories),
          proteins: Number(data.proteins),
          carbs: Number(data.carbs),
          fats: Number(data.fats),
          mode: 'manual',
        };
    mutation.mutate(payload);
  };

  const showSubmit = !isAuto || savedManual;
  const submitLabel = mutation.isPending ? 'APLICANDO...' : isAuto ? 'USAR METAS AUTOMÁTICAS' : 'APLICAR METAS';

  const renderField = (key: NumberKey, className = '') => (
    <div key={key} className={`space-y-2 min-w-0 ${className}`}>
      <label htmlFor={`goal-${key}`} className={labelClass}>{FIELD_LABELS[key]}</label>
      {isAuto ? (
        <input
          key={`goal-${key}-auto`}
          id={`goal-${key}`}
          type="number"
          readOnly
          value={automatic[key]}
          className="w-full min-w-0 border-2 border-border bg-secondary p-3"
        />
      ) : (
        <input
          key={`goal-${key}-manual`}
          id={`goal-${key}`}
          type="number"
          step="any"
          min={key === 'calories' ? 1 : 0}
          {...register(key, { valueAsNumber: true })}
          aria-invalid={!!errors[key]}
          className="w-full min-w-0 border-2 border-border bg-background p-3 focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring outline-none"
        />
      )}
      {errors[key] && <p role="alert" className="text-xs text-destructive">{errors[key]?.message}</p>}
    </div>
  );

  return <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
    <SegmentedToggle
      options={[...MODE_OPTIONS]}
      value={selectedMode}
      onChange={chooseMode}
      ariaLabel="Modo das metas"
      disabled={mutation.isPending}
    />
    <p className="text-muted-foreground">
      {!isAuto
        ? 'Defina calorias e macronutrientes e confirme em Aplicar metas.'
        : savedManual
          ? 'Este é o cálculo automático. Suas metas manuais continuam valendo até você confirmar a troca.'
          : 'As metas automáticas são calculadas com base nos seus dados corporais, objetivo e rotina.'}
    </p>
    {isAuto && (
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        TMB {Math.round(preview.tmb)} · GASTO TOTAL {Math.round(preview.tdee)} KCAL
      </p>
    )}
    <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {renderField('calories', 'col-span-3 sm:col-span-1')}
      {renderField('proteins')}
      {renderField('carbs')}
      {renderField('fats')}
    </div>
    {showSubmit && (
      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full sm:w-auto border-2 border-edge bg-primary text-primary-foreground px-6 py-3 text-xs font-black uppercase disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-hard-fill disabled:shadow-none"
      >
        {submitLabel}
      </button>
    )}
  </form>;
}

function GoalQueries({ user }: { user: UserProfile }) {
  const date = getLocalDateString();
  const goal = useQuery({ queryKey: ['active-goal', date], queryFn: () => getActiveGoal(date), staleTime: 5 * 60 * 1000 });
  const inputs: Record<string, unknown> = {};
  if (user.weight != null && !isNaN(Number(user.weight))) inputs.weight = Number(user.weight);
  if (user.height != null && !isNaN(Number(user.height))) inputs.height = Number(user.height);
  if (user.body_fat != null && !isNaN(Number(user.body_fat))) inputs.body_fat = Number(user.body_fat);
  if (user.sex) inputs.sex = user.sex;
  if (user.birth_date) inputs.birthDate = user.birth_date;
  if (user.activity_level) inputs.activity_level = user.activity_level;
  if (user.goal) inputs.goal = user.goal;

  const preview = useQuery({ queryKey: ['preview-goal', inputs], queryFn: () => previewGoals(inputs), staleTime: 5 * 60 * 1000 });
  if (goal.isPending || preview.isPending) return <p role="status" className="font-bold uppercase">CARREGANDO METAS...</p>;
  if (goal.isError || preview.isError) return <div role="alert" className="text-destructive space-y-3">
    <p>{goal.error?.message || preview.error?.message}</p>
    <button type="button" onClick={() => { void goal.refetch(); void preview.refetch(); }} className="border-2 border-border p-3 font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">TENTAR NOVAMENTE</button>
  </div>;
  if (!goal.data || !preview.data) return <p className="uppercase font-bold">NENHUMA META DISPONÍVEL.</p>;
  return <GoalForm goal={goal.data} preview={preview.data} date={date} />;
}

export function GoalSettingsCard() {
  return <>
    {/* A aba "Metas diárias" já nomeia a página; o título só existe para a hierarquia de cabeçalhos. */}
    <h2 className="sr-only">METAS DIÁRIAS</h2>
    <SectionCard>
      <ProfileQueryBoundary>{user => <GoalQueries user={user} />}</ProfileQueryBoundary>
    </SectionCard>
  </>;
}
