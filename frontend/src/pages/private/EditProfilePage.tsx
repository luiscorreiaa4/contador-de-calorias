import React, { useState, useMemo, useRef, useEffect } from 'react';
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

interface EditProfilePageProps {
  onBack: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onBack }) => {
  const { user, updateUserSession, logout } = useAuth();

  const formatInitialBirthDate = (val?: string): string => {
    if (!val) return '';
    if (val.includes('-')) {
      const [y, m, d] = val.split('T')[0].split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return val;
  };

  const [initialData, setInitialData] = useState(() => {
    const rawBirthDate = user?.birth_date || (user as unknown as { birthDate?: string })?.birthDate || '';
    return {
      name: user?.name || '',
      email: user?.email || '',
      goal: user?.goal || 'perder_peso',
      sex: user?.sex || 'masculino',
      birthDate: formatInitialBirthDate(rawBirthDate),
      weight: user?.weight?.toString() || '',
      height: user?.height?.toString() || '',
      bodyFat: user?.body_fat?.toString() || '',
      activityLevel: user?.activity_level || 'sedentario',
    };
  });

  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [goal, setGoal] = useState(initialData.goal);
  const [sex, setSex] = useState(initialData.sex);
  const [birthDate, setBirthDate] = useState(initialData.birthDate);
  const [weight, setWeight] = useState(initialData.weight);
  const [height, setHeight] = useState(initialData.height);
  const [bodyFat, setBodyFat] = useState(initialData.bodyFat);
  const [activityLevel, setActivityLevel] = useState(initialData.activityLevel);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFetchedRef = useRef(false);

  useEffect(() => {
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;

    getCurrentUserProfile()
      .then((freshUser) => {
        updateUserSession(freshUser);
        const formattedBirth = formatInitialBirthDate(freshUser.birth_date || (freshUser as unknown as { birthDate?: string })?.birthDate);
        const newBaseline = {
          name: freshUser.name || '',
          email: freshUser.email || '',
          goal: freshUser.goal || 'perder_peso',
          sex: freshUser.sex || 'masculino',
          birthDate: formattedBirth,
          weight: freshUser.weight?.toString() || '',
          height: freshUser.height?.toString() || '',
          bodyFat: freshUser.body_fat?.toString() || '',
          activityLevel: freshUser.activity_level || 'sedentario',
        };
        setInitialData(newBaseline);
        setName(newBaseline.name);
        setEmail(newBaseline.email);
        setGoal(newBaseline.goal);
        setSex(newBaseline.sex);
        setBirthDate(newBaseline.birthDate);
        setWeight(newBaseline.weight);
        setHeight(newBaseline.height);
        setBodyFat(newBaseline.bodyFat);
        setActivityLevel(newBaseline.activityLevel);
      })
      .catch((err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (
          errorMsg === 'Usuário não encontrado.' ||
          errorMsg.includes('Token') ||
          errorMsg.includes('autenticad')
        ) {
          logout();
        }
      });
  }, [logout, updateUserSession]);

  const isEmailChanged = useMemo(() => {
    return email.trim().toLowerCase() !== initialData.email.trim().toLowerCase();
  }, [email, initialData.email]);

  const isDirty = useMemo(() => {
    const nameChanged = name.trim() !== initialData.name.trim();
    const emailChanged = isEmailChanged;
    const goalChanged = goal !== initialData.goal;
    const sexChanged = sex !== initialData.sex;
    const birthDateChanged = birthDate.trim() !== initialData.birthDate.trim();
    const weightChanged = weight !== initialData.weight;
    const heightChanged = height !== initialData.height;
    const bodyFatChanged = bodyFat !== initialData.bodyFat;
    const activityLevelChanged = activityLevel !== initialData.activityLevel;
    const passwordChanged = newPassword.trim().length > 0;

    return nameChanged || emailChanged || goalChanged || sexChanged || birthDateChanged || weightChanged || heightChanged || bodyFatChanged || activityLevelChanged || passwordChanged;
  }, [name, goal, sex, birthDate, weight, height, bodyFat, activityLevel, newPassword, initialData, isEmailChanged]);

  const validateBirthDate = (val: string): string | null => {
    if (!val || !val.trim()) return null;
    if (val.length < 10) return 'INFORME A DATA COMPLETA (DD/MM/AAAA).';
    const parts = val.split('/');
    if (parts.length !== 3) return 'DATA INVÁLIDA (DD/MM/AAAA).';
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return 'DATA DE NASCIMENTO INVÁLIDA.';
    if (month < 1 || month > 12) return 'MÊS INVÁLIDO.';
    if (year < 1900 || year > new Date().getFullYear()) return 'ANO INVÁLIDO.';
    return null;
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (errors.name && val.trim()) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.name;
        return next;
      });
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrors((prev) => {
      const next = { ...prev };
      if (!val.trim()) {
        next.email = 'O E-MAIL É OBRIGATÓRIO.';
      } else if (!/\S+@\S+\.\S+/.test(val)) {
        next.email = 'DIGITE UM E-MAIL VÁLIDO.';
      } else {
        delete next.email;
      }
      return next;
    });
  };

  const handleCurrentPasswordChange = (val: string) => {
    setCurrentPassword(val);
    setErrors((prev) => {
      const next = { ...prev };
      if (val.trim()) {
        delete next.currentPassword;
      } else {
        if (isEmailChanged) {
          next.currentPassword = 'DIGITE SUA SENHA ATUAL PARA CONFIRMAR A ALTERAÇÃO DO E-MAIL.';
        } else if (newPassword.length > 0) {
          next.currentPassword = 'INFORME SUA SENHA ATUAL PARA ALTERAR A SENHA.';
        }
      }
      return next;
    });
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    setErrors((prev) => {
      const next = { ...prev };

      if (val.length > 0 && (val.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(val))) {
        next.newPassword = 'A NOVA SENHA DEVE TER NO MÍNIMO 8 CARACTERES COM LETRA E NÚMERO.';
      } else {
        delete next.newPassword;
      }

      if (val.length > 0 && !currentPassword.trim()) {
        next.currentPassword = 'INFORME SUA SENHA ATUAL PARA ALTERAR A SENHA.';
      } else if (!isEmailChanged && !val.length) {
        delete next.currentPassword;
      }

      if (confirmNewPassword.length > 0) {
        if (val !== confirmNewPassword) {
          next.confirmNewPassword = 'AS SENHAS NÃO COINCIDEM.';
        } else {
          delete next.confirmNewPassword;
        }
      }

      return next;
    });
  };

  const handleConfirmNewPasswordChange = (val: string) => {
    setConfirmNewPassword(val);
    setErrors((prev) => {
      const next = { ...prev };

      if (!val) {
        if (newPassword.length > 0) {
          next.confirmNewPassword = 'CONFIRME SUA NOVA SENHA.';
        } else {
          delete next.confirmNewPassword;
        }
      } else if (newPassword !== val) {
        next.confirmNewPassword = 'AS SENHAS NÃO COINCIDEM.';
      } else {
        delete next.confirmNewPassword;
      }

      return next;
    });
  };

  const handleBlur = (field: string) => {
    if (field === 'name' && !name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'O NOME É OBRIGATÓRIO.' }));
    } else if (field === 'email') {
      if (!email.trim()) {
        setErrors((prev) => ({ ...prev, email: 'O E-MAIL É OBRIGATÓRIO.' }));
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        setErrors((prev) => ({ ...prev, email: 'DIGITE UM E-MAIL VÁLIDO.' }));
      }
    } else if (field === 'birthDate') {
      const err = validateBirthDate(birthDate);
      if (err) setErrors((prev) => ({ ...prev, birthDate: err }));
    } else if (field === 'newPassword' && newPassword) {
      if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
        setErrors((prev) => ({ ...prev, newPassword: 'A NOVA SENHA DEVE TER NO MÍNIMO 8 CARACTERES COM LETRA E NÚMERO.' }));
      }
    } else if (field === 'confirmNewPassword' && newPassword) {
      if (!confirmNewPassword) {
        setErrors((prev) => ({ ...prev, confirmNewPassword: 'CONFIRME SUA NOVA SENHA.' }));
      } else if (newPassword !== confirmNewPassword) {
        setErrors((prev) => ({ ...prev, confirmNewPassword: 'AS SENHAS NÃO COINCIDEM.' }));
      }
    } else if (field === 'currentPassword') {
      if ((isEmailChanged || newPassword) && !currentPassword.trim()) {
        setErrors((prev) => ({ ...prev, currentPassword: 'INFORME SUA SENHA ATUAL.' }));
      }
    }
  };

  const handleFocus = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'O NOME É OBRIGATÓRIO.';
    if (!email.trim()) newErrors.email = 'O E-MAIL É OBRIGATÓRIO.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'DIGITE UM E-MAIL VÁLIDO.';

    const birthErr = validateBirthDate(birthDate);
    if (birthErr) newErrors.birthDate = birthErr;

    if (!sex) newErrors.sex = 'SELECIONE O SEXO.';
    if (!weight) newErrors.weight = 'INFORME SEU PESO.';
    if (!height) newErrors.height = 'INFORME SUA ALTURA.';
    if (!activityLevel) newErrors.activityLevel = 'SELECIONE SEU NÍVEL DE ATIVIDADE.';

    if (isEmailChanged && !currentPassword.trim()) {
      newErrors.currentPassword = 'DIGITE SUA SENHA ATUAL PARA CONFIRMAR A ALTERAÇÃO DO E-MAIL.';
    }

    if (newPassword) {
      if (!currentPassword.trim()) {
        newErrors.currentPassword = 'INFORME SUA SENHA ATUAL PARA ALTERAR A SENHA.';
      }
      if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
        newErrors.newPassword = 'A NOVA SENHA DEVE TER NO MÍNIMO 8 CARACTERES COM LETRA E NÚMERO.';
      }
      if (newPassword !== confirmNewPassword) {
        newErrors.confirmNewPassword = 'AS SENHAS NÃO COINCIDEM.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessMessage(null);

    if (!isDirty) return;
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {};

      if (name.trim() !== initialData.name) payload.name = name.trim();
      if (isEmailChanged) payload.email = email.trim();
      if (goal !== initialData.goal) payload.goal = goal;
      if (sex !== initialData.sex) payload.sex = sex;
      if (birthDate !== initialData.birthDate) payload.birthDate = birthDate;
      if (weight !== initialData.weight) payload.weight = parseFloat(weight.replace(',', '.'));
      if (height !== initialData.height) payload.height = parseFloat(height.replace(',', '.'));
      if (bodyFat !== initialData.bodyFat) {
        payload.body_fat = bodyFat ? parseFloat(bodyFat.replace(',', '.')) : null;
      }
      if (activityLevel !== initialData.activityLevel) payload.activity_level = activityLevel;

      if (currentPassword) payload.currentPassword = currentPassword;
      if (newPassword) payload.newPassword = newPassword;

      const updatedUser = await updateUserProfile(payload);
      updateUserSession(updatedUser);

      const formattedBirth = formatInitialBirthDate(updatedUser.birth_date || (updatedUser as unknown as { birthDate?: string })?.birthDate);
      const updatedBaseline = {
        name: updatedUser.name || name.trim(),
        email: updatedUser.email || email.trim(),
        goal: updatedUser.goal || goal,
        sex: updatedUser.sex || sex,
        birthDate: formattedBirth || birthDate,
        weight: updatedUser.weight?.toString() || weight,
        height: updatedUser.height?.toString() || height,
        bodyFat: updatedUser.body_fat?.toString() || bodyFat,
        activityLevel: updatedUser.activity_level || activityLevel,
      };

      setInitialData(updatedBaseline);
      setName(updatedBaseline.name);
      setEmail(updatedBaseline.email);
      setGoal(updatedBaseline.goal);
      setSex(updatedBaseline.sex);
      setBirthDate(updatedBaseline.birthDate);
      setWeight(updatedBaseline.weight);
      setHeight(updatedBaseline.height);
      setBodyFat(updatedBaseline.bodyFat);
      setActivityLevel(updatedBaseline.activityLevel);

      setSuccessMessage('PERFIL ATUALIZADO COM SUCESSO!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg === 'Usuário não encontrado.') {
        setServerError('SESSÃO EXPIRADA. REDIRECIONANDO...');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setServerError(errorMsg || 'ERRO AO ATUALIZAR PERFIL.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  const handleDeleteAccount = async (password: string) => {
    setIsDeleting(true);
    setDeleteModalError(null);
    try {
      await deleteUserAccount(password);
      logout();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDeleteModalError(errorMsg || 'SENHA INCORRETA. TENTE NOVAMENTE.');
      setIsDeleting(false);
    }
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
          onClick={onBack}
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
      <form onSubmit={handleSubmit} className="bg-card border-2 border-border shadow-hard p-6 sm:p-8 space-y-10" noValidate>
        
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
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => handleBlur('name')}
                  onFocus={() => handleFocus('name')}
                  placeholder="SEU NOME"
                  className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
                  aria-invalid={!!errors.name}
                />
              </div>
              {errors.name && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.name}</p>}
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
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  onFocus={() => handleFocus('email')}
                  placeholder="SEU@EMAIL.COM"
                  className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.email}</p>}
            </div>

            {/* Sexo biológico */}
            <div>
              <label htmlFor="edit-sex" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                SEXO BIOLÓGICO
              </label>
              <select
                id="edit-sex"
                value={sex}
                onChange={(e) => setSex(e.target.value as 'masculino' | 'feminino' | 'prefiro_nao_responder')}
                className={`w-full pl-4 pr-10 py-2.5 bg-background border-2 rounded-none text-sm font-medium text-foreground uppercase outline-none transition-colors min-h-[48px] appearance-none cursor-pointer ${
                  errors.sex ? inputError : inputNormal
                }`}
                aria-invalid={!!errors.sex}
              >
                <option value="masculino">MASCULINO</option>
                <option value="feminino">FEMININO</option>
                <option value="prefiro_nao_responder">NÃO RESPONDER</option>
              </select>
              {errors.sex && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.sex}</p>}
            </div>

            {/* Data de Nascimento */}
            <div>
              <label htmlFor="edit-birth-date" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                NASCIMENTO (DD/MM/AAAA)
              </label>
              <DatePickerInput
                id="edit-birth-date"
                value={birthDate}
                onChange={(val) => setBirthDate(val)}
                error={errors.birthDate}
              />
              {errors.birthDate && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.birthDate}</p>}
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
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="EX: 75.5"
                  className={`${inputBase} ${errors.weight ? inputError : inputNormal}`}
                  aria-invalid={!!errors.weight}
                />
              </div>
              {errors.weight && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.weight}</p>}
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
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="EX: 175"
                  className={`${inputBase} ${errors.height ? inputError : inputNormal}`}
                  aria-invalid={!!errors.height}
                />
              </div>
              {errors.height && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.height}</p>}
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
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  placeholder="EX: 18.5"
                  className={`${inputBase} ${inputNormal}`}
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
                    aria-checked={goal === key}
                    onClick={() => setGoal(key)}
                    className={`p-4 border-2 flex items-center gap-4 transition-all focus:outline-none ${
                      goal === key
                        ? 'border-primary bg-primary text-primary-foreground shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'
                        : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary'
                    }`}
                  >
                    <div className={goal === key ? 'text-primary-foreground' : 'text-primary'}>
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
                    onClick={() => setActivityLevel(a.key)}
                    className={`p-3 border-2 flex flex-col text-left transition-all focus:outline-none ${
                      activityLevel === a.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background hover:border-primary/50 text-foreground'
                    }`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">
                      {a.label}
                    </span>
                    <span className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${activityLevel === a.key ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {a.desc}
                    </span>
                  </button>
                ))}
              </div>
              {errors.activityLevel && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.activityLevel}</p>}
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

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="edit-current-password" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                SENHA ATUAL {isEmailChanged || newPassword ? <span className="text-primary">*</span> : <span className="opacity-50">(OPCIONAL)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="edit-current-password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                  onBlur={() => handleBlur('currentPassword')}
                  onFocus={() => handleFocus('currentPassword')}
                  placeholder="DIGITE A SENHA ATUAL"
                  className={`${inputBase} pr-12 ${errors.currentPassword ? inputError : inputNormal}`}
                  aria-invalid={!!errors.currentPassword}
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
              {errors.currentPassword && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.currentPassword}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    onBlur={() => handleBlur('newPassword')}
                    onFocus={() => handleFocus('newPassword')}
                    placeholder="NOVA SENHA"
                    className={`${inputBase} pr-12 ${errors.newPassword ? inputError : inputNormal}`}
                    aria-invalid={!!errors.newPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.newPassword && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.newPassword}</p>}
              </div>

              {newPassword.length > 0 && (
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
                      value={confirmNewPassword}
                      onChange={(e) => handleConfirmNewPasswordChange(e.target.value)}
                      onBlur={() => handleBlur('confirmNewPassword')}
                      onFocus={() => handleFocus('confirmNewPassword')}
                      placeholder="REPITA A SENHA"
                      className={`${inputBase} pr-12 ${errors.confirmNewPassword ? inputError : inputNormal}`}
                      aria-invalid={!!errors.confirmNewPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground focus:outline-none"
                    >
                      {showConfirmNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmNewPassword && <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">{errors.confirmNewPassword}</p>}
                </div>
              )}
            </div>
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
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary transition-colors focus:outline-none focus:border-primary"
            >
              CANCELAR
            </button>

            <button
              type="submit"
              disabled={!isDirty || isLoading}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary/90 transition-all border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-foreground shadow-hard disabled:shadow-none"
            >
              {isLoading ? (
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
        isLoading={isDeleting}
        error={deleteModalError}
      />
    </div>
  );
};
