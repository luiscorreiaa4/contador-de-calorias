import React, { Suspense, lazy, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMealStats, type MealStats } from '../../services/meal.service';
import { getLocalDateString } from '../../utils/date';
import { ChartSkeleton } from '../../components/charts/ChartSkeleton';

const CaloriesBarChart = lazy(() => import('../../components/charts/CaloriesBarChart'));
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { SectionCard } from '../../components/common/SectionCard';
import { SegmentedToggle } from '../../components/common/SegmentedToggle';

type Period = 'week' | 'month';

const PERIOD_OPTIONS = [
  { value: 'week', label: '7D', ariaLabel: 'Últimos 7 dias' },
  { value: 'month', label: '30D', ariaLabel: 'Últimos 30 dias' },
] as const;

const MACROS = [
  { key: 'proteins', label: 'PROT' },
  { key: 'carbs', label: 'CARB' },
  { key: 'fats', label: 'GORD' },
] as const;

function Summary({ stats }: { stats: MealStats }) {
  const { consumed, goal } = stats.averages;
  return (
    <div className="space-y-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-relaxed">
        Média dos {stats.daysLogged} de {stats.totalDays} dias com refeição registrada
      </p>

      <div className="grid grid-cols-2 divide-x-2 divide-border">
        <div className="pr-4 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            CONSUMO
          </span>
          <span className="block text-3xl sm:text-5xl font-heading font-black text-foreground tracking-tighter">
            {consumed.calories}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            KCAL/DIA
          </span>
        </div>
        <div className="pl-4 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            META
          </span>
          <span className="block text-3xl sm:text-5xl font-heading font-black text-muted-foreground tracking-tighter">
            {goal.calories}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            KCAL/DIA
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t-2 border-border pt-4">
        {MACROS.map(({ key, label }) => (
          <div key={key} className="min-w-0">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {label}
            </span>
            <span className="text-base sm:text-lg font-heading font-black text-foreground">
              {consumed[key]}
            </span>
            <span className="text-xs font-bold text-muted-foreground"> / {goal[key]}G</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const StatsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const Heading = embedded ? 'h2' : 'h1';
  const [period, setPeriod] = useState<Period>('week');
  const clientDate = getLocalDateString();

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mealStats', period, clientDate],
    queryFn: ({ signal }) => getMealStats(period, clientDate, signal),
    staleTime: 1000 * 60 * 5,
  });

  const hasData = !isLoading && !isError && !!stats && stats.daysLogged > 0;

  return (
    <div className={embedded ? 'space-y-6' : 'w-full max-w-5xl mx-auto px-4 py-8 space-y-6'}>
      {/* A aba "Alimentação" já nomeia a página; o título só existe para a hierarquia de cabeçalhos. */}
      <Heading
        className={
          embedded
            ? 'sr-only'
            : 'text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter'
        }
      >
        ALIMENTAÇÃO
      </Heading>

      <SectionCard
        title="MÉDIA DE CONSUMO"
        titleAs="h3"
        actions={
          <SegmentedToggle
            options={[...PERIOD_OPTIONS]}
            value={period}
            onChange={setPeriod}
            ariaLabel="Período"
          />
        }
      >
        {isLoading ? (
          <ChartSkeleton className="h-32" label="CARREGANDO ESTATÍSTICAS..." />
        ) : isError ? (
          <div
            role="alert"
            className="bg-destructive/10 border-2 border-destructive p-6 flex flex-col items-center justify-center text-center gap-3"
          >
            <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
            <div>
              <h3 className="text-base font-heading font-black text-destructive uppercase tracking-wide">
                FALHA AO CARREGAR ESTATÍSTICAS
              </h3>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                {error instanceof Error
                  ? error.message
                  : 'NÃO FOI POSSÍVEL CONSULTAR SEU HISTÓRICO NO MOMENTO.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 py-3 px-6 bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-xs border-2 border-destructive hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : stats && stats.daysLogged === 0 ? (
          <div className="border-2 border-border border-dashed p-8 text-center flex flex-col items-center justify-center">
            <TrendingUp
              className="w-10 h-10 text-muted-foreground mb-4 opacity-50"
              aria-hidden="true"
            />
            <p className="text-base font-heading font-black uppercase tracking-tight text-foreground mb-1">
              NENHUM HISTÓRICO REGISTRADO NESTE PERÍODO
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground max-w-md">
              VOCÊ AINDA NÃO REGISTROU NENHUMA REFEIÇÃO NOS{' '}
              {period === 'week' ? 'ÚLTIMOS 7 DIAS' : 'ÚLTIMOS 30 DIAS'}. REGISTRE SUAS REFEIÇÕES NO
              DIÁRIO PARA VER SUAS TENDÊNCIAS.
            </p>
          </div>
        ) : stats ? (
          <Summary stats={stats} />
        ) : null}
      </SectionCard>

      {hasData && stats && (
        <SectionCard title="CALORIAS POR DIA" titleAs="h3">
          <Suspense fallback={<ChartSkeleton className="h-60 sm:h-80" />}>
            <CaloriesBarChart stats={stats} period={period} />
          </Suspense>
        </SectionCard>
      )}
    </div>
  );
};
