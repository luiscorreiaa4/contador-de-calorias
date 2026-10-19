import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { render } from '../../tests/setup/test-utils';
import { server } from '../../mocks/server';
import { NewMealModal } from './NewMealModal';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function buildFoods(prefix: string, count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index}`,
    name: `${prefix} ${String(index).padStart(2, '0')}`,
    calories: 100,
    proteins: 10,
    carbs: 10,
    fats: 5,
    base_unit: 'g',
    serving_weight: 100,
  }));
}

describe('NewMealModal', () => {
  const onClose = vi.fn();

  it('deve renderizar o modal corretamente quando aberto', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: /nova refeição/i })).toBeInTheDocument();
    
    // Aguarda carregar as opções da API
    await waitFor(() => {
      expect(screen.getAllByText(/pesquisar alimento/i)[0]).toBeInTheDocument();
    });
  });

  it('deve buscar e adicionar um alimento', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);
    
    // Espera o select de alimentos carregar
    const searchInput = await screen.findByRole('combobox');
    
    // Digita para buscar e seleciona 'Arroz Branco'
    await userEvent.type(searchInput, 'Arroz');
    const option = await screen.findByText(/arroz branco/i);
    await userEvent.click(option);

    // Agora o painel de inserção de quantidade deve aparecer
    expect(await screen.findByText(/quantidade em gramas/i)).toBeInTheDocument();

    // Preenche quantidade e clica em 'Incluir'
    const amountInput = screen.getByRole('spinbutton');
    await userEvent.clear(amountInput); // limpa o padrão (100)
    await userEvent.type(amountInput, '150');
    
    const includeButton = screen.getByRole('button', { name: /incluir/i });
    await userEvent.click(includeButton);

    // O item deve aparecer na lista com a quantidade registrada
    expect(await screen.findByText(/arroz branco/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantidade de arroz branco/i)).toHaveValue(150);
    
    // Preenche o nome da refeição (opcional mas bom testar)
    const mealNameInput = screen.getByLabelText(/^nome$/i);
    await userEvent.type(mealNameInput, 'Almoço');

    // Salvar refeição
    const saveButton = screen.getByRole('button', { name: /criar refeição/i });
    await userEvent.click(saveButton);

    // Modal deve fechar no sucesso
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('não deve salvar sem alimentos', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);
    
    const saveButton = await screen.findByRole('button', { name: /criar refeição/i });
    expect(saveButton).toBeDisabled();
  });

  it('deve preservar e calcular os macros base do alimento ao carregar refeição para edição (PC-15 / BUG-B09)', async () => {
    const mealToEdit = {
      id: 'meal-1',
      user_id: 'user-1',
      name: 'Almoço Fit',
      meal_time: '2026-10-16T12:00:00.000Z',
      created_at: '2026-10-16T12:00:00.000Z',
      total_calories: 330,
      total_proteins: 62,
      total_carbs: 0,
      total_fats: 6,
      items: [
        {
          id: 'item-1',
          meal_id: 'meal-1',
          food_id: 'food-chicken',
          food_name: 'Peito de Frango',
          food_base_unit: 'g' as const,
          quantity: 200,
          unit: 'g' as const,
          display_amount: 200,
          calories: 330,
          proteins: 62,
          carbs: 0,
          fats: 6,
        },
      ],
    };

    render(<NewMealModal isOpen={true} onClose={onClose} mealToEdit={mealToEdit} />);

    expect(await screen.findByText(/peito de frango/i)).toBeInTheDocument();
    expect(screen.getAllByText(/330\s*kcal/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/62g\s*prot/i).length).toBeGreaterThan(0);
  });

  it('deve carregar a próxima página de alimentos ao acionar o fim da lista (BL-13)', async () => {
    server.use(
      http.get(`${baseURL}/foods`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const foods = page === 1 ? buildFoods('ALIMENTO P1', 50) : buildFoods('ALIMENTO P2', 1);
        return HttpResponse.json({ success: true, data: { foods, total: 51 } });
      })
    );

    render(<NewMealModal isOpen={true} onClose={onClose} />);

    const searchInput = await screen.findByRole('combobox');
    await userEvent.click(searchInput);

    expect(await screen.findByText('ALIMENTO P1 00')).toBeInTheDocument();
    expect(screen.queryByText('ALIMENTO P2 00')).not.toBeInTheDocument();

    const loadMoreButton = await screen.findByRole('button', { name: /carregar mais alimentos/i });
    await userEvent.click(loadMoreButton);

    expect(await screen.findByText('ALIMENTO P2 00')).toBeInTheDocument();
  });

  it('deve registrar refeição na data selecionada (BL-02)', async () => {
    let captured: { mealTime?: string } | undefined;
    server.use(
      http.post(`${baseURL}/meals`, async ({ request }) => {
        captured = (await request.json()) as { mealTime?: string };
        return HttpResponse.json({
          success: true,
          data: { id: 'new-meal', name: 'Refeição', meal_time: captured.mealTime, items: [] },
        });
      })
    );

    render(<NewMealModal isOpen={true} onClose={onClose} mealDate="2026-10-15" />);

    const searchInput = await screen.findByRole('combobox');
    await userEvent.type(searchInput, 'Arroz');
    await userEvent.click(await screen.findByText(/arroz branco/i));

    const amountInput = screen.getByRole('spinbutton');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '150');
    await userEvent.click(screen.getByRole('button', { name: /incluir/i }));

    await userEvent.click(screen.getByRole('button', { name: /criar refeição/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });

    expect(captured?.mealTime).toBeTruthy();
    const saved = new Date(String(captured?.mealTime));
    expect(saved.getFullYear()).toBe(2026);
    expect(saved.getMonth()).toBe(9); // outubro (0-based)
    expect(saved.getDate()).toBe(15);
  });

  it('deve recalcular os macros ao editar inline a quantidade de um item do prato (BL-14)', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);

    const searchInput = await screen.findByRole('combobox');
    await userEvent.type(searchInput, 'Arroz');
    const option = await screen.findByText(/arroz branco/i);
    await userEvent.click(option);

    const amountInput = screen.getByRole('spinbutton');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '150');
    await userEvent.click(screen.getByRole('button', { name: /incluir/i }));

    // Arroz Branco: 130 kcal/100g -> 150g = 195 kcal
    await waitFor(() => {
      expect(screen.getAllByText(/195\s*kcal/i).length).toBeGreaterThan(0);
    });

    const inlineInput = screen.getByLabelText(/quantidade de arroz branco/i);
    await userEvent.clear(inlineInput);
    await userEvent.type(inlineInput, '300');

    // 130 kcal/100g -> 300g = 390 kcal
    await waitFor(() => {
      expect(screen.getAllByText(/390\s*kcal/i).length).toBeGreaterThan(0);
    });
  });
});
