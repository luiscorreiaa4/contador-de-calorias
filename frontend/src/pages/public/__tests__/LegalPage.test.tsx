import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router';
import { render } from '../../../tests/setup/test-utils';
import { TermsPage, PrivacyPage, SecurityPage } from '../LegalPage';

describe('Páginas legais públicas (BL-11 / SEC-020)', () => {
  it('renderiza os Termos de Uso com link de retorno funcional', () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /termos de uso/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar/i })).toBeInTheDocument();
  });

  it('renderiza a Política de Privacidade citando os direitos da LGPD', () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: /política de privacidade/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/lgpd, art\. 18/i)).toBeInTheDocument();
  });

  it('renderiza a página de Segurança', () => {
    render(
      <MemoryRouter>
        <SecurityPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /segurança/i })).toBeInTheDocument();
  });
});
