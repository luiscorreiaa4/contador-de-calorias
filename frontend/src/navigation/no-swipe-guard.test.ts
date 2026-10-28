import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const srcRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name) ? [full] : [];
  });
}

const GESTURE_CONFLICT_IMPORT = /from\s+['"](recharts|@radix-ui\/react-slider)['"]/;

describe('guarda do swipe (data-no-swipe)', () => {
  it('todo arquivo que importa recharts ou slider Radix marca data-no-swipe', () => {
    const offenders = sourceFiles(srcRoot).filter((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      if (!GESTURE_CONFLICT_IMPORT.test(content)) return false;
      return !content.includes('data-no-swipe') && !content.includes('no-swipe-guard-allow:');
    });

    expect(
      offenders.map((file) => path.relative(srcRoot, file)),
      'Adicione data-no-swipe ao wrapper (ou "no-swipe-guard-allow: <motivo>")'
    ).toEqual([]);
  });
});
