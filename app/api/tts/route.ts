import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { rateLimit, getClientIP } from "@/lib/rate-limit";

// ── MiniMax T2A 語音合成 API ──────────────────────────────────────
// 注意：Token Plan key (sk-cp-) 需要使用 api.minimaxi.com 端點
const MINIMAX_TTS_URL = "https://api.minimaxi.com/v1/t2a_v2";

// speech-2.8-hd 支持的 voice_id 列表
// 參考：https://platform.minimax.io/docs/api-reference/voice-management-get
const VOICES = [
  { id: "female-shaonv",  name: "少女音（清澈寧靜）",   gender: "female", default: true  },
  { id: "female-yujie",   name: "御姐音（沉穩大氣）",   gender: "female", default: false },
  { id: "female-tianmei", name: "甜美音（溫柔親切）",   gender: "female", default: false },
  { id: "male-qinchen",   name: "青沉音（低沉穩重）",   gender: "male",   default: false },
  { id: "male-jingying",  name: "精英音（莊重有力）",   gender: "male",   default: false },
];

// ── 服務端音頻緩存 ────────────────────────────────────────────────
// 結構：cacheKey → { buf: Buffer; expiresAt: number }
// • static=true  → 永久緩存（今日金句、佛經、早晚課等固定內容）
// • static=false → 1 小時緩存（AI 動態回答，防同一句重複請求）
const audioCache = new Map<string, { buf: Buffer; expiresAt: number }>();

const FOREVER   = 9999999999999; // 固定內容永不過期
const ONE_HOUR  = 60 * 60 * 1000;

function getCacheKey(text: string, voice_id: string) {
  return createHash("md5").update(`${voice_id}::${text}`).digest("hex");
}

function getFromCache(key: string): Buffer | null {
  const entry = audioCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    audioCache.delete(key);
    return null;
  }
  return entry.buf;
}

function setCache(key: string, buf: Buffer, isStatic: boolean) {
  // 限制緩存總條數，超過 200 條清掉最舊一批（防記憶體洩漏）
  if (audioCache.size >= 200) {
    const firstKey = audioCache.keys().next().value;
    if (firstKey) audioCache.delete(firstKey);
  }
  audioCache.set(key, {
    buf,
    expiresAt: isStatic ? FOREVER : Date.now() + ONE_HOUR,
  });
}

// ── 核心 TTS 調用 ─────────────────────────────────────────────────
async function callMiniMaxTTS(
  text: string,
  voice_id: string,
  apiKey: string
): Promise<Buffer | null> {
  const body = {
    model: "speech-2.8-hd",   // 正確模型名稱（非 speech-02-hd）
    text,
    voice_setting: {
      voice_id,
      speed:  0.88,  // 稍慢，字字清晰，有停頓感
      vol:    1.0,
      pitch:  0,     // speech-2.8-hd 自帶情感韻律，無需強制降調
    },
    audio_setting: {
      sample_rate: 32000,
      bitrate:     128000,
      format:      "mp3",
      channel:     1,
    },
  };

  const res = await fetch(MINIMAX_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("MiniMax TTS error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const audioHex: string = data?.data?.audio ?? "";
  if (!audioHex) {
    console.error("MiniMax TTS: empty audio", JSON.stringify(data).slice(0, 200));
    return null;
  }

  return Buffer.from(audioHex, "hex");
}

// ── Route Handler ─────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ── Rate Limiting：每 IP 每分鐘最多 15 次（TTS 比 chat 寬鬆些）──
    const ip = getClientIP(request);
    const limit = rateLimit(ip, 15, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "請求過於頻繁，請稍後再試" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(limit.resetInMs / 1000)) },
        }
      );
    }

    const {
      text,
      voice_id = "female-shaonv",
      // isStatic=true：固定內容（金句/佛經），永久緩存，節省 token
      // isStatic=false（預設）：動態 AI 回答，緩存 1 小時
      isStatic = false,
    } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "請提供文字" }, { status: 400 });
    }

    const truncatedText = text.slice(0, 500);
    const cacheKey      = getCacheKey(truncatedText, voice_id);

    // 1️⃣ 命中緩存 → 直接回傳，零 token 消耗
    const cached = getFromCache(cacheKey);
    if (cached) {
      return new NextResponse(new Uint8Array(cached), {
        status: 200,
        headers: {
          "Content-Type":  "audio/mpeg",
          "Cache-Control": isStatic ? "public, max-age=86400" : "private, max-age=3600",
          "X-Cache":       "HIT",
        },
      });
    }

    // 2️⃣ 無 API Key → 告知前端降級
    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    // 3️⃣ 調用 MiniMax TTS
    const audioBuffer = await callMiniMaxTTS(truncatedText, voice_id, apiKey);
    if (!audioBuffer) {
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    // 4️⃣ 存入緩存
    setCache(cacheKey, audioBuffer, isStatic);

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": isStatic ? "public, max-age=86400" : "private, max-age=3600",
        "X-Cache":       "MISS",
      },
    });

  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ voices: VOICES });
}
