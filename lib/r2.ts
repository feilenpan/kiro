/**
 * Cloudflare R2 存儲工具
 *
 * R2 兼容 S3 API，使用 fetch 直接調用，無需額外 SDK。
 * 免費額度：10GB 存儲 + 100萬次讀取/月，完全夠用。
 *
 * 環境變量：
 *   R2_ACCOUNT_ID   - Cloudflare Account ID
 *   R2_ACCESS_KEY   - R2 Access Key ID
 *   R2_SECRET_KEY   - R2 Secret Access Key
 *   R2_BUCKET       - Bucket 名稱（如 foshuoaudio）
 *   R2_PUBLIC_URL   - 公開訪問域名（如 https://audio.foshuo.com）
 */

// ── HMAC-SHA256 簽名（用於 AWS S3 兼容認證）─────────────────────

async function hmacSHA256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function sha256Hex(data: string | Uint8Array): Promise<string> {
  const encoded = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const buf = encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength) as ArrayBuffer;
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── AWS Signature V4 簽名 ─────────────────────────────────────────

async function signRequest(params: {
  method: string;
  url: string;
  body?: Uint8Array;
  contentType?: string;
  accessKey: string;
  secretKey: string;
  region: string;
  service: string;
}): Promise<Headers> {
  const { method, url, body, contentType = "application/octet-stream", accessKey, secretKey, region, service } = params;

  const now = new Date();
  const dateStamp  = now.toISOString().slice(0, 10).replace(/-/g, "");
  const amzDate    = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";

  const parsedUrl  = new URL(url);
  const host       = parsedUrl.host;
  const path       = parsedUrl.pathname;

  const payloadHash = body ? await sha256Hex(body) : await sha256Hex("");

  // Canonical Headers
  const headers: Record<string, string> = {
    "content-type": contentType,
    "host":         host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date":  amzDate,
  };
  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers).sort()
    .map((k) => `${k}:${headers[k]}\n`).join("");

  const canonicalRequest = [
    method.toUpperCase(),
    path,
    "",   // query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  // Signing key
  const kSecret  = new TextEncoder().encode(`AWS4${secretKey}`);
  const kDate    = await hmacSHA256(kSecret.buffer as ArrayBuffer, dateStamp);
  const kRegion  = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  const kSigning = await hmacSHA256(kService, "aws4_request");
  const signature = toHex(await hmacSHA256(kSigning, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const resultHeaders = new Headers();
  resultHeaders.set("Authorization", authHeader);
  resultHeaders.set("Content-Type", contentType);
  resultHeaders.set("x-amz-content-sha256", payloadHash);
  resultHeaders.set("x-amz-date", amzDate);

  return resultHeaders;
}

// ── R2 Client ─────────────────────────────────────────────────────

export interface R2Config {
  accountId: string;
  accessKey: string;
  secretKey: string;
  bucket:    string;
  publicUrl: string;   // CDN 公開域名
}

function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKey = process.env.R2_ACCESS_KEY;
  const secretKey = process.env.R2_SECRET_KEY;
  const bucket    = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!accountId || !accessKey || !secretKey || !bucket || !publicUrl) {
    return null;
  }
  return { accountId, accessKey, secretKey, bucket, publicUrl };
}

/**
 * 上傳音頻文件到 R2
 * @param key      文件路徑，如 "audio/daily/2026-01-01.mp3"
 * @param audio    mp3 Buffer
 */
export async function uploadAudio(key: string, audio: Buffer): Promise<string | null> {
  const config = getR2Config();
  if (!config) {
    console.warn("[R2] 未配置 R2 環境變量，跳過上傳");
    return null;
  }

  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${config.bucket}/${key}`;
  const body = new Uint8Array(audio);

  const headers = await signRequest({
    method: "PUT",
    url,
    body,
    contentType: "audio/mpeg",
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region:  "auto",
    service: "s3",
  });
  headers.set("Content-Length", String(body.length));

  const res = await fetch(url, { method: "PUT", headers, body });

  if (!res.ok) {
    console.error("[R2] 上傳失敗:", res.status, await res.text());
    return null;
  }

  return `${config.publicUrl}/${key}`;
}

/**
 * 檢查文件是否已存在於 R2
 */
export async function checkExists(key: string): Promise<boolean> {
  const config = getR2Config();
  if (!config) return false;

  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${config.bucket}/${key}`;

  const headers = await signRequest({
    method: "HEAD",
    url,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region:  "auto",
    service: "s3",
  });

  const res = await fetch(url, { method: "HEAD", headers });
  return res.ok;
}

/**
 * 根據 key 生成公開 URL
 */
export function getPublicUrl(key: string): string | null {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) return null;
  return `${publicUrl}/${key}`;
}


/**
 * 上傳 JSON 數據到 R2
 */
export async function uploadJSON(key: string, data: unknown): Promise<string | null> {
  const config = getR2Config();
  if (!config) {
    console.warn("[R2] 未配置 R2 環境變量，跳過 JSON 上傳");
    return null;
  }

  const json = JSON.stringify(data, null, 2);
  const body = new TextEncoder().encode(json);

  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const url = `${endpoint}/${config.bucket}/${key}`;

  const headers = await signRequest({
    method: "PUT",
    url,
    body,
    contentType: "application/json; charset=utf-8",
    accessKey: config.accessKey,
    secretKey: config.secretKey,
    region: "auto",
    service: "s3",
  });
  headers.set("Content-Length", String(body.length));

  const res = await fetch(url, { method: "PUT", headers, body });

  if (!res.ok) {
    console.error("[R2] JSON 上傳失敗:", res.status, await res.text());
    return null;
  }

  return `${config.publicUrl}/${key}`;
}

/**
 * 從 R2 公開 URL 讀取 JSON 數據
 */
export async function fetchJSON<T>(key: string): Promise<T | null> {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!publicUrl) return null;

  try {
    const res = await fetch(`${publicUrl}/${key}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
