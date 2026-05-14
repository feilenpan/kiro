/**
 * 一次性音頻預生成腳本
 *
 * 用途：首次部署時運行，生成所有固定內容的音頻並上傳到 R2
 * 運行：npx tsx scripts/generate-audio.ts
 *
 * 覆蓋範圍：
 *   - 10 條金句典藏
 *   - 4 段佛經節選
 *   - 早課 / 晚課
 *   - 今日金句（當天）
 */

import { dailySutras, sutraCategories } from "../lib/sutras";
import { uploadAudio, checkExists } from "../lib/r2";
import {
  quoteAudioKey,
  sutraAudioKey,
  dailyAudioKey,
  MORNING_KEY,
  EVENING_KEY,
} from "../lib/audio-keys";

// ── MiniMax TTS ───────────────────────────────────────────────────
// 注意：Token Plan key (sk-cp-) 需要使用 api.minimaxi.com 端點
const MINIMAX_TTS_URL = "https://api.minimaxi.com/v1/t2a_v2";
const VOICE_ID = "female-yujie";  // 御姐音，沉穩慈悲，適合佛經朗誦

/**
 * TTS 語氣設定說明：
 *   model  speech-2.8-hd — Token Plan 支持的正確模型名
 *   speed  0.88  — 稍慢，字字清晰，適合佛經朗誦
 *   pitch  0     — speech-2.8-hd 自帶情感韻律，無需強制降調
 *   vol    1.0   — 標準音量
 */
const VOICE_SETTING = { voice_id: VOICE_ID, speed: 0.88, vol: 1.0, pitch: 0 };

async function tts(text: string): Promise<Buffer | null> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("缺少 MINIMAX_API_KEY 環境變量");

  const res = await fetch(MINIMAX_TTS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "speech-2.8-hd",   // 正確模型名稱
      text: text.slice(0, 500),
      voice_setting: VOICE_SETTING,
      audio_setting: { sample_rate: 32000, bitrate: 128000, format: "mp3", channel: 1 },
    }),
  });

  if (!res.ok) {
    console.error("TTS 請求失敗:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const hex: string = data?.data?.audio ?? "";
  if (!hex) { console.error("TTS 返回空音頻"); return null; }
  return Buffer.from(hex, "hex");
}

// ── 帶重試的上傳 ──────────────────────────────────────────────────
async function generateAndUpload(
  key: string,
  text: string,
  label: string,
  skipIfExists = true
): Promise<boolean> {
  if (skipIfExists) {
    const exists = await checkExists(key);
    if (exists) {
      console.log(`  ⏭  跳過（已存在）: ${label}`);
      return true;
    }
  }

  process.stdout.write(`  ⏳ 生成中: ${label} ...`);
  const audio = await tts(text);
  if (!audio) { console.log(" ❌ 失敗"); return false; }

  const url = await uploadAudio(key, audio);
  if (!url) { console.log(" ❌ 上傳失敗"); return false; }

  console.log(` ✅ ${url}`);
  return true;
}

// ── 主流程 ────────────────────────────────────────────────────────
async function main() {
  console.log("\n🔔 佛說 — 音頻預生成腳本\n");

  let ok = 0, fail = 0;

  const run = async (key: string, text: string, label: string) => {
    const success = await generateAndUpload(key, text, label);
    success ? ok++ : fail++;
    // 每次請求間隔 600ms，避免觸發 MiniMax 限流
    await new Promise((r) => setTimeout(r, 600));
  };

  // ── 1. 早晚課（永久固定）────────────────────────────────────────
  console.log("📿 早晚課誦");
  await run(MORNING_KEY, "清晨時分，萬物初醒。願您以清淨心迎接新的一天。南無阿彌陀佛。", "早課祝福");
  await run(EVENING_KEY, "日暮時分，塵囂漸息。回顧今日，若有過失，輕輕放下，明日再來。南無阿彌陀佛。", "晚課迴向");

  // ── 2. 金句典藏（永久固定，共 10 條）────────────────────────────
  console.log("\n📖 金句典藏");
  for (const s of dailySutras) {
    const text = `${s.text}。摘自${s.source}。${s.explanation}`;
    await run(quoteAudioKey(s.id), text, `金句 #${s.id}: ${s.text.slice(0, 15)}…`);
  }

  // ── 3. 佛經段落（永久固定）──────────────────────────────────────
  console.log("\n🪷 佛經段落");
  for (const cat of sutraCategories) {
    for (const sutra of cat.sutras) {
      await run(sutraAudioKey(sutra.id), sutra.excerpt, `${sutra.title} (${cat.name})`);
    }
  }

  // ── 4. 今日金句（當天）──────────────────────────────────────────
  console.log("\n☀️  今日金句");
  const today = new Date();
  const todaySutra = dailySutras[(Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  )) % dailySutras.length];
  // 今日金句強制重新生成（skipIfExists=false）
  const success = await generateAndUpload(
    dailyAudioKey(today),
    `${todaySutra.text}。摘自${todaySutra.source}。${todaySutra.explanation}`,
    `今日金句: ${todaySutra.text.slice(0, 15)}…`,
    false
  );
  success ? ok++ : fail++;

  // ── 結果統計 ─────────────────────────────────────────────────────
  console.log(`\n✅ 完成：${ok} 個  ❌ 失敗：${fail} 個`);
  console.log("🎉 預生成完畢！固定內容音頻已上傳 R2，用戶訪問零延遲、零 token 消耗。\n");
}

main().catch(console.error);
