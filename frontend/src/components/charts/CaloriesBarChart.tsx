import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { MealStats } from '../../services/meal.service';
import { prefersReducedMotion } from '../../navigation/swipe';

/** Carregado sob demanda: o recharts só baixa quando o gráfico aparece. */
const CaloriesBarChart: React.FC<{ stats: MealStats; period: 'week' | 'month' }> = ({
  stats,
  period,
}) => (
  <div data-no-swipe className="h-60 sm:h-80 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={stats.chartData} margin={{ top: 24, right: 8, left: 0, bottom: 8 }}>
        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="hsl(var(--border))"
          opacity={0.8}
        />
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
              const item = stats.chartData.find((d) => d.date === val);
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
          width={40}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--muted) / 0.2)' }}
          contentStyle={{
            borderRadius: '0px',
            border: '2px solid hsl(var(--border))',
            backgroundColor: 'hsl(var(--card))',
            boxShadow: '4px 4px 0px 0px hsl(var(--shadow) / var(--shadow-alpha))',
            textTransform: 'uppercase',
            padding: '12px',
          }}
          itemStyle={{
            color: 'hsl(var(--foreground))',
            fontWeight: '900',
            fontSize: '14px',
            fontFamily: 'Montserrat, sans-serif',
          }}
          labelStyle={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '10px',
            fontWeight: 'bold',
            marginBottom: '8px',
            letterSpacing: '0.1em',
          }}
          labelFormatter={(label) => {
            const item = stats.chartData.find((d) => d.date === label);
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
            label={{
              position: 'top',
              value: 'MÉDIA DA META',
              fill: 'hsl(var(--foreground))',
              fontSize: 10,
              fontWeight: 'bold',
              letterSpacing: '0.1em',
            }}
          />
        )}
        <Bar
          // Entrada curta (o padrão do recharts é 1,5 s); nenhuma com movimento reduzido.
          isAnimationActive={!prefersReducedMotion()}
          animationDuration={250}
          dataKey="consumed_calories"
          fill="hsl(var(--primary))"
          radius={[0, 0, 0, 0]}
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default CaloriesBarChart;
