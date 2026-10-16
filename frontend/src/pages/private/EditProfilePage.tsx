import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, deleteUserAccount, getCurrentUserProfile } from '../../services/auth.service';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal';
import { GoalSettingsCard } from '../../components/profile/GoalSettingsCard';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  Loader2,
  Weight,
  Ruler,
  ActivitySquare,
} from 'lucide-react';

const formatInitialBirthDate = (val?: string): string => {
  if (!val) return '';
  if (val.includes('-')) {
    const [y, m, d] = val.split('T')[0].split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return val;
};

const editProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'O NOME É OBRIGATÓRIO.'),
    email: z.string().trim().min(1, 'O E-MAIL É OBRIGATÓRIO.').email('DIGITE UM E-MAIL VÁLIDO.'),
    goal: z.string().min(1, 'SELECIONE O OBJETIVO.'),
    sex: z.enum(['masculino', 'feminino', 'prefiro_nao_responder']),
    birthDate: z.string().optional().refine((val) => {
      if (!val || !val.trim()) return true;
      if (val.length < 10) return false;
      const parts = val.split('/');
      if (parts.length !== 3) return false;
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
      if (month < 1 || month > 12) return false;
      if (year < 1900 || year > new Date().getFullYear()) return false;
      return true;
    }, 'DATA DE NASCIMENTO INVÁLIDA.'),
    weight: z.string().min(1, 'INFORME SEU PESO.'),
    height: z.string().min(1, 'INFORME SUA ALTURA.'),
    bodyFat: z.string().optional().default(''),
    activityLevel: z.string().min(1, 'SELECIONE SEU NÍVEL DE ATIVIDADE.'),
    currentPassword: z.string().optional().default(''),
    newPassword: z.string().optional().default(''),
    confirmNewPassword: z.string().optional().default(''),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword.length >= 8 && /(?=.*[a-zA-Z])(?=.*[0-9])/.test(data.newPassword);
      }
      return true;
    },
    {
      message: 'A NOVA SENHA DEVE TER NO MÍNIMO 8 CARACTERES COM LETRA E NÚMERO.',
      path: ['newPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: 'AS SENHAS NÃO COINCIDEM.',
      path: ['confirmNewPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return !!data.currentPassword && data.currentPassword.trim().length > 0;
      }
      return true;
    },
    {
      message: 'INFORME SUA SENHA ATUAL PARA ALTERAR A SENHA.',
      path: ['currentPassword'],
    }
  );

type EditProfileFormInputs = z.infer<typeof editProfileSchema>;

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

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

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

  const goals = [
    { key: 'perder_peso', label: 'EMAGRECER', icon: <Flame className="w-5 h-5" aria-hidden="true" /> },
    { key: 'manter_peso', label: 'MANTER', icon: <Target className="w-5 h-5" aria-hidden="true" /> },
    { key: 'ganhar_massa', label: 'GANHAR MASSA', icon: <TrendingUp className="w-5 h-5" aria-hidden="true" /> },
  ] as const;

  const activityLevels = [
    { key: 'sedentario', label: 'SEDENTÁRIO', desc: 'POUCO OU NENHUM EXERCÍCIO' },
    { key: 'pouco_ativo', label: 'POUCO ATIVO', desc: 'EXERCÍCIO LEVE 1-3 DIAS/SEM' },
    { key: 'moderadamente_ativo', label: 'MODERADAMENTE ATIVO', desc: 'EXERCÍCIO MODERADO 3-5 DIAS/SEM' },
    { key: 'muito_ativo', label: 'MUITO ATIVO', desc: 'EXERCÍCIO PESADO 6-7 DIAS/SEM' },
    { key: 'extremamente_ativo', label: 'EXTREMAMENTE ATIVO', desc: 'TRABALHO FÍSICO / TREINO 2X AO DIA' },
  ];

  const inputBase =
    'w-full pl-10 pr-4 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground outline-none transition-colors min-h-[48px]';
  const inputNormal =
    'border-border hover:border-primary/50 focus:border-primary focus:ring-0';
  const inputError =
    'border-destructive bg-destructive/10 text-destructive focus:border-destructive';

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
        
        {/* Informações Pessoais */}
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
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
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
              {errors.email && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.email.message}</p>}
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
              {errors.sex && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.sex.message}</p>}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label htmlFor="edit-birth-date" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                NASCIMENTO (DD/MM/AAAA)
              </label>
              <DatePickerInput
                id="edit-birth-date"
                value={formValues.birthDate || ''}
                onChange={(val) => setValue('birthDate', val, { shouldValidate: true, shouldDirty: true })}
                error={errors.birthDate?.message}
              />
              {errors.birthDate && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.birthDate.message}</p>}
            </div>
          </div>
        </div>

        {/* Medidas Corporais */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2">
            MEDIDAS CORPORAIS
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
              {errors.weight && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.weight.message}</p>}
            </div>

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
              {errors.height && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.height.message}</p>}
            </div>

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

        {/* Rotina e Objetivo */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2">
            OBJETIVO E ROTINA
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Objetivo */}
            <div>
              <label id="goal-group-label" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                SEU FOCO PRINCIPAL
              </label>
              <div role="radiogroup" aria-labelledby="goal-group-label" className="flex flex-col gap-3">
                {goals.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={formValues.goal === key}
                    onClick={() => setValue('goal', key, { shouldValidate: true, shouldDirty: true })}
                    className={`p-4 border-2 flex items-center gap-4 transition-all focus:outline-none ${
                      formValues.goal === key
                        ? 'border-primary bg-primary text-primary-foreground shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className={formValues.goal === key ? 'text-primary-foreground' : 'text-primary'}>
                      {icon}
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Nível de Atividade */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                NÍVEL DE ATIVIDADE FÍSICA
              </label>
              <div className="grid gap-3">
                {activityLevels.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => setValue('activityLevel', a.key, { shouldValidate: true, shouldDirty: true })}
                    className={`p-3 border-2 flex flex-col text-left transition-all focus:outline-none ${
                      formValues.activityLevel === a.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50 text-foreground'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">
                      {a.label}
                    </span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${formValues.activityLevel === a.key ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {a.desc}
                    </span>
                  </button>
                ))}
              </div>
              {errors.activityLevel && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.activityLevel.message}</p>}
            </div>
          </div>
        </div>

        {/* Metas Diárias - Componente Separado */}
        <GoalSettingsCard />

        {/* Segurança e Senha */}
        <div className="space-y-6">
          <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2">
            SEGURANÇA
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-current-password" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                SENHA ATUAL {isEmailChanged || (formValues.newPassword && formValues.newPassword.length > 0) ? <span className="text-primary">*</span> : <span className="opacity-50">(OPCIONAL)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="edit-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="DIGITE A SENHA ATUAL"
                  className={`${inputBase} pr-12 ${errors.currentPassword ? inputError : inputNormal}`}
                  aria-invalid={!!errors.currentPassword}
                  {...register('currentPassword')}
                />
                <button
                  type="button"
                  aria-label={showCurrentPassword ? 'Ocultar' : 'Mostrar'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.currentPassword && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.currentPassword.message}</p>}
            </div>

            <div>
              <label htmlFor="edit-new-password" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                NOVA SENHA <span className="opacity-50">(OPCIONAL)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="edit-new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="NOVA SENHA"
                  className={`${inputBase} pr-12 ${errors.newPassword ? inputError : inputNormal}`}
                  aria-invalid={!!errors.newPassword}
                  {...register('newPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.newPassword.message}</p>}
            </div>

            {formValues.newPassword && formValues.newPassword.length > 0 && (
              <div>
                <label htmlFor="edit-confirm-new-password" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                  CONFIRMAR NOVA SENHA
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <input
                    id="edit-confirm-new-password"
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    placeholder="REPITA A SENHA"
                    className={`${inputBase} pr-12 ${errors.confirmNewPassword ? inputError : inputNormal}`}
                    aria-invalid={!!errors.confirmNewPassword}
                    {...register('confirmNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmNewPassword && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.confirmNewPassword.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-8 border-t-2 border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-6">
          
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-4 py-3 border-2 border-destructive bg-background text-destructive font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors focus:outline-none"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>EXCLUIR CONTA</span>
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="w-full sm:w-auto px-6 py-3 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary transition-colors focus:outline-none focus:border-primary"
            >
              CANCELAR
            </button>

            <button
              type="submit"
              disabled={!isDirty || updateProfileMutation.isPending}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-foreground shadow-hard disabled:shadow-none"
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
