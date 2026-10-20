import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
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

  it('carrega automaticamente no fim sem remontar a lista ou perder a posição e para no total do catálogo', async () => {
    const requestedPages: number[] = [];
    server.use(
      http.get(`${baseURL}/foods`, async ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        requestedPages.push(page);
        if (page > 1) await delay(100);
        const foods = buildFoods(`ALIMENTO P${page}`, 50);
        return HttpResponse.json({ success: true, data: { foods, total: 100 } });
      })
    );

    render(<NewMealModal isOpen={true} onClose={onClose} />);

    const searchInput = await screen.findByRole('combobox');
    await userEvent.click(searchInput);

    expect(await screen.findByText('ALIMENTO P1 00')).toBeInTheDocument();
    expect(screen.queryByText('ALIMENTO P2 00')).not.toBeInTheDocument();

    expect(screen.queryByRole('button', { name: /carregar mais alimentos/i })).not.toBeInTheDocument();
    const list = screen.getByRole('listbox');
    Object.defineProperties(list, {
      scrollHeight: { value: 1000, configurable: true },
      clientHeight: { value: 300, configurable: true },
    });
    list.scrollTop = 100;
    fireEvent.scroll(list);
    expect(requestedPages).toEqual([1]);

    list.scrollTop = 700;
    fireEvent.scroll(list);
    expect(await screen.findByText(/carregando alimentos/i)).toBeInTheDocument();
    fireEvent.scroll(list);
    expect(screen.getByRole('listbox')).toBe(list);
    expect(list.scrollTop).toBe(700);

    expect(await screen.findByText('ALIMENTO P2 00')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBe(list);
    expect(list.scrollTop).toBe(700);
    expect(screen.getAllByRole('option')).toHaveLength(100);
    fireEvent.scroll(list);
    expect(requestedPages).toEqual([1, 2]);

    await userEvent.click(screen.getByRole('option', { name: 'ALIMENTO P2 00' }));
    expect(await screen.findByText(/quantidade em gramas/i)).toBeInTheDocument();
  });

  it('preserva os alimentos após erro de paginação e permite tentar novamente sem reiniciar a lista', async () => {
    let failNextPage = true;
    const requestedPages: number[] = [];
    server.use(
      http.get(`${baseURL}/foods`, ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? '1');
        requestedPages.push(page);
        if (page === 2 && failNextPage) {
          return HttpResponse.json({ success: false, message: 'Falha temporária' }, { status: 500 });
        }
        const foods = buildFoods(`ALIMENTO P${page}`, page === 1 ? 50 : 1);
        return HttpResponse.json({ success: true, data: { foods, total: 51 } });
      })
    );

    render(<NewMealModal isOpen={true} onClose={onClose} />);
    await userEvent.click(await screen.findByRole('combobox'));
    await screen.findByRole('option', { name: 'ALIMENTO P1 00' });
    const list = screen.getByRole('listbox');
    fireEvent.scroll(list);

    expect(await screen.findByRole('alert')).toHaveTextContent(/erro ao carregar mais alimentos/i);
    expect(screen.getAllByRole('option')).toHaveLength(50);
    fireEvent.scroll(list);
    expect(requestedPages).toEqual([1, 2]);

    failNextPage = false;
    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));
    expect(await screen.findByRole('option', { name: 'ALIMENTO P2 00' })).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBe(list);
    expect(requestedPages).toEqual([1, 2, 2]);
  });

  it('reinicia a paginação ao pesquisar depois de carregar mais alimentos', async () => {
    const requests: { page: number; search: string | null }[] = [];
    server.use(
      http.get(`${baseURL}/foods`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        const page = Number(params.get('page') ?? '1');
        const search = params.get('search');
        requests.push({ page, search });
        const foods = search ? buildFoods('ARROZ', 1) : buildFoods(`ALIMENTO P${page}`, 50);
        return HttpResponse.json({ success: true, data: { foods, total: search ? 1 : 100 } });
      })
    );

    render(<NewMealModal isOpen={true} onClose={onClose} />);
    const searchInput = await screen.findByRole('combobox');
    await userEvent.click(searchInput);
    await screen.findByRole('option', { name: 'ALIMENTO P1 00' });
    fireEvent.scroll(screen.getByRole('listbox'));
    await screen.findByRole('option', { name: 'ALIMENTO P2 00' });
    await userEvent.type(searchInput, 'Arroz');
    expect(await screen.findByRole('option', { name: 'ARROZ 00' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(requests).toEqual([{ page: 1, search: null }, { page: 2, search: null }, { page: 1, search: 'Arroz' }]);
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

    expect(await screen.findByText(/quantidade em gramas/i)).toBeInTheDocument();

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

    expect(await screen.findByText(/quantidade em gramas/i)).toBeInTheDocument();

    const amountInput = screen.getByRole('spinbutton');
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, '150');
    await userEvent.click(screen.getByRole('button', { name: /incluir/i }));

    // Arroz Branco: 130 kcal/100g -> 150g = 195 kcal
    await waitFor(() => {
      expect(screen.getAllByText(/195\s*kcal/i).length).toBeGreaterThan(0);
    });

    const inlineInput = await screen.findByLabelText(/quantidade de arroz branco/i);
    await userEvent.clear(inlineInput);
    await userEvent.type(inlineInput, '300');

    // 130 kcal/100g -> 300g = 390 kcal
    await waitFor(() => {
      expect(screen.getAllByText(/390\s*kcal/i).length).toBeGreaterThan(0);
    });
  });

  it('deve alternar para a aba de favoritos e permitir selecionar um alimento (BL-19)', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);

    const favTab = await screen.findByRole('button', { name: /favoritos/i });
    await userEvent.click(favTab);

    // Deve exibir o item favorito mockado
    expect(await screen.findByText(/ovo de galinha/i)).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /adicionar/i });
    await userEvent.click(addBtn);

    // Deve abrir o formulário de quantidade do alimento selecionado
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('deve alternar para a aba de combos e permitir aplicar um combo à refeição (BL-20)', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);

    const comboTab = await screen.findByRole('button', { name: /combos/i });
    await userEvent.click(comboTab);

    // Deve listar o combo 'Café Matinal'
    expect(await screen.findByText(/café matinal/i)).toBeInTheDocument();

    const useComboBtn = screen.getByRole('button', { name: /usar combo/i });
    await userEvent.click(useComboBtn);

    // Os itens do combo devem ser inseridos na lista de refeição
    await waitFor(() => {
      expect(screen.getByText(/arroz branco/i)).toBeInTheDocument();
    });
  });

  it('deve permitir cadastrar um alimento personalizado e selecioná-lo automaticamente (BL-22)', async () => {
    render(<NewMealModal isOpen={true} onClose={onClose} />);

    const customTab = await screen.findByRole('button', { name: /novo alimento/i });
    await userEvent.click(customTab);

    // Deve exibir o formulário de cadastro de alimento personalizado
    expect(screen.getByLabelText(/nome do alimento/i)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/nome do alimento/i), 'Panqueca de Banana Fit');
    await userEvent.type(screen.getByLabelText(/kcal \/ 100g/i), '180');
    await userEvent.type(screen.getByLabelText(/prot \(g\)/i), '8');
    await userEvent.type(screen.getByLabelText(/carb \(g\)/i), '30');
    await userEvent.type(screen.getByLabelText(/gord \(g\)/i), '3');

    const saveBtn = screen.getByRole('button', { name: /cadastrar e selecionar/i });
    await userEvent.click(saveBtn);

    // Deve selecionar o alimento recém-criado e exibir o formulário de porção
    await waitFor(() => {
      expect(screen.getByText(/panqueca de banana fit/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('permite favoritar um alimento diretamente pelo card perto do botão de incluir', async () => {
    let isFav = false;
    server.use(
      http.get(`${baseURL}/foods/favorites`, () => {
        return HttpResponse.json({
          success: true,
          data: isFav
            ? [
                {
                  id: '1',
                  name: 'Arroz Branco',
                  calories: 130,
                  proteins: 2.6,
                  carbs: 28.2,
                  fats: 0.4,
                  base_unit: 'g',
                  serving_weight: 100,
                },
              ]
            : [],
        });
      }),
      http.post(`${baseURL}/foods/:id/favorite`, () => {
        isFav = true;
        return HttpResponse.json({ success: true });
      })
    );

    render(<NewMealModal isOpen={true} onClose={vi.fn()} />);

    const searchInput = await screen.findByRole('combobox');
    await userEvent.type(searchInput, 'Arroz');
    const option = await screen.findByText(/arroz branco/i);
    await userEvent.click(option);

    // Card de quantidade aberto: botão de favoritar deve estar disponível perto de INCLUIR e no cabeçalho
    const favButtons = await screen.findAllByRole('button', { name: /adicionar aos favoritos/i });
    expect(favButtons.length).toBeGreaterThan(0);

    // Clica para favoritar
    await userEvent.click(favButtons[0]);

    // O status do botão deve refletir que o alimento foi favoritado
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /remover dos favoritos/i }).length).toBeGreaterThan(0);
    });
  });
});



