import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { BOTTOM_NAV_ITEMS, isDestinationActive, type NavDestination } from './nav-items';
import {
  SWIPE_CONFIG,
  classifySwipe,
  hasBlockingState,
  isEdgeTouch,
  isNarrowViewport,
  prefersReducedMotion,
  shouldIgnoreTarget,
  type SwipeDirection,
} from './swipe';

type Phase = 'idle' | 'pending' | 'dragging' | 'animating';

/**
 * Swipe entre os destinos da barra inferior, com a tela acompanhando o dedo.
 * `areaRef` recebe os toques (listeners nativos e passivos, sem preventDefault);
 * `panelRef` é o conteúdo que se move. O transform só existe durante o gesto/animação.
 */
export function useSwipeNav<A extends HTMLElement, P extends HTMLElement>(enabled: boolean) {
  const areaRef = useRef<A>(null);
  const panelRef = useRef<P>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const latest = useRef({ pathname, navigate });

  useEffect(() => {
    latest.current = { pathname, navigate };
  });

  useEffect(() => {
    const area = areaRef.current;
    const panel = panelRef.current;
    if (!enabled || !area || !panel) return;

    let phase: Phase = 'idle';
    let start = { x: 0, y: 0, t: 0, edge: false };
    let width = 1;
    let timer: number | undefined;

    const currentIndex = () =>
      BOTTOM_NAV_ITEMS.findIndex((item) => isDestinationActive(latest.current.pathname, item));

    const targetFor = (direction: Exclude<SwipeDirection, null>): NavDestination | undefined => {
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

    const finishAfter = (ms: number, done: () => void) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(done, ms);
    };

    const animateTo = (ms: number, easing: string, transform: string, opacity: string) => {
      panel.style.transition = `transform ${ms}ms ${easing}, opacity ${ms}ms ${easing}`;
      panel.style.transform = transform;
      panel.style.opacity = opacity;
    };

    const snapBack = () => {
      if (prefersReducedMotion()) {
        resetPanel();
        phase = 'idle';
        return;
      }
      phase = 'animating';
      animateTo(SWIPE_CONFIG.enterMs, 'ease-out', 'translateX(0px)', '1');
      finishAfter(SWIPE_CONFIG.enterMs, () => {
        resetPanel();
        phase = 'idle';
      });
    };

    const commit = (direction: Exclude<SwipeDirection, null>, to: string) => {
      if (prefersReducedMotion()) {
        resetPanel();
        phase = 'idle';
        latest.current.navigate(to);
        return;
      }
      phase = 'animating';
      const exit = direction === 'next' ? -width : width;
      animateTo(SWIPE_CONFIG.exitMs, 'ease-in', `translateX(${exit}px)`, '0');
      finishAfter(SWIPE_CONFIG.exitMs, () => {
        // A nova tela entra pelo lado oposto ao da saída.
        panel.style.transition = 'none';
        panel.style.transform = `translateX(${-exit * 0.3}px)`;
        panel.style.opacity = '0';
        latest.current.navigate(to);
        void panel.offsetWidth;
        animateTo(SWIPE_CONFIG.enterMs, 'ease-out', 'translateX(0px)', '1');
        finishAfter(SWIPE_CONFIG.enterMs, () => {
          resetPanel();
          phase = 'idle';
        });
      });
    };

    const onTouchStart = (event: TouchEvent) => {
      if (phase === 'animating') return;
      phase = 'idle';
      if (event.touches.length !== 1) return;
      if (!isNarrowViewport() || currentIndex() < 0) return;
      if (shouldIgnoreTarget(event.target, area) || hasBlockingState()) return;

      const touch = event.touches[0];
      width = window.innerWidth || 1;
      start = { x: touch.clientX, y: touch.clientY, t: event.timeStamp, edge: isEdgeTouch(touch.clientX, width) };
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
        panel.style.willChange = 'transform, opacity';
      }

      const hasTarget = targetFor(dx < 0 ? 'next' : 'prev') !== undefined;
      const offset = hasTarget ? dx : dx * SWIPE_CONFIG.rubberBand;
      panel.style.transform = `translateX(${offset}px)`;
      panel.style.opacity = String(1 - Math.min(Math.abs(offset) / width, 1) * 0.5);
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
      if (direction && target) commit(direction, target.to);
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
      resetPanel();
    };
  }, [enabled]);

  return { areaRef, panelRef };
}
