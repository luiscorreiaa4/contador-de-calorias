#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');

const args = process.argv.slice(2);

function isAllowedLiteralFile(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return (
    norm.endsWith('index.css') ||
    norm.endsWith('src/styles/index.css') ||
    norm.endsWith('tailwind.config.js') ||
    norm.includes('/public/') ||
    norm.startsWith('public/') ||
    norm.endsWith('index.html')
  );
}

function findFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'coverage'].includes(entry.name)) continue;
      results.push(...findFiles(fullPath));
    } else if (entry.isFile()) {
      if (/\.(tsx|ts|jsx|js|css|html|svg)$/.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const targetFiles = args.length > 0
  ? args.map(a => path.isAbsolute(a) ? a : path.resolve(process.cwd(), a))
  : findFiles(frontendRoot);

const prohibitedRules = [
  {
    id: 'hex-literal',
    description: 'Cor hexadecimal literal (#xxx)',
    match: (line, file) => {
      if (isAllowedLiteralFile(file)) return false;
      return /#[0-9a-fA-F]{3,8}\b/.test(line);
    }
  },
  {
    id: 'fn-color-number',
    description: 'rgb/rgba/hsl/hsla com valores numéricos literais',
    match: (line, file) => {
      if (isAllowedLiteralFile(file)) return false;
      return /\b(rgba?|hsla?)\s*\(\s*[\d.]+/i.test(line);
    }
  },
  {
    id: 'style-color-name',
    description: 'Nome literal de cor em estilo/SVG (white, black, red...)',
    match: (line, file) => {
      if (isAllowedLiteralFile(file)) return false;
      return /(?:color|fill|stroke|backgroundColor|borderColor|background)\s*[:=]\s*['"`](white|black|red|green|blue|gray|grey|yellow|orange|purple|pink)['"`]/i.test(line);
    }
  },
  {
    id: 'text-primary-invalid',
    description: 'text-primary não seguido de -ink ou -foreground',
    match: (line) => /(?:[a-z0-9_:[\]-]+:)*text-primary(?!(?:-ink|-foreground))\b/.test(line)
  },
  {
    id: 'text-accent-invalid',
    description: 'text-accent não seguido de -foreground',
    match: (line) => /(?:[a-z0-9_:[\]-]+:)*text-accent(?!(?:-foreground))\b/.test(line)
  },
  {
    id: 'primary-accent-decor',
    description: 'border-/ring-/outline-/decoration-/caret-/accent-/divide- com primary ou accent não permitidos',
    match: (line) => {
      // border, ring, outline, divide nunca aceitam primary ou accent
      if (/(?:[a-z0-9_:[\]-]+:)*(?:border|ring|outline|divide)-(?:primary|accent)(?:-[a-z0-9]+)?(?:\/[0-9]+)?\b/.test(line)) return true;
      // decoration, caret, accent só aceitam -primary-ink ou -accent-foreground
      if (/(?:[a-z0-9_:[\]-]+:)*(?:decoration|caret|accent)-(?:primary|accent)(?!(?:-ink|-foreground))\b/.test(line)) return true;
      return false;
    }
  },
  {
    id: 'tailwind-palette-num',
    description: 'Utilitário de cor da paleta Tailwind padrão com número',
    match: (line) => /(?:[a-z0-9_:[\]-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}(?:\/[0-9]+)?\b/.test(line)
  },
  {
    id: 'fixed-white-black',
    description: 'bg-white, text-white, text-black, bg-black (sem /NN) ou border-white',
    match: (line) => {
      if (/(?:[a-z0-9_:[\]-]+:)*(?:bg-white|text-white|text-black|border-white)(?:\/[0-9]+)?\b/.test(line)) return true;
      if (/(?:[a-z0-9_:[\]-]+:)*bg-black\b(?!\/[0-9]+)/.test(line)) return true;
      return false;
    }
  },
  {
    id: 'dark-color-variant',
    description: 'Variante dark: aplicada a utilitários de cor',
    match: (line) => /\bdark:(?:[a-z0-9_:[\]-]+:)*(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration)-[^\s"'`<>]+/.test(line)
  },
  {
    id: 'arbitrary-color-or-shadow',
    description: 'Valores arbitrários de cor [#..], [rgb..], [hsl..] ou shadow-[..]',
    match: (line) => /\[(?:#[0-9a-fA-F]+|rgba?\(|hsla?\()[^\]]*\]/.test(line) || /(?:[a-z0-9_:[\]-]+:)*shadow-\[[^\]]+\]/.test(line)
  }
];

let totalViolations = 0;

for (const filePath of targetFiles) {
  if (!fs.existsSync(filePath)) continue;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relPath = path.relative(frontendRoot, filePath).replace(/\\/g, '/');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';

    // Verifica exceção autorizada
    if (line.includes('color-guard-allow:') || prevLine.includes('color-guard-allow:')) {
      continue;
    }

    for (const rule of prohibitedRules) {
      if (rule.match(line, relPath)) {
        totalViolations++;
        console.log(`${relPath}:${i + 1}:${rule.id}`);
      }
    }
  }
}

if (totalViolations > 0) {
  console.error(`\n[check:colors] ${totalViolations} violações encontradas.`);
  process.exit(1);
} else {
  console.log('[check:colors] 0 violações encontradas. Todas as cores seguem os tokens semânticos.');
  process.exit(0);
}
