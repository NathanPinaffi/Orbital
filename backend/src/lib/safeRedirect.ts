/**
 * Valida um path de redirecionamento vindo do cliente (query param `redirect`/`state`)
 * para evitar open redirect: só aceita paths internos relativos, nunca uma URL
 * absoluta ou "//host" (protocol-relative), que o navegador trataria como
 * redirecionamento para outro domínio.
 */
export function safeRedirectPath(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  // precisa começar com uma única barra (path relativo) e não com "//" ou "/\"
  // (ambos interpretados pelo navegador como protocol-relative URL para outro host).
  if (!/^\/(?!\/|\\)/.test(value)) return undefined;
  return value;
}
