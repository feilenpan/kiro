/**
 * 音頻文件 Key 命名規範
 *
 * 所有音頻統一存放在 R2，命名規則如下：
 *   audio/daily/YYYY-MM-DD.mp3        — 今日金句（每天1個）
 *   audio/sutra/<sutra-id>.mp3        — 佛經段落（一次性，永久）
 *   audio/quote/<quote-id>.mp3        — 金句典藏（一次性，永久）
 *   audio/course/morning.mp3          — 早課（一次性，永久）
 *   audio/course/evening.mp3          — 晚課（一次性，永久）
 */

/** 今日金句：按日期命名，每天凌晨 Cron 生成 */
export function dailyAudioKey(date?: Date): string {
  const d = date ?? new Date();
  const ymd = d.toISOString().slice(0, 10); // YYYY-MM-DD
  return `audio/daily/${ymd}.mp3`;
}

/** 佛經段落 */
export function sutraAudioKey(sutraId: string): string {
  return `audio/sutra/${sutraId}.mp3`;
}

/** 金句典藏 */
export function quoteAudioKey(quoteId: number): string {
  return `audio/quote/${quoteId}.mp3`;
}

/** 早晚課 */
export const MORNING_KEY = "audio/course/morning.mp3";
export const EVENING_KEY = "audio/course/evening.mp3";
