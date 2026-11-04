import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import { OtpInput } from './OtpInput';

function Harness() {
  const [code, setCode] = useState('');
  return (
    <>
      <label htmlFor="otp">CÓDIGO</label>
      <OtpInput id="otp" value={code} onChange={setCode} />
    </>
  );
}

describe('OtpInput', () => {
  it('aceita só dígitos, limita a 6 e aceita colar o código inteiro', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('CÓDIGO');

    await user.type(input, '1a2-3');
    expect(input).toHaveValue('123');

    await user.clear(input);
    await user.click(input);
    await user.paste('987 654 321');
    expect(input).toHaveValue('987654');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
  });

  describe('botão COLAR CÓDIGO', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    // userEvent.setup() instala o próprio clipboard; sobrescrevemos depois dele.
    const stubClipboard = (clipboard: unknown) =>
      Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });

    afterEach(() => {
      if (original) Object.defineProperty(navigator, 'clipboard', original);
      else Reflect.deleteProperty(navigator, 'clipboard');
    });

    it('cola o código da área de transferência sem os separadores', async () => {
      const user = userEvent.setup();
      stubClipboard({ readText: () => Promise.resolve('Código: 123 456') });
      render(<Harness />);

      await user.click(screen.getByRole('button', { name: /colar código/i }));

      const input = screen.getByLabelText('CÓDIGO');
      expect(input).toHaveValue('123456');
      expect(input).toHaveFocus();
    });

    it('avisa e devolve o foco quando não há 6 dígitos', async () => {
      const user = userEvent.setup();
      stubClipboard({ readText: () => Promise.resolve('abc 12') });
      render(<Harness />);

      await user.click(screen.getByRole('button', { name: /colar código/i }));

      expect(screen.getByRole('status')).toHaveTextContent(/nenhum código de 6 dígitos/i);
      const input = screen.getByLabelText('CÓDIGO');
      expect(input).toHaveValue('');
      expect(input).toHaveFocus();
    });

    it('oculta o botão quando o navegador não expõe clipboard.readText', () => {
      stubClipboard(undefined);
      render(<Harness />);
      expect(screen.queryByRole('button', { name: /colar código/i })).not.toBeInTheDocument();
    });
  });
});
