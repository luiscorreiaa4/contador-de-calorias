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
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-border pb-6 gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
            Estatísticas
          </p>
          <h1 className="text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter">
            HISTÓRICO E TENDÊNCIAS
          </h1>
        </div>
        
        <div className="flex gap-4 border-2 border-border p-2 bg-background w-full md:w-auto">
          <button
            onClick={() => setPeriod('week')}
            className={`flex-1 md:flex-none py-3 px-6 text-xs font-black uppercase tracking-widest transition-all focus:outline-none ${
              period === 'week' 
                ? 'bg-primary text-primary-foreground border-2 border-transparent shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]' 
                : 'bg-background text-foreground border-2 border-transparent hover:border-border'
            }`}
          >
            ÚLTIMOS 7 DIAS
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 md:flex-none py-3 px-6 text-xs font-black uppercase tracking-widest transition-all focus:outline-none ${
              period === 'month' 
                ? 'bg-primary text-primary-foreground border-2 border-transparent shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]' 
                : 'bg-background text-foreground border-2 border-transparent hover:border-border'
            }`}
          >
            ÚLTIMOS 30 DIAS
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 border-2 border-border border-dashed bg-card opacity-50">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">CARREGANDO ESTATÍSTICAS...</p>
        </div>
      ) : stats ? (
        <div className="space-y-10">
          
          <div className="bg-primary/10 border-2 border-primary/20 p-4 flex items-start gap-4">
            <Info className="w-6 h-6 text-primary shrink-0" />
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-foreground leading-relaxed">
              AS MÉDIAS ABAIXO CONSIDERAM <strong className="text-primary">APENAS OS DIAS EM QUE HOUVE PELO MENOS UMA REFEIÇÃO REGISTRADA</strong>.<br className="hidden sm:block" /> 
              NESTE PERÍODO DE {stats.totalDays} DIAS, VOCÊ REGISTROU REFEIÇÕES EM <strong className="text-primary">{stats.daysLogged} DIAS</strong>.
            </p>
          </div>

          {/* Cards Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-card border-2 border-border p-6 shadow-hard group">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-widest">
                  MÉDIA DE CONSUMO
                </h3>
                <div className="p-2 bg-primary text-primary-foreground">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-heading font-black text-foreground tracking-tighter">
                  {stats.averages.consumed.calories}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">KCAL/DIA</span>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t-2 border-border pt-6">
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">PROT</span>
                  <span className="text-lg font-heading font-black text-foreground">{stats.averages.consumed.proteins}G</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CARB</span>
                  <span className="text-lg font-heading font-black text-foreground">{stats.averages.consumed.carbs}G</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GORD</span>
                  <span className="text-lg font-heading font-black text-foreground">{stats.averages.consumed.fats}G</span>
                </div>
              </div>
            </div>

            <div className="bg-card border-2 border-border p-6 shadow-hard group">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-widest">
                  MÉDIA DA META
                </h3>
                <div className="p-2 border-2 border-border bg-background text-foreground group-hover:border-foreground transition-colors">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-heading font-black text-foreground tracking-tighter">
                  {stats.averages.goal.calories}
                </span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">KCAL/DIA</span>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t-2 border-border pt-6">
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">PROT</span>
                  <span className="text-lg font-heading font-black text-foreground">{stats.averages.goal.proteins}G</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">CARB</span>
                  <span className="text-lg font-heading font-black text-foreground">{stats.averages.goal.carbs}G</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">GORD</span>
                  <span className="text-lg font-heading font-black text-foreground">{stats.averages.goal.fats}G</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-card border-2 border-border p-6 sm:p-8 shadow-hard">
            <h3 className="text-xl font-heading font-black text-foreground uppercase tracking-tight mb-8">
              HISTÓRICO DIÁRIO DE CALORIAS
            </h3>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 30, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.8} />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    dy={10}
                    minTickGap={15}
                    tickFormatter={(val) => {
                      if (period === 'week') {
                        const item = stats.chartData.find(d => d.date === val);
                        return item ? item.dayName.toUpperCase() : val;
                      }
                      const parts = val.split('-');
                      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                      return val;
                    }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={10}
                    fontWeight="bold"
                    tickLine={false} 
                    axisLine={false} 
                    dx={-5}
                    width={45}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted) / 0.2)' }} 
                    contentStyle={{ 
                      borderRadius: '0px', 
                      border: '2px solid hsl(var(--border))', 
                      backgroundColor: 'hsl(var(--card))',
                      boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                      textTransform: 'uppercase',
                      padding: '12px'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: '900', fontSize: '14px', fontFamily: 'Montserrat, sans-serif' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', fontWeight: 'bold', marginBottom: '8px', letterSpacing: '0.1em' }}
                    labelFormatter={(label) => {
                      const item = stats.chartData.find(d => d.date === label);
                      if (!item) return label;
                      const parts = item.date.split('-');
                      if (parts.length === 3) return `${item.dayName}, ${parts[2]}/${parts[1]}/${parts[0]}`;
                      return label;
                    }}
                    formatter={(val, name) => {
                      if (name === 'consumed_calories') return [`${val} KCAL`, 'CONSUMIDO'];
                      if (name === 'goal_calories') return [`${val} KCAL`, 'META'];
                      return [val, name];
                    }}
                  />
                  {stats.averages.goal.calories > 0 && (
                    <ReferenceLine 
                      y={stats.averages.goal.calories} 
                      stroke="hsl(var(--foreground))" 
                      strokeDasharray="8 8" 
                      strokeWidth={2}
                      label={{ position: 'top', value: 'MÉDIA DA META', fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 'bold', letterSpacing: '0.1em' }}
                    />
                  )}
                  <Bar dataKey="consumed_calories" fill="#ccff00" radius={[0, 0, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
};
