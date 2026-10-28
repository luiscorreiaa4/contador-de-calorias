import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SegmentedNav } from './SegmentedNav';
import { CONFIG_TABS, EVOLUCAO_TABS, PROGRESSO_TABS } from '../../navigation/nav-items';

function renderNav(path: string, tabs = CONFIG_TABS, ariaLabel = 'Configurações') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SegmentedNav tabs={tabs} ariaLabel={ariaLabel} />
    </MemoryRouter>
  );
}

describe('SegmentedNav', () => {
  it('é um nav com links (não tablist) e marca só a aba da rota atual', () => {
    renderNav('/configuracoes/seguranca');
    expect(screen.getByRole('navigation', { name: 'Configurações' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Segurança' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Notificações' })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: 'Privacidade e dados' })).not.toHaveAttribute('aria-current');
  });

  it('cada aba aponta para a rota correta', () => {
    renderNav('/configuracoes/notificacoes');
    expect(screen.getByRole('link', { name: 'Privacidade e dados' })).toHaveAttribute(
      'href',
      '/configuracoes/privacidade'
    );
  });

  it('exibe o rótulo curto no mobile e mantém o nome completo acessível', () => {
    renderNav('/configuracoes/notificacoes');
    const link = screen.getByRole('link', { name: 'Privacidade e dados' });
    expect(link).toHaveTextContent('Privacidade');
    expect(link.querySelector('span')).toHaveTextContent('Privacidade');
  });

  it('não gera overflow por construção: colunas iguais, min-w-0 e truncate', () => {
    renderNav('/configuracoes/notificacoes');
    const link = screen.getByRole('link', { name: 'Segurança' });
    expect(link).toHaveClass('min-w-0', 'min-h-11');
    expect(link.parentElement).toHaveClass('grid', 'auto-cols-fr');
    expect(link.parentElement).not.toHaveClass('overflow-x-auto');
    expect(link.firstElementChild).toHaveClass('truncate');
  });

  it('usa padrões de rota no nível superior de Progresso (Evolução e Metas)', () => {
    renderNav('/evolucao/corpo', PROGRESSO_TABS, 'Progresso');
    expect(screen.getByRole('link', { name: 'Evolução' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Metas' })).not.toHaveAttribute('aria-current');
  });

  it('ativa Metas em qualquer sub-rota de metas', () => {
    renderNav('/metas/diarias', PROGRESSO_TABS, 'Progresso');
    expect(screen.getByRole('link', { name: 'Metas' })).toHaveAttribute('aria-current', 'page');
  });

  describe('variante underline (nível 2)', () => {
    function renderUnderline(path: string) {
      return render(
        <MemoryRouter initialEntries={[path]}>
          <SegmentedNav tabs={EVOLUCAO_TABS} ariaLabel="Evolução" variant="underline" />
        </MemoryRouter>
      );
    }

    it('marca a aba ativa com aria-current e sublinhado, sem caixa nem fundo', () => {
      renderUnderline('/evolucao/corpo');
      const active = screen.getByRole('link', { name: 'Peso e medidas' });
      const inactive = screen.getByRole('link', { name: 'Alimentação' });
      expect(active).toHaveAttribute('aria-current', 'page');
      expect(active).toHaveClass('border-b-4', 'border-foreground', 'font-black');
      expect(inactive).not.toHaveAttribute('aria-current');
      expect(inactive).toHaveClass('border-transparent', 'text-muted-foreground');
      expect(active).not.toHaveClass('bg-primary');
      expect(active.parentElement).not.toHaveClass('bg-card');
    });

    it('não gera overflow por construção e mantém o alvo mínimo de 44px', () => {
      renderUnderline('/evolucao/alimentacao');
      const link = screen.getByRole('link', { name: 'Alimentação' });
      expect(link).toHaveClass('min-w-0', 'min-h-11');
      expect(link.parentElement).toHaveClass('grid', 'auto-cols-fr');
      expect(link.firstElementChild).toHaveClass('truncate');
    });
  });
});
