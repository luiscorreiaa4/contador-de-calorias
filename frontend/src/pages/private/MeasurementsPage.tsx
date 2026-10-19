import React, { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMeasurements, addMeasurement, type BodyMeasurement } from '../../services/measurement.service';
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
import { Scale, TrendingDown, TrendingUp, ArrowLeft, Plus, AlertTriangle, Calendar } from 'lucide-react';

export const MeasurementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'30d' | '90d' | 'all'>('90d');
  const [isLogging, setIsLogging] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [bodyFatInput, setBodyFatInput] = useState('');
  const [dateInput, setDateInput] = useState(getLocalDateString());
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: measurements = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['measurements', period],
    queryFn: ({ signal }) => getMeasurements(period, signal),
    staleTime: 1000 * 60 * 5,
  });

  const mutation = useMutation({
    mutationFn: (data: { weight: number; body_fat?: number; measured_at?: string }) =>
      addMeasurement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurements'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      setIsLogging(false);
      setWeightInput('');
      setBodyFatInput('');
      setFormError(null);
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message.toUpperCase() : 'ERRO AO REGISTRAR MEDIÇÃO.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const weightNum = parseFloat(weightInput.replace(',', '.'));
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      setFormError('INFORME UM PESO VÁLIDO (EX: 75.5 KG).');
      return;
    }

    let bfNum: number | undefined;
    if (bodyFatInput.trim()) {
      bfNum = parseFloat(bodyFatInput.replace(',', '.'));
      if (isNaN(bfNum) || bfNum <= 0 || bfNum > 100) {
        setFormError('PERCENTUAL DE GORDURA INVÁLIDO (0 - 100%).');
        return;
      }
    }

    const payload = {
      weight: weightNum,
      body_fat: bfNum,
      measured_at: dateInput ? new Date(dateInput).toISOString() : new Date().toISOString(),
    };

    mutation.mutate(payload);
  };

  // Cálculos estatísticos
  const weights = measurements.map((m) => Number(m.weight)).filter((w) => !isNaN(w) && w > 0);
  const currentWeight = weights.length > 0 ? weights[weights.length - 1] : null;
  const initialWeight = weights.length > 0 ? weights[0] : null;
  const minWeight = weights.length > 0 ? Math.min(...weights) : null;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
  const weightDiff = currentWeight !== null && initialWeight !== null ? currentWeight - initialWeight : 0;

  const chartData = measurements.map((m) => {
    const d = new Date(m.measured_at);
    const dateFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    return {
      date: dateFormatted,
      weight: Number(m.weight),
      bodyFat: m.body_fat !== null ? Number(m.body_fat) : undefined,
    };
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="border-b-2 border-border pb-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
              Evolução Corporal
            </p>
            <h1 className="text-3xl sm:text-5xl font-heading font-black text-foreground uppercase tracking-tighter">
              PESO E MEDIDAS
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLogging(!isLogging)}
              className="py-3 px-5 text-xs font-black uppercase tracking-widest bg-primary text-primary-foreground border-2 border-primary hover:bg-primary/90 flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              NOVA MEDIÇÃO
            </button>
            <Link
              to="/"
              aria-label="Voltar ao dashboard"
              className="flex items-center justify-center w-12 h-12 border-2 border-border bg-background hover:bg-primary hover:text-primary-foreground transition-colors text-foreground focus:outline-none focus:border-primary"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Filtros de período */}
        <div className="flex gap-2 border-2 border-border p-2 bg-background w-full md:w-fit md:ml-auto">
          {(['30d', '90d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 md:flex-none py-2 px-5 text-xs font-black uppercase tracking-widest transition-all focus:outline-none ${
                period === p
                  ? 'bg-primary text-primary-foreground border-2 border-transparent'
                  : 'bg-background text-foreground border-2 border-transparent hover:border-border'
              }`}
            >
              {p === '30d' ? '30 DIAS' : p === '90d' ? '90 DIAS' : 'TUDO'}
            </button>
          ))}
        </div>
      </div>

      {/* Formulário de Registro Rápido */}
      {isLogging && (
        <form onSubmit={handleSubmit} className="p-6 bg-card border-2 border-border shadow-hard space-y-4">
          <div className="flex items-center justify-between border-b-2 border-border pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              REGISTRAR NOVO PESO / MEDIÇÃO
            </h2>
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
            >
              FECHAR
            </button>
          </div>

          {formError && (
            <p className="p-3 bg-destructive text-destructive-foreground text-xs font-bold uppercase tracking-wider">
              {formError}
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
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder="EX: 78.5"
                className="w-full px-3 py-2 bg-background border-2 border-border text-sm font-black uppercase focus:border-primary outline-none"
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
                value={bodyFatInput}
                onChange={(e) => setBodyFatInput(e.target.value)}
                placeholder="EX: 18.0"
                className="w-full px-3 py-2 bg-background border-2 border-border text-sm font-black uppercase focus:border-primary outline-none"
              />
            </div>
            <div>
              <label htmlFor="input-date" className="block text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                DATA DA MEDIÇÃO
              </label>
              <input
                id="input-date"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="w-full px-3 py-2 bg-background border-2 border-border text-sm font-black uppercase focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsLogging(false)}
              className="px-4 py-2 border-2 border-border text-xs font-black uppercase hover:bg-secondary"
            >
              CANCELAR
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground text-xs font-black uppercase hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'SALVANDO...' : 'CONFIRMAR PESO'}
            </button>
          </div>
        </form>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border-2 border-border p-4 shadow-hard">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">PESO ATUAL</p>
          <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
            {currentWeight !== null ? `${currentWeight.toFixed(1)} kg` : '—'}
          </p>
        </div>
        <div className="bg-card border-2 border-border p-4 shadow-hard">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MENOR PESO</p>
          <p className="text-2xl sm:text-3xl font-heading font-black text-emerald-600 dark:text-emerald-400">
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
              <TrendingUp className="w-5 h-5 text-amber-500" />
            ) : weightDiff < 0 ? (
              <TrendingDown className="w-5 h-5 text-emerald-500" />
            ) : null}
            <p className="text-2xl sm:text-3xl font-heading font-black text-foreground">
              {currentWeight !== null
                ? `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolução */}
      <div className="bg-card border-2 border-border p-6 shadow-hard space-y-6">
        <div className="flex items-center justify-between border-b-2 border-border pb-4">
          <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            GRÁFICO DE EVOLUÇÃO TEMPORAL
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {measurements.length} REGISTROS
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
        ) : chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border p-6 text-center space-y-3">
            <Scale className="w-10 h-10 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              NENHUMA MEDIÇÃO REGISTRADA NESTE PERÍODO
            </p>
            <button
              onClick={() => setIsLogging(true)}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider"
            >
              REGISTRAR PRIMEIRO PESO
            </button>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)', strokeWidth: 2 }}
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)', strokeWidth: 2 }}
                  tick={{ fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as { date: string; weight: number; bodyFat?: number };
                      return (
                        <div className="bg-card border-2 border-border p-3 shadow-hard">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{data.date}</p>
                          <p className="text-sm font-black uppercase text-foreground">{data.weight} kg</p>
                          {data.bodyFat !== undefined && (
                            <p className="text-xs font-bold text-primary uppercase">{data.bodyFat}% gordura</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="var(--color-primary)"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabela de Histórico Recente */}
      {measurements.length > 0 && (
        <div className="bg-card border-2 border-border p-6 shadow-hard space-y-4">
          <h2 className="text-sm font-black uppercase tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            HISTÓRICO DE REGISTROS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Peso (kg)</th>
                  <th className="py-2 px-3">% Gordura</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-border divide-border text-xs font-bold uppercase">
                {measurements
                  .slice()
                  .reverse()
                  .map((m: BodyMeasurement) => {
                    const d = new Date(m.measured_at);
                    return (
                      <tr key={m.id} className="hover:bg-secondary transition-colors">
                        <td className="py-2.5 px-3">
                          {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="py-2.5 px-3 font-black text-foreground">{Number(m.weight).toFixed(1)} kg</td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          {m.body_fat !== null ? `${Number(m.body_fat).toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
