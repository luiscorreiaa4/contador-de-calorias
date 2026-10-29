import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination, getPaginationWindow } from '../Pagination';

describe('Pagination Component', () => {
  it('calcula janela de páginas com reticências corretamente (1 ... 11 [12] 13 ... 137)', () => {
    expect(getPaginationWindow(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationWindow(12, 137)).toEqual([1, 'ellipsis-start', 11, 12, 13, 'ellipsis-end', 137]);
    expect(getPaginationWindow(1, 10)).toEqual([1, 2, 'ellipsis-end', 10]);
    expect(getPaginationWindow(10, 10)).toEqual([1, 'ellipsis-start', 9, 10]);
  });

  it('renderiza contagem formatada em pt-BR e acessibilidade aria-current', () => {
    const handlePageChange = vi.fn();
    const handlePageSizeChange = vi.fn();

    render(
      <Pagination
        page={12}
        totalPages={137}
        total={3412}
        pageSize={25}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    );

    // Texto pt-BR: Mostrando 276–300 de 3.412 alimentos
    expect(screen.getByText(/Mostrando/i)).toBeInTheDocument();
    expect(screen.getByText('3.412')).toBeInTheDocument();

    // Nav com acessibilidade
    const nav = screen.getByRole('navigation', { name: 'Paginação' });
    expect(nav).toBeInTheDocument();

    // Botão atual com aria-current="page"
    const currentBtn = screen.getByRole('button', { name: 'Página 12' });
    expect(currentBtn).toHaveAttribute('aria-current', 'page');
  });

  it('chama onPageChange ao clicar nos botões de navegação e página', async () => {
    const handlePageChange = vi.fn();
    const handlePageSizeChange = vi.fn();

    render(
      <Pagination
        page={12}
        totalPages={137}
        total={3412}
        pageSize={25}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    );

    // Clica no botão "Próxima página"
    const nextBtn = screen.getByRole('button', { name: 'Próxima página' });
    await userEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(13);

    // Clica na "Primeira página"
    const firstBtn = screen.getByRole('button', { name: 'Primeira página' });
    await userEvent.click(firstBtn);
    expect(handlePageChange).toHaveBeenCalledWith(1);

    // Clica na página 11
    const page11Btn = screen.getByRole('button', { name: 'Página 11' });
    await userEvent.click(page11Btn);
    expect(handlePageChange).toHaveBeenCalledWith(11);
  });

  it('desabilita botões anterior e primeira na página 1', () => {
    render(
      <Pagination
        page={1}
        totalPages={10}
        total={250}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Primeira página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima página' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Última página' })).not.toBeDisabled();
  });

  it('desabilita botões próxima e última na última página', () => {
    render(
      <Pagination
        page={10}
        totalPages={10}
        total={250}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Primeira página' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página anterior' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled();
  });

  it('altera itens por página via select', async () => {
    const handlePageSizeChange = vi.fn();

    render(
      <Pagination
        page={1}
        totalPages={10}
        total={250}
        pageSize={25}
        onPageChange={vi.fn()}
        onPageSizeChange={handlePageSizeChange}
      />
    );

    const select = screen.getByRole('combobox', { name: 'Itens por página' });
    await userEvent.selectOptions(select, '50');
    expect(handlePageSizeChange).toHaveBeenCalledWith(50);
  });
});

