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
    const option = await screen.findByText('Arroz Branco');
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
    expect(await screen.findByText('Arroz Branco')).toBeInTheDocument();
    expect(screen.getByText('150 g')).toBeInTheDocument();
    
    // Preenche o nome da refeição (opcional mas bom testar)
    const mealNameInput = screen.getByLabelText(/nome da refeição/i);
    await userEvent.type(mealNameInput, 'Almoço');

    // Salvar refeição
    const saveButton = screen.getByRole('button', { name: /salvar refeição/i });
    await userEvent.click(saveButton);

    // Modal deve fechar no sucesso
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('não deve salvar sem alimentos', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);
    
    const saveButton = await screen.findByRole('button', { name: /salvar refeição/i });
    expect(saveButton).toBeDisabled();
  });
});
