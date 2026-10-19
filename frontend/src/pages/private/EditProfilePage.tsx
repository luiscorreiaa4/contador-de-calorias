import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, deleteUserAccount, getCurrentUserProfile, exportUserData } from '../../services/auth.service';
import { downloadJsonFile } from '../../utils/download';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal';
import { GoalSettingsCard } from '../../components/profile/GoalSettingsCard';
import { PersonalInfoSection } from '../../components/profile/PersonalInfoSection';
import { BiometricsSection } from '../../components/profile/BiometricsSection';
import { RoutineGoalsSection } from '../../components/profile/RoutineGoalsSection';
import { SecuritySection } from '../../components/profile/SecuritySection';
import { editProfileSchema, type EditProfileFormInputs } from '../../types/profile';
import {
  Save,
  ArrowLeft,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const formatInitialBirthDate = (val?: string): string => {
  if (!val) return '';
  if (val.includes('-')) {
    const [y, m, d] = val.split('T')[0].split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return val;
};

interface EditProfilePageProps {
  onBack?: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onBack }) => {
  const { user, updateUserSession, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const initialBaseline = useMemo(() => {
    const rawBirthDate = user?.birth_date || (user as unknown as { birthDate?: string })?.birthDate || '';
    return {
      name: user?.name || '',
      email: user?.email || '',
      goal: user?.goal || 'perder_peso',
      sex: (user?.sex as 'masculino' | 'feminino' | 'prefiro_nao_responder') || 'masculino',
      birthDate: formatInitialBirthDate(rawBirthDate),
      weight: user?.weight?.toString() || '',
      height: user?.height?.toString() || '',
      bodyFat: user?.body_fat?.toString() || '',
      activityLevel: user?.activity_level || 'sedentario',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    };
  }, [user]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    setError,
    formState: { errors, isDirty },
  } = useForm<EditProfileFormInputs>({
    resolver: zodResolver(editProfileSchema),
    mode: 'all',
    defaultValues: initialBaseline,
  });

  const formValues = watch();

  const { data: freshUser } = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: getCurrentUserProfile,
    staleTime: 1000 * 60 * 5,
  });

  const isProfilePopulatedRef = useRef(false);
  useEffect(() => {
    if (freshUser && !isProfilePopulatedRef.current) {
      isProfilePopulatedRef.current = true;
      updateUserSession(freshUser);
      const formattedBirth = formatInitialBirthDate(
        freshUser.birth_date || (freshUser as unknown as { birthDate?: string })?.birthDate
      );
      if (freshUser.weight != null && !getValues('weight')) setValue('weight', freshUser.weight.toString(), { shouldDirty: false });
      if (freshUser.height != null && !getValues('height')) setValue('height', freshUser.height.toString(), { shouldDirty: false });
      if (freshUser.body_fat != null && !getValues('bodyFat')) setValue('bodyFat', freshUser.body_fat.toString(), { shouldDirty: false });
      if (freshUser.goal && !getValues('goal')) setValue('goal', freshUser.goal, { shouldDirty: false });
      if (freshUser.sex && !getValues('sex')) setValue('sex', freshUser.sex as 'masculino' | 'feminino' | 'prefiro_nao_responder', { shouldDirty: false });
      if (formattedBirth && !getValues('birthDate')) setValue('birthDate', formattedBirth, { shouldDirty: false });
      if (freshUser.activity_level && !getValues('activityLevel')) setValue('activityLevel', freshUser.activity_level, { shouldDirty: false });
    }
  }, [freshUser, updateUserSession, setValue, getValues]);

  const updateProfileMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateUserProfile(payload),
    onSuccess: (updatedUser) => {
      updateUserSession(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['activeGoal'] });
      queryClient.invalidateQueries({ queryKey: ['todayMeals'] });
      queryClient.invalidateQueries({ queryKey: ['mealStats'] });

      const formattedBirth = formatInitialBirthDate(
        updatedUser.birth_date || (updatedUser as unknown as { birthDate?: string })?.birthDate
      );
      reset({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        goal: updatedUser.goal || 'perder_peso',
        sex: (updatedUser.sex as 'masculino' | 'feminino' | 'prefiro_nao_responder') || 'masculino',
        birthDate: formattedBirth || '',
        weight: updatedUser.weight?.toString() || '',
        height: updatedUser.height?.toString() || '',
        bodyFat: updatedUser.body_fat?.toString() || '',
        activityLevel: updatedUser.activity_level || 'sedentario',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });

      setSuccessMessage('PERFIL ATUALIZADO COM SUCESSO!');
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'Usuário não encontrado.') {
        setServerError('SESSÃO EXPIRADA. REDIRECIONANDO...');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setServerError(errorMsg || 'ERRO AO ATUALIZAR PERFIL.');
      }
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: (pwd: string) => deleteUserAccount(pwd),
    onSuccess: () => {
      logout();
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDeleteModalError(errorMsg || 'SENHA INCORRETA. TENTE NOVAMENTE.');
    },
  });

  // Exportação completa dos dados do titular (LGPD art. 18).
  const exportDataMutation = useMutation({
    mutationFn: () => exportUserData(),
    onSuccess: (payload) => {
      setServerError(null);
      setSuccessMessage(null);
      downloadJsonFile(payload, `caloriesync-dados-${payload.exported_at.slice(0, 10)}.json`);
      setSuccessMessage('SEUS DADOS FORAM EXPORTADOS COM SUCESSO!');
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setSuccessMessage(null);
      setServerError(errorMsg || 'ERRO AO EXPORTAR SEUS DADOS.');
    },
  });

  const handleExportData = () => {
    setServerError(null);
    setSuccessMessage(null);
    exportDataMutation.mutate();
  };

  const currentEmailBaseline = (freshUser?.email || user?.email || '').trim().toLowerCase();
  const isEmailChanged = useMemo(() => {
    return (formValues.email || '').trim().toLowerCase() !== currentEmailBaseline;
  }, [formValues.email, currentEmailBaseline]);

  const onSubmit = (data: EditProfileFormInputs) => {
    setServerError(null);
    setSuccessMessage(null);

    const emailChanged = data.email.trim().toLowerCase() !== currentEmailBaseline;
    if (emailChanged && !data.currentPassword?.trim()) {
      setError('currentPassword', {
        type: 'manual',
        message: 'DIGITE SUA SENHA ATUAL PARA CONFIRMAR A ALTERAÇÃO DO E-MAIL.',
      });
      return;
    }

    const payload: Record<string, unknown> = {};
    payload.name = data.name.trim();
    if (emailChanged) payload.email = data.email.trim();
    payload.goal = data.goal;
    payload.sex = data.sex;
    if (data.birthDate) payload.birthDate = data.birthDate;
    payload.weight = parseFloat(data.weight.replace(',', '.'));
    payload.height = parseFloat(data.height.replace(',', '.'));
    if (data.bodyFat) {
      payload.body_fat = parseFloat(data.bodyFat.replace(',', '.'));
    } else {
      payload.body_fat = null;
    }
    payload.activity_level = data.activityLevel;
    if (data.currentPassword) payload.currentPassword = data.currentPassword;
    if (data.newPassword) payload.newPassword = data.newPassword;

    updateProfileMutation.mutate(payload);
  };

  const handleDeleteAccount = async (password: string) => {
    setDeleteModalError(null);
    await deleteAccountMutation.mutateAsync(password);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 space-y-10">
      {/* Top Bar / Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-border pb-6 gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            Configurações
          </p>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-foreground uppercase tracking-tighter">
            EDITAR PERFIL
          </h1>
        </div>
        <button
          type="button"
          onClick={handleBack}
          aria-label="Voltar ao dashboard"
          className="self-start sm:self-auto flex items-center justify-center w-12 h-12 border-2 border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors text-foreground focus:outline-none focus:border-primary group"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Alerts */}
      {serverError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-3 border-2 border-transparent"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-3 border-2 border-transparent"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-card border-2 border-border shadow-hard p-6 sm:p-8 space-y-10" noValidate>
        {/* Seção de Informações Pessoais */}
        <PersonalInfoSection
          register={register}
          errors={errors}
          setValue={setValue}
          birthDateValue={formValues.birthDate || ''}
          isEmailChanged={isEmailChanged}
        />

        {/* Seção de Medidas Corporais */}
        <BiometricsSection
          register={register}
          errors={errors}
        />

        {/* Seção de Objetivo e Rotina */}
        <RoutineGoalsSection
          goalValue={formValues.goal || 'perder_peso'}
          activityLevelValue={formValues.activityLevel || 'sedentario'}
          onSelectGoal={(key) => setValue('goal', key, { shouldValidate: true, shouldDirty: true })}
          onSelectActivityLevel={(key) => setValue('activityLevel', key, { shouldValidate: true, shouldDirty: true })}
          errors={errors}
        />

        {/* Metas Diárias - Componente Separado */}
        <GoalSettingsCard />

        {/* Seção de Segurança e Senha */}
        <SecuritySection
          register={register}
          errors={errors}
          isEmailChanged={isEmailChanged}
          hasNewPassword={Boolean(formValues.newPassword && formValues.newPassword.length > 0)}
        />

        {/* Action Buttons */}
        <div className="pt-8 border-t-2 border-border flex flex-col-reverse gap-6">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleExportData}
              disabled={exportDataMutation.isPending}
              className="w-full min-h-12 px-4 py-3 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-secondary transition-colors focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportDataMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{exportDataMutation.isPending ? 'EXPORTANDO...' : 'EXPORTAR MEUS DADOS'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full min-h-12 px-4 py-3 border-2 border-destructive bg-background text-destructive font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none focus:border-destructive"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>EXCLUIR CONTA</span>
            </button>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-full min-h-12 px-4 py-3 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center hover:bg-secondary transition-colors focus:outline-none focus:border-primary"
            >
              CANCELAR
            </button>

            <button
              type="submit"
              disabled={!isDirty || updateProfileMutation.isPending}
              className="w-full min-h-12 px-4 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-foreground shadow-hard disabled:shadow-none"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>SALVANDO...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>SALVAR ALTERAÇÕES</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteModalError(null);
        }}
        onConfirm={handleDeleteAccount}
        isLoading={deleteAccountMutation.isPending}
        error={deleteModalError}
      />
    </div>
  );
};
