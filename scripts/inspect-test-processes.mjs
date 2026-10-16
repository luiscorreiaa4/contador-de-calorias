import { runBounded } from './run-bounded.mjs';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const script = `Get-CimInstance Win32_Process -Filter "name = 'node.exe'" | ForEach-Object {
  [PSCustomObject]@{ ProcessId = $_.ProcessId; ParentProcessId = $_.ParentProcessId; CreationDate = $_.CreationDate.ToUniversalTime().ToString('o'); TestRunner = ($_.CommandLine -match '(run-tests|verify-test-hygiene|audit-test-baseline|vitest|--test|leak-probe|config-probe)'); DevServer = ($_.CommandLine -match '(tsx.*watch|src[/\\\\]server.ts|vite[/\\\\]bin[/\\\\]vite)'); Inspection = ($_.CommandLine -match 'inspect-test-processes') }
} | ConvertTo-Json`;
const result = await runBounded('powershell.exe', ['-NoProfile', '-Command', script], { timeout: 10000, capture: true });
if (result.code !== 0) throw new Error(result.output);
const processes = JSON.parse(result.output);
await writeFile(resolve(import.meta.dirname, '../docs/test-hygiene-processes.json'), JSON.stringify(processes, null, 2) + '\n');
console.log(JSON.stringify(processes));
