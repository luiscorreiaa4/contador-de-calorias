/**
 * Swipe horizontal entre abas irmãs (atalho opcional no mobile; a SegmentedNav funciona sem ele).
 * Princípio: na dúvida, NÃO navegue.
 */

export const SWIPE_CONFIG = {
  minDistancePx: 64,
  fastMinDistancePx: 40,
  fastVelocityPxPerMs: 0.5,
  horizontalDominance: 2,
  maxDurationMs: 700,
  edgeGuardPx: 24,
} as const;

export type SwipeDirection = 'next' | 'prev' | null;

export interface SwipeInput {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  dtMs: number;
  startedAtEdge: boolean;
}

/** Dedo para a esquerda = próxima aba; para a direita = anterior. */
export function classifySwipe({ startX, startY, endX, endY, dtMs, startedAtEdge }: SwipeInput): SwipeDirection {
  if (startedAtEdge) return null;
  if (!(dtMs > 0) || dtMs > SWIPE_CONFIG.maxDurationMs) return null;

  const dx = endX - startX;
  const dy = endY - startY;
  const adx = Math.abs(dx);
  if (adx < SWIPE_CONFIG.horizontalDominance * Math.abs(dy)) return null;

  const isLong = adx >= SWIPE_CONFIG.minDistancePx;
  const isFast = adx >= SWIPE_CONFIG.fastMinDistancePx && adx / dtMs >= SWIPE_CONFIG.fastVelocityPxPerMs;
  if (!isLong && !isFast) return null;

  return dx < 0 ? 'next' : 'prev';
}

export function isEdgeTouch(x: number, viewportWidth: number): boolean {
  return x < SWIPE_CONFIG.edgeGuardPx || x > viewportWidth - SWIPE_CONFIG.edgeGuardPx;
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
