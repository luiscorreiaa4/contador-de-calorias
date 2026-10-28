import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router';
import { PersonalInfoSection } from '../../components/profile/PersonalInfoSection';
import { ProfileQueryBoundary } from '../../components/profile/ProfileQueryBoundary';
import { ProfileFormFeedback, ProfileSaveButton } from '../../components/profile/ProfileFormFeedback';
import { useProfileUpdate } from '../../hooks/useProfileSettings';
import { personalInfoSchema, type PersonalInfoFormInputs } from '../../types/profile';
import type { UserProfile } from '../../services/auth.service';

function PersonalInfoForm({ user }: { user: UserProfile }) {
  const mutation = useProfileUpdate();
  const { register, handleSubmit, setValue, control, reset, formState: { errors, isDirty } } = useForm<PersonalInfoFormInputs>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'all',
    defaultValues: {
      name: user.name,
      sex: user.sex || 'prefiro_nao_responder',
      birthDate: user.birth_date ? user.birth_date.split('T')[0].split('-').reverse().join('/') : '',
      height: user.height ?? undefined,
    },
  });
  const birthDate = useWatch({ control, name: 'birthDate' });
  const onSubmit = (data: PersonalInfoFormInputs) => {
    mutation.mutate({
      name: data.name,
      sex: data.sex,
      birthDate: data.birthDate?.trim() ? data.birthDate.trim() : null,
      height: data.height,
    }, { onSuccess: () => reset(data) });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-card border-2 border-border shadow-hard p-6 sm:p-8 space-y-6">
      <PersonalInfoSection
        register={register}
        errors={errors}
        setValue={setValue}
        birthDateValue={birthDate || ''}
        userEmail={user.email}
      />
      <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
      <ProfileSaveButton pending={mutation.isPending} disabled={!isDirty} />
    </form>
  );
}

export function EditProfilePage() {
  return <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
    <div className="space-y-3">
      <h1 className="text-3xl sm:text-4xl font-heading font-black uppercase tracking-tighter">PERFIL</h1>
      <p className="text-muted-foreground">Atualize seus dados pessoais e corporais. Para alterar sua senha, acesse <Link to="/configuracoes/seguranca" className="underline font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Segurança</Link>.</p>
    </div>
    <ProfileQueryBoundary>{user => <PersonalInfoForm user={user} />}</ProfileQueryBoundary>
  </div>;
}
