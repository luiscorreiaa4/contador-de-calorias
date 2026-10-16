import React from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Flame, Target, TrendingUp } from 'lucide-react';
import type { EditProfileFormInputs } from '../../types/profile';

interface RoutineGoalsSectionProps {
  goalValue: string;
  activityLevelValue: string;
  onSelectGoal: (key: string) => void;
  onSelectActivityLevel: (key: string) => void;
  errors: FieldErrors<EditProfileFormInputs>;
}

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

export const RoutineGoalsSection: React.FC<RoutineGoalsSectionProps> = ({
  goalValue,
  activityLevelValue,
  onSelectGoal,
  onSelectActivityLevel,
  errors,
}) => {
  return (
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
                aria-checked={goalValue === key}
                onClick={() => onSelectGoal(key)}
                className={`p-4 border-2 flex items-center gap-4 transition-all focus:outline-none ${
                  goalValue === key
                    ? 'border-primary bg-primary text-primary-foreground shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]'
                    : 'border-border bg-background text-foreground hover:border-primary/50 hover:bg-secondary'
                }`}
              >
                <div className={goalValue === key ? 'text-primary-foreground' : 'text-primary'}>
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
                onClick={() => onSelectActivityLevel(a.key)}
                className={`p-3 border-2 flex flex-col text-left transition-all focus:outline-none ${
                  activityLevelValue === a.key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background hover:border-primary/50 text-foreground'
                }`}
              >
                <span className="text-xs font-black uppercase tracking-widest">
                  {a.label}
                </span>
                <span
                  className={`text-[10px] font-bold tracking-widest uppercase mt-1 ${
                    activityLevelValue === a.key ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {a.desc}
                </span>
              </button>
            ))}
          </div>
          {errors.activityLevel && (
            <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-destructive">
              {errors.activityLevel.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
