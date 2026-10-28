import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect } from 'vitest';
import { StatsPage } from '../StatsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

const render = (ui: ReactElement) => rtlRender(<MemoryRouter initialEntries={['/estatisticas']}>{ui}</MemoryRouter>);

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('StatsPage (PC-27)', () => {
  it('renders loading state initially', () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <StatsPage />
      </QueryClientProvider>
    );

    expect(screen.getByText(/carregando estatísticas/i)).toBeInTheDocument();
  });

  it('renders error state with retry button when API fails', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.get(`${baseURL}/meals/stats`, () => {
        return HttpResponse.json({ success: false, message: 'Falha de conexão com o banco' }, { status: 500 });
      })
    );

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <StatsPage />
      </QueryClientProvider>
    );

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/falha ao carregar estatísticas/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('renders empty state when no meals logged in period', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.get(`${baseURL}/meals/stats`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            period: 'week',
            daysLogged: 0,
            totalDays: 7,
            averages: {
              consumed: { calories: 0, proteins: 0, carbs: 0, fats: 0 },
              goal: { calories: 2000, proteins: 150, carbs: 200, fats: 60 },
            },
            chartData: [],
          },
        });
      })
    );

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <StatsPage />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/nenhum histórico registrado neste período/i)).toBeInTheDocument();
  });

  it('renders stats and chart when data is present', async () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <StatsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/média de consumo/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /alimentação/i })).toBeInTheDocument();
  });

  it('mostra consumo e meta num único resumo, com a legenda dos dias registrados', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StatsPage embedded />
      </QueryClientProvider>
    );

    expect(await screen.findByText('2000')).toBeInTheDocument();
    expect(screen.getByText('2200')).toBeInTheDocument();
    expect(screen.getByText(/média dos 1 de 7 dias com refeição registrada/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /calorias por dia/i })).toBeInTheDocument();
  });

  it('o período vira chips no cabeçalho do card: 7D ativo e 30D troca a consulta', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StatsPage embedded />
      </QueryClientProvider>
    );

    const week = screen.getByRole('button', { name: 'Últimos 7 dias' });
    const month = screen.getByRole('button', { name: 'Últimos 30 dias' });
    expect(week).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(month);
    expect(month).toHaveAttribute('aria-pressed', 'true');
    expect(week).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByText(/média dos 1 de 30 dias/i)).toBeInTheDocument();
  });

  it('o filtro de período continua disponível no estado de erro', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.get(`${baseURL}/meals/stats`, () => HttpResponse.json({ success: false, message: 'Falha' }, { status: 500 }))
    );
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StatsPage embedded />
      </QueryClientProvider>
    );

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Últimos 30 dias' })).toBeInTheDocument();
  });

  it('em modo embutido o título da aba fica só para leitores de tela (sr-only)', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <StatsPage embedded />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { level: 2, name: /alimentação/i })).toHaveClass('sr-only');
    await screen.findByText('2000');
  });
});
