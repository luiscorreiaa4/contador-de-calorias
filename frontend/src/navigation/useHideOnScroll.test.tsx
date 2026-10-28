import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { useRef } from 'react';
import { useHideOnScroll } from './useHideOnScroll';

function Bar() {
  const ref = useRef<HTMLElement>(null);
  const hidden = useHideOnScroll(ref);
  return (
    <nav ref={ref} data-testid="bar" data-hidden={String(hidden)}>
      <button type="button">item</button>
    </nav>
  );
}

function renderBar(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Bar />
    </MemoryRouter>
  );
}

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

const isHidden = () => screen.getByTestId('bar').getAttribute('data-hidden') === 'true';

beforeEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
    callback(0);
    return 0;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useHideOnScroll', () => {
  it('oculta ao rolar para baixo e reaparece ao rolar para cima', () => {
    renderBar();
    scrollTo(100);
    scrollTo(130);
    expect(isHidden()).toBe(true);
    scrollTo(120);
    expect(isHidden()).toBe(false);
  });

  it('só oculta depois de acumular mais de 8px para baixo', () => {
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
    renderBar();
    scrollTo(105);
    expect(isHidden()).toBe(false);
    scrollTo(108);
    expect(isHidden()).toBe(false);
    scrollTo(110);
    expect(isHidden()).toBe(true);
    scrollTo(104);
    expect(isHidden()).toBe(false);
  });

  it('subida de até 4px não reexibe', () => {
    renderBar();
    scrollTo(200);
    expect(isHidden()).toBe(true);
    scrollTo(197);
    expect(isHidden()).toBe(true);
  });

  it('fica visível perto do topo (scrollY < 56)', () => {
    renderBar();
    scrollTo(300);
    scrollTo(340);
    expect(isHidden()).toBe(true);
    scrollTo(30);
    expect(isHidden()).toBe(false);
    scrollTo(55);
    expect(isHidden()).toBe(false);
  });

  it('fica visível enquanto um elemento da barra tem foco', () => {
    renderBar();
    scrollTo(100);
    scrollTo(150);
    expect(isHidden()).toBe(true);
    act(() => {
      screen.getByRole('button', { name: 'item' }).focus();
    });
    expect(isHidden()).toBe(false);
  });

  it('nunca oculta ao rolar em /configuracoes/*', () => {
    renderBar('/configuracoes/seguranca');
    scrollTo(100);
    scrollTo(300);
    expect(isHidden()).toBe(false);
  });

  it('oculta com campo de texto em foco mesmo em /configuracoes/*', () => {
    render(
      <MemoryRouter initialEntries={['/configuracoes/seguranca']}>
        <input aria-label="senha" />
        <Bar />
      </MemoryRouter>
    );
    act(() => {
      screen.getByLabelText('senha').focus();
    });
    expect(isHidden()).toBe(true);
    act(() => {
      screen.getByLabelText('senha').blur();
    });
    expect(isHidden()).toBe(false);
  });
});
