import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { render } from '../../../tests/setup/test-utils';
import { DashboardPage } from '../DashboardPage';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';
import { getLocalDateString, addDaysToDateString, parseLocalDateString } from '../../../utils/date';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function formatDateLabel(dateStr: string): string {
  return parseLocalDateString(dateStr).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function renderDashboard(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/diario/:date" element={<DashboardPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DashboardPage Async States (PC-27)', () => {
  it('inicia com macronutrientes recolhidos e permite expandir e recolher pelo mesmo controle', async () => {
    renderDashboard();

    const toggle = screen.getByRole('button', { name: /mostrar macronutrientes/i });
    const macros = screen.getByRole('group', { name: /macronutrientes/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-controls', macros.id);
    expect(screen.getByText(/^calorias$/i)).toBeInTheDocument();

    await userEvent.click(toggle);

    expect(screen.getByRole('button', { name: /recolher macronutrientes/i })).toBe(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(within(macros).getByText(/^proteínas$/i)).toBeInTheDocument();
    expect(within(macros).getByText(/^carboidratos$/i)).toBeInTheDocument();
    expect(within(macros).getByText(/^gorduras$/i)).toBeInTheDocument();

    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: /mostrar macronutrientes/i })).toBe(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/^calorias$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nova refeição/i })).toBeEnabled();
  });

  it('abre o cadastro pela ação principal do dashboard', async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole('button', { name: /nova refeição/i }));
    expect(await screen.findByRole('dialog', { name: /nova refeição/i })).toBeInTheDocument();
  });

  it('renderiza o estado de carregamento de refeições', () => {
    renderDashboard();
    expect(screen.getByText(/carregando refeições.../i)).toBeInTheDocument();
  });

  it('renderiza estado vazio quando não há refeições no dia', async () => {
    renderDashboard();

    expect(await screen.findByText(/nenhuma refeição registrada hoje/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar refeição/i })).toBeInTheDocument();
  });

  it('renderiza feedback visual de erro quando a API de refeições falha', async () => {
    server.use(
      http.get(`${baseURL}/meals/today`, () => {
        return HttpResponse.json({ success: false, message: 'Erro no servidor' }, { status: 500 });
      })
    );

    renderDashboard();

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/erro ao carregar refeições/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('renderiza refeições quando retornadas com sucesso da API', async () => {
    server.use(
      http.get(`${baseURL}/meals/today`, () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              id: 'meal-1',
              user_id: '1',
              name: 'Almoço Pré-Treino',
              meal_time: '2026-10-15T12:00:00Z',
              created_at: '2026-10-15T12:00:00Z',
              total_calories: 600,
              total_proteins: 45,
              items: [
                {
                  id: 'item-1',
                  meal_id: 'meal-1',
                  food_id: '1',
                  food_name: 'Frango Grelhado',
                  quantity: 150,
                  unit: 'g',
                  calories: 247,
                  proteins: 46,
                  carbs: 0,
                  fats: 5,
                },
              ],
            },
          ],
        });
      })
    );

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/almoço pré-treino/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/frango grelhado/i)).toBeInTheDocument();
  });
});

describe('DashboardPage — navegação de datas (BL-02)', () => {
  it('exibe o dia de hoje e desabilita o próximo dia por padrão', async () => {
    renderDashboard();

    const today = getLocalDateString();
    expect(await screen.findByTestId('dashboard-date')).toHaveTextContent(formatDateLabel(today));
    expect(screen.getByText(/refeições de hoje/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próximo dia/i })).toBeDisabled();
  });

  it('navega para o dia anterior e habilita o próximo dia', async () => {
    const requestedDates: string[] = [];
    server.use(
      http.get(`${baseURL}/meals/today`, ({ request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get('date');
        if (date) requestedDates.push(date);
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    renderDashboard();

    const today = getLocalDateString();
    const yesterday = addDaysToDateString(today, -1);

    await userEvent.click(await screen.findByRole('button', { name: /dia anterior/i }));

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-date')).toHaveTextContent(formatDateLabel(yesterday));
    });

    expect(requestedDates).toContain(yesterday);
    expect(screen.getByText(/nenhuma refeição registrada neste dia/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próximo dia/i })).toBeEnabled();

    // Voltar para hoje restaura o estado padrão.
    await userEvent.click(screen.getByRole('button', { name: /voltar para hoje/i }));
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-date')).toHaveTextContent(formatDateLabel(today));
    });
    expect(screen.getByRole('button', { name: /próximo dia/i })).toBeDisabled();
  });

  it('abre o diário de uma data específica a partir da URL', async () => {
    const today = getLocalDateString();
    const twoDaysAgo = addDaysToDateString(today, -2);

    renderDashboard(`/diario/${twoDaysAgo}`);

    expect(await screen.findByTestId('dashboard-date')).toHaveTextContent(formatDateLabel(twoDaysAgo));
    expect(screen.getByText(/refeições do dia/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /próximo dia/i })).toBeEnabled();
  });
});

describe('DashboardPage — Copiar Refeição (BL-18 / FEAT-C03 / D-20)', () => {
  it('permite copiar todas as refeições do dia anterior com feedback visual', async () => {
    let copyCalled = false;
    server.use(
      http.post(`${baseURL}/meals/copy`, async ({ request }) => {
        copyCalled = true;
        const body = (await request.json()) as { sourceDate?: string; targetDate?: string };
        expect(body.sourceDate).toBeDefined();
        expect(body.targetDate).toBeDefined();
        return HttpResponse.json({
          success: true,
          message: 'Refeições do dia copiadas com sucesso!',
          data: [
            {
              id: 'copied-1',
              name: 'Almoço Copiado',
              meal_time: new Date().toISOString(),
              items: [],
              total_calories: 400,
              total_proteins: 30,
            },
          ],
        });
      })
    );

    renderDashboard();

    const copyBtn = await screen.findByRole('button', { name: /copiar de ontem/i });
    expect(copyBtn).toBeInTheDocument();

    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(copyCalled).toBe(true);
      expect(screen.getByRole('status')).toHaveTextContent(/copiada\(s\) com sucesso/i);
    });
  });

  it('permite duplicar uma refeição individual pelo card', async () => {
    let copyMealId: string | undefined;
    server.use(
      http.get(`${baseURL}/meals/today`, () => {
        return HttpResponse.json({
          success: true,
          data: [
            {
              id: 'meal-to-copy-123',
              user_id: '1',
              name: 'Omelete Proteico',
              meal_time: '2026-10-15T08:30:00.000Z',
              total_calories: 320,
              total_proteins: 28,
              items: [
                {
                  id: 'item-1',
                  meal_id: 'meal-to-copy-123',
                  food_id: '1',
                  food_name: 'Ovos',
                  quantity: 150,
                  unit: 'g',
                  calories: 320,
                  proteins: 28,
                  carbs: 2,
                  fats: 20,
                },
              ],
            },
          ],
        });
      }),
      http.post(`${baseURL}/meals/copy`, async ({ request }) => {
        const body = (await request.json()) as { sourceMealId?: string };
        copyMealId = body.sourceMealId;
        return HttpResponse.json({
          success: true,
          message: 'Refeição copiada com sucesso!',
          data: {
            id: 'copied-meal-456',
            name: 'Omelete Proteico',
            meal_time: new Date().toISOString(),
            items: [],
            total_calories: 320,
            total_proteins: 28,
          },
        });
      })
    );

    renderDashboard();

    const duplicateBtn = await screen.findByTitle(/duplicar refeição/i);
    expect(duplicateBtn).toBeInTheDocument();

    await userEvent.click(duplicateBtn);

    await waitFor(() => {
      expect(copyMealId).toBe('meal-to-copy-123');
      expect(screen.getByRole('status')).toHaveTextContent(/copiada\(s\) com sucesso/i);
    });
  });
});
