import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { completeUserOnboarding } from '../../services/auth.service';
import { Flame, Target, TrendingUp, ArrowRight, ArrowLeft, CheckCircle2, Weight, Ruler, ActivitySquare, AlertCircle } from 'lucide-react';
import { DatePickerInput } from '../common/DatePickerInput';

export const OnboardingFlow: React.FC = () => {
  const { user, setAuthSession } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    sex: '',
    birthDate: '',
    goal: '',
    weight: '',
    height: '',
    bodyFat: '',
    activityLevel: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBirthDate = (val: string): string | null => {
    if (!val || !val.trim()) return 'A data de nascimento é obrigatória.';
    if (val.length < 10) return 'Informe a data completa (DD/MM/AAAA).';
    const parts = val.split('/');
    if (parts.length !== 3) return 'Data inválida (DD/MM/AAAA).';
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 'Data de nascimento inválida.';
    if (month < 1 || month > 12) return 'Mês inválido.';
    if (year < 1900 || year > new Date().getFullYear()) return 'Ano inválido.';
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return 'Data de nascimento inválida.';
    const birthObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthObj > today) return 'A data de nascimento não pode ser no futuro.';
    const age = today.getFullYear() - year;
    if (age < 1 || age > 120) return 'Informe uma data de nascimento válida.';
    return null;
  };

  const nextStep = () => {
    const currentErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.sex) currentErrors.sex = 'Selecione o sexo biológico.';
      const birthErr = validateBirthDate(formData.birthDate);
      if (birthErr) currentErrors.birthDate = birthErr;
    } else if (step === 2) {
      if (!formData.goal) currentErrors.goal = 'Selecione um objetivo para continuar.';
    } else if (step === 3) {
      if (!formData.weight) currentErrors.weight = 'Informe seu peso.';
      if (!formData.height) currentErrors.height = 'Informe sua altura.';
    } else if (step === 4) {
      if (!formData.activityLevel) currentErrors.activityLevel = 'Selecione seu nível de atividade.';
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setErrors({});
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setErrors({});
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setServerError(null);
    try {
      const response = await completeUserOnboarding({
        sex: formData.sex,
        birthDate: formData.birthDate,
        goal: formData.goal,
        weight: parseFloat(formData.weight.replace(',', '.')),
        height: parseFloat(formData.height.replace(',', '.')),
        body_fat: formData.bodyFat ? parseFloat(formData.bodyFat.replace(',', '.')) : undefined,
        activity_level: formData.activityLevel,
      });
      // Atualiza a sessão com os novos dados
      setAuthSession(response.user, response.token);
      // Aqui o ProtectedRoute no App.tsx irá detectar e redirecionar para o Dashboard automaticamente.
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setServerError(errorMsg || 'Erro ao salvar o perfil. Tente novamente.');
      setIsLoading(false);
    }
  };

  const goals = [
    { key: 'perder_peso', label: 'Emagrecer', icon: <Flame className="w-5 h-5 text-orange-400" /> },
    { key: 'manter_peso', label: 'Manter peso', icon: <Target className="w-5 h-5 text-sky-400" /> },
    { key: 'ganhar_massa', label: 'Ganhar massa', icon: <TrendingUp className="w-5 h-5 text-violet-400" /> },
  ];

  const activityLevels = [
    { key: 'sedentario', label: 'Sedentário', desc: 'Pouco ou nenhum exercício (trabalho de escritório)' },
    { key: 'pouco_ativo', label: 'Pouco Ativo', desc: 'Exercício leve 1 a 3 dias na semana' },
    { key: 'moderadamente_ativo', label: 'Moderadamente Ativo', desc: 'Exercício moderado 3 a 5 dias na semana' },
    { key: 'muito_ativo', label: 'Muito Ativo', desc: 'Exercício pesado 6 a 7 dias na semana' },
    { key: 'extremamente_ativo', label: 'Extremamente Ativo', desc: 'Trabalho físico pesado ou treino 2x ao dia' },
  ];

  const inputBase = 'w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 border rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors';

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-zinc-900/80 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Configurar Perfil</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Passo {step} de 5</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${step >= i ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
          ))}
        </div>
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 text-center mb-6">Informações Básicas</h3>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Sexo biológico</label>
            <select
              value={formData.sex}
              onChange={(e) => {
                setFormData({ ...formData, sex: e.target.value });
                if (errors.sex) setErrors({ ...errors, sex: '' });
              }}
              className={`${inputBase} !pl-4 cursor-pointer ${errors.sex ? '!border-red-500 !bg-red-50/50' : ''}`}
            >
              <option value="" disabled>- Selecione -</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="prefiro_nao_responder">Prefiro não responder</option>
            </select>
            {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Data de Nascimento</label>
            <DatePickerInput
              id="onboarding-birth-date"
              value={formData.birthDate}
              onChange={(val) => setFormData({ ...formData, birthDate: val })}
              onFocus={() => { if (errors.birthDate) setErrors({ ...errors, birthDate: '' }); }}
              error={errors.birthDate}
            />
            {errors.birthDate && <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 text-center mb-6">Qual é o seu objetivo principal?</h3>
          <div className="grid gap-3">
            {goals.map((g) => (
              <button
                key={g.key}
                onClick={() => { setFormData({ ...formData, goal: g.key }); setErrors({}); }}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${formData.goal === g.key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
              >
                <div className={`p-2 rounded-lg ${formData.goal === g.key ? 'bg-white dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-800/50'}`}>
                  {g.icon}
                </div>
                <span className={`font-medium ${formData.goal === g.key ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                  {g.label}
                </span>
              </button>
            ))}
          </div>
          {errors.goal && <p className="text-red-500 text-sm text-center mt-2">{errors.goal}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-5">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 text-center mb-6">Suas medidas corporais</h3>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Peso atual (kg)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} placeholder="Ex: 75.5" className={inputBase} />
            </div>
            {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Altura (cm)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="number" value={formData.height} onChange={(e) => setFormData({...formData, height: e.target.value})} placeholder="Ex: 175" className={inputBase} />
            </div>
            {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Percentual de Gordura (%) <span className="text-zinc-400 font-normal text-xs">(Opcional)</span>
            </label>
            <div className="relative">
              <ActivitySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input type="number" step="0.1" value={formData.bodyFat} onChange={(e) => setFormData({...formData, bodyFat: e.target.value})} placeholder="Ex: 18.5" className={inputBase} />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 text-center mb-6">Como é a sua rotina?</h3>
          <div className="grid gap-3">
            {activityLevels.map((a) => (
              <button
                key={a.key}
                onClick={() => { setFormData({ ...formData, activityLevel: a.key }); setErrors({}); }}
                className={`p-3 rounded-xl border flex flex-col text-left transition-all ${formData.activityLevel === a.key ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-zinc-200 dark:border-zinc-700 hover:border-emerald-300 dark:hover:border-emerald-700'}`}
              >
                <span className={`font-medium ${formData.activityLevel === a.key ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-800 dark:text-zinc-200'}`}>
                  {a.label}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{a.desc}</span>
              </button>
            ))}
          </div>
          {errors.activityLevel && <p className="text-red-500 text-sm text-center mt-2">{errors.activityLevel}</p>}
        </div>
      )}

      {step === 5 && (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Tudo pronto, {user?.name.split(' ')[0]}!</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Com base nas suas informações, vamos calcular as suas necessidades calóricas e definir as melhores metas para o seu objetivo de <strong>{goals.find(g => g.key === formData.goal)?.label.toLowerCase()}</strong>.
          </p>
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 1 && (
          <button
            onClick={prevStep}
            disabled={isLoading}
            className="flex-1 py-3 px-4 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        )}
        
        {step < 5 ? (
          <button
            onClick={nextStep}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
          >
            Continuar
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-60"
          >
            {isLoading ? (
               <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Começar agora
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
