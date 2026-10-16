import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { render } from '../../../tests/setup/test-utils';
import { DashboardPage } from '../DashboardPage';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('DashboardPage Async States (PC-27)', () => {
  it('renderiza o estado de carregamento de refeições', () => {
    render(<DashboardPage />);
    expect(screen.getByText(/carregando refeições.../i)).toBeInTheDocument();
  });

  it('renderiza estado vazio quando não há refeições no dia', async () => {
    render(<DashboardPage />);

    expect(await screen.findByText(/nenhuma refeição registrada hoje/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar refeição/i })).toBeInTheDocument();
  });

  it('renderiza feedback visual de erro quando a API de refeições falha', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    server.use(
      http.get(`${baseURL}/meals/today`, () => {
        return HttpResponse.json({ success: false, message: 'Erro no servidor' }, { status: 500 });
      })
    );

    render(<DashboardPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/erro ao carregar refeições/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument();
  });

  it('renderiza refeições quando retornadas com sucesso da API', async () => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/almoço pré-treino/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/frango grelhado/i)).toBeInTheDocument();
  });
});
