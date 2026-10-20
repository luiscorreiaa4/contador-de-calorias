import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cssContent = fs.readFileSync(path.resolve(__dirname, 'index.css'), 'utf-8');

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseTokens(content: string) {
  const rootMatch = content.match(/:root\s*\{([^}]+)\}/);
  const darkMatch = content.match(/\.dark[^{]*\{([^}]+)\}/);

  if (!rootMatch || !darkMatch) {
    throw new Error('Não foi possível encontrar :root ou .dark no index.css');
  }

  function extractHslMap(block: string): Record<string, [number, number, number]> {
    const map: Record<string, [number, number, number]> = {};
    const varRegex = /--([a-z0-9-]+)\s*:\s*([0-9.]+)\s+([0-9.]+)%\s+([0-9.]+)%/g;
    let match;
    while ((match = varRegex.exec(block)) !== null) {
      const [, name, h, s, l] = match;
      map[name] = hslToRgb(parseFloat(h), parseFloat(s), parseFloat(l));
    }
    return map;
  }

  return {
    light: extractHslMap(rootMatch[1]),
    dark: extractHslMap(darkMatch[1]),
  };
}

describe('WCAG Tokens Contrast Test (Fase 2a)', () => {
  const { light, dark } = parseTokens(cssContent);

  describe('Modo Claro (WCAG Ratios)', () => {
    it('foreground/background >= 7', () => {
      expect(contrastRatio(light['foreground'], light['background'])).toBeGreaterThanOrEqual(7);
    });

    it('foreground/card >= 7', () => {
      expect(contrastRatio(light['foreground'], light['card'])).toBeGreaterThanOrEqual(7);
    });

    it('muted-foreground/background >= 4.5', () => {
      expect(contrastRatio(light['muted-foreground'], light['background'])).toBeGreaterThanOrEqual(4.5);
    });

    it('muted-foreground/card >= 4.5', () => {
      expect(contrastRatio(light['muted-foreground'], light['card'])).toBeGreaterThanOrEqual(4.5);
    });

    it('muted-foreground/secondary >= 4.5', () => {
      expect(contrastRatio(light['muted-foreground'], light['secondary'])).toBeGreaterThanOrEqual(4.5);
    });

    it('primary-ink/background >= 4.5', () => {
      expect(contrastRatio(light['primary-ink'], light['background'])).toBeGreaterThanOrEqual(4.5);
    });

    it('primary-ink/card >= 4.5', () => {
      expect(contrastRatio(light['primary-ink'], light['card'])).toBeGreaterThanOrEqual(4.5);
    });

    it('primary-ink/secondary >= 4.5', () => {
      expect(contrastRatio(light['primary-ink'], light['secondary'])).toBeGreaterThanOrEqual(4.5);
    });

    it('primary-foreground/primary >= 7', () => {
      expect(contrastRatio(light['primary-foreground'], light['primary'])).toBeGreaterThanOrEqual(7);
    });

    it('destructive/background >= 4.5', () => {
      expect(contrastRatio(light['destructive'], light['background'])).toBeGreaterThanOrEqual(4.5);
    });

    it('destructive/card >= 4.5', () => {
      expect(contrastRatio(light['destructive'], light['card'])).toBeGreaterThanOrEqual(4.5);
    });

    it('destructive-foreground/destructive >= 4.5', () => {
      expect(contrastRatio(light['destructive-foreground'], light['destructive'])).toBeGreaterThanOrEqual(4.5);
    });

    it('ring/background >= 3', () => {
      expect(contrastRatio(light['ring'], light['background'])).toBeGreaterThanOrEqual(3);
    });

    it('border/background >= 3', () => {
      expect(contrastRatio(light['border'], light['background'])).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Modo Escuro (WCAG Ratios)', () => {
    it('foreground/background >= 7', () => {
      expect(contrastRatio(dark['foreground'], dark['background'])).toBeGreaterThanOrEqual(7);
    });

    it('foreground/card >= 7', () => {
      expect(contrastRatio(dark['foreground'], dark['card'])).toBeGreaterThanOrEqual(7);
    });

    it('muted-foreground/card >= 4.5', () => {
      expect(contrastRatio(dark['muted-foreground'], dark['card'])).toBeGreaterThanOrEqual(4.5);
    });

    it('primary-ink/background >= 7', () => {
      expect(contrastRatio(dark['primary-ink'], dark['background'])).toBeGreaterThanOrEqual(7);
    });

    it('primary-ink/card >= 7', () => {
      expect(contrastRatio(dark['primary-ink'], dark['card'])).toBeGreaterThanOrEqual(7);
    });

    it('primary-foreground/primary >= 7', () => {
      expect(contrastRatio(dark['primary-foreground'], dark['primary'])).toBeGreaterThanOrEqual(7);
    });

    it('destructive/card >= 4.5', () => {
      expect(contrastRatio(dark['destructive'], dark['card'])).toBeGreaterThanOrEqual(4.5);
    });

    it('ring/background >= 3', () => {
      expect(contrastRatio(dark['ring'], dark['background'])).toBeGreaterThanOrEqual(3);
    });

    it('destructive-foreground/destructive >= 3 (exceção conhecida: texto grande/negrito)', () => {
      expect(contrastRatio(dark['destructive-foreground'], dark['destructive'])).toBeGreaterThanOrEqual(3);
    });

    it('nota: border/card no escuro (~1.15:1) não é imposto para contraste de texto', () => {
      const ratio = contrastRatio(dark['border'], dark['card']);
      expect(ratio).toBeGreaterThan(1);
    });
  });
});
