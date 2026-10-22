import { render as rtlRender, screen, waitFor, within } from '@testing-library/react';
import type { ReactElement } from 'react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
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
      expect(screen.getByText(/nenhuma medição registrada/i)).toBeInTheDocument();
    });
  });

  it('permite alternar entre o gráfico de peso e o gráfico de percentual de gordura', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /gráfico de evolução de peso/i })).toBeInTheDocument();
    });

    const fatBtn = screen.getByRole('button', { name: /% gordura/i });
    await userEvent.click(fatBtn);

    expect(screen.getByRole('heading', { name: /gráfico de percentual de gordura/i })).toBeInTheDocument();
    expect(screen.getByText(/gordura atual/i)).toBeInTheDocument();
    expect(screen.getAllByText(/17\.5%/i).length).toBeGreaterThan(0);
  });

  it('abre o diálogo de confirmação ao clicar no botão de lixeira de uma medição e permite cancelar', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /histórico de registros/i })).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /excluir pesagem de/i });
    expect(deleteButtons.length).toBeGreaterThan(0);

    // Clica na lixeira da primeira pesagem
    await userEvent.click(deleteButtons[0]);

    // O modal acessível deve abrir
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('heading', { name: /excluir medição/i })).toBeInTheDocument();
    expect(within(dialog).getByText(/tem certeza que deseja apagar a pesagem/i)).toBeInTheDocument();

    // Clicar em cancelar fecha o modal sem deletar
    const cancelBtn = within(dialog).getByRole('button', { name: /cancelar/i });
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('permite confirmar a exclusão de uma pesagem no diálogo de confirmação', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /histórico de registros/i })).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /excluir pesagem de/i });
    await userEvent.click(deleteButtons[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const confirmBtn = within(dialog).getByRole('button', { name: /^excluir$/i });
    await userEvent.click(confirmBtn);

    // O modal deve fechar após a exclusão
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('utiliza DatePickerInput padronizado com o onboarding no formulário de nova medição', async () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MeasurementsPage />
      </QueryClientProvider>
    );

    const newBtn = screen.getByRole('button', { name: /nova medição/i });
    await userEvent.click(newBtn);

    const dateInput = screen.getByLabelText(/data da medição/i);
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute('placeholder', 'DD/MM/AAAA');
    expect(screen.getByRole('button', { name: /abrir calendário/i })).toBeInTheDocument();
  });
});

