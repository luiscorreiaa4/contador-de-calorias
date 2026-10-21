import { render as rtlRender, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, it, expect } from 'vitest';
import { MeasurementsPage } from '../MeasurementsPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

const render = (ui: ReactElement) => rtlRender(<MemoryRouter initialEntries={['/medidas']}>{ui}</MemoryRouter>);

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe('MeasurementsPage (BL-21 / FEAT-C04)', () => {
  it('volta ao dashboard pela seta de navegação', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <Routes>
          <Route path="/medidas" element={<MeasurementsPage />} />
          <Route path="/" element={<h1>Dashboard</h1>} />
        </Routes>
      </QueryClientProvider>
    );

    await userEvent.click(screen.getByRole('link', { name: /voltar ao dashboard/i }));
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renderiza o cabeçalho e estatísticas de peso a partir da API', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    expect(screen.getByRole('heading', { name: /peso e medidas/i })).toBeInTheDocument();

    // Aguardar carregamento dos dados mockados (80.0 e 79.2)
    await waitFor(() => {
      expect(screen.getAllByText(/79\.2\s*kg/i).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/peso atual/i)).toBeInTheDocument();
  });

  it('permite abrir o formulário e registrar um novo peso', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    const newBtn = screen.getByRole('button', { name: /nova medição/i });
    await userEvent.click(newBtn);

    const weightInput = screen.getByLabelText(/peso \(kg\)/i);
    await userEvent.type(weightInput, '78.5');

    const submitBtn = screen.getByRole('button', { name: /confirmar peso/i });
    await userEvent.click(submitBtn);

    // O formulário deve fechar após sucesso
    await waitFor(() => {
      expect(screen.queryByLabelText(/peso \(kg\)/i)).not.toBeInTheDocument();
    });
  });

  it('exibe estado de erro e botão de retry quando a API falha', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.get(`${baseURL}/users/me/measurements`, () => {
        return HttpResponse.json({ success: false, message: 'Erro no banco de dados' }, { status: 500 });
      })
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('exibe estado vazio quando não há registros', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.get(`${baseURL}/users/me/measurements`, () => {
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/nenhuma medição registrada neste período/i)).toBeInTheDocument();
    });
  });
});
