/**
 * 用戶行為分析 — 匿名、隱私友好
 *
 * 原則：
 *   ✅ 只追蹤「行為事件」，不記錄個人身份信息（PII）
 *   ✅ 匿名 ID 存於 localStorage，用戶可隨時清除
 *   ✅ 全部依賴 Vercel Analytics（免費、零配置、合規）
 *   ✅ 用戶反感時可完全關閉（localStorage 設 foshuo_do_not_track=1）
 *
 * 使用：
 *   import { track, events } from '@/lib/analytics';
 *   track(events.LISTEN_DAILY);
 *   track(events.ASK_AI, { topic: "焦慮" });
 */

import { track as vercelTrack } from "@vercel/analytics";

// ── 核心事件枚舉（標準化，方便數據分析）────────────────────────
export const events = {
  // 閱讀/聆聽類
  VIEW_DAILY:     "view_daily",        // 查看今日金句
  LISTEN_DAILY:   "listen_daily",      // 聆聽今日金句（最核心觸達）
  VIEW_SUTRA:     "view_sutra",        // 查看佛經全文
  LISTEN_SUTRA:   "listen_sutra",      // 聆聽佛經朗誦
  VIEW_QUOTE:     "view_quote",        // 展開金句典藏
  LISTEN_QUOTE:   "listen_quote",      // 聆聽典藏金句
  LISTEN_COURSE:  "listen_course",     // 聆聽早晚課

  // AI 互動類（核心價值指標）
  ASK_AI:         "ask_ai",            // 發起一次問佛
  LISTEN_AI:      "listen_ai",         // 聆聽 AI 回答

  // 工具類
  MEDITATE_START: "meditate_start",    // 開始禪修
  MEDITATE_DONE:  "meditate_done",     // 完成禪修
  FONT_RESIZE:    "font_resize",       // 調整字體大小（中老年關鍵指標）

  // 留存類
  PWA_PROMPT:     "pwa_prompt",        // PWA 安裝提示顯示
  PWA_INSTALLED:  "pwa_installed",     // 用戶安裝到桌面
  SHARE:          "share",             // 分享內容
} as const;

export type EventName = (typeof events)[keyof typeof events];

// ── 匿名用戶 ID（localStorage 持久化，不跨站）──────────────────
const UID_KEY  = "foshuo_uid";
const DNT_KEY  = "foshuo_do_not_track";

function uuid(): string {
  // 簡易 UUID v4
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAnonId(): string | null {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem(UID_KEY);
  if (!id) {
    id = uuid();
    try { localStorage.setItem(UID_KEY, id); } catch { /* 隱私模式下可能失敗 */ }
  }
  return id;
}

export function isDoNotTrack(): boolean {
  if (typeof window === "undefined") return true;
  if (localStorage.getItem(DNT_KEY) === "1") return true;
  // 尊重瀏覽器 DNT 信號
  if (typeof navigator !== "undefined" && (navigator as Navigator & { doNotTrack?: string }).doNotTrack === "1") return true;
  return false;
}

export function setDoNotTrack(enabled: boolean) {
  if (typeof window === "undefined") return;
  enabled
    ? localStorage.setItem(DNT_KEY, "1")
    : localStorage.removeItem(DNT_KEY);
}

// ── 事件上報 ──────────────────────────────────────────────────────
type EventProps = Record<string, string | number | boolean | null>;

export function track(event: EventName, props?: EventProps) {
  if (isDoNotTrack()) return;
  try {
    // 自動附帶匿名 ID，方便聚合去重
    const uid = getAnonId();
    vercelTrack(event, { ...(props ?? {}), ...(uid ? { uid } : {}) });
  } catch (err) {
    // 埋點失敗不影響業務
    if (process.env.NODE_ENV === "development") {
      console.warn("[analytics]", event, err);
    }
  }
}
