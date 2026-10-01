import autocannon from 'autocannon';

const URL = process.env.API_URL || 'http://localhost:3001';

console.log(`Iniciando Teste de Carga no servidor: ${URL}`);

const instance = autocannon({
  url: `${URL}/health`, // Rota mais rápida, testa vazão do servidor e middleware
  connections: 500,     // Conexões concorrentes (peso médio/alto)
  pipelining: 1,
  duration: 10          // Duração em segundos
}, console.log);

autocannon.track(instance, { renderProgressBar: true });

instance.on('done', (result) => {
  console.log('\\n--- RESULTADOS DO TESTE DE CARGA ---');
  console.log(`Requisições completadas: ${result.requests.total}`);
  console.log(`Média de req/s: ${result.requests.average}`);
  console.log(`Latência P99: ${result.latency.p99} ms`);
  console.log(`Erros (timeout/conexão): ${result.errors}`);
  console.log(`Erros HTTP 4xx/5xx: ${result.non2xx}`);
  console.log('--------------------------------------\\n');
});
