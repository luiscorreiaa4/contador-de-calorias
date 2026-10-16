import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { completeUserOnboarding } from '../../services/auth.service';
import { Flame, Target, TrendingUp, ArrowRight, ArrowLeft, CheckCircle2, Weight, Ruler, ActivitySquare, AlertCircle } from 'lucide-react';
import { DatePickerInput } from '../common/DatePickerInput';

export const OnboardingFlow: React.FC = () => {
  const { user, setAuthSession } = useAuth();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const onboardingMutation = useMutation({
    mutationFn: completeUserOnboarding,
    onSuccess: (response) => {
      setAuthSession(response.user, response.token);
    },
    onError: (err: unknown) => {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setServerError(errorMsg || 'ERRO AO SALVAR O PERFIL. TENTE NOVAMENTE.');
    },
  });

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
    if (!val || !val.trim()) return 'A DATA DE NASCIMENTO É OBRIGATÓRIA.';
    if (val.length < 10) return 'INFORME A DATA COMPLETA (DD/MM/AAAA).';
    const parts = val.split('/');
    if (parts.length !== 3) return 'DATA INVÁLIDA (DD/MM/AAAA).';
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return 'DATA DE NASCIMENTO INVÁLIDA.';
    if (month < 1 || month > 12) return 'MÊS INVÁLIDO.';
    if (year < 1900 || year > new Date().getFullYear()) return 'ANO INVÁLIDO.';
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) return 'DATA DE NASCIMENTO INVÁLIDA.';
    const birthObj = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (birthObj > today) return 'A DATA NÃO PODE SER NO FUTURO.';
    const age = today.getFullYear() - year;
    if (age < 1 || age > 120) return 'INFORME UMA DATA VÁLIDA.';
    return null;
  };

  const nextStep = () => {
    const currentErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.sex) currentErrors.sex = 'SELECIONE O SEXO BIOLÓGICO.';
      const birthErr = validateBirthDate(formData.birthDate);
      if (birthErr) currentErrors.birthDate = birthErr;
    } else if (step === 2) {
      if (!formData.goal) currentErrors.goal = 'SELECIONE UM OBJETIVO PARA CONTINUAR.';
    } else if (step === 3) {
      if (!formData.weight) currentErrors.weight = 'INFORME SEU PESO.';
      if (!formData.height) currentErrors.height = 'INFORME SUA ALTURA.';
    } else if (step === 4) {
      if (!formData.activityLevel) currentErrors.activityLevel = 'SELECIONE SEU NÍVEL DE ATIVIDADE.';
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

  const handleSubmit = () => {
    setServerError(null);
    onboardingMutation.mutate({
      sex: formData.sex,
      birthDate: formData.birthDate,
      goal: formData.goal,
      weight: parseFloat(formData.weight.replace(',', '.')),
      height: parseFloat(formData.height.replace(',', '.')),
      body_fat: formData.bodyFat ? parseFloat(formData.bodyFat.replace(',', '.')) : undefined,
      activity_level: formData.activityLevel,
    });
  };

  const goals = [
    { key: 'perder_peso', label: 'EMAGRECER', icon: <Flame className="w-5 h-5 text-primary" /> },
    { key: 'manter_peso', label: 'MANTER PESO', icon: <Target className="w-5 h-5 text-primary" /> },
    { key: 'ganhar_massa', label: 'GANHAR MASSA', icon: <TrendingUp className="w-5 h-5 text-primary" /> },
  ];

  const activityLevels = [
    { key: 'sedentario', label: 'SEDENTÁRIO', desc: 'POUCO OU NENHUM EXERCÍCIO' },
    { key: 'pouco_ativo', label: 'POUCO ATIVO', desc: 'EXERCÍCIO LEVE 1 A 3 DIAS/SEMANA' },
    { key: 'moderadamente_ativo', label: 'MODERADAMENTE ATIVO', desc: 'EXERCÍCIO MODERADO 3 A 5 DIAS/SEMANA' },
    { key: 'muito_ativo', label: 'MUITO ATIVO', desc: 'EXERCÍCIO PESADO 6 A 7 DIAS/SEMANA' },
    { key: 'extremamente_ativo', label: 'EXTREMAMENTE ATIVO', desc: 'TRABALHO FÍSICO PESADO OU TREINO 2X/DIA' },
  ];

  const inputBase = 'w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-none text-sm font-black text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors min-h-[48px]';

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 5) {
          nextStep();
        } else {
          handleSubmit();
        }
      }}
      className="w-full max-w-md mx-auto p-6 sm:p-8 bg-card border-2 border-border shadow-hard flex flex-col gap-6"
    >
      <div className="flex justify-between items-center border-b-2 border-border pb-4">
        <div>
          <h2 className="text-xl font-heading font-black text-foreground uppercase tracking-tight">CONFIGURAR PERFIL</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">PASSO {step} DE 5</p>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`w-3 h-3 border-2 border-border ${step >= i ? 'bg-primary' : 'bg-background'}`} />
          ))}
        </div>
      </div>

      {serverError && (
        <div className="p-4 bg-destructive text-destructive-foreground border-2 border-transparent font-bold text-xs uppercase tracking-widest flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-primary pl-3">INFORMAÇÕES BÁSICAS</h3>
          
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">SEXO BIOLÓGICO</label>
            <select
              value={formData.sex}
              onChange={(e) => {
                setFormData({ ...formData, sex: e.target.value });
                if (errors.sex) setErrors({ ...errors, sex: '' });
              }}
              className={`${inputBase} !pl-4 cursor-pointer ${errors.sex ? '!border-destructive bg-destructive/10' : ''}`}
            >
              <option value="" disabled>- SELECIONE -</option>
              <option value="masculino">MASCULINO</option>
              <option value="feminino">FEMININO</option>
              <option value="prefiro_nao_responder">PREFIRO NÃO RESPONDER</option>
            </select>
            {errors.sex && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.sex}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">DATA DE NASCIMENTO</label>
            <DatePickerInput
              id="onboarding-birth-date"
              value={formData.birthDate}
              onChange={(val) => setFormData({ ...formData, birthDate: val })}
              onFocus={() => { if (errors.birthDate) setErrors({ ...errors, birthDate: '' }); }}
              error={errors.birthDate}
            />
            {errors.birthDate && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.birthDate}</p>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-primary pl-3">QUAL É O SEU OBJETIVO PRINCIPAL?</h3>
          <div className="grid gap-4">
            {goals.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => { setFormData({ ...formData, goal: g.key }); setErrors({}); }}
                className={`p-4 border-2 flex items-center gap-4 transition-all focus:outline-none uppercase ${
                  formData.goal === g.key 
                    ? 'border-primary bg-secondary shadow-hard translate-y-0.5' 
                    : 'border-border bg-background hover:-translate-y-0.5 hover:shadow-hard-hover hover:border-primary'
                }`}
              >
                <div className={`p-2 border-2 ${formData.goal === g.key ? 'bg-background border-primary' : 'bg-secondary border-transparent'}`}>
                  {g.icon}
                </div>
                <span className={`font-black tracking-widest text-xs ${formData.goal === g.key ? 'text-primary' : 'text-foreground'}`}>
                  {g.label}
                </span>
              </button>
            ))}
          </div>
          {errors.goal && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.goal}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-primary pl-3">SUAS MEDIDAS CORPORAIS</h3>
          
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">PESO ATUAL (KG)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="number" 
                step="0.1" 
                value={formData.weight} 
                onChange={(e) => setFormData({...formData, weight: e.target.value})} 
                placeholder="EX: 75.5" 
                className={`${inputBase} ${errors.weight ? '!border-destructive bg-destructive/10' : ''}`} 
              />
            </div>
            {errors.weight && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.weight}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">ALTURA (CM)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="number" 
                value={formData.height} 
                onChange={(e) => setFormData({...formData, height: e.target.value})} 
                placeholder="EX: 175" 
                className={`${inputBase} ${errors.height ? '!border-destructive bg-destructive/10' : ''}`} 
              />
            </div>
            {errors.height && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.height}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              PERCENTUAL DE GORDURA (%) <span className="text-muted-foreground opacity-50 ml-1">(OPCIONAL)</span>
            </label>
            <div className="relative">
              <ActivitySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="number" 
                step="0.1" 
                value={formData.bodyFat} 
                onChange={(e) => setFormData({...formData, bodyFat: e.target.value})} 
                placeholder="EX: 18.5" 
                className={inputBase} 
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-primary pl-3">COMO É A SUA ROTINA?</h3>
          <div className="grid gap-4">
            {activityLevels.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => { setFormData({ ...formData, activityLevel: a.key }); setErrors({}); }}
                className={`p-4 border-2 flex flex-col text-left transition-all focus:outline-none uppercase ${
                  formData.activityLevel === a.key 
                    ? 'border-primary bg-secondary shadow-hard translate-y-0.5' 
                    : 'border-border bg-background hover:-translate-y-0.5 hover:shadow-hard-hover hover:border-primary'
                }`}
              >
                <span className={`font-black tracking-widest text-xs mb-1 ${formData.activityLevel === a.key ? 'text-primary' : 'text-foreground'}`}>
                  {a.label}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">{a.desc}</span>
              </button>
            ))}
          </div>
          {errors.activityLevel && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.activityLevel}</p>}
        </div>
      )}

      {step === 5 && (
        <div className="text-center space-y-6 py-6 border-2 border-border bg-secondary">
          <div className="w-16 h-16 bg-primary text-primary-foreground border-2 border-transparent flex items-center justify-center mx-auto shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="px-6">
            <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight mb-3">TUDO PRONTO, {user?.name.split(' ')[0].toUpperCase()}!</h3>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase leading-relaxed">
              VAMOS CALCULAR SUAS NECESSIDADES E DEFINIR METAS PARA O OBJETIVO DE <strong className="text-foreground">{goals.find(g => g.key === formData.goal)?.label}</strong>.
            </p>
          </div>
        </div>
      )}

      <div className="mt-2 flex gap-4">
        {step > 1 && (
          <button
            type="button"
            onClick={prevStep}
            disabled={onboardingMutation.isPending}
            className="flex-1 py-3 px-4 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary focus:outline-none transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            VOLTAR
          </button>
        )}
        
        {step < 5 ? (
          <button
            type="submit"
            className="flex-[2] py-3 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-2 border-transparent hover:bg-primary/90 focus:outline-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            CONTINUAR
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={onboardingMutation.isPending}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-2 border-transparent hover:bg-primary/90 focus:outline-none shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] disabled:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {onboardingMutation.isPending ? (
              <span>CARREGANDO...</span>
            ) : (
              <>
                COMEÇAR AGORA
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
};
