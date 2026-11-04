import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from './pages';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');
const read = (file: string) => fs.readFileSync(path.join(publicDir, file), 'utf-8');

describe('endereço público do site (SEO)', () => {
  it('SITE_URL é o endereço do Netlify, sem barra final', () => {
    expect(SITE_URL).toBe('https://caloriesync-luiscorreia.netlify.app');
  });

  it.each(['robots.txt', 'sitemap.xml', 'llms.txt'])('%s só cita SITE_URL', (file) => {
    const content = read(file);
    expect(content).toContain(SITE_URL);
    const origins = new Set(content.match(/https:\/\/[^/\s)<"]+/g) ?? []);
    expect([...origins].filter((origin) => origin.includes('caloriesync'))).toEqual([SITE_URL]);
  });
});
