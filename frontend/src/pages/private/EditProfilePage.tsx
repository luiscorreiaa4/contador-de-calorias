import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updateUserProfile, deleteUserAccount, getCurrentUserProfile } from '../../services/auth.service';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { DeleteAccountModal } from '../../components/common/DeleteAccountModal';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Flame,
  Target,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface EditProfilePageProps {
  onBack: () => void;
}

export const EditProfilePage: React.FC<EditProfilePageProps> = ({ onBack }) => {
  const { user, updateUserSession, logout } = useAuth();

  // Format initial birth_date from YYYY-MM-DD to DD/MM/AAAA if needed
  const formatInitialBirthDate = (val?: string): string => {
    if (!val) return '';
    if (val.includes('-')) {
      const [y, m, d] = val.split('T')[0].split('-');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    return val;
  };

  // Baseline Initial Data
  const [initialData, setInitialData] = useState(() => {
    const rawBirthDate = user?.birth_date || (user as any)?.birthDate || '';
    return {
      name: user?.name || '',
      email: user?.email || '',
      goal: user?.goal || 'perder_peso',
      sex: user?.sex || 'masculino',
      birthDate: formatInitialBirthDate(rawBirthDate),
    };
  });

  // Form State
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);
  const [goal, setGoal] = useState(initialData.goal);
  const [sex, setSex] = useState(initialData.sex);
  const [birthDate, setBirthDate] = useState(initialData.birthDate);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flag so single fetch on mount occurs without infinite re-renders
  const isFetchedRef = useRef(false);

  useEffect(() => {
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;

    getCurrentUserProfile()
      .then((freshUser) => {
        updateUserSession(freshUser);
        const formattedBirth = formatInitialBirthDate(freshUser.birth_date || (freshUser as any)?.birthDate);
        const newBaseline = {
          name: freshUser.name || '',
          email: freshUser.email || '',
          goal: freshUser.goal || 'perder_peso',
          sex: freshUser.sex || 'masculino',
          birthDate: formattedBirth,
        };
        setInitialData(newBaseline);
        setName(newBaseline.name);
        setEmail(newBaseline.email);
        setGoal(newBaseline.goal);
        setSex(newBaseline.sex);
        setBirthDate(newBaseline.birthDate);
      })
      .catch((err: any) => {
        if (
          err?.message === 'Usuário não encontrado.' ||
          err?.message?.includes('Token') ||
          err?.message?.includes('autenticad')
        ) {
          logout();
        }
      });
  }, [logout, updateUserSession]);

  // Check if email is changed relative to initialData
  const isEmailChanged = useMemo(() => {
    return email.trim().toLowerCase() !== initialData.email.trim().toLowerCase();
  }, [email, initialData.email]);

  // Check if form is dirty (has changes)
  const isDirty = useMemo(() => {
    const nameChanged = name.trim() !== initialData.name.trim();
    const emailChanged = isEmailChanged;
    const goalChanged = goal !== initialData.goal;
    const sexChanged = sex !== initialData.sex;
    const birthDateChanged = birthDate.trim() !== initialData.birthDate.trim();
    const passwordChanged = newPassword.trim().length > 0;

    return nameChanged || emailChanged || goalChanged || sexChanged || birthDateChanged || passwordChanged;
  }, [name, email, goal, sex, birthDate, newPassword, initialData, isEmailChanged]);

  const validateBirthDate = (val: string): string | null => {
    if (!val || !val.trim()) return null; // Opcional ao editar
    if (val.length < 10) return 'Informe a data completa (DD/MM/AAAA).';
    const parts = val.split('/');
    if (parts.length !== 3) return 'Data inválida (DD/MM/AAAA).';
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) return 'Data de nascimento inválida.';
    if (month < 1 || month > 12) return 'Mês inválido.';
    if (year < 1900 || year > new Date().getFullYear()) return 'Ano inválido.';
    return null;
  };

  // Real-time Handlers for Inputs
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
        next.email = 'O e-mail é obrigatório.';
      } else if (!/\S+@\S+\.\S+/.test(val)) {
        next.email = 'Digite um e-mail válido.';
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
          next.currentPassword = 'Digite sua senha atual para confirmar a alteração do e-mail.';
        } else if (newPassword.length > 0) {
          next.currentPassword = 'Informe sua senha atual para alterar a senha.';
        }
      }
      return next;
    });
  };

  const handleNewPasswordChange = (val: string) => {
    setNewPassword(val);
    setErrors((prev) => {
      const next = { ...prev };

      if (val.length > 0 && val.length < 6) {
        next.newPassword = 'A nova senha deve ter no mínimo 6 caracteres.';
      } else {
        delete next.newPassword;
      }

      if (val.length > 0 && !currentPassword.trim()) {
        next.currentPassword = 'Informe sua senha atual para alterar a senha.';
      } else if (!isEmailChanged && !val.length) {
        delete next.currentPassword;
      }

      if (confirmNewPassword.length > 0) {
        if (val !== confirmNewPassword) {
          next.confirmNewPassword = 'As senhas não coincidem.';
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
          next.confirmNewPassword = 'Confirme sua nova senha.';
        } else {
          delete next.confirmNewPassword;
        }
      } else if (newPassword !== val) {
        next.confirmNewPassword = 'As senhas não coincidem.';
      } else {
        delete next.confirmNewPassword;
      }

      return next;
    });
  };

  const handleBlur = (field: string) => {
    if (field === 'name' && !name.trim()) {
      setErrors((prev) => ({ ...prev, name: 'O nome é obrigatório.' }));
    } else if (field === 'email') {
      if (!email.trim()) {
        setErrors((prev) => ({ ...prev, email: 'O e-mail é obrigatório.' }));
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        setErrors((prev) => ({ ...prev, email: 'Digite um e-mail válido.' }));
      }
    } else if (field === 'birthDate') {
      const err = validateBirthDate(birthDate);
      if (err) setErrors((prev) => ({ ...prev, birthDate: err }));
    } else if (field === 'newPassword' && newPassword) {
      if (newPassword.length < 6) {
        setErrors((prev) => ({ ...prev, newPassword: 'A nova senha deve ter no mínimo 6 caracteres.' }));
      }
    } else if (field === 'confirmNewPassword' && newPassword) {
      if (!confirmNewPassword) {
        setErrors((prev) => ({ ...prev, confirmNewPassword: 'Confirme sua nova senha.' }));
      } else if (newPassword !== confirmNewPassword) {
        setErrors((prev) => ({ ...prev, confirmNewPassword: 'As senhas não coincidem.' }));
      }
    } else if (field === 'currentPassword') {
      if ((isEmailChanged || newPassword) && !currentPassword.trim()) {
        setErrors((prev) => ({ ...prev, currentPassword: 'Informe sua senha atual.' }));
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

    if (!name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!email.trim()) newErrors.email = 'O e-mail é obrigatório.';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Digite um e-mail válido.';

    const birthErr = validateBirthDate(birthDate);
    if (birthErr) newErrors.birthDate = birthErr;

    if (!sex) newErrors.sex = 'Selecione o sexo.';

    if (isEmailChanged && !currentPassword.trim()) {
      newErrors.currentPassword = 'Digite sua senha atual para confirmar a alteração do e-mail.';
    }

    if (newPassword) {
      if (!currentPassword.trim()) {
        newErrors.currentPassword = 'Informe sua senha atual para alterar a senha.';
      }
      if (newPassword.length < 6) {
        newErrors.newPassword = 'A nova senha deve ter no mínimo 6 caracteres.';
      }
      if (newPassword !== confirmNewPassword) {
        newErrors.confirmNewPassword = 'As senhas não coincidem.';
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
      const payload: any = {};

      if (name.trim() !== initialData.name) payload.name = name.trim();
      if (isEmailChanged) payload.email = email.trim();
      if (goal !== initialData.goal) payload.goal = goal;
      if (sex !== initialData.sex) payload.sex = sex;
      if (birthDate !== initialData.birthDate) payload.birthDate = birthDate;

      if (currentPassword) payload.currentPassword = currentPassword;
      if (newPassword) payload.newPassword = newPassword;

      const updatedUser = await updateUserProfile(payload);
      updateUserSession(updatedUser);

      const formattedBirth = formatInitialBirthDate(updatedUser.birth_date || (updatedUser as any)?.birthDate);
      const updatedBaseline = {
        name: updatedUser.name || name.trim(),
        email: updatedUser.email || email.trim(),
        goal: updatedUser.goal || goal,
        sex: updatedUser.sex || sex,
        birthDate: formattedBirth || birthDate,
      };

      setInitialData(updatedBaseline);
      setName(updatedBaseline.name);
      setEmail(updatedBaseline.email);
      setGoal(updatedBaseline.goal);
      setSex(updatedBaseline.sex);
      setBirthDate(updatedBaseline.birthDate);

      setSuccessMessage('Perfil atualizado com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      if (err?.message === 'Usuário não encontrado.') {
        setServerError('Sua sessão expirou ou a conta não foi encontrada no banco de dados. Redirecionando...');
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setServerError(err.message || 'Erro ao atualizar perfil.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      logout();
    } catch (err: any) {
      setServerError(err.message || 'Erro ao excluir conta.');
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const goals = [
    { key: 'perder_peso', label: 'Emagrecer', icon: <Flame className="w-4 h-4 text-orange-400" aria-hidden="true" /> },
    { key: 'manter_peso', label: 'Manter', icon: <Target className="w-4 h-4 text-sky-400" aria-hidden="true" /> },
    { key: 'ganhar_massa', label: 'Ganhar massa', icon: <TrendingUp className="w-4 h-4 text-violet-400" aria-hidden="true" /> },
  ] as const;

  const inputBase =
    'w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 transition-colors duration-150 min-h-[42px]';
  const inputNormal =
    'border-zinc-200 dark:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none';
  const inputError =
    'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-950/20 focus:ring-2 focus:ring-red-400/20 outline-none';

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Voltar ao Dashboard</span>
        </button>

        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Editar Perfil</h1>
      </div>

      {/* Alerts */}
      {serverError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5" noValidate>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-zinc-100 dark:border-zinc-800/80 pb-2">
          Informações Pessoais
        </h2>

        {/* Nome */}
        <div>
          <label htmlFor="edit-name" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Nome Completo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <User className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => handleBlur('name')}
              onFocus={() => handleFocus('name')}
              placeholder="Seu nome"
              className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
              aria-describedby={errors.name ? 'edit-name-error' : undefined}
            />
          </div>
          {errors.name && <p id="edit-name-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name}</p>}
        </div>

        {/* E-mail */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="edit-email" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              E-mail
            </label>
            {isEmailChanged && (
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                *Exige senha atual abaixo para confirmar
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Mail className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={() => handleBlur('email')}
              onFocus={() => handleFocus('email')}
              placeholder="seu@email.com"
              className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
              aria-describedby={errors.email ? 'edit-email-error' : undefined}
            />
          </div>
          {errors.email && <p id="edit-email-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>}
        </div>

        {/* Sexo biológico */}
        <div>
          <label htmlFor="edit-sex" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Sexo biológico
          </label>
          <select
            id="edit-sex"
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className={`w-full pl-3 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-800/60 border rounded-lg text-sm text-zinc-900 dark:text-zinc-100 transition-colors duration-150 min-h-[42px] cursor-pointer ${
              errors.sex ? inputError : inputNormal
            }`}
          >
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="prefiro_nao_responder">Prefiro não responder</option>
          </select>
          {errors.sex && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.sex}</p>}
        </div>

        {/* Data de Nascimento */}
        <div>
          <label htmlFor="edit-birth-date" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Data de Nascimento
          </label>
          <DatePickerInput
            id="edit-birth-date"
            value={birthDate}
            onChange={(val) => setBirthDate(val)}
            error={errors.birthDate}
          />
          {errors.birthDate && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.birthDate}</p>}
        </div>

        {/* Objetivo */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Objetivo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {goals.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setGoal(key)}
                className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all text-xs font-medium min-h-[56px] ${
                  goal === key
                    ? 'border-indigo-300 dark:border-indigo-500/60 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Alteração de Senha */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b border-zinc-100 dark:border-zinc-800/80 pt-4 pb-2">
          Segurança e Senha
        </h2>

        {/* Senha Atual */}
        <div>
          <label htmlFor="edit-current-password" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Senha Atual {isEmailChanged || newPassword ? <span className="text-amber-500 font-bold">*</span> : '(obrigatória apenas se alterar e-mail ou senha)'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-current-password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => handleCurrentPasswordChange(e.target.value)}
              onBlur={() => handleBlur('currentPassword')}
              onFocus={() => handleFocus('currentPassword')}
              placeholder="Digite a senha atual"
              className={`${inputBase} pr-10 ${errors.currentPassword ? inputError : inputNormal}`}
              aria-describedby={errors.currentPassword ? 'edit-current-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && <p id="edit-current-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.currentPassword}</p>}
        </div>

        {/* Nova Senha */}
        <div>
          <label htmlFor="edit-new-password" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
            Nova Senha (opcional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              id="edit-new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => handleNewPasswordChange(e.target.value)}
              onBlur={() => handleBlur('newPassword')}
              onFocus={() => handleFocus('newPassword')}
              placeholder="Mínimo 6 caracteres"
              className={`${inputBase} pr-10 ${errors.newPassword ? inputError : inputNormal}`}
              aria-describedby={errors.newPassword ? 'edit-new-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.newPassword && <p id="edit-new-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.newPassword}</p>}
        </div>

        {/* Confirmar Nova Senha */}
        {newPassword.length > 0 && (
          <div>
            <label htmlFor="edit-confirm-new-password" className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" aria-hidden="true" />
              </div>
              <input
                id="edit-confirm-new-password"
                type={showConfirmNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => handleConfirmNewPasswordChange(e.target.value)}
                onBlur={() => handleBlur('confirmNewPassword')}
                onFocus={() => handleFocus('confirmNewPassword')}
                placeholder="Repita a nova senha"
                className={`${inputBase} pr-10 ${errors.confirmNewPassword ? inputError : inputNormal}`}
                aria-describedby={errors.confirmNewPassword ? 'edit-confirm-new-password-error' : undefined}
              />
              <button
                type="button"
                onClick={() => setShowConfirmNewPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmNewPassword && <p id="edit-confirm-new-password-error" className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.confirmNewPassword}</p>}
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Delete Account Link / Button */}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            <span>Excluir Conta</span>
          </button>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-1/2 sm:w-auto px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium text-sm rounded-xl transition-colors min-h-[42px]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isDirty || isLoading}
              className="w-1/2 sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 min-h-[42px] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      />
    </div>
  );
};
