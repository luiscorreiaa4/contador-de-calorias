import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveGoal, updateGoals, previewGoals } from '../../services/goals.service';
import { Target, Info, Save } from 'lucide-react';
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
    return <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border animate-pulse h-64"></div>;
  }

  const isAuto = mode === 'auto';
  
  const displayCalories = isAuto ? previewData?.suggestedCalories : manualCalories;
  const displayProt = isAuto ? previewData?.suggestedMacros.proteins : manualProteins;
  const displayCarb = isAuto ? previewData?.suggestedMacros.carbs : manualCarbs;
  const displayFat = isAuto ? previewData?.suggestedMacros.fats : manualFats;

  // Se estiver no modo manual mas nunca salvou como manual, o preview mostra o que o backend gerou
  
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b border-zinc-100 dark:border-zinc-800/80 pb-2 flex items-center gap-2">
        <Target className="w-4 h-4" />
        Metas Diárias
      </h2>

      <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-xl">
        <button
          onClick={() => setMode('auto')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'auto' 
              ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' 
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Automático
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            mode === 'manual' 
              ? 'bg-white dark:bg-zinc-700 shadow-sm text-emerald-600 dark:text-emerald-400' 
              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
        >
          Manual
        </button>
      </div>

      {isAuto && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 p-3 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
            O modo automático calcula suas necessidades ideais (TMB + Fator de Atividade) com base no seu perfil. 
            Se você alterar seu peso ou altura, as metas se ajustarão sozinhas caso você confirme.
          </p>
        </div>
      )}

      {mutation.isSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs flex items-center gap-2">
          <Save className="w-4 h-4" />
          Metas atualizadas com sucesso!
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Calorias (kcal)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayCalories ?? ''}
            onChange={e => setManualCalories(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${isAuto ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'} dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Proteínas (g)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayProt ?? ''}
            onChange={e => setManualProteins(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${isAuto ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'} dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Carbos (g)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayCarb ?? ''}
            onChange={e => setManualCarbs(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${isAuto ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'} dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100`}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-zinc-500">Gorduras (g)</label>
          <input 
            type="number" 
            readOnly={isAuto}
            value={displayFat ?? ''}
            onChange={e => setManualFats(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${isAuto ? 'bg-zinc-50 border-zinc-200 text-zinc-500' : 'bg-white border-zinc-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'} dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100`}
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Salvando...' : 'Aplicar Metas'}
        </button>
      </div>
    </div>
  );
}
