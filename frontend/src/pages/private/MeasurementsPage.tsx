import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateMeasurementDTO } from '@caloriesync/shared';
import { z } from 'zod';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMeasurements, addMeasurement, deleteMeasurement, type BodyMeasurement } from '../../services/measurement.service';
import { getLocalDateString } from '../../utils/date';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Scale, TrendingDown, TrendingUp, Plus, AlertTriangle, Calendar, Trash2 } from 'lucide-react';

const isValidDateValue = (val: string) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    if (Number.isNaN(Date.parse(trimmed))) return false;
    return trimmed <= getLocalDateString();
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return false;
  const [d, m, y] = trimmed.split('/').map(Number);
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d > daysInMonth) return false;
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};

const getTodayBR = () => getLocalDateString().split('-').reverse().join('/');

const measurementFormSchema = z.object({
  weight: z
    .number({ invalid_type_error: 'INFORME UM PESO VÁLIDO.', required_error: 'INFORME SEU PESO.' })
    .positive('O PESO DEVE SER MAIOR QUE ZERO.')
    .max(500, 'PESO INVÁLIDO.'),
  body_fat: z
    .number({ invalid_type_error: 'INFORME UMA GORDURA VÁLIDA.' })
    .positive('O PERCENTUAL DE GORDURA DEVE SER MAIOR QUE ZERO.')
    .max(100, 'PERCENTUAL INVÁLIDO.')
    .nullable()
    .optional(),
  measured_at: z
    .string({ required_error: 'INFORME A DATA DA MEDIÇÃO.' })
    .min(10, 'INFORME UMA DATA VÁLIDA.')
    .refine((val) => isValidDateValue(val), 'DATA INVÁLIDA OU NO FUTURO.'),
});
const decimalValue = (value: string) => value.trim() ? Number(value.replace(',', '.')) : undefined;

export const MeasurementsPage: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const Heading = embedded ? 'h2' : 'h1';
  const queryClient = useQueryClient();
  const [metric, setMetric] = useState<'weight' | 'fat'>('weight');
  const [isLogging, setIsLogging] = useState(false);
  const [measurementToDelete, setMeasurementToDelete] = useState<BodyMeasurement | null>(null);
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<z.infer<typeof measurementFormSchema>>({
    resolver: zodResolver(measurementFormSchema),
    defaultValues: { measured_at: getTodayBR() },
  });
  const measuredAt = useWatch({ control, name: 'measured_at' });

  const {
    data: measurements = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['measurements', 'all'],
    queryFn: ({ signal }) => getMeasurements('all', signal),
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: (data: CreateMeasurementDTO) => addMeasurement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      setIsLogging(false);
      reset({ measured_at: getTodayBR() });
      for (const key of ['active-goal', 'preview-goal', 'mealStats', 'todayMeals']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  const onSubmit = (data: z.infer<typeof measurementFormSchema>) => {
    let dateStr = data.measured_at.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [d, m, y] = dateStr.split('/');
      dateStr = `${y}-${m}-${d}`;
    }
    mutation.mutate({
      weight: data.weight,
      body_fat: data.body_fat,
      measured_at: `${dateStr}T12:00:00-03:00`,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMeasurement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      setMeasurementToDelete(null);
      for (const key of ['active-goal', 'preview-goal', 'mealStats', 'todayMeals']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  const weights = measurements.map((m) => Number(m.weight)).filter((w) => !isNaN(w) && w > 0);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const initialWeight = weights.length > 0 ? weights[0] : null;
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
  const weightDiff = currentWeight !== null && initialWeight !== null ? currentWeight - initialWeight : 0;

  const bodyFats = measurements
    .map((m) => (m.body_fat !== null && m.body_fat !== undefined ? Number(m.body_fat) : null))
    .filter((f): f is number => f !== null && !isNaN(f) && f > 0);
  const currentBodyFat = bodyFats.length > 0 ? bodyFats[bodyFats.length - 1] : null;
  const initialBodyFat = bodyFats.length > 0 ? bodyFats[0] : null;
  const minBodyFat = bodyFats.length > 0 ? Math.min(...bodyFats) : null;
  const maxBodyFat = bodyFats.length > 0 ? Math.max(...bodyFats) : null;
  const bodyFatDiff = currentBodyFat !== null && initialBodyFat !== null ? currentBodyFat - initialBodyFat : 0;

  const chartData = measurements.map((m) => {
    const d = new Date(m.measured_at);
    const dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      date: dateFormatted,
      weight: Number(m.weight),
      bodyFat: m.body_fat !== null && m.body_fat !== undefined ? Number(m.body_fat) : undefined,
    };
  });

  const fatChartData = chartData.filter((item) => item.bodyFat !== undefined);
  const activeChartData = metric === 'weight' ? chartData : fatChartData;

  return (
    <div className={embedded ? "space-y-8" : "w-full max-w-5xl mx-auto px-4 py-8 space-y-10"}>
      {/* Header */}
      <div className="border-b-2 border-border pb-6 space-y-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-ink mb-2">
            Evolução Corporal
          </p>
          <Heading className="text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter">
            PESO E MEDIDAS
          </Heading>
        </div>

        {/* Seletor de métrica: Peso vs Gordura */}
        <div className="border-2 border-border p-1 bg-card shadow-hard grid grid-cols-2 w-full sm:w-fit sm:inline-flex sm:ml-auto gap-1">
          <button
            aria-pressed={metric === 'weight'}
            onClick={() => setMetric('weight')}
            className={`flex items-center justify-center text-center py-2.5 px-4 sm:px-6 text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              metric === 'weight'
                ? 'border-2 border-black bg-primary text-primary-foreground shadow-hard-fill'
                : 'bg-card text-foreground border-2 border-transparent hover:bg-secondary'
            }`}
          >
            PESO
          </button>
          <button
            aria-pressed={metric === 'fat'}
            onClick={() => setMetric('fat')}
            className={`flex items-center justify-center text-center py-2.5 px-4 sm:px-6 text-xs font-black uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              metric === 'fat'
                ? 'border-2 border-black bg-primary text-primary-foreground shadow-hard-fill'
                : 'bg-card text-foreground border-2 border-transparent hover:bg-secondary'
            }`}
          >
            % GORDURA
          </button>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div className="bg-card border-2 border-border p-6 shadow-hard space-y-6">
        <div className="flex items-center justify-between border-b-2 border-border pb-4">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary-ink" />
            {metric === 'weight' ? 'GRÁFICO DE EVOLUÇÃO DE PESO' : 'GRÁFICO DE PERCENTUAL DE GORDURA'}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {activeChartData.length} REGISTROS
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64 border-2 border-border border-dashed bg-card opacity-50">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
              CARREGANDO MEDIÇÕES...
            </p>
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="bg-destructive/10 border-2 border-destructive p-8 flex flex-col items-center justify-center text-center gap-4"
          >
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm font-black uppercase tracking-wider text-destructive">
              {error instanceof Error ? error.message.toUpperCase() : 'ERRO AO CARREGAR DADOS DE EVOLUÇÃO'}
            </p>
            <button
              onClick={() => refetch()}
              className="py-2 px-6 bg-destructive text-destructive-foreground font-black text-xs uppercase"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : activeChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border p-6 text-center space-y-3">
            <Scale className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {metric === 'weight'
                ? 'NENHUMA MEDIÇÃO REGISTRADA'
                : 'NENHUM PERCENTUAL DE GORDURA REGISTRADO'}
            </p>
            {metric === 'fat' && (
              <p className="text-[11px] font-bold uppercase text-muted-foreground max-w-sm">
                Ao registrar um novo peso, preencha o campo opcional de % gordura para acompanhar sua evolução.
              </p>
            )}
            <button
              onClick={() => setIsLogging(true)}
              className="px-4 py-2 bg-primary text-primary-foreground border-2 border-black shadow-hard-fill text-xs font-black uppercase tracking-wider hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {metric === 'weight' ? 'REGISTRAR PRIMEIRO PESO' : 'REGISTRAR % GORDURA'}
            </button>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  domain={metric === 'weight' ? ['dataMin - 2', 'dataMax + 2'] : ['dataMin - 1', 'dataMax + 1']}
                  tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => (metric === 'weight' ? `${v}kg` : `${v}%`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { date: string; weight: number; bodyFat?: number };
                      return (
                        <div className="bg-card border-2 border-border p-3 shadow-hard">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{data.date}</p>
                          {metric === 'weight' ? (
                            <>
                              <p className="text-sm font-black uppercase text-foreground">{data.weight} kg</p>
                              {data.bodyFat !== undefined && (
                                <p className="text-xs font-bold text-primary-ink uppercase">{data.bodyFat}% gordura</p>
                              )}
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black uppercase text-foreground">{data.bodyFat}% gordura</p>
                              <p className="text-xs font-bold text-muted-foreground uppercase">{data.weight} kg</p>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey={metric === 'weight' ? 'weight' : 'bodyFat'}
                  stroke="hsl(var(--primary-ink))"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))', stroke: 'hsl(var(--primary-ink))' }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary-ink))', stroke: 'hsl(var(--foreground))', strokeWidth: 2 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cards de Resumo */}
      {metric === 'weight' ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">PESO ATUAL</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : '—'}
            </p>
          </div>
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MENOR PESO</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {minWeight !== null ? `${minWeight.toFixed(1)} kg` : '—'}
            </p>
          </div>
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MAIOR PESO</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {maxWeight !== null ? `${maxWeight.toFixed(1)} kg` : '—'}
            </p>
          </div>
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">VARIAÇÃO</p>
            <div className="flex items-center gap-1">
              {weightDiff > 0 ? (
                <TrendingUp className="w-5 h-5 text-primary-ink" />
              ) : weightDiff < 0 ? (
                <TrendingDown className="w-5 h-5 text-primary-ink" />
              ) : null}
              <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
                {currentWeight !== null
                  ? `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">GORDURA ATUAL</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {currentBodyFat !== null ? `${currentBodyFat.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MENOR GORDURA</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {minBodyFat !== null ? `${minBodyFat.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MAIOR GORDURA</p>
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {maxBodyFat !== null ? `${maxBodyFat.toFixed(1)}%` : '—'}
            </p>
          </div>
          <div className="bg-card border-2 border-border p-4 shadow-hard">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">VARIAÇÃO</p>
            <div className="flex items-center gap-1">
              {bodyFatDiff > 0 ? (
                <TrendingUp className="w-5 h-5 text-primary-ink" />
              ) : bodyFatDiff < 0 ? (
                <TrendingDown className="w-5 h-5 text-primary-ink" />
              ) : null}
              <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
                {currentBodyFat !== null
                  ? `${bodyFatDiff > 0 ? '+' : ''}${bodyFatDiff.toFixed(1)}%`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ação Nova Medição */}
      <div className="flex justify-end">
        <button
          aria-expanded={isLogging}
          aria-controls="measurement-form"
          onClick={() => setIsLogging(!isLogging)}
          className="w-full sm:w-auto py-3 px-5 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-black shadow-hard-fill hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="w-4 h-4" />
          NOVA MEDIÇÃO
        </button>
      </div>

      {/* Formulário de Registro Rápido */}
      {isLogging && (
        <form id="measurement-form" noValidate onSubmit={handleSubmit(onSubmit)} className="p-6 bg-card border-2 border-border shadow-hard space-y-4">
          <div className="flex items-center justify-between border-b-2 border-border pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary-ink" />
              REGISTRAR NOVO PESO / MEDIÇÃO
            </h2>
            <button
              type="button"
              onClick={() => { setIsLogging(false); reset({ measured_at: getTodayBR() }); }}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
            >
              FECHAR
            </button>
          </div>

          {(mutation.isError || Object.keys(errors).length > 0) && (
            <p role="alert" className="p-3 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
              {mutation.error?.message || errors.weight?.message || errors.body_fat?.message || errors.measured_at?.message}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="input-weight" className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                PESO (KG) *
              </label>
              <input
                id="input-weight"
                type="text"
                {...register('weight', { setValueAs: decimalValue })}
                aria-invalid={!!errors.weight}
                inputMode="decimal"
                placeholder="EX: 78.5"
                className="w-full px-3 py-2 bg-background border-2 border-border text-sm font-black uppercase focus:border-ring focus:outline-none focus-visible:border-ring focus-visible:outline-none outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="input-bodyfat" className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                % GORDURA (OPCIONAL)
              </label>
              <input
                id="input-bodyfat"
                type="text"
                {...register('body_fat', { setValueAs: decimalValue })}
                aria-invalid={!!errors.body_fat}
                inputMode="decimal"
                placeholder="EX: 18.0"
                className="w-full px-3 py-2 bg-background border-2 border-border text-sm font-black uppercase focus:border-ring focus:outline-none focus-visible:border-ring focus-visible:outline-none outline-none"
              />
            </div>
            <div>
              <label htmlFor="input-date" className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                DATA DA MEDIÇÃO (DD/MM/AAAA)
              </label>
              <DatePickerInput
                id="input-date"
                value={measuredAt || ''}
                onChange={(val) => setValue('measured_at', val, { shouldValidate: true, shouldDirty: true })}
                error={errors.measured_at?.message}
              />
              {errors.measured_at && (
                <p role="alert" className="mt-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
                  {errors.measured_at.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsLogging(false); reset({ measured_at: getTodayBR() }); }}
              className="px-4 py-2 border-2 border-border text-xs font-black uppercase hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground border-2 border-black shadow-hard-fill text-xs font-black uppercase hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {mutation.isPending ? 'SALVANDO...' : 'CONFIRMAR PESO'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Histórico Recente */}
      {measurements.length > 0 && (
        <div className="bg-card border-2 border-border p-6 shadow-hard space-y-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-ink" />
            HISTÓRICO DE REGISTROS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Peso (kg)</th>
                  <th className="py-2 px-3">% Gordura</th>
                  <th className="py-2 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-border divide-border text-xs font-bold uppercase">
                {measurements
                  .slice()
                  .reverse()
                  .map((m: BodyMeasurement) => {
                    const d = new Date(m.measured_at);
                    const formattedDate = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    return (
                      <tr key={m.id} className="hover:bg-secondary transition-colors">
                        <td className="py-2.5 px-3">
                          {formattedDate}
                        </td>
                        <td className="py-2.5 px-3 font-black text-foreground">{Number(m.weight).toFixed(1)} kg</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {m.body_fat !== null ? `${Number(m.body_fat).toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => setMeasurementToDelete(m)}
                            aria-label={`Excluir pesagem de ${formattedDate}`}
                            className="p-2 border-2 border-transparent text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* Confirmação de Exclusão de Medição */}
      <ConfirmDialog
        isOpen={!!measurementToDelete}
        title="Excluir medição"
        description={
          measurementToDelete ? (
            <span>
              Tem certeza que deseja apagar a pesagem de{' '}
              <strong className="text-foreground">{Number(measurementToDelete.weight).toFixed(1)} kg</strong> registrada em{' '}
              <strong className="text-foreground">
                {new Date(measurementToDelete.measured_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </strong>
              ? Essa ação não pode ser desfeita.
            </span>
          ) : null
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (measurementToDelete) {
            deleteMutation.mutate(measurementToDelete.id);
          }
        }}
        onCancel={() => setMeasurementToDelete(null)}
      />
    </div>
  );
};
