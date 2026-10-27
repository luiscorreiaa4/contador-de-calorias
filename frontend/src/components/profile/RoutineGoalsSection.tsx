import React from 'react';
import type { FieldErrors } from 'react-hook-form';
import { Flame, Target, TrendingUp } from 'lucide-react';
import type { RoutineFormInputs } from '../../types/profile';

interface RoutineGoalsSectionProps {
  goalValue: string;
  activityLevelValue: string;
  onSelectGoal: (key: string) => void;
  onSelectActivityLevel: (key: string) => void;
  errors: FieldErrors<RoutineFormInputs>;
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
          <p id="goal-group-label" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            SEU FOCO PRINCIPAL
          </p>
          <div role="radiogroup" aria-labelledby="goal-group-label" className="flex flex-col gap-3">
            {goals.map(({ key, label, icon }) => (
              <label
                key={key}
                htmlFor={`routine-goal-${key}`}
                className={`p-4 border-2 flex items-center gap-4 transition-all cursor-pointer focus-within:ring-2 focus-within:ring-ring ${
                  goalValue === key
                    ? 'border-edge bg-primary text-primary-foreground shadow-hard-fill'
                    : 'border-border bg-background text-foreground hover:border-foreground hover:bg-secondary'
                }`}
              >
                <input id={`routine-goal-${key}`} type="radio" name="routine-goal" value={key} checked={goalValue === key} onChange={() => onSelectGoal(key)} className="accent-primary-ink" />
                <div className={goalValue === key ? 'text-primary-foreground' : 'text-primary-ink'}>
                  {icon}
                </div>
                <span className="font-black uppercase tracking-widest text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Nível de Atividade */}
        <div>
          <p id="activity-group-label" className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            NÍVEL DE ATIVIDADE FÍSICA
          </p>
          <div role="radiogroup" aria-labelledby="activity-group-label" className="grid gap-3">
            {activityLevels.map((a) => (
              <label
                key={a.key}
                htmlFor={`routine-activity-${a.key}`}
                className={`p-3 border-2 flex flex-col text-left transition-all cursor-pointer focus-within:ring-2 focus-within:ring-ring ${
                  activityLevelValue === a.key
                    ? 'border-edge bg-primary text-primary-foreground shadow-hard-fill'
                    : 'border-border bg-background hover:border-foreground text-foreground'
                }`}
              >
                <input id={`routine-activity-${a.key}`} type="radio" name="routine-activity" value={a.key} checked={activityLevelValue === a.key} onChange={() => onSelectActivityLevel(a.key)} className="sr-only" />
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
              </label>
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
