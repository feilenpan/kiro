/**
 * Vercel Cron Job — 每日金句音頻預生成
 *
 * 執行時間：每天 UTC 00:00（即北京時間 08:00）
 * 觸發方式：Vercel 定時自動調用 GET /api/cron
 * 安全：使用 CRON_SECRET 驗證，防止外部隨意觸發
 *
 * 效果：
 *   用戶打開網站時，今日金句音頻已就緒在 R2
 *   任何人點擊「朗讀」都直接播放 CDN URL，0 等待、0 token
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadAudio, checkExists } from "@/lib/r2";
import { dailyAudioKey } from "@/lib/audio-keys";
import { dailySutras } from "@/lib/sutras";

// 注意：Token Plan key (sk-cp-) 需要使用 api.minimaxi.com 端點
const MINIMAX_TTS_URL = "https://api.minimaxi.com/v1/t2a_v2";

async function callTTS(text: string, apiKey: string): Promise<Buffer | null> {
  const res = await fetch(MINIMAX_TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "speech-2.8-hd",   // 正確模型名稱
      text: text.slice(0, 500),
      voice_setting: { voice_id: "female-shaonv", speed: 0.88, vol: 1.0, pitch: 0 },
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

export async function GET(request: NextRequest) {
  // ── 安全驗證 ───────────────────────────────────────────────────
  const secret = request.headers.get("x-cron-secret")
    ?? request.nextUrl.searchParams.get("secret");

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 準備環境 ───────────────────────────────────────────────────
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 MINIMAX_API_KEY" }, { status: 500 });
  }

  const today  = new Date();
  const key    = dailyAudioKey(today);

  // ── 幂等檢查：今天已生成就跳過 ───────────────────────────────
  const exists = await checkExists(key);
  if (exists) {
    const publicUrl = process.env.R2_PUBLIC_URL;
    return NextResponse.json({
      ok:     true,
      cached: true,
      url:    publicUrl ? `${publicUrl}/${key}` : key,
      msg:    "今日金句音頻已存在，無需重新生成",
    });
  }

  // ── 計算今日金句 ───────────────────────────────────────────────
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const sutra  = dailySutras[dayOfYear % dailySutras.length];
  const text   = `${sutra.text}。摘自${sutra.source}。${sutra.explanation}`;

  // ── 生成 TTS ──────────────────────────────────────────────────
  console.log(`[Cron] 生成今日金句: ${sutra.text.slice(0, 20)}…`);
  const audio = await callTTS(text, apiKey);
  if (!audio) {
    return NextResponse.json({ ok: false, error: "TTS 生成失敗" }, { status: 500 });
  }

  // ── 上傳 R2 ───────────────────────────────────────────────────
  const url = await uploadAudio(key, audio);
  if (!url) {
    return NextResponse.json({ ok: false, error: "R2 上傳失敗" }, { status: 500 });
  }

  console.log(`[Cron] ✅ 今日金句音頻已就緒: ${url}`);
  return NextResponse.json({
    ok:     true,
    cached: false,
    url,
    sutra:  sutra.text.slice(0, 20),
    msg:    "今日金句音頻生成並上傳成功",
  });
}
