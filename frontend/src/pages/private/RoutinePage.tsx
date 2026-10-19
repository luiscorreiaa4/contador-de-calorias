import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RoutineGoalsSection } from '../../components/profile/RoutineGoalsSection';
import { ProfileQueryBoundary } from '../../components/profile/ProfileQueryBoundary';
import { ProfileFormFeedback, ProfileSaveButton } from '../../components/profile/ProfileFormFeedback';
import { useProfileUpdate } from '../../hooks/useProfileSettings';
import { routineSchema, type RoutineFormInputs } from '../../types/profile';
import type { UserProfile } from '../../services/auth.service';

function RoutineForm({ user }: { user: UserProfile }) {
  const mutation = useProfileUpdate();
  const { control, setValue, handleSubmit, reset, formState: { errors, isDirty } } = useForm<RoutineFormInputs>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      goal: user.goal,
      activityLevel: routineSchema.shape.activityLevel.safeParse(user.activity_level).data || 'sedentario',
    },
  });
  const values = useWatch({ control });
  return <form noValidate onSubmit={handleSubmit(data => mutation.mutate({ goal: data.goal, activity_level: data.activityLevel }, { onSuccess: () => reset(data) }))} className="border-2 border-border bg-card p-6 shadow-hard space-y-6">
    <p className="text-muted-foreground">Seu objetivo e sua atividade física orientam o cálculo das metas automáticas.</p>
    <RoutineGoalsSection goalValue={values.goal || user.goal} activityLevelValue={values.activityLevel || 'sedentario'} errors={errors}
      onSelectGoal={value => setValue('goal', routineSchema.shape.goal.parse(value), { shouldDirty: true })}
      onSelectActivityLevel={value => setValue('activityLevel', routineSchema.shape.activityLevel.parse(value), { shouldDirty: true })} />
    <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
    <ProfileSaveButton pending={mutation.isPending} disabled={!isDirty} />
  </form>;
}

export function RoutinePage() {
  return <ProfileQueryBoundary>{user => <RoutineForm user={user} />}</ProfileQueryBoundary>;
}
