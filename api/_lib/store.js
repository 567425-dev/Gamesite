// Shared storage: Upstash Redis, reached over its REST API with plain fetch so
// there's nothing to npm install. Connect it in Vercel under Storage → Upstash
// for Redis; that adds the KV_REST_API_* env vars read below.
import { DEFAULT_SITES } from "./defaults.js";

const SITES_KEY = "room32:sites";

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

export function hasStorage() {
  return redisConfig() != null;
}

export async function redis(...command) {
  const cfg = redisConfig();
  if (!cfg) throw new Error("Redis isn't configured.");
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Redis ${command[0]} failed: ${data.error || res.status}`);
  return data.result;
}

export async function getSites() {
  // No storage connected yet: show the defaults read-only rather than nothing.
  if (!hasStorage()) return DEFAULT_SITES;
  const raw = await redis("GET", SITES_KEY);
  if (raw == null) return DEFAULT_SITES;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list)) return list;
  } catch {
    /* corrupt value: fall through to defaults */
  }
  return DEFAULT_SITES;
}

export async function saveSites(list) {
  await redis("SET", SITES_KEY, JSON.stringify(list));
}

export async function resetSites() {
  await redis("DEL", SITES_KEY);
}
