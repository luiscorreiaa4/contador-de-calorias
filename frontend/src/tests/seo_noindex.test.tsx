import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useNoIndex } from '../hooks/useNoIndex';
import React from 'react';

const TestPrivateComponent: React.FC = () => {
  useNoIndex();
  return <div>Área Privada</div>;
};

describe('SEO & Robots NoIndex Guard (#29)', () => {
  beforeEach(() => {
    document.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    document.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
  });

  it('deve adicionar meta robots noindex, nofollow ao montar componente protegido', () => {
    expect(document.querySelector('meta[name="robots"]')).toBeNull();

    const { unmount } = render(<TestPrivateComponent />);

    const meta = document.querySelector('meta[name="robots"]');
    expect(meta).not.toBeNull();
    expect(meta?.getAttribute('content')).toBe('noindex, nofollow');

    unmount();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
