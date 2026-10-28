import { describe, expect, it } from 'vitest';
import { classifySwipe, isEdgeTouch, SWIPE_CONFIG, type SwipeInput } from './swipe';

const base: SwipeInput = {
  startX: 300,
  startY: 300,
  endX: 150,
  endY: 305,
  dtMs: 200,
  startedAtEdge: false,
  widthPx: 390,
};

describe('classifySwipe', () => {
  it('dedo para a esquerda = next; para a direita = prev', () => {
    expect(classifySwipe(base)).toBe('next');
    expect(classifySwipe({ ...base, startX: 100, endX: 250 })).toBe('prev');
  });

  it('confirma por distância: o maior entre 64px e 30% da largura', () => {
    // 30% de 390 = 117px
    expect(classifySwipe({ ...base, endX: 300 - 116, dtMs: 400 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 300 - 118, dtMs: 400 })).toBe('next');
    // em tela estreita vale o mínimo absoluto de 64px
    expect(classifySwipe({ ...base, widthPx: 200, endX: 300 - 63, dtMs: 400 })).toBeNull();
    expect(classifySwipe({ ...base, widthPx: 200, endX: 300 - 65, dtMs: 400 })).toBe('next');
  });

  it('arrasto lento mas longo ainda confirma (o usuário vê a tela acompanhar)', () => {
    expect(classifySwipe({ ...base, endX: 300 - 200, dtMs: 2500 })).toBe('next');
  });

  it('aceita flick curto e rápido (>= 40px com velocidade >= 0.5 px/ms)', () => {
    expect(classifySwipe({ ...base, endX: 300 - 45, dtMs: 80 })).toBe('next');
    expect(classifySwipe({ ...base, endX: 300 - 45, dtMs: 120 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 300 - 30, dtMs: 20 })).toBeNull();
  });

  it('rejeita gesto vertical e diagonal (dominância 2x)', () => {
    expect(classifySwipe({ ...base, endX: 290, endY: 100 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 150, endY: 450 })).toBeNull();
    expect(classifySwipe({ ...base, endX: 150, endY: 370 })).toBe('next');
  });

  it('ignora toque iniciado na borda (gesto de voltar)', () => {
    expect(classifySwipe({ ...base, startedAtEdge: true })).toBeNull();
    expect(isEdgeTouch(SWIPE_CONFIG.edgeGuardPx - 1, 390)).toBe(true);
    expect(isEdgeTouch(390 - SWIPE_CONFIG.edgeGuardPx + 1, 390)).toBe(true);
    expect(isEdgeTouch(200, 390)).toBe(false);
  });

  it('duração inválida (0 ou negativa) não navega', () => {
    expect(classifySwipe({ ...base, dtMs: 0 })).toBeNull();
    expect(classifySwipe({ ...base, dtMs: -5 })).toBeNull();
  });
});
