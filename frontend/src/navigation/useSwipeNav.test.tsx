import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { SWIPE_CONFIG } from './swipe';
import { SwipeMain } from './SwipeMain';

type Point = { x: number; y: number };
type TouchType = 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';

function LocationProbe() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderArea(path = '/', children: React.ReactNode = <p>conteúdo</p>, enabled = true) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SwipeMain enabled={enabled}>{children}</SwipeMain>
      <LocationProbe />
    </MemoryRouter>
  );
}

function fire(target: Element, type: TouchType, touches: Point[], changed: Point[], timeStamp: number) {
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

/** Gesto completo com arrasto: start → move → end. */
function swipe(target: Element, from: Point, to: Point, dtMs = 200) {
  fire(target, 'touchstart', [from], [from], 1000);
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  fire(target, 'touchmove', [mid], [mid], 1000 + dtMs / 2);
  fire(target, 'touchmove', [to], [to], 1000 + dtMs);
  fire(target, 'touchend', [], [to], 1000 + dtMs);
}

const LEFT = { from: { x: 300, y: 300 }, to: { x: 150, y: 302 } };
const RIGHT = { from: { x: 150, y: 300 }, to: { x: 300, y: 302 } };
const path = () => screen.getByTestId('path').textContent;
const panel = () => screen.getByText('conteúdo').parentElement as HTMLElement;
const settle = () =>
  act(() => {
    vi.advanceTimersByTime(SWIPE_CONFIG.exitMs + SWIPE_CONFIG.enterMs + 50);
  });

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(window, 'innerWidth', { value: 390, configurable: true });
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
  document.body.querySelectorAll('[data-test-overlay]').forEach((node) => node.remove());
});

describe('useSwipeNav — navegação entre destinos da barra inferior', () => {
  it.each([
    ['/', LEFT, '/evolucao'],
    ['/evolucao/alimentacao', LEFT, '/conta'],
    ['/metas/diarias', LEFT, '/conta'],
    ['/evolucao/corpo', RIGHT, '/'],
    ['/conta', RIGHT, '/evolucao'],
    ['/perfil', RIGHT, '/evolucao'],
    ['/configuracoes/seguranca', RIGHT, '/evolucao'],
    ['/diario/2026-10-01', LEFT, '/evolucao'],
  ])('em %s o gesto leva a %s', (start, gesture, expected) => {
    renderArea(start);
    swipe(screen.getByText('conteúdo'), gesture.from, gesture.to);
    settle();
    expect(path()).toBe(expected);
  });

  it('não percorre as abas irmãs: em Evolução, deslizar para a esquerda vai para Conta, não para Metas', () => {
    renderArea('/evolucao/corpo');
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/conta');
  });

  it('não dá a volta: primeiro destino à direita e último à esquerda não navegam', () => {
    const first = renderArea('/');
    swipe(screen.getByText('conteúdo'), RIGHT.from, RIGHT.to);
    settle();
    expect(path()).toBe('/');
    first.unmount();

    renderArea('/conta');
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/conta');
  });

  it('só funciona em telas que pertencem a um destino da barra (não em /admin nem /termos)', () => {
    renderArea('/termos');
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/termos');
  });

  it('desligado (sem barra inferior) não faz nada', () => {
    renderArea('/', <p>conteúdo</p>, false);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('flick curto e rápido confirma a troca', () => {
    renderArea('/');
    swipe(screen.getByText('conteúdo'), { x: 300, y: 300 }, { x: 250, y: 301 }, 60);
    settle();
    expect(path()).toBe('/evolucao');
  });
});

describe('useSwipeNav — animação', () => {
  it('a tela acompanha o dedo durante o arrasto e fica sem transform ao terminar', () => {
    renderArea('/');
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000);
    fire(target, 'touchmove', [{ x: 250, y: 301 }], [{ x: 250, y: 301 }], 1050);
    expect(panel().style.transform).toBe('translateX(-50px)');
    expect(Number(panel().style.opacity)).toBeLessThan(1);
    fire(target, 'touchend', [], [{ x: 250, y: 301 }], 1100);
    settle();
    expect(panel().style.transform).toBe('');
    expect(panel().style.opacity).toBe('');
    expect(panel().style.transition).toBe('');
  });

  it('ao confirmar, a tela sai deslizando para o lado do gesto antes de navegar', () => {
    renderArea('/');
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(panel().style.transform).toBe('translateX(-390px)');
    expect(path()).toBe('/');
    act(() => {
      vi.advanceTimersByTime(SWIPE_CONFIG.exitMs);
    });
    expect(path()).toBe('/evolucao');
    // a nova tela entra pelo lado oposto
    expect(panel().style.transform).toBe('translateX(0px)');
    settle();
    expect(panel().style.transform).toBe('');
  });

  it('arrasto curto volta ao lugar sem navegar', () => {
    renderArea('/');
    swipe(screen.getByText('conteúdo'), { x: 300, y: 300 }, { x: 270, y: 301 }, 400);
    expect(panel().style.transform).toBe('translateX(0px)');
    settle();
    expect(path()).toBe('/');
    expect(panel().style.transform).toBe('');
  });

  it('na ponta da fila o arrasto tem resistência e volta', () => {
    renderArea('/');
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [RIGHT.from], [RIGHT.from], 1000);
    fire(target, 'touchmove', [{ x: 250, y: 301 }], [{ x: 250, y: 301 }], 1050);
    expect(panel().style.transform).toBe('translateX(25px)'); // 100px * 0.25
    fire(target, 'touchend', [], [{ x: 250, y: 301 }], 1100);
    settle();
    expect(path()).toBe('/');
    expect(panel().style.transform).toBe('');
  });

  it('com prefers-reduced-motion navega direto, sem animar', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query }));
    renderArea('/');
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    expect(path()).toBe('/evolucao');
    expect(panel().style.transform).toBe('');
    vi.unstubAllGlobals();
  });
});

describe('useSwipeNav — proteções', () => {
  it('nunca chama preventDefault', () => {
    renderArea('/');
    const target = screen.getByText('conteúdo');
    const events = [
      fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000),
      fire(target, 'touchmove', [LEFT.to], [LEFT.to], 1100),
      fire(target, 'touchend', [], [LEFT.to], 1200),
    ];
    events.forEach((event) => expect(event.defaultPrevented).toBe(false));
  });

  it('em tela larga (desktop) é ignorado', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query }));
    renderArea('/');
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
    vi.unstubAllGlobals();
  });

  it('ignora toque dentro de [data-no-swipe]', () => {
    renderArea('/', <div data-no-swipe><p>conteúdo</p></div>);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('ignora toque dentro de role="slider"', () => {
    renderArea('/', <div role="slider" aria-label="meta" aria-valuenow={1}><p>conteúdo</p></div>);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('ignora toque dentro de ancestral rolável na horizontal', () => {
    renderArea('/', <div data-testid="scroller"><p>conteúdo</p></div>);
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 200, configurable: true });
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) =>
      element === scroller ? ({ overflowX: 'auto' } as CSSStyleDeclaration) : original(element)
    );
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('overflow-x auto sem conteúdo excedente não bloqueia', () => {
    renderArea('/', <div data-testid="scroller"><p>conteúdo</p></div>);
    const scroller = screen.getByTestId('scroller');
    Object.defineProperty(scroller, 'scrollWidth', { value: 200, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 200, configurable: true });
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element: Element) =>
      element === scroller ? ({ overflowX: 'auto' } as CSSStyleDeclaration) : original(element)
    );
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/evolucao');
  });

  it('ignora gesto com dois dedos e cancela se o segundo dedo entrar no meio', () => {
    renderArea('/');
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from, { x: 10, y: 10 }], [LEFT.from], 1000);
    fire(target, 'touchend', [], [LEFT.to], 1150);
    settle();
    expect(path()).toBe('/');

    fire(target, 'touchstart', [LEFT.from], [LEFT.from], 2000);
    fire(target, 'touchmove', [{ x: 250, y: 301 }], [{ x: 250, y: 301 }], 2050);
    fire(target, 'touchmove', [{ x: 200, y: 301 }, { x: 50, y: 50 }], [{ x: 50, y: 50 }], 2100);
    settle();
    fire(target, 'touchend', [], [LEFT.to], 2150);
    settle();
    expect(path()).toBe('/');
    expect(panel().style.transform).toBe('');
  });

  it('ignora com texto selecionado', () => {
    renderArea('/');
    vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => 'trecho' } as unknown as Selection);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('ignora com campo de texto em foco', () => {
    render(<input aria-label="busca" />);
    renderArea('/');
    screen.getByLabelText('busca').focus();
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('ignora com [role="dialog"] aberto', () => {
    renderArea('/');
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('data-test-overlay', '');
    document.body.appendChild(dialog);
    swipe(screen.getByText('conteúdo'), LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('touchcancel no meio do arrasto devolve a tela e não navega', () => {
    renderArea('/');
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000);
    fire(target, 'touchmove', [{ x: 200, y: 301 }], [{ x: 200, y: 301 }], 1050);
    fire(target, 'touchcancel', [], [{ x: 200, y: 301 }], 1060);
    settle();
    fire(target, 'touchend', [], [LEFT.to], 1150);
    settle();
    expect(path()).toBe('/');
    expect(panel().style.transform).toBe('');
  });

  it('toque em Portal (fora do contêiner) não dispara', () => {
    renderArea('/');
    const portal = document.createElement('div');
    portal.setAttribute('data-test-overlay', '');
    document.body.appendChild(portal);
    swipe(portal, LEFT.from, LEFT.to);
    settle();
    expect(path()).toBe('/');
  });

  it('toque iniciado na borda da tela não arrasta (gesto de voltar do sistema)', () => {
    renderArea('/');
    swipe(screen.getByText('conteúdo'), { x: 10, y: 300 }, { x: 250, y: 302 });
    settle();
    expect(path()).toBe('/');
    expect(panel().style.transform).toBe('');
  });

  it('movimento vertical libera a rolagem: não arrasta nem navega', () => {
    renderArea('/');
    const target = screen.getByText('conteúdo');
    fire(target, 'touchstart', [LEFT.from], [LEFT.from], 1000);
    fire(target, 'touchmove', [{ x: 295, y: 340 }], [{ x: 295, y: 340 }], 1050);
    expect(panel().style.transform).toBe('');
    fire(target, 'touchmove', [{ x: 150, y: 345 }], [{ x: 150, y: 345 }], 1100);
    expect(panel().style.transform).toBe('');
    fire(target, 'touchend', [], [{ x: 150, y: 345 }], 1150);
    settle();
    expect(path()).toBe('/');
  });
});
