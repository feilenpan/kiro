/**
 * 本地持久化 — 对话历史（localStorage）
 *
 * 与 Vercel KV 服务端记忆互补：
 *   - KV 记忆：跨设备、AI 摘要式记忆（需联网）
 *   - localStorage：当前设备对话历史恢复（离线也可用）
 *
 * 策略：
 *   - 最多保留最近 20 条消息，防止 localStorage 膨胀
 *   - 所有操作捕获异常（私密模式 / iOS 限制下 localStorage 可能被禁）
 */

const CHAT_HISTORY_KEY = "foshuo_chat_history";
const MAX_HISTORY = 20;

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ── 读取历史 ──────────────────────────────────────────────────────
export function loadChatHistory(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as StoredMessage[];
  } catch {
    return [];
  }
}

// ── 保存历史（自动截断）────────────────────────────────────────────
export function saveChatHistory(messages: StoredMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  } catch {
    // 存储空间满或私密模式，静默失败
  }
}

// ── 清空历史 ──────────────────────────────────────────────────────
export function clearChatHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    // ignore
  }
}
