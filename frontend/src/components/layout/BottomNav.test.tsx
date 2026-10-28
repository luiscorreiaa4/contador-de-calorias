import { describe, expect, it } from 'vitest';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { render, screen } from '../../tests/setup/test-utils';
import { NewMealModalProvider } from '../../context/NewMealModalProvider';
import { BOTTOM_NAV_ITEMS } from '../../navigation/nav-items';
import { BottomNav } from './BottomNav';

function renderBar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <NewMealModalProvider>
        <BottomNav />
      </NewMealModalProvider>
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  it('renderiza 4 slots: Diário, Progresso, + e Conta, só a partir do módulo único', () => {
    renderBar();
    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    expect(nav).toHaveClass('md:hidden');
    expect(within(nav).getAllByRole('listitem')).toHaveLength(4);
    BOTTOM_NAV_ITEMS.forEach((item) => {
      expect(within(nav).getByRole('link', { name: item.shortLabel })).toHaveAttribute('href', item.to);
    });
    expect(within(nav).getByRole('button', { name: 'Nova refeição' })).toBeInTheDocument();
  });

  it.each([
    ['/', 'Diário'],
    ['/diario/2026-10-01', 'Diário'],
    ['/evolucao/corpo', 'Progresso'],
    ['/metas/diarias', 'Progresso'],
    ['/conta', 'Conta'],
    ['/perfil', 'Conta'],
    ['/configuracoes/seguranca', 'Conta'],
  ])('em %s só o slot "%s" tem aria-current', (path, active) => {
    renderBar(path);
    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    const current = within(nav).getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.getAttribute('aria-label'))).toEqual([active]);
  });

  it('o slot ativo usa o ícone preenchido e o inativo usa o de contorno', () => {
    renderBar('/');
    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    const activeSvg = within(nav).getByRole('link', { name: 'Diário' }).querySelector('svg');
    const inactiveSvg = within(nav).getByRole('link', { name: 'Conta' }).querySelector('svg');
    expect(activeSvg).toHaveAttribute('fill', 'currentColor');
    expect(inactiveSvg).toHaveAttribute('fill', 'none');
  });

  it('mostra só ícones, sem legendas visíveis', () => {
    renderBar();
    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    expect(nav.textContent).toBe('');
  });

  it('o "+" nunca recebe aria-current', () => {
    renderBar('/');
    expect(screen.getByRole('button', { name: 'Nova refeição' })).not.toHaveAttribute('aria-current');
  });

  it.each(['/', '/evolucao/corpo', '/conta'])('o "+" abre o modal de nova refeição em %s', async (path) => {
    renderBar(path);
    await userEvent.click(screen.getByRole('button', { name: 'Nova refeição' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('some enquanto um campo de texto está em foco e volta ao sair dele', async () => {
    render(
      <MemoryRouter>
        <NewMealModalProvider>
          <input aria-label="busca" />
          <BottomNav />
        </NewMealModalProvider>
      </MemoryRouter>
    );
    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    expect(nav).toHaveClass('translate-y-0');
    await userEvent.click(screen.getByLabelText('busca'));
    expect(nav).toHaveClass('translate-y-full', 'pointer-events-none');
    await userEvent.tab();
    expect(nav).toHaveClass('translate-y-0');
  });

  it('usa vidro translúcido com fallback sólido e padding da área segura', () => {
    renderBar();
    const nav = screen.getByRole('navigation', { name: 'Navegação inferior' });
    expect(nav).toHaveClass(
      'bg-background',
      'supports-[backdrop-filter]:bg-background/85',
      'backdrop-blur-2xl',
      'pb-[env(safe-area-inset-bottom)]',
      'z-40'
    );
  });
});
