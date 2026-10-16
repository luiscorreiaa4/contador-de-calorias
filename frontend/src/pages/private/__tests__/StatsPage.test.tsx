import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsPage } from '../StatsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

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
    expect(screen.getByText(/histórico e tendências/i)).toBeInTheDocument();
  });
});
