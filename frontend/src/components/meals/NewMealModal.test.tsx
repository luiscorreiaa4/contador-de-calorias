import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { render } from '../../tests/setup/test-utils';
import { NewMealModal } from './NewMealModal';

describe('NewMealModal', () => {
  const onClose = vi.fn();

  it('deve renderizar o modal corretamente quando aberto', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog', { name: /nova refeição/i })).toBeInTheDocument();
    
    // Aguarda carregar as opções da API
    await waitFor(() => {
      expect(screen.getByText(/pesquisar alimento/i)).toBeInTheDocument();
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

    // O item deve aparecer na lista
    expect(await screen.findByText(/arroz branco/i)).toBeInTheDocument();
    expect(screen.getByText(/150\s*g/i)).toBeInTheDocument();
    
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
});

