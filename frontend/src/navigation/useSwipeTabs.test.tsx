import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { CONFIG_TABS } from './nav-items';
import { SwipeTabsArea } from './SwipeTabsArea';

type Point = { x: number; y: number };

function LocationProbe() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderArea(children: React.ReactNode = <p>conteúdo</p>, path = '/configuracoes/notificacoes') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SwipeTabsArea tabs={CONFIG_TABS}>{children}</SwipeTabsArea>
      <LocationProbe />
    </MemoryRouter>
  );
}

function fire(target: Element, type: 'touchstart' | 'touchend' | 'touchcancel', touches: Point[], changed: Point[], timeStamp: number) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const toList = (points: Point[]) => points.map((p) => ({ clientX: p.x, clientY: p.y }));
  Object.defineProperty(event, 'touches', { value: toList(touches) });
  Object.defineProperty(event, 'changedTouches', { value: toList(changed) });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  act(() => {
    target.dispatchEvent(event);
  });
  return event;
}

function swipe(target: Element, from: Point, to: Point, dtMs = 150) {
  fire(target, 'touchstart', [from], [from], 1000);
  fire(target, 'touchend', [], [to], 1000 + dtMs);
}

const LEFT = { from: { x: 300, y: 300 }, to: { x: 150, y: 302 } };
const RIGHT = { from: { x: 150, y: 300 }, to: { x: 300, y: 302 } };
const path = () => screen.getByTestId('path').textContent;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.querySelectorAll('[data-test-overlay]').forEach((node) => node.remove());
});

describe('useSwipeTabs', () => {
  it('swipe válido para a esquerda abre a próxima aba (mesma rota do link da aba)', () => {
    renderArea();
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[1].to);
  });

  it('swipe para a direita volta à aba anterior', () => {
    renderArea(<p>conteúdo</p>, CONFIG_TABS[2].to);
    swipe(screen.getByText('conteúdo'), RIGHT.from, RIGHT.to);
    expect(path()).toBe(CONFIG_TABS[1].to);
  });

  it('não dá a volta: anterior na primeira aba e próxima na última não navegam', () => {
    const first = renderArea();
    swipe(screen.getByText('conteúdo'), RIGHT.from, RIGHT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
    first.unmount();

    renderArea(<p>conteúdo</p>, CONFIG_TABS[2].to);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[2].to);
  });

  it('nunca chama preventDefault', () => {
    renderArea();
    const target = screen.getByText('conteúdo');
    const start = fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000);
    const end = fire(target, 'touchend', [], [LEFT.to], 1150);
    expect(start.defaultPrevented).toBe(false);
    expect(end.defaultPrevented).toBe(false);
  });

  it('ignora toque dentro de [data-no-swipe]', () => {
    renderArea(<div data-no-swipe><p>gráfico</p></div>);
    swipe(screen.getByText('gráfico'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('ignora toque dentro de role="slider"', () => {
    renderArea(<div role="slider" aria-label="meta" aria-valuenow={1}><p>alça</p></div>);
    swipe(screen.getByText('alça'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('ignora toque dentro de ancestral rolável na horizontal', () => {
    renderArea(<div data-testid="scroller"><p>tabela</p></div>);
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 200, configurable: true });
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) =>
      element === scroller ? ({ overflowX: 'auto' } as CSSStyleDeclaration) : original(element)
    );
    swipe(screen.getByText('tabela'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('overflow-x auto sem conteúdo excedente não bloqueia o swipe', () => {
    renderArea(<div data-testid="scroller"><p>lista</p></div>);
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollWidth', { value: 200, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 200, configurable: true });
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) =>
      element === scroller ? ({ overflowX: 'auto' } as CSSStyleDeclaration) : original(element)
    );
    swipe(screen.getByText('lista'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[1].to);
  });

  it('ignora gesto com dois dedos', () => {
    renderArea();
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from, { x: 10, y: 10 }], [LEFT.from], 1000);
    fire(target, 'touchend', [], [LEFT.to], 1150);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('cancela se um segundo dedo entrar no meio do gesto', () => {
    renderArea();
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000);
    fire(target, 'touchstart', [LEFT.from, { x: 50, y: 50 }], [{ x: 50, y: 50 }], 1050);
    fire(target, 'touchend', [], [LEFT.to], 1150);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('ignora com texto selecionado', () => {
    renderArea();
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'trecho' } as unknown as Selection);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('ignora com campo de texto em foco', () => {
    render(<input aria-label="busca" />);
    renderArea();
    screen.getByLabelText('busca').focus();
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('ignora com [role="dialog"] aberto', () => {
    renderArea();
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('data-test-overlay', '');
    document.body.appendChild(dialog);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('ignora após touchcancel', () => {
    renderArea();
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000);
    fire(target, 'touchcancel', [], [LEFT.from], 1050);
    fire(target, 'touchend', [], [LEFT.to], 1150);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });

  it('toque em Portal (fora do contêiner) não dispara', () => {
    renderArea();
    const portal = document.createElement('div');
    portal.setAttribute('data-test-overlay', '');
    document.body.appendChild(portal);
    swipe(portal, LEFT.from, LEFT.to);
    expect(path()).toBe(CONFIG_TABS[0].to);
  });
});
