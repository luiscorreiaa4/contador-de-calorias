import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveGoal, updateGoals, previewGoals } from '../../services/goals.service';
import { Target, Info, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function GoalSettingsCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  
  // Local state for manual mode
  const [manualCalories, setManualCalories] = useState('');
  const [manualProteins, setManualProteins] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');
  
  const { data: goal, isLoading } = useQuery({
    queryKey: ['active-goal'],
    queryFn: () => getActiveGoal(),
  });

  const { data: previewData } = useQuery({
    queryKey: ['preview-goal', user?.weight, user?.activity_level, user?.goal],
    queryFn: () => previewGoals({
      weight: user?.weight,
      height: user?.height,
      sex: user?.sex,
      birthDate: user?.birth_date,
      body_fat: user?.body_fat,
      activity_level: user?.activity_level,
      goal: user?.goal,
    }),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: updateGoals,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-goal'] });
    }
  });

  // Sync mode with loaded goal
  useEffect(() => {
    if (goal) {
      setMode(goal.mode);
      if (goal.mode === 'manual') {
        setManualCalories(goal.calories.toString());
        setManualProteins(goal.proteins.toString());
        setManualCarbs(goal.carbs.toString());
        setManualFats(goal.fats.toString());
      }
    }
  }, [goal]);

  const handleSave = () => {
    if (mode === 'auto') {
      if (!previewData) return;
      mutation.mutate({
        calories: previewData.suggestedCalories,
        proteins: previewData.suggestedMacros.proteins,
        carbs: previewData.suggestedMacros.carbs,
        fats: previewData.suggestedMacros.fats,
        mode: 'auto',
      });
    } else {
      mutation.mutate({
        calories: Number(manualCalories) || 0,
        proteins: Number(manualProteins) || 0,
        carbs: Number(manualCarbs) || 0,
        fats: Number(manualFats) || 0,
        mode: 'manual',
      });
    }
  };

  if (isLoading) {
    return <div className="p-8 bg-card border-2 border-border animate-pulse h-64 flex items-center justify-center">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">CARREGANDO METAS...</span>
    </div>;
  }

  const isAuto = mode === 'auto';
  
  const displayCalories = isAuto ? previewData?.suggestedCalories : manualCalories;
  const displayProt = isAuto ? previewData?.suggestedMacros.proteins : manualProteins;
  const displayCarb = isAuto ? previewData?.suggestedMacros.carbs : manualCarbs;
  const displayFat = isAuto ? previewData?.suggestedMacros.fats : manualFats;

  const inputBase =
    'w-full px-4 py-2.5 bg-background border-2 rounded-none text-sm font-black text-foreground uppercase outline-none transition-colors min-h-[48px]';
  const inputNormal = 'border-border hover:border-primary/50 focus:border-primary focus:ring-0';
  const inputDisabled = 'border-border opacity-60 cursor-not-allowed';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-heading font-black uppercase tracking-tight text-foreground border-b-2 border-border pb-2 flex items-center gap-2">
        METAS DIÁRIAS
      </h2>

      {/* Toggle Mode */}
      <div className="flex flex-col sm:flex-row gap-4 border-2 border-border p-2 bg-background">
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-widest transition-all focus:outline-none ${
            mode === 'auto' 
              ? 'bg-primary text-primary-foreground border-2 border-transparent shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]' 
              : 'bg-background text-foreground border-2 border-transparent hover:border-border'
          }`}
        >
          AUTOMÁTICO
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 py-3 px-4 text-xs font-black uppercase tracking-widest transition-all focus:outline-none ${
            mode === 'manual' 
              ? 'bg-primary text-primary-foreground border-2 border-transparent shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]' 
              : 'bg-background text-foreground border-2 border-transparent hover:border-border'
          }`}
        >
          MANUAL
        </button>
      </div>

      {isAuto && (
        <div className="bg-primary/10 border-2 border-primary/20 p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground leading-relaxed">
            O MODO AUTOMÁTICO CALCULA SUAS NECESSIDADES (TMB + FATOR DE ATIVIDADE). 
            AS METAS SE AJUSTAM SOZINHAS SE VOCÊ ALTERAR PESO, ALTURA OU ROTINA.
          </p>
        </div>
      )}

      {mutation.isSuccess && (
        <div className="p-4 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-3 border-2 border-transparent">
          <Save className="w-5 h-5 shrink-0" />
          <span>METAS ATUALIZADAS COM SUCESSO!</span>
        </div>
      )}

      {/* Inputs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">CALORIAS (KCAL)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayCalories ?? ''}
            onChange={e => setManualCalories(e.target.value)}
            className={`${inputBase} ${isAuto ? inputDisabled : inputNormal}`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">PROTEÍNAS (G)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayProt ?? ''}
            onChange={e => setManualProteins(e.target.value)}
            className={`${inputBase} ${isAuto ? inputDisabled : inputNormal}`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">CARBOS (G)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayCarb ?? ''}
            onChange={e => setManualCarbs(e.target.value)}
            className={`${inputBase} ${isAuto ? inputDisabled : inputNormal}`}
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">GORDURAS (G)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayFat ?? ''}
            onChange={e => setManualFats(e.target.value)}
            className={`${inputBase} ${isAuto ? inputDisabled : inputNormal}`}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={mutation.isPending}
          className="w-full sm:w-auto px-8 py-3 bg-foreground text-background font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all border-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>APLICANDO...</span>
            </>
          ) : (
            <>
              <Target className="w-4 h-4" />
              <span>APLICAR METAS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
