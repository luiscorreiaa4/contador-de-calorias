import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionCard } from './SectionCard';

describe('SectionCard', () => {
  it('renderiza título como h2 por padrão, ações à direita e o conteúdo', () => {
    render(
      <SectionCard title="Média de consumo" actions={<button type="button">7D</button>}>
        <p>corpo</p>
      </SectionCard>
    );
    expect(screen.getByRole('heading', { level: 2, name: /média de consumo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '7D' })).toBeInTheDocument();
    expect(screen.getByText('corpo')).toBeInTheDocument();
  });

  it('permite trocar o nível do título', () => {
    render(
      <SectionCard title="Gráfico" titleAs="h3">
        <p>corpo</p>
      </SectionCard>
    );
    expect(screen.getByRole('heading', { level: 3, name: /gráfico/i })).toBeInTheDocument();
  });

  it('sem título nem ações não renderiza cabeçalho', () => {
    render(
      <SectionCard>
        <p>corpo</p>
      </SectionCard>
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
