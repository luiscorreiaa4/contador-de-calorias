import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { prefersReducedMotion } from '../../navigation/swipe';

interface MeasurementPoint {
  date: string;
  weight: number;
  bodyFat?: number;
}

/** Carregado sob demanda: o recharts só baixa quando o gráfico aparece. */
const MeasurementLineChart: React.FC<{ data: MeasurementPoint[]; metric: 'weight' | 'fat' }> = ({
  data,
  metric,
}) => (
  <div data-no-swipe className="h-60 sm:h-72 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="hsl(var(--border))"
          opacity={0.5}
        />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          domain={
            metric === 'weight' ? ['dataMin - 2', 'dataMax + 2'] : ['dataMin - 1', 'dataMax + 1']
          }
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
          tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(v) => (metric === 'weight' ? `${v}kg` : `${v}%`)}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload as {
                date: string;
                weight: number;
                bodyFat?: number;
              };
              return (
                <div className="bg-card border-2 border-border p-3 shadow-hard">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {data.date}
                  </p>
                  {metric === 'weight' ? (
                    <>
                      <p className="text-sm font-black uppercase text-foreground">
                        {data.weight} kg
                      </p>
                      {data.bodyFat !== undefined && (
                        <p className="text-xs font-bold text-primary-ink uppercase">
                          {data.bodyFat}% gordura
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black uppercase text-foreground">
                        {data.bodyFat}% gordura
                      </p>
                      <p className="text-xs font-bold text-muted-foreground uppercase">
                        {data.weight} kg
                      </p>
                    </>
                  )}
                </div>
              );
            }
            return null;
          }}
        />
        <Line
          // Entrada curta (o padrão do recharts é 1,5 s); nenhuma com movimento reduzido.
          isAnimationActive={!prefersReducedMotion()}
          animationDuration={250}
          type="monotone"
          dataKey={metric === 'weight' ? 'weight' : 'bodyFat'}
          stroke="hsl(var(--primary-ink))"
          strokeWidth={3}
          dot={{
            r: 4,
            strokeWidth: 2,
            fill: 'hsl(var(--card))',
            stroke: 'hsl(var(--primary-ink))',
          }}
          activeDot={{
            r: 6,
            fill: 'hsl(var(--primary-ink))',
            stroke: 'hsl(var(--foreground))',
            strokeWidth: 2,
          }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default MeasurementLineChart;
