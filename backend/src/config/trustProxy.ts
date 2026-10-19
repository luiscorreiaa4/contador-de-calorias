/**
 * BL-01 / D-19 — `trust proxy` deve ser configurado como número de saltos
 * (ex: "1" atrás de um proxy reverso) ou desabilitado com "false".
 * Nunca aceitar `true`: confiar em toda a cadeia permite spoofing de IP
 * via header `X-Forwarded-For` e fura o rate limiting.
 */
export function parseTrustProxy(raw: string | undefined): number | false {
  if (raw === undefined) return false;

  const value = raw.trim();
  if (value === '' || value === 'false') return false;

  if (!/^\d+$/.test(value)) {
    throw new Error(
      'TRUST_PROXY deve ser um número inteiro de saltos (ex: "1") ou "false"; nunca "true".'
    );
  }

  const hops = Number(value);
  return hops > 0 ? hops : false;
}
