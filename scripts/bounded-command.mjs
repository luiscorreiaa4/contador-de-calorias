import { runBounded } from './run-bounded.mjs';
const [command, ...args] = process.argv.slice(2);
if (!command) throw new Error('Informe comando e argumentos.');
process.exitCode = (await runBounded(command, args)).code;
