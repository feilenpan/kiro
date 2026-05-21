/**
 * Vercel Cron Job — 每日 AI 金句生成 + 音頻預生成
 *
 * 執行時間：每天 UTC 00:00（即北京時間 08:00）
 * 觸發方式：Vercel 定時自動調用 GET /api/cron
 * 安全：使用 CRON_SECRET 驗證，防止外部隨意觸發
 *
 * 流程：
 *   1. 調用 MiniMax Chat API，讓 AI 生成今日金句
 *   2. 將金句 JSON 存入 R2：data/daily/YYYY-MM-DD.json
 *   3. 將金句轉為 TTS 音頻，存入 R2：audio/daily/YYYY-MM-DD.mp3
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadAudio, uploadJSON, checkExists } from "@/lib/r2";
import { dailyAudioKey } from "@/lib/audio-keys";
import { dailySutras, DailySutra } from "@/lib/sutras";

const MINIMAX_CHAT_URL = "https://api.minimaxi.com/v1/text/chatcompletion_v2";
const MINIMAX_TTS_URL  = "https://api.minimaxi.com/v1/t2a_v2";

export function dailyQuoteKey(date?: Date): string {
  const d = date ?? new Date();
  const ymd = d.toISOString().slice(0, 10);
  return `data/daily/${ymd}.json`;
}

// ── AI 生成金句 ────────────────────────────────────────────────────
async function generateDailyQuote(apiKey: string): Promise<DailySutra | null> {
  const today = new Date();
  const dateStr = today.toLocaleDateString("zh-TW", {
    month: "long", day: "numeric", weekday: "long",
  });

  const prompt = `今天是${dateStr}。請為「佛說」應用生成一條今日佛法金句。

要求：
- 金句必須來自真實佛經或禪宗典籍
- 金句長度：15～50字
- 白話解讀：80～120字，貼近現代人生活
- 不要重複常見的「菩提本無樹」「一切有為法」等

請嚴格按以下 JSON 格式輸出，不要有任何其他文字：
{
  "text": "金句原文",
  "source": "出處",
  "explanation": "白話解讀"
}`;

  try {
    const res = await fetch(MINIMAX_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: [
          { role: "system", content: "你是一位精通佛法的法師。請嚴格按用戶要求的 JSON 格式輸出。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      console.error("[Cron] Chat API 失敗:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content: string = data?.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;

    const parsed = JSON.parse(match[0]);
    if (!parsed.text || !parsed.source || !parsed.explanation) return null;

    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );

    return {
      id: 1000 + dayOfYear,
      text: parsed.text,
      source: parsed.source,
      explanation: parsed.explanation,
    } satisfies DailySutra;
  } catch (err) {
    console.error("[Cron] 解析 AI 金句失敗:", err);
    return null;
  }
}

// ── TTS 生成 ───────────────────────────────────────────────────────
async function callTTS(text: string, apiKey: string): Promise<Buffer | null> {
  const res = await fetch(MINIMAX_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "speech-2.8-hd",
      text: text.slice(0, 500),
      voice_setting: { voice_id: "female-yujie", speed: 0.88, vol: 1.0, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });

  if (!res.ok) {
    console.error("[Cron] TTS 失敗:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const hex: string = data?.data?.audio ?? "";
  return hex ? Buffer.from(hex, "hex") : null;
}

function diagnoseR2(): Record<string, string> {
  return {
    R2_ACCOUNT_ID:   process.env.R2_ACCOUNT_ID   ? "✅" : "❌",
    R2_ACCESS_KEY:   process.env.R2_ACCESS_KEY   ? "✅" : "❌",
    R2_SECRET_KEY:   process.env.R2_SECRET_KEY   ? "✅" : "❌",
    R2_BUCKET:       process.env.R2_BUCKET       || "❌",
    R2_PUBLIC_URL:   process.env.R2_PUBLIC_URL   || "❌",
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? "✅" : "❌",
  };
}

// ── Cron Handler ───────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret")
    ?? request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 MINIMAX_API_KEY" }, { status: 500 });
  }

  const today    = new Date();
  const audioKey = dailyAudioKey(today);
  const jsonKey  = dailyQuoteKey(today);

  // 幂等：今天已生成就跳過
  const audioExists = await checkExists(audioKey);
  if (audioExists) {
    const publicUrl = process.env.R2_PUBLIC_URL;
    return NextResponse.json({
      ok: true, cached: true,
      url: publicUrl ? `${publicUrl}/${audioKey}` : audioKey,
      msg: "今日金句已存在，無需重新生成",
    });
  }

  // Step 1：AI 生成金句
  console.log("[Cron] 開始 AI 生成今日金句…");
  let sutra = await generateDailyQuote(apiKey);

  if (!sutra) {
    console.warn("[Cron] AI 生成失敗，使用靜態 fallback");
    const dayOfYear = Math.floor(
      (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
    );
    sutra = dailySutras[dayOfYear % dailySutras.length];
  }

  // Step 2：存儲金句 JSON
  const jsonUrl = await uploadJSON(jsonKey, sutra);
  if (jsonUrl) console.log(`[Cron] ✅ JSON 存儲: ${jsonUrl}`);

  // Step 3：生成 TTS 音頻
  const ttsText = `${sutra.text}。摘自${sutra.source}。${sutra.explanation}`;
  const audio = await callTTS(ttsText, apiKey);

  if (!audio) {
    return NextResponse.json({
      ok: false, error: "TTS 生成失敗",
      jsonUploaded: !!jsonUrl, diagnose: diagnoseR2(),
    }, { status: 500 });
  }

  // Step 4：上傳音頻到 R2
  const audioUrl = await uploadAudio(audioKey, audio);
  if (!audioUrl) {
    return NextResponse.json({
      ok: false, error: "音頻上傳失敗",
      diagnose: diagnoseR2(),
    }, { status: 500 });
  }

  console.log(`[Cron] ✅ 今日金句就緒: ${audioUrl}`);
  return NextResponse.json({
    ok: true, cached: false, audioUrl, jsonUrl,
    sutra: sutra.text.slice(0, 30),
    aiGenerated: sutra.id >= 1000,
    msg: sutra.id >= 1000 ? "AI 生成成功" : "靜態 fallback",
  });
}
