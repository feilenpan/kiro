import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// ── MiniMax T2A 語音合成 API ──────────────────────────────────────
const MINIMAX_TTS_URL = "https://api.minimax.io/v1/t2a_v2";

const VOICES = [
  { id: "Wise_Woman", name: "智慧女聲（溫柔莊重）", gender: "female", default: true  },
  { id: "Calm_Woman", name: "沉穩女聲（寧靜平和）", gender: "female", default: false },
  { id: "Gentle_Man", name: "溫潤男聲（低沉穩健）", gender: "male",   default: false },
  { id: "Calm_Man",   name: "沉靜男聲（莊重深遠）", gender: "male",   default: false },
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
    model: "speech-02-hd",
    text,
    voice_setting: { voice_id, speed: 0.85, vol: 1.0, pitch: 0 },
    audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3" },
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
    const {
      text,
      voice_id = "Wise_Woman",
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
