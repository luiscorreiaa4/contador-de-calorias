import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DatePickerInput } from './DatePickerInput';

describe('DatePickerInput Accessibility (PC-26 / ARCH-022)', () => {
  it('deve ter atributos semânticos ARIA no botão do calendário', () => {
    const handleChange = vi.fn();
    render(
      <DatePickerInput
        id="birth-date"
        value=""
        onChange={handleChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /abrir calendário/i });
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-haspopup', 'dialog');
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');

    // Ao clicar para abrir, deve atualizar aria-expanded para true
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');

    // O popover deve possuir role="dialog" e aria-label="Seletor de data"
    const dialog = screen.getByRole('dialog', { name: /seletor de data/i });
    expect(dialog).toBeInTheDocument();
  });

  it('deve fechar o popover do calendário ao pressionar a tecla Escape', () => {
    const handleChange = vi.fn();
    render(
      <DatePickerInput
        id="birth-date"
        value=""
        onChange={handleChange}
      />
    );

    const toggleButton = screen.getByRole('button', { name: /abrir calendário/i });
    fireEvent.click(toggleButton);

    expect(screen.getByRole('dialog', { name: /seletor de data/i })).toBeInTheDocument();

    // Pressiona Escape
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Popover deve ser fechado
    expect(screen.queryByRole('dialog', { name: /seletor de data/i })).not.toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });
});
