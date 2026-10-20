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
  const { register, handleSubmit, setValue, setError, control, reset, formState: { errors, isDirty } } = useForm<PersonalInfoFormInputs>({
    resolver: zodResolver(personalInfoSchema),
    mode: 'all',
    defaultValues: {
      name: user.name,
      email: user.email,
      sex: user.sex || 'prefiro_nao_responder',
      birthDate: user.birth_date ? user.birth_date.split('T')[0].split('-').reverse().join('/') : '',
      currentPassword: '',
    },
  });
  const email = useWatch({ control, name: 'email' });
  const birthDate = useWatch({ control, name: 'birthDate' });
  const emailChanged = email.trim().toLowerCase() !== user.email.trim().toLowerCase();
  const onSubmit = (data: PersonalInfoFormInputs) => {
    if (emailChanged && !data.currentPassword.trim()) {
      setError('currentPassword', { message: 'DIGITE SUA SENHA ATUAL PARA CONFIRMAR A ALTERAÇÃO DO E-MAIL.' });
      return;
    }
    mutation.mutate({
      name: data.name, sex: data.sex,
      ...(data.birthDate ? { birthDate: data.birthDate } : {}),
      ...(emailChanged ? { email: data.email, currentPassword: data.currentPassword } : {}),
    }, { onSuccess: () => reset({ ...data, currentPassword: '' }) });
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-card border-2 border-border shadow-hard p-6 sm:p-8 space-y-6">
      <PersonalInfoSection register={register} errors={errors} setValue={setValue} birthDateValue={birthDate || ''} isEmailChanged={emailChanged} />
      {emailChanged && <div className="space-y-2">
        <label htmlFor="profile-confirm-password" className="block font-bold text-xs uppercase">SENHA ATUAL PARA ALTERAR O E-MAIL</label>
        <input id="profile-confirm-password" type="password" autoComplete="current-password" {...register('currentPassword')} aria-invalid={!!errors.currentPassword} className="w-full border-2 border-border bg-background p-3 focus:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background outline-none" />
        {errors.currentPassword && <p role="alert" className="text-destructive">{errors.currentPassword.message}</p>}
      </div>}
      <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
      <ProfileSaveButton pending={mutation.isPending} disabled={!isDirty} />
    </form>
  );
}

export function EditProfilePage() {
  return <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-8">
    <div className="space-y-3">
      <h1 className="text-3xl sm:text-4xl font-heading font-black uppercase tracking-tighter">PERFIL</h1>
      <p className="text-muted-foreground">Atualize seus dados pessoais e de acesso. Para alterar sua senha, acesse <Link to="/configuracoes/seguranca" className="underline font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">Segurança</Link>.</p>
    </div>
    <ProfileQueryBoundary>{user => <PersonalInfoForm user={user} />}</ProfileQueryBoundary>
  </div>;
}
