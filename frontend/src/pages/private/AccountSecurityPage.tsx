import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SecuritySection } from '../../components/profile/SecuritySection';
import { ProfileFormFeedback, ProfileSaveButton } from '../../components/profile/ProfileFormFeedback';
import { useProfileUpdate } from '../../hooks/useProfileSettings';
import { passwordSchema, type PasswordFormInputs } from '../../types/profile';

export function AccountSecurityPage() {
  const mutation = useProfileUpdate();
  const { register, handleSubmit, control, reset, formState: { errors, isDirty } } = useForm<PasswordFormInputs>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });
  return <form noValidate onSubmit={handleSubmit(({ currentPassword, newPassword }) => mutation.mutate({ currentPassword, newPassword }, { onSuccess: () => reset() }))} className="border-2 border-border bg-card p-6 shadow-hard space-y-6">
    <SecuritySection register={register} errors={errors} hasNewPassword={!!newPassword} />
    <p className="text-muted-foreground">Use pelo menos 8 caracteres, incluindo letras e números.</p>
    <ProfileFormFeedback error={mutation.error} success={mutation.isSuccess} />
    <ProfileSaveButton pending={mutation.isPending} disabled={!isDirty} />
  </form>;
}
