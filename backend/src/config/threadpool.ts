/**
 * Dimensiona o pool de threads do libuv, usado pelas operações assíncronas
 * de hash do bcrypt. O libuv lê esta variável na primeira utilização do pool,
 * por isso este módulo deve ser o PRIMEIRO import de `server.ts`.
 */
const DEFAULT_UV_THREADPOOL_SIZE = 8;

const configured = Number.parseInt(process.env.UV_THREADPOOL_SIZE ?? '', 10);

export const UV_THREADPOOL_SIZE =
  Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_UV_THREADPOOL_SIZE;

process.env.UV_THREADPOOL_SIZE = String(UV_THREADPOOL_SIZE);
