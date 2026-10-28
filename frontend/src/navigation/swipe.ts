/**
 * Swipe horizontal entre os destinos da barra inferior (Diário ↔ Progresso ↔ Conta), só no mobile.
 * A tela acompanha o dedo; ao soltar, confirma a troca ou volta. Princípio: na dúvida, NÃO navegue.
 */

export const SWIPE_CONFIG = {
  /** Distância mínima absoluta para confirmar a troca. */
  minDistancePx: 64,
  /** Fração da largura da tela que também confirma a troca (vale o maior entre as duas distâncias). */
  commitRatio: 0.3,
  /** Gesto curto mas rápido (flick) também confirma. */
  fastMinDistancePx: 40,
  fastVelocityPxPerMs: 0.5,
  /** |dx| precisa ser pelo menos 2x |dy|; diagonal ou vertical não navega. */
  horizontalDominance: 2,
  /** Toque inicial a menos de 24px da borda esquerda/direita é gesto de "voltar" do sistema. */
  edgeGuardPx: 24,
  /** Deslocamento mínimo antes de decidir se o gesto é horizontal (arrasto) ou vertical (rolagem). */
  lockPx: 10,
  /** Resistência ao arrastar na direção sem destino (fim da fila). */
  rubberBand: 0.25,
  exitMs: 180,
  enterMs: 220,
} as const;

export type SwipeDirection = 'next' | 'prev' | null;

export interface SwipeInput {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  dtMs: number;
  startedAtEdge: boolean;
  /** Largura da viewport, para a distância proporcional. */
  widthPx: number;
}

/** Dedo para a esquerda = próximo destino; para a direita = anterior. */
export function classifySwipe({ startX, startY, endX, endY, dtMs, startedAtEdge, widthPx }: SwipeInput): SwipeDirection {
  if (startedAtEdge) return null;
  if (!(dtMs > 0)) return null;

  const dx = endX - startX;
  const dy = endY - startY;
  const adx = Math.abs(dx);
  if (adx < SWIPE_CONFIG.horizontalDominance * Math.abs(dy)) return null;

  const isFar = adx >= Math.max(SWIPE_CONFIG.minDistancePx, SWIPE_CONFIG.commitRatio * widthPx);
  const isFlick = adx >= SWIPE_CONFIG.fastMinDistancePx && adx / dtMs >= SWIPE_CONFIG.fastVelocityPxPerMs;
  if (!isFar && !isFlick) return null;

  return dx < 0 ? 'next' : 'prev';
}

export function isEdgeTouch(x: number, viewportWidth: number): boolean {
  return x < SWIPE_CONFIG.edgeGuardPx || x > viewportWidth - SWIPE_CONFIG.edgeGuardPx;
}

/** Só o layout mobile (abaixo de md) tem barra inferior e swipe. Sem matchMedia (jsdom), assume mobile. */
export function isNarrowViewport(): boolean {
  return typeof window.matchMedia !== 'function' || window.matchMedia('(max-width: 767px)').matches;
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const IGNORE_SELECTOR = [
  '[data-no-swipe]',
  '[role="slider"]',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[role="dialog"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="combobox"]',
  '.recharts-wrapper',
  'svg.recharts-surface',
].join(', ');

const OVERLAY_SELECTOR = '[role="dialog"], [role="menu"], [role="listbox"]';

function scrollsHorizontally(element: Element): boolean {
  const { overflowX } = window.getComputedStyle(element);
  return (overflowX === 'auto' || overflowX === 'scroll') && element.scrollWidth > element.clientWidth;
}

/** O toque inicial cai numa área em que o gesto horizontal pertence a outro controle? */
export function shouldIgnoreTarget(target: EventTarget | null, container: Element): boolean {
  if (!(target instanceof Element) || !container.contains(target)) return true;
  if (target.closest(IGNORE_SELECTOR)) return true;

  for (let element: Element | null = target; element; element = element.parentElement) {
    if (scrollsHorizontally(element)) return true;
    if (element === container) break;
  }
  return false;
}

/** Estado global que cancela o gesto: texto selecionado, campo com foco ou overlay aberto. */
export function hasBlockingState(): boolean {
  if (window.getSelection()?.toString()) return true;

  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  ) {
    return true;
  }

  return document.querySelector(OVERLAY_SELECTOR) !== null || document.body.hasAttribute('data-scroll-locked');
}
