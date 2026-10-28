import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { completeUserOnboarding } from '../../services/auth.service';
import { Flame, Target, TrendingUp, ArrowRight, ArrowLeft, CheckCircle2, Weight, Ruler, ActivitySquare, AlertCircle } from 'lucide-react';
import { DatePickerInput } from '../common/DatePickerInput';

const validateBirthDateString = (val: string): boolean => {
  if (!val || val.length < 10) return false;
  const parts = val.split('/');
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > new Date().getFullYear()) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;
  const birthObj = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (birthObj > today) return false;
  const age = today.getFullYear() - year;
  return age >= 1 && age <= 120;
};

const onboardingFormSchema = z.object({
  sex: z.string().min(1, 'SELECIONE O SEXO BIOLÓGICO.'),
  birthDate: z
    .string()
    .min(1, 'A DATA DE NASCIMENTO É OBRIGATÓRIA.')
    .refine((val) => val.length >= 10, 'INFORME A DATA COMPLETA (DD/MM/AAAA).')
    .refine(validateBirthDateString, 'DATA DE NASCIMENTO INVÁLIDA.'),
  goal: z.string().min(1, 'SELECIONE UM OBJETIVO PARA CONTINUAR.'),
  weight: z.string().min(1, 'INFORME SEU PESO.'),
  height: z.string().min(1, 'INFORME SUA ALTURA.'),
  bodyFat: z.string().optional().default(''),
  activityLevel: z.string().min(1, 'SELECIONE SEU NÍVEL DE ATIVIDADE.'),
});

type OnboardingFormInputs = z.infer<typeof onboardingFormSchema>;

export const OnboardingFlow: React.FC = () => {
  const { user, setAuthSession } = useAuth();
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OnboardingFormInputs>({
    resolver: zodResolver(onboardingFormSchema),
    mode: 'onTouched',
    defaultValues: {
      sex: '',
      birthDate: '',
      goal: '',
      weight: '',
      height: '',
      bodyFat: '',
      activityLevel: '',
    },
  });

  const formValues = watch();

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

  const nextStep = async () => {
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['sex', 'birthDate']);
    } else if (step === 2) {
      isValid = await trigger('goal');
    } else if (step === 3) {
      isValid = await trigger(['weight', 'height']);
    } else if (step === 4) {
      isValid = await trigger('activityLevel');
    }
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = (data: OnboardingFormInputs) => {
    setServerError(null);
    onboardingMutation.mutate({
      sex: data.sex,
      birthDate: data.birthDate,
      goal: data.goal,
      weight: parseFloat(data.weight.replace(',', '.')),
      height: parseFloat(data.height.replace(',', '.')),
      body_fat: data.bodyFat ? parseFloat(data.bodyFat.replace(',', '.')) : undefined,
      activity_level: data.activityLevel,
    });
  };

  const goals = [
    { key: 'perder_peso', label: 'EMAGRECER', icon: <Flame className="w-5 h-5 text-primary-ink" /> },
    { key: 'manter_peso', label: 'MANTER PESO', icon: <Target className="w-5 h-5 text-primary-ink" /> },
    { key: 'ganhar_massa', label: 'GANHAR MASSA', icon: <TrendingUp className="w-5 h-5 text-primary-ink" /> },
  ];

  const activityLevels = [
    { key: 'sedentario', label: 'SEDENTÁRIO', desc: 'POUCO OU NENHUM EXERCÍCIO' },
    { key: 'pouco_ativo', label: 'POUCO ATIVO', desc: 'EXERCÍCIO LEVE 1 A 3 DIAS/SEMANA' },
    { key: 'moderadamente_ativo', label: 'MODERADAMENTE ATIVO', desc: 'EXERCÍCIO MODERADO 3 A 5 DIAS/SEMANA' },
    { key: 'muito_ativo', label: 'MUITO ATIVO', desc: 'EXERCÍCIO PESADO 6 A 7 DIAS/SEMANA' },
    { key: 'extremamente_ativo', label: 'EXTREMAMENTE ATIVO', desc: 'TRABALHO FÍSICO PESADO OU TREINO 2X/DIA' },
  ];

  const inputBase = 'w-full pl-10 pr-4 py-3 bg-background border-2 border-border rounded-none text-sm font-black text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus-visible:border-ring focus-visible:outline-none outline-none transition-colors min-h-[48px]';

  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 5) {
          nextStep();
        } else {
          handleSubmit(onSubmit)();
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
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-foreground pl-3">INFORMAÇÕES BÁSICAS</h3>
          
          <div>
            <label htmlFor="onboarding-sex" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">SEXO BIOLÓGICO</label>
            <select
              id="onboarding-sex"
              {...register('sex')}
              className={`${inputBase} !pl-4 cursor-pointer ${errors.sex ? '!border-destructive bg-destructive/10' : ''}`}
            >
              <option value="" disabled>- SELECIONE -</option>
              <option value="masculino">MASCULINO</option>
              <option value="feminino">FEMININO</option>
              <option value="prefiro_nao_responder">PREFIRO NÃO RESPONDER</option>
            </select>
            {errors.sex && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.sex.message}</p>}
          </div>

          <div>
            <label htmlFor="onboarding-birth-date" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">DATA DE NASCIMENTO</label>
            <DatePickerInput
              id="onboarding-birth-date"
              value={formValues.birthDate}
              onChange={(val) => {
                setValue('birthDate', val, { shouldValidate: true });
              }}
              error={errors.birthDate?.message}
            />
            {errors.birthDate && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.birthDate.message}</p>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-foreground pl-3">QUAL É O SEU OBJETIVO PRINCIPAL?</h3>
          <div className="grid gap-4">
            {goals.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => {
                  setValue('goal', g.key, { shouldValidate: true });
                }}
                className={`p-4 border-2 flex items-center gap-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring uppercase ${
                  formValues.goal === g.key 
                    ? 'border-foreground bg-secondary shadow-hard translate-y-0.5' 
                    : 'border-border bg-background hover:-translate-y-0.5 hover:shadow-hard-hover hover:border-foreground'
                }`}
              >
                <div className={`p-2 border-2 ${formValues.goal === g.key ? 'bg-background border-foreground' : 'bg-secondary border-transparent'}`}>
                  {g.icon}
                </div>
                <span className={`font-black tracking-widest text-xs ${formValues.goal === g.key ? 'text-primary-ink' : 'text-foreground'}`}>
                  {g.label}
                </span>
              </button>
            ))}
          </div>
          {errors.goal && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.goal.message}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-foreground pl-3">SUAS MEDIDAS CORPORAIS</h3>
          
          <div>
            <label htmlFor="onboarding-weight" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">PESO ATUAL (KG)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                id="onboarding-weight"
                type="number" 
                step="0.1" 
                {...register('weight')}
                placeholder="EX: 75.5" 
                className={`${inputBase} ${errors.weight ? '!border-destructive bg-destructive/10' : ''}`} 
              />
            </div>
            {errors.weight && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.weight.message}</p>}
          </div>

          <div>
            <label htmlFor="onboarding-height" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">ALTURA (CM)</label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                id="onboarding-height"
                type="number" 
                {...register('height')}
                placeholder="EX: 175" 
                className={`${inputBase} ${errors.height ? '!border-destructive bg-destructive/10' : ''}`} 
              />
            </div>
            {errors.height && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.height.message}</p>}
          </div>

          <div>
            <label htmlFor="onboarding-body-fat" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              PERCENTUAL DE GORDURA (%) <span className="text-muted-foreground opacity-50 ml-1">(OPCIONAL)</span>
            </label>
            <div className="relative">
              <ActivitySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                id="onboarding-body-fat"
                type="number" 
                step="0.1" 
                {...register('bodyFat')}
                placeholder="EX: 18.5" 
                className={inputBase} 
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-sm font-heading font-black text-foreground uppercase tracking-tight border-l-4 border-foreground pl-3">COMO É A SUA ROTINA?</h3>
          <div className="grid gap-4">
            {activityLevels.map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => {
                  setValue('activityLevel', a.key, { shouldValidate: true });
                }}
                className={`p-4 border-2 flex flex-col text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring uppercase ${
                  formValues.activityLevel === a.key 
                    ? 'border-foreground bg-secondary shadow-hard translate-y-0.5' 
                    : 'border-border bg-background hover:-translate-y-0.5 hover:shadow-hard-hover hover:border-foreground'
                }`}
              >
                <span className={`font-black tracking-widest text-xs mb-1 ${formValues.activityLevel === a.key ? 'text-primary-ink' : 'text-foreground'}`}>
                  {a.label}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">{a.desc}</span>
              </button>
            ))}
          </div>
          {errors.activityLevel && <p className="text-destructive font-bold text-[10px] mt-2 uppercase tracking-widest">{errors.activityLevel.message}</p>}
        </div>
      )}

      {step === 5 && (
        <div className="text-center space-y-6 py-6 border-2 border-border bg-secondary">
          <div className="w-16 h-16 bg-primary text-primary-foreground border-2 border-edge flex items-center justify-center mx-auto shadow-hard-fill">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="px-6">
            <h3 className="text-lg font-heading font-black text-foreground uppercase tracking-tight mb-3">TUDO PRONTO, {user?.name.split(' ')[0].toUpperCase()}!</h3>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase leading-relaxed">
              VAMOS CALCULAR SUAS NECESSIDADES E DEFINIR METAS PARA O OBJETIVO DE <strong className="text-foreground">{goals.find(g => g.key === formValues.goal)?.label}</strong>.
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
            className="flex-1 py-3 px-4 border-2 border-border bg-background text-foreground font-black uppercase tracking-widest text-xs hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            VOLTAR
          </button>
        )}
        
        {step < 5 ? (
          <button
            type="submit"
            className="flex-[2] py-3 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-2 border-edge hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-hard-fill hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            CONTINUAR
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={onboardingMutation.isPending}
            className="w-full py-3 px-4 bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs border-2 border-edge hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-hard-fill disabled:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
