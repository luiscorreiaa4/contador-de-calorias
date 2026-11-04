// Smoke de carga (#23). Variáveis: API_URL, DURATION (s), CONNECTIONS,
// LATENCY_P99_MAX_MS (opcional; sem ele só erros reprovam) e LOAD_TOKEN (Bearer, opcional,
// habilita a busca autenticada de alimentos).
import autocannon from 'autocannon';

const url = process.env.API_URL || 'http://localhost:3001';
const duration = Number(process.env.DURATION || 10);
const connections = Number(process.env.CONNECTIONS || 20);
const p99Max = process.env.LATENCY_P99_MAX_MS ? Number(process.env.LATENCY_P99_MAX_MS) : undefined;
const token = process.env.LOAD_TOKEN;

const requests = [{ method: 'GET', path: '/health' }];
if (token) {
  requests.push({
    method: 'GET',
    path: '/api/foods?search=arroz',
    headers: { authorization: `Bearer ${token}` },
  });
}

console.log(`Carga em ${url}: ${connections} conexões, ${duration}s, ${requests.length} rota(s).`);
const result = await autocannon({ url, connections, duration, requests });

console.log(`Requisições: ${result.requests.total} | média ${result.requests.average} req/s`);
console.log(
  `Latência p99: ${result.latency.p99} ms | erros: ${result.errors} | não-2xx: ${result.non2xx}`,
);

if (result.errors > 0 || result.non2xx > 0) process.exitCode = 1;
if (p99Max !== undefined && result.latency.p99 > p99Max) {
  console.error(`Latência p99 ${result.latency.p99} ms acima do limite de ${p99Max} ms.`);
  process.exitCode = 1;
}
