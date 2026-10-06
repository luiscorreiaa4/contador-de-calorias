import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMealStats } from '../../services/meal.service';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp, Target, Info } from 'lucide-react';

export const StatsPage: React.FC = () => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['mealStats', period],
    queryFn: ({ signal }) => getMealStats(period, undefined, signal),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-500 mb-0.5">
            Estatísticas
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Histórico e Tendências
          </h1>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              period === 'week' 
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              period === 'month' 
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Últimos 30 dias
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          <p>Carregando estatísticas...</p>
        </div>
      ) : stats ? (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-2xl flex items-start gap-3 border border-blue-100 dark:border-blue-800/50">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm">
              As médias abaixo consideram <strong>apenas os dias em que houve pelo menos uma refeição registrada</strong>. 
              Neste período de {stats.totalDays} dias, você registrou refeições em <strong className="font-bold">{stats.daysLogged} dias</strong>.
            </p>
          </div>

          {/* Cards Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Média de Consumo
                </h3>
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  {stats.averages.consumed.calories}
                </span>
                <span className="text-zinc-500 font-medium mb-1">kcal/dia</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div>
                  <span className="block text-xs text-zinc-500">Proteínas</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.averages.consumed.proteins}g</span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Carboidratos</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.averages.consumed.carbs}g</span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Gorduras</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.averages.consumed.fats}g</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Média da Meta
                </h3>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-white">
                  {stats.averages.goal.calories}
                </span>
                <span className="text-zinc-500 font-medium mb-1">kcal/dia</span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <div>
                  <span className="block text-xs text-zinc-500">Proteínas</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.averages.goal.proteins}g</span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Carboidratos</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.averages.goal.carbs}g</span>
                </div>
                <div>
                  <span className="block text-xs text-zinc-500">Gorduras</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{stats.averages.goal.fats}g</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-6">Histórico Diário de Calorias</h3>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" opacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    tickFormatter={(val) => {
                      if (period === 'week') {
                        const item = stats.chartData.find(d => d.date === val);
                        return item ? item.dayName : val;
                      }
                      const parts = val.split('-');
                      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                      return val;
                    }}
                  />
                  <YAxis 
                    stroke="#a1a1aa" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                    labelStyle={{ color: '#71717a', fontSize: '12px', marginBottom: '4px' }}
                    labelFormatter={(label) => {
                      const item = stats.chartData.find(d => d.date === label);
                      if (!item) return label;
                      const parts = item.date.split('-');
                      if (parts.length === 3) return `${item.dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
                      return label;
                    }}
                    formatter={(val, name) => {
                      if (name === 'consumed_calories') return [`${val} kcal`, 'Consumido'];
                      if (name === 'goal_calories') return [`${val} kcal`, 'Meta'];
                      return [val, name];
                    }}
                  />
                  {stats.averages.goal.calories > 0 && (
                    <ReferenceLine 
                      y={stats.averages.goal.calories} 
                      stroke="#10b981" 
                      strokeDasharray="4 4" 
                      strokeWidth={2}
                      label={{ position: 'top', value: 'Média da Meta', fill: '#10b981', fontSize: 12, fontWeight: 'bold' }}
                    />
                  )}
                  <Bar dataKey="consumed_calories" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};
