import { useEffect, useLayoutEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router';
import { prefetchFor } from './prefetch';
import { BOTTOM_NAV_ITEMS, isDestinationActive, type NavDestination } from './nav-items';
import {
  SWIPE_CONFIG,
  classifySwipe,
  hasBlockingState,
  isEdgeTouch,
  isInsideNoSwipeArea,
  isNarrowViewport,
  prefersReducedMotion,
  shouldIgnoreTarget,
  type SwipeDirection,
} from './swipe';
import { savedTabScroll, tabTarget } from './tab-memory';

type Phase = 'idle' | 'pending' | 'dragging' | 'animating';
type Direction = Exclude<SwipeDirection, null>;

const NEIGHBOR_STYLES = ['position', 'top', 'left', 'width', 'transform'] as const;

/**
 * Swipe entre os destinos da barra inferior, no estilo pager: a tela vizinha (já montada, com
 * `data-tab`) fica ao lado e as duas acompanham o dedo. `areaRef` recebe os toques (listeners nativos
 * e passivos, sem preventDefault); `panelRef` é o conteúdo que se move. `onPeek` pede ao React que
 * mostre a vizinha. O transform só existe durante o gesto/animação.
 */
export function useSwipeNav<A extends HTMLElement, P extends HTMLElement>(
  enabled: boolean,
  onPeek?: (id: NavDestination['id'] | null) => void,
) {
  const areaRef = useRef<A>(null);
  const panelRef = useRef<P>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const latest = useRef({ pathname, navigate, onPeek });
  const pendingLand = useRef<((force?: boolean) => void) | null>(null);

  useLayoutEffect(() => {
    latest.current = { pathname, navigate, onPeek };
  });

  // A navegação roda em transição: a tela antiga fica visível até a nova existir. Quando a rota
  // nova de fato renderizou, a vizinha já está no lugar e o painel volta a zero no mesmo quadro.
  useLayoutEffect(() => {
    pendingLand.current?.();
  }, [pathname]);

  useEffect(() => {
    const area = areaRef.current;
    const panel = panelRef.current;
    if (!enabled || !area || !panel) return;

    let phase: Phase = 'idle';
    let start = { x: 0, y: 0, t: 0, edge: false };
    let width = 1;
    let timer: number | undefined;
    let peeked: { id: NavDestination['id']; el: HTMLElement | null } | null = null;

    const currentIndex = () =>
      BOTTOM_NAV_ITEMS.findIndex((item) => isDestinationActive(latest.current.pathname, item));

    const targetFor = (direction: Direction): NavDestination | undefined => {
      const index = currentIndex();
      if (index < 0) return undefined;
      return BOTTOM_NAV_ITEMS[direction === 'next' ? index + 1 : index - 1];
    };

    const resetPanel = () => {
      panel.style.transition = '';
      panel.style.transform = '';
      panel.style.opacity = '';
      panel.style.willChange = '';
    };

    const clearPeek = () => {
      if (!peeked) return;
      const { el } = peeked;
      NEIGHBOR_STYLES.forEach((prop) => el?.style.removeProperty(prop));
      peeked = null;
      latest.current.onPeek?.(null);
    };

    // Mostra a vizinha ao lado da tela atual, na posição de rolagem em que ela ficou.
    const showNeighbor = (direction: Direction, target: NavDestination) => {
      if (peeked?.id === target.id) return;
      clearPeek();
      const el = area.querySelector<HTMLElement>(`[data-tab="${target.id}"]`);
      if (el) {
        el.style.position = 'absolute';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.top = `${window.scrollY - savedTabScroll(target.id)}px`;
        el.style.transform = `translateX(${direction === 'next' ? 100 : -100}%)`;
      }
      peeked = { id: target.id, el };
      latest.current.onPeek?.(target.id);
    };

    const finishAfter = (ms: number, done: () => void) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(done, ms);
    };

    const animateTo = (ms: number, easing: string, transform: string) => {
      panel.style.transition = `transform ${ms}ms ${easing}`;
      panel.style.transform = transform;
    };

    const settleIdle = () => {
      window.clearTimeout(timer);
      resetPanel();
      clearPeek();
      pendingLand.current = null;
      phase = 'idle';
    };

    const snapBack = () => {
      if (prefersReducedMotion()) {
        settleIdle();
        return;
      }
      phase = 'animating';
      animateTo(SWIPE_CONFIG.enterMs, 'ease-out', 'translateX(0px)');
      finishAfter(SWIPE_CONFIG.enterMs, settleIdle);
    };

    const commit = (direction: Direction, target: NavDestination) => {
      const to = tabTarget(target, latest.current.pathname);
      if (prefersReducedMotion()) {
        settleIdle();
        latest.current.navigate(to);
        return;
      }
      phase = 'animating';
      showNeighbor(direction, target);
      const exit = direction === 'next' ? -width : width;
      animateTo(SWIPE_CONFIG.exitMs, 'ease-out', `translateX(${exit}px)`);
      finishAfter(SWIPE_CONFIG.exitMs, () => {
        // O painel fica deslocado até a rota nova renderizar; o teto de 1,5 s evita ficar preso.
        const land = (force = false) => {
          if (pendingLand.current !== land) return;
          if (!force && !isDestinationActive(latest.current.pathname, target)) return;
          settleIdle();
        };
        pendingLand.current = land;
        latest.current.navigate(to);
        finishAfter(SWIPE_CONFIG.enterTimeoutMs, () => land(true));
      });
    };

    const onTouchStart = (event: TouchEvent) => {
      if (phase === 'animating') return;
      phase = 'idle';
      if (event.touches.length !== 1) return;
      if (!isNarrowViewport() || currentIndex() < 0) return;
      if (shouldIgnoreTarget(event.target, area) || hasBlockingState()) return;

      const touch = event.touches[0];
      if (isInsideNoSwipeArea(touch.clientX, touch.clientY, area)) return;
      width = window.innerWidth || 1;
      start = {
        x: touch.clientX,
        y: touch.clientY,
        t: event.timeStamp,
        edge: isEdgeTouch(touch.clientX, width),
      };
      phase = 'pending';
    };

    const onTouchMove = (event: TouchEvent) => {
      if (phase !== 'pending' && phase !== 'dragging') return;
      if (event.touches.length !== 1) {
        if (phase === 'dragging') snapBack();
        else phase = 'idle';
        return;
      }

      const touch = event.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;

      if (phase === 'pending') {
        if (Math.abs(dx) < SWIPE_CONFIG.lockPx && Math.abs(dy) < SWIPE_CONFIG.lockPx) return;
        if (start.edge || Math.abs(dx) < SWIPE_CONFIG.horizontalDominance * Math.abs(dy)) {
          phase = 'idle'; // rolagem vertical (ou gesto de borda): não arrasta
          return;
        }
        phase = 'dragging';
        panel.style.transition = 'none';
        panel.style.willChange = 'transform';
      }

      const direction: Direction = dx < 0 ? 'next' : 'prev';
      const target = targetFor(direction);
      if (target) {
        if (peeked?.id !== target.id) prefetchFor(queryClient, target.id);
        showNeighbor(direction, target);
      } else {
        clearPeek();
      }
      const offset = target ? dx : dx * SWIPE_CONFIG.rubberBand;
      panel.style.transform = `translateX(${offset}px)`;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (phase !== 'dragging') {
        if (phase === 'pending') phase = 'idle';
        return;
      }
      const touch = event.changedTouches[0];
      if (!touch || event.touches.length > 0 || hasBlockingState()) {
        snapBack();
        return;
      }

      const direction = classifySwipe({
        startX: start.x,
        startY: start.y,
        endX: touch.clientX,
        endY: touch.clientY,
        dtMs: event.timeStamp - start.t,
        startedAtEdge: start.edge,
        widthPx: width,
      });
      const target = direction ? targetFor(direction) : undefined;
      if (direction && target) commit(direction, target);
      else snapBack();
    };

    const onTouchCancel = () => {
      if (phase === 'dragging') snapBack();
      else if (phase === 'pending') phase = 'idle';
    };

    area.addEventListener('touchstart', onTouchStart, { passive: true });
    area.addEventListener('touchmove', onTouchMove, { passive: true });
    area.addEventListener('touchend', onTouchEnd, { passive: true });
    area.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      area.removeEventListener('touchstart', onTouchStart);
      area.removeEventListener('touchmove', onTouchMove);
      area.removeEventListener('touchend', onTouchEnd);
      area.removeEventListener('touchcancel', onTouchCancel);
      window.clearTimeout(timer);
      pendingLand.current = null;
      resetPanel();
      clearPeek();
    };
  }, [enabled, queryClient]);

  return { areaRef, panelRef };
}
