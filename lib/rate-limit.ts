/**
 * 簡易 Rate Limiter（基於 IP，In-Memory）
 *
 * 適用於 Vercel Serverless：
 *   - 每個 Serverless 實例有自己的 Map，實例回收後清空
 *   - 對於免費個人項目完全夠用
 *   - 如果流量增大需要 Redis 方案（如 @upstash/ratelimit）
 *
 * 策略：滑動窗口，每 IP 每分鐘最多 N 次請求
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * 檢查是否允許請求
 * @param ip       客戶端 IP
 * @param maxReqs  窗口內最大請求數（預設 10）
 * @param windowMs 窗口時間（預設 60000ms = 1 分鐘）
 */
export function rateLimit(
  ip: string,
  maxReqs: number = 10,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();

  cleanup(windowMs);

  let entry = store.get(ip);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(ip, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxReqs) {
    const oldestInWindow = entry.timestamps[0];
    const resetInMs = windowMs - (now - oldestInWindow);
    return { allowed: false, remaining: 0, resetInMs };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxReqs - entry.timestamps.length,
    resetInMs: windowMs,
  };
}

/**
 * 從 Next.js Request 中提取客戶端 IP
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  return request.headers.get("x-real-ip") || "unknown";
}
