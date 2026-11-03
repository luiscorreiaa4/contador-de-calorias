import { useState } from 'react';
import { describe, expect, it } from 'vitest';
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
});
