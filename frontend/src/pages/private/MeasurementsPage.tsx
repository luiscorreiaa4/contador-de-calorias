import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateMeasurementDTO } from '@caloriesync/shared';
import { z } from 'zod';
import { DatePickerInput } from '../../components/common/DatePickerInput';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SectionCard } from '../../components/common/SectionCard';
import { SegmentedToggle } from '../../components/common/SegmentedToggle';
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
import { Scale, TrendingDown, TrendingUp, Plus, AlertTriangle, Trash2 } from 'lucide-react';

type Metric = 'weight' | 'fat';

const METRIC_OPTIONS = [
  { value: 'weight', label: 'PESO' },
  { value: 'fat', label: '% GORDURA' },
] as const;

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
  const [metric, setMetric] = useState<Metric>('weight');
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

  const unit = metric === 'weight' ? ' kg' : '%';
  const series =
    metric === 'weight'
      ? { current: currentWeight, min: minWeight, max: maxWeight, diff: weightDiff, labels: ['PESO ATUAL', 'MENOR PESO', 'MAIOR PESO'] }
      : { current: currentBodyFat, min: minBodyFat, max: maxBodyFat, diff: bodyFatDiff, labels: ['GORDURA ATUAL', 'MENOR GORDURA', 'MAIOR GORDURA'] };
  const format = (value: number | null) => (value !== null ? `${value.toFixed(1)}${unit}` : '—');
  const showStats = !isLoading && !isError && activeChartData.length > 0;
  const statCells: { label: string; value: string }[] = [
    { label: series.labels[0], value: format(series.current) },
    { label: series.labels[1], value: format(series.min) },
    { label: series.labels[2], value: format(series.max) },
  ];

  return (
    <div className={embedded ? 'space-y-6' : 'w-full max-w-5xl mx-auto px-4 py-8 space-y-6'}>
      {/* A aba "Peso e medidas" já nomeia a página; o título só existe para a hierarquia de cabeçalhos. */}
      <Heading
        className={embedded ? 'sr-only' : 'text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter'}
      >
        PESO E MEDIDAS
      </Heading>

      {/* Gráfico de evolução: o filtro de métrica fica no cabeçalho do card que ele afeta */}
      <SectionCard
        title={metric === 'weight' ? 'GRÁFICO DE EVOLUÇÃO DE PESO' : 'GRÁFICO DE PERCENTUAL DE GORDURA'}
        actions={<SegmentedToggle options={[...METRIC_OPTIONS]} value={metric} onChange={setMetric} ariaLabel="Métrica" />}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {activeChartData.length} REGISTROS
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center h-48 border-2 border-border border-dashed opacity-50">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
              CARREGANDO MEDIÇÕES...
            </p>
          </div>
        ) : isError ? (
          <div
            role="alert"
            className="bg-destructive/10 border-2 border-destructive p-6 flex flex-col items-center justify-center text-center gap-3"
          >
            <AlertTriangle className="w-8 h-8 text-destructive" />
            <p className="text-sm font-black uppercase tracking-wider text-destructive">
              {error instanceof Error ? error.message.toUpperCase() : 'ERRO AO CARREGAR DADOS DE EVOLUÇÃO'}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="py-2 px-6 bg-destructive text-destructive-foreground font-black text-xs uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              TENTAR NOVAMENTE
            </button>
          </div>
        ) : activeChartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-48 border-2 border-dashed border-border p-6 text-center space-y-3">
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
              type="button"
              onClick={() => setIsLogging(true)}
              className="px-4 py-2 bg-primary text-primary-foreground border-2 border-edge shadow-hard-fill text-xs font-black uppercase tracking-wider hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {metric === 'weight' ? 'REGISTRAR PRIMEIRO PESO' : 'REGISTRAR % GORDURA'}
            </button>
          </div>
        ) : (
          <div data-no-swipe className="h-60 sm:h-72 w-full">
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

        {/* Faixa de resumo: 4 indicadores em linha (não vira grade 2x2 no mobile) */}
        {showStats && (
          <div className="grid grid-cols-4 divide-x-2 divide-border border-t-2 border-border pt-4">
            {[...statCells, { label: 'VARIAÇÃO', value: series.current !== null ? `${series.diff > 0 ? '+' : ''}${series.diff.toFixed(1)}${unit}` : '—' }].map(
              ({ label, value }, index) => (
                <div key={label} className="min-w-0 px-2 first:pl-0 last:pr-0">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase leading-tight tracking-wider text-muted-foreground">
                    {label}
                    {index === 3 && series.diff > 0 && <TrendingUp className="w-3 h-3 text-primary-ink shrink-0" aria-hidden="true" />}
                    {index === 3 && series.diff < 0 && <TrendingDown className="w-3 h-3 text-primary-ink shrink-0" aria-hidden="true" />}
                  </p>
                  <p className="mt-1 whitespace-nowrap text-sm sm:text-2xl font-heading font-black text-foreground">{value}</p>
                </div>
              )
            )}
          </div>
        )}
      </SectionCard>

      {/* Ação Nova Medição */}
      <div>
        <button
          type="button"
          aria-expanded={isLogging}
          aria-controls="measurement-form"
          onClick={() => setIsLogging(!isLogging)}
          className="w-full py-3 px-5 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-edge shadow-hard-fill hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Plus className="w-4 h-4" />
          NOVA MEDIÇÃO
        </button>
      </div>

      {/* Formulário de Registro Rápido */}
      {isLogging && (
        <form id="measurement-form" noValidate onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 bg-card border-2 border-border shadow-hard space-y-4">
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
              className="px-6 py-2 bg-primary text-primary-foreground border-2 border-edge shadow-hard-fill text-xs font-black uppercase hover:bg-primary/90 disabled:opacity-50 disabled:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {mutation.isPending ? 'SALVANDO...' : 'CONFIRMAR PESO'}
            </button>
          </div>
        </form>
      )}

      {/* Tabela de Histórico Recente */}
      {measurements.length > 0 && (
        <SectionCard title="HISTÓRICO DE REGISTROS">
          <div data-no-swipe className="overflow-x-auto">
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
        </SectionCard>
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
