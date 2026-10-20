import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateGoalsSchema, type UpdateGoalsDTO } from '@caloriesync/shared';
import { getActiveGoal, updateGoals, previewGoals, type UserGoal, type EnergyTargets } from '../../services/goals.service';
import type { UserProfile } from '../../services/auth.service';
import { getLocalDateString } from '../../utils/date';
import { ProfileQueryBoundary } from './ProfileQueryBoundary';
import { ProfileFormFeedback } from './ProfileFormFeedback';

function GoalForm({ goal, preview }: { goal: UserGoal; preview: EnergyTargets }) {
  const queryClient = useQueryClient();
  const { register, control, setValue, handleSubmit, reset, formState: { errors } } = useForm<UpdateGoalsDTO>({
    resolver: zodResolver(updateGoalsSchema),
    defaultValues: goal,
  });
  const selectedMode = useWatch({ control, name: 'mode' });
  const isAuto = selectedMode === 'auto';
  const mutation = useMutation({
    mutationFn: updateGoals,
    onSuccess: updated => {
      reset(updated);
      for (const key of ['active-goal', 'mealStats', 'todayMeals']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
  const automatic = { calories: preview.suggestedCalories, ...preview.suggestedMacros };
  const chooseMode = (mode: 'auto' | 'manual') => {
    setValue('mode', mode);
    if (mode === 'auto') {
      for (const key of ['calories', 'proteins', 'carbs', 'fats'] as const) setValue(key, automatic[key]);
    }
  };
  return <form noValidate onSubmit={handleSubmit(data => mutation.mutate(data.mode === 'auto' ? { ...automatic, mode: 'auto' } : data))} className="space-y-6">
    <div className="flex flex-wrap gap-3" role="group" aria-label="Modo das metas">
      {(['auto', 'manual'] as const).map(mode => <button key={mode} type="button" aria-pressed={selectedMode === mode} onClick={() => chooseMode(mode)} className={`border-2 border-border px-5 py-3 font-black text-xs uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${selectedMode === mode ? 'bg-primary text-primary-foreground border-black' : 'bg-background hover:bg-secondary'}`}>{mode === 'auto' ? 'AUTOMÁTICO' : 'MANUAL'}</button>)}
    </div>
    <p className="text-muted-foreground">{isAuto ? 'As metas automáticas usam seus dados corporais, objetivo e rotina. Confirme em Aplicar metas para ativar este modo.' : 'Defina calorias e macronutrientes e confirme em Aplicar metas.'}</p>
    <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {([
        ['calories', 'CALORIAS (KCAL)'], ['proteins', 'PROTEÍNAS (G)'], ['carbs', 'CARBOIDRATOS (G)'], ['fats', 'GORDURAS (G)'],
      ] as const).map(([key, label]) => <div key={key} className="space-y-2">
        <label htmlFor={`goal-${key}`} className="block text-xs font-bold uppercase">{label}</label>
        {isAuto ? <input id={`goal-${key}`} type="number" readOnly value={automatic[key]} className="w-full border-2 border-border bg-secondary p-3" /> : <input id={`goal-${key}`} type="number" step="any" min={key === 'calories' ? 1 : 0} {...register(key, { valueAsNumber: true })} aria-invalid={!!errors[key]} className="w-full border-2 border-border bg-background p-3 focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring outline-none" />}
        {errors[key] && <p role="alert" className="text-xs text-destructive">{errors[key]?.message}</p>}
      </div>)}
    </div>
    <button type="submit" disabled={mutation.isPending} className="border-2 border-black bg-primary text-primary-foreground px-6 py-3 text-xs font-black uppercase disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-hard-fill disabled:shadow-none">{mutation.isPending ? 'APLICANDO...' : 'APLICAR METAS'}</button>
  </form>;
}

function GoalQueries({ user }: { user: UserProfile }) {
  const date = getLocalDateString();
  const goal = useQuery({ queryKey: ['active-goal', date], queryFn: () => getActiveGoal(date), staleTime: 5 * 60 * 1000 });
  const inputs = { weight: user.weight, height: user.height, sex: user.sex, birthDate: user.birth_date, body_fat: user.body_fat, activity_level: user.activity_level, goal: user.goal };
  const preview = useQuery({ queryKey: ['preview-goal', inputs], queryFn: () => previewGoals(inputs), staleTime: 5 * 60 * 1000 });
  if (goal.isPending || preview.isPending) return <p role="status" className="font-bold uppercase">CARREGANDO METAS...</p>;
  if (goal.isError || preview.isError) return <div role="alert" className="text-destructive space-y-3">
    <p>{goal.error?.message || preview.error?.message}</p>
    <button type="button" onClick={() => { void goal.refetch(); void preview.refetch(); }} className="border-2 border-border p-3 font-bold uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">TENTAR NOVAMENTE</button>
  </div>;
  if (!goal.data || !preview.data) return <p className="uppercase font-bold">NENHUMA META DISPONÍVEL.</p>;
  return <GoalForm goal={goal.data} preview={preview.data} />;
}

export function GoalSettingsCard() {
  return <section className="bg-card border-2 border-border shadow-hard p-6 space-y-6">
    <h2 className="text-xl font-heading font-black uppercase">METAS DIÁRIAS</h2>
    <ProfileQueryBoundary>{user => <GoalQueries user={user} />}</ProfileQueryBoundary>
  </section>;
}
