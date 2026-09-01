/**
 * Valida um path de redirecionamento vindo da URL (`?redirect=`) para evitar
 * open redirect: só aceita paths internos relativos, nunca uma URL absoluta
 * ou "//host" (protocol-relative), que seria tratada como outro domínio.
 */
export function safeRedirectPath(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (!/^\/(?!\/|\\)/.test(value)) return undefined;
  return value;
}
