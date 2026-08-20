import { Redis } from "ioredis";

let client: Redis | null = null;
let warned = false;

function getClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!client) {
    client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: false });
    client.on("error", () => {
      if (!warned) {
        console.warn("Redis indisponível — cache desabilitado, seguindo sem cache.");
        warned = true;
      }
    });
  }
  return client;
}

/**
 * Executa `fn` e cacheia o resultado em Redis por `ttlSeconds`. Se REDIS_URL não
 * estiver configurado ou o Redis estiver indisponível, chama `fn()` direto — o
 * cache é só uma otimização, nunca um requisito pro funcionamento do app.
 */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const redis = getClient();
  if (!redis) return fn();

  try {
    const hit = await redis.get(key);
    if (hit != null) return JSON.parse(hit) as T;
  } catch {
    return fn();
  }

  const value = await fn();
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // cache best-effort — ignora falha de escrita
  }
  return value;
}

/** Remove uma chave do cache (usado quando dados subjacentes mudam antes do TTL expirar). */
export async function invalidateCache(key: string) {
  const redis = getClient();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // best-effort
  }
}
