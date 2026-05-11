/**
 * Vercel Cron Job — 音频预生成
 *
 * 执行时间：每天 UTC 00:00（即北京时间 08:00）
 * 触发方式：Vercel 定时自动调用 GET /api/cron
 *
 * 生成内容：
 *   1. 今日金句音频（每天 1 个，按日期命名）
 *   2. 所有佛经段落音频（一次性，已存在则跳过）
 *   3. 所有金句典藏音频（一次性，已存在则跳过）
 *   4. 早晚课音频（一次性，已存在则跳过）
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadAudio, checkExists } from "@/lib/r2";
import { dailyAudioKey, sutraAudioKey, quoteAudioKey, MORNING_KEY, EVENING_KEY } from "@/lib/audio-keys";
import { dailySutras, sutraCategories } from "@/lib/sutras";

const MINIMAX_TTS_URL = "https://api.minimaxi.com/v1/t2a_v2";

// ── TTS 调用 ──────────────────────────────────────────────────────
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
      voice_setting: { voice_id: "female-shaonv", speed: 0.88, vol: 1.0, pitch: 0 },
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });

  if (!res.ok) {
    console.error("[Cron] TTS 失败:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const hex: string = data?.data?.audio ?? "";
  return hex ? Buffer.from(hex, "hex") : null;
}

// ── 生成并上传单条音频（已存在则跳过）────────────────────────────
async function generateOne(
  key: string,
  text: string,
  apiKey: string,
  label: string
): Promise<{ key: string; status: "skipped" | "ok" | "error" }> {
  const exists = await checkExists(key);
  if (exists) {
    console.log(`[Cron] 已存在，跳过: ${label}`);
    return { key, status: "skipped" };
  }

  const audio = await callTTS(text, apiKey);
  if (!audio) {
    console.error(`[Cron] TTS 失败: ${label}`);
    return { key, status: "error" };
  }

  const url = await uploadAudio(key, audio);
  if (!url) {
    console.error(`[Cron] R2 上传失败: ${label}`);
    return { key, status: "error" };
  }

  console.log(`[Cron] ✅ 已生成: ${label}`);
  return { key, status: "ok" };
}

// ── R2 环境变量诊断 ───────────────────────────────────────────────
function diagnoseR2(): Record<string, string> {
  return {
    R2_ACCOUNT_ID:   process.env.R2_ACCOUNT_ID   ? "✅ 已设置" : "❌ 未设置",
    R2_ACCESS_KEY:   process.env.R2_ACCESS_KEY   ? "✅ 已设置" : "❌ 未设置",
    R2_SECRET_KEY:   process.env.R2_SECRET_KEY   ? "✅ 已设置" : "❌ 未设置",
    R2_BUCKET:       process.env.R2_BUCKET       || "❌ 未设置",
    R2_PUBLIC_URL:   process.env.R2_PUBLIC_URL   || "❌ 未设置",
    MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? "✅ 已设置" : "❌ 未设置",
  };
}

// ── 早晚课文字 ────────────────────────────────────────────────────
const MORNING_TEXT = "清晨时分，万物初醒。愿您以清净心迎接新的一天。南无阿弥陀佛。";
const EVENING_TEXT = "日暮时分，尘嚣渐息。回顾今日，若有过失，轻轻放下，明日再来。南无阿弥陀佛。";

// ── Cron Handler ──────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // 安全验证
  const secret = request.headers.get("x-cron-secret")
    ?? request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "缺少 MINIMAX_API_KEY", diagnose: diagnoseR2() }, { status: 500 });
  }

  const results: { key: string; status: string }[] = [];

  // ── 1. 今日金句（每天都要生成）─────────────────────────────────
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const todaySutra = dailySutras[dayOfYear % dailySutras.length];
  const dailyText  = `${todaySutra.text}。摘自${todaySutra.source}。${todaySutra.explanation}`;
  const dailyKey   = dailyAudioKey(today);

  // 今日金句强制重新生成（不跳过，因为每天不同）
  const dailyExists = await checkExists(dailyKey);
  if (!dailyExists) {
    const audio = await callTTS(dailyText, apiKey);
    if (audio) {
      const url = await uploadAudio(dailyKey, audio);
      results.push({ key: dailyKey, status: url ? "ok" : "error" });
      console.log(`[Cron] ✅ 今日金句已生成: ${todaySutra.text.slice(0, 20)}…`);
    } else {
      results.push({ key: dailyKey, status: "error" });
    }
  } else {
    results.push({ key: dailyKey, status: "skipped" });
  }

  // ── 2. 早晚课（一次性生成）──────────────────────────────────────
  results.push(await generateOne(MORNING_KEY, MORNING_TEXT, apiKey, "早课"));
  results.push(await generateOne(EVENING_KEY, EVENING_TEXT, apiKey, "晚课"));

  // ── 3. 金句典藏（一次性生成，共 10 条）─────────────────────────
  for (const sutra of dailySutras) {
    const key  = quoteAudioKey(sutra.id);
    const text = `${sutra.text}。摘自${sutra.source}。${sutra.explanation}`;
    results.push(await generateOne(key, text, apiKey, `金句-${sutra.id}`));
  }

  // ── 4. 佛经段落（一次性生成）────────────────────────────────────
  for (const cat of sutraCategories) {
    for (const sutra of cat.sutras) {
      const key  = sutraAudioKey(sutra.id);
      const text = sutra.excerpt;
      results.push(await generateOne(key, text, apiKey, `佛经-${sutra.title}`));
    }
  }

  // ── 汇总结果 ──────────────────────────────────────────────────
  const summary = {
    total:   results.length,
    ok:      results.filter((r) => r.status === "ok").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    error:   results.filter((r) => r.status === "error").length,
  };

  console.log(`[Cron] 完成: 新生成 ${summary.ok}，跳过 ${summary.skipped}，失败 ${summary.error}`);

  return NextResponse.json({
    ok: summary.error === 0,
    summary,
    results,
    diagnose: diagnoseR2(),
  });
}
