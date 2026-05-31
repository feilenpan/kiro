/**
 * Rate Limiter — 雙模式
 *
 *   ① KV 模式（生產推薦）：基於 @vercel/kv（Redis），固定窗口計數
 *      跨 Serverless 實例共享，冷啟動不重置，真正有效。
 *   ② 內存模式（降級）：KV 未配置時用 In-Memory 滑動窗口，
 *      單實例有效，適合本地開發 / 無 KV 環境。
 *
 * 用法（異步）：
 *   const { allowed, resetInMs } = await checkRateLimit(ip, 10, 60_000);
 */

// ── 內存滑動窗口（降級用）─────────────────────────────────────────
interface RateLimitEntry { timestamps: number[]; }
const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

function rateLimitMemory(ip: string, maxReqs: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  cleanup(windowMs);

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxReqs) {
    const resetInMs = windowMs - (now - entry.timestamps[0]);
    return { allowed: false, remaining: 0, resetInMs };
  }
  entry.timestamps.push(now);
  return { allowed: true, remaining: maxReqs - entry.timestamps.length, resetInMs: windowMs };
}

// ── KV 是否可用 ───────────────────────────────────────────────────
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ── KV 固定窗口限流 ───────────────────────────────────────────────
async function rateLimitKV(ip: string, maxReqs: number, windowMs: number): Promise<RateLimitResult> {
  const { kv } = await import("@vercel/kv");
  const windowSec = Math.ceil(windowMs / 1000);
  // 固定窗口 key：把當前時間按窗口大小取整，同一窗口內共用一個 key
  const windowStart = Math.floor(Date.now() / windowMs);
  const key = `rl:${ip}:${windowStart}`;

  // INCR 計數；首次設置過期時間（窗口長度）
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, windowSec);
  }

  if (count > maxReqs) {
    // 距離本窗口結束的剩餘時間
    const resetInMs = (windowStart + 1) * windowMs - Date.now();
    return { allowed: false, remaining: 0, resetInMs };
  }
  return { allowed: true, remaining: maxReqs - count, resetInMs: windowMs };
}

/**
 * 統一限流入口（異步）。
 * KV 可用 → 用 Redis 固定窗口（跨實例有效）；否則 → 內存降級。
 * 任何 KV 異常都安全降級到內存，絕不阻斷正常請求。
 */
export async function checkRateLimit(
  ip: string,
  maxReqs: number = 10,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  if (isKvAvailable()) {
    try {
      return await rateLimitKV(ip, maxReqs, windowMs);
    } catch (e) {
      console.error("[RateLimit] KV 失敗，降級到內存:", e);
      return rateLimitMemory(ip, maxReqs, windowMs);
    }
  }
  return rateLimitMemory(ip, maxReqs, windowMs);
}

/** 同步版（保留向後兼容，僅內存模式）*/
export function rateLimit(ip: string, maxReqs: number = 10, windowMs: number = 60 * 1000): RateLimitResult {
  return rateLimitMemory(ip, maxReqs, windowMs);
}

// ── 提取客戶端 IP ─────────────────────────────────────────────────
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  return request.headers.get("x-real-ip") || "unknown";
}
