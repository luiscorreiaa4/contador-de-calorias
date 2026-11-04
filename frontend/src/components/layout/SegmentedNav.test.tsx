import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SegmentedNav } from './SegmentedNav';
import { CONFIG_TABS } from '../../navigation/nav-items';

function renderNav(path: string, tabs = CONFIG_TABS, ariaLabel = 'Configurações') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SegmentedNav tabs={tabs} ariaLabel={ariaLabel} />
    </MemoryRouter>,
  );
}

describe('SegmentedNav', () => {
  it('é um nav com links (não tablist) e marca só a aba da rota atual', () => {
    renderNav('/app/configuracoes/seguranca');
    expect(screen.getByRole('navigation', { name: 'Configurações' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Segurança' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Notificações' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Privacidade e dados' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('cada aba aponta para a rota correta', () => {
    renderNav('/app/configuracoes/notificacoes');
    expect(screen.getByRole('link', { name: 'Privacidade e dados' })).toHaveAttribute(
      'href',
      '/app/configuracoes/privacidade',
    );
  });

  it('exibe o rótulo curto no mobile e mantém o nome completo acessível', () => {
    renderNav('/app/configuracoes/notificacoes');
    const link = screen.getByRole('link', { name: 'Privacidade e dados' });
    expect(link).toHaveTextContent('Privacidade');
    expect(link.querySelector('span')).toHaveTextContent('Privacidade');
  });

  it('não gera overflow por construção: colunas iguais, min-w-0 e truncate', () => {
    renderNav('/app/configuracoes/notificacoes');
    const link = screen.getByRole('link', { name: 'Segurança' });
    expect(link).toHaveClass('min-w-0', 'min-h-11');
    expect(link.parentElement).toHaveClass('grid', 'auto-cols-fr');
    expect(link.parentElement).not.toHaveClass('overflow-x-auto');
    expect(link.firstElementChild).toHaveClass('truncate');
  });

  it('ativa a aba por padrões de rota quando definidos', () => {
    const tabs = [
      { to: '/app/historico/alimentacao', label: 'Histórico', patterns: ['/app/historico/*'] },
      { to: '/app/metas/rotina', label: 'Metas', patterns: ['/app/metas/*'] },
    ];
    renderNav('/app/historico/corpo', tabs, 'Seções');
    expect(screen.getByRole('link', { name: 'Histórico' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Metas' })).not.toHaveAttribute('aria-current');
  });
});
