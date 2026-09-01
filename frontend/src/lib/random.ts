/**
 * Gera um float uniforme em [0, 1) usando o CSPRNG do navegador em vez de
 * Math.random(). Usado só para valores puramente visuais/decorativos (posição
 * de estrelas, cometas etc.) — sem nenhum uso criptográfico ou de segurança —
 * mas evitamos Math.random() mesmo assim por boa prática.
 */
export function secureRandom(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296; // 2^32
}
