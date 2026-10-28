import { describe, expect, it } from 'vitest';
import { classifySwipe, isEdgeTouch, SWIPE_CONFIG, type SwipeInput } from './swipe';

const base: SwipeInput = { startX: 200, startY: 300, endX: 100, endY: 305, dtMs: 200, startedAtEdge: false };

describe('classifySwipe', () => {
  it('dedo para a esquerda = next; para a direita = prev', () => {
    expect(classifySwipe(base)).toBe('next');
    expect(classifySwipe({ ...base, startX: 100, endX: 200 })).toBe('prev');
  });

  it('rejeita deslize curto demais e lento', () => {
    expect(classifySwipe({ ...base, endX: 200 - 30 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 200 - (SWIPE_CONFIG.minDistancePx - 1), dtMs: 600 })).toBeNull();
  });

  it('aceita deslize rápido e curto (>= 40px com velocidade >= 0.5 px/ms)', () => {
    expect(classifySwipe({ ...base, endX: 200 - 45, dtMs: 80 })).toBe('next');
    expect(classifySwipe({ ...base, endX: 200 - 45, dtMs: 120 })).toBeNull();
  });

  it('rejeita gesto vertical e diagonal (dominância 2x)', () => {
    expect(classifySwipe({ ...base, endX: 190, endY: 100 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 100, endY: 400 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 100, endY: 350 })).toBe('next');
  });

  it('rejeita arrasto lento demais (> 700ms)', () => {
    expect(classifySwipe({ ...base, dtMs: SWIPE_CONFIG.maxDurationMs + 1 })).toBeNull();
    expect(classifySwipe({ ...base, dtMs: SWIPE_CONFIG.maxDurationMs })).toBe('next');
  });

  it('ignora toque iniciado na borda (gesto de voltar)', () => {
    expect(classifySwipe({ ...base, startedAtEdge: true })).toBeNull();
    expect(isEdgeTouch(10, 390)).toBe(true);
    expect(isEdgeTouch(380, 390)).toBe(true);
    expect(isEdgeTouch(200, 390)).toBe(false);
  });

  it('duração inválida (0 ou negativa) não navega', () => {
    expect(classifySwipe({ ...base, dtMs: 0 })).toBeNull();
    expect(classifySwipe({ ...base, dtMs: -5 })).toBeNull();
  });
});
