import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedToggle } from './SegmentedToggle';

const options = [
  { value: 'week', label: '7D', ariaLabel: 'Últimos 7 dias' },
  { value: 'month', label: '30D', ariaLabel: 'Últimos 30 dias' },
] as const;

describe('SegmentedToggle', () => {
  it('é um grupo nomeado com botões aria-pressed e type="button"', () => {
    render(<SegmentedToggle options={[...options]} value="week" onChange={() => {}} ariaLabel="Período" />);
    expect(screen.getByRole('group', { name: 'Período' })).toBeInTheDocument();
    const week = screen.getByRole('button', { name: 'Últimos 7 dias' });
    const month = screen.getByRole('button', { name: 'Últimos 30 dias' });
    expect(week).toHaveAttribute('aria-pressed', 'true');
    expect(month).toHaveAttribute('aria-pressed', 'false');
    expect(week).toHaveAttribute('type', 'button');
  });

  it('mostra o rótulo curto e chama onChange com o valor da opção', async () => {
    const onChange = vi.fn();
    render(<SegmentedToggle options={[...options]} value="week" onChange={onChange} ariaLabel="Período" />);
    expect(screen.getByRole('button', { name: 'Últimos 30 dias' })).toHaveTextContent('30D');
    await userEvent.click(screen.getByRole('button', { name: 'Últimos 30 dias' }));
    expect(onChange).toHaveBeenCalledWith('month');
  });

  it('sem ariaLabel o nome acessível é o próprio rótulo', () => {
    render(
      <SegmentedToggle
        options={[{ value: 'auto', label: 'AUTOMÁTICO' }, { value: 'manual', label: 'MANUAL' }]}
        value="auto"
        onChange={() => {}}
        ariaLabel="Modo das metas"
      />
    );
    expect(screen.getByRole('button', { name: 'MANUAL' })).toBeInTheDocument();
  });
  it('desabilita todos os botões quando disabled', () => {
    render(<SegmentedToggle options={[...options]} value="week" onChange={() => {}} ariaLabel="Período" disabled />);
    screen.getAllByRole('button').forEach((button) => expect(button).toBeDisabled());
  });
});
