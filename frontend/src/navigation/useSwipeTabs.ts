import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { isTabActive, type NavTab } from './nav-items';
import { classifySwipe, hasBlockingState, isEdgeTouch, shouldIgnoreTarget } from './swipe';

interface TouchStart {
  x: number;
  y: number;
  t: number;
  edge: boolean;
}

/**
 * Navega entre abas irmãs ao deslizar horizontalmente no contêiner retornado.
 * Listeners nativos e passivos (sem preventDefault); só toque.
 */
export function useSwipeTabs<T extends HTMLElement>(tabs: NavTab[]) {
  const containerRef = useRef<T>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const latest = useRef({ tabs, pathname, navigate });

  useEffect(() => {
    latest.current = { tabs, pathname, navigate };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let start: TouchStart | null = null;

    const onTouchStart = (event: TouchEvent) => {
      start = null;
      if (event.touches.length !== 1) return;
      if (shouldIgnoreTarget(event.target, container) || hasBlockingState()) return;
      const touch = event.touches[0];
      start = {
        x: touch.clientX,
        y: touch.clientY,
        t: event.timeStamp,
        edge: isEdgeTouch(touch.clientX, window.innerWidth),
      };
    };

    const onTouchCancel = () => {
      start = null;
    };

    const onTouchEnd = (event: TouchEvent) => {
      const origin = start;
      start = null;
      if (!origin || event.touches.length > 0 || hasBlockingState()) return;
      const touch = event.changedTouches[0];
      if (!touch) return;

      const direction = classifySwipe({
        startX: origin.x,
        startY: origin.y,
        endX: touch.clientX,
        endY: touch.clientY,
        dtMs: event.timeStamp - origin.t,
        startedAtEdge: origin.edge,
      });
      if (!direction) return;

      const { tabs: current, pathname: path, navigate: go } = latest.current;
      const index = current.findIndex((tab) => isTabActive(path, tab));
      if (index < 0) return;
      const target = current[direction === 'next' ? index + 1 : index - 1];
      if (target) go(target.to);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });
    container.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchCancel);
    };
  }, []);

  return containerRef;
}
