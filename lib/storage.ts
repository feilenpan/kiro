/**
 * 本地持久化 — 设备ID + 对话历史
 *
 * 原则：
 *   ✅ 设备ID随机生成，存于 localStorage，不含任何个人信息
 *   ✅ 对话历史仅存本地，不上传服务器（只传给 AI 推理用）
 *   ✅ 最多保留最近 20 条消息，防止 localStorage 膨胀
 *   ✅ 所有操作捕获异常（隐私模式下 localStorage 可能被禁）
 */

const DEVICE_ID_KEY  = "foshuo_device_id";
const CHAT_HISTORY_KEY = "foshuo_chat_history";
const MAX_HISTORY = 20; // 最多保留条数

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// ── 设备 ID ────────────────────────────────────────────────────

function uuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 获取或生成设备ID
 * 同一设备/浏览器始终返回同一个ID，清除 localStorage 后会重新生成
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = `dev_${uuid()}`;
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "unknown";
  }
}

// ── 对话历史 ───────────────────────────────────────────────────

/**
 * 从 localStorage 读取历史消息
 */
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

/**
 * 保存消息到 localStorage（自动截断，只保留最近 MAX_HISTORY 条）
 */
export function saveChatHistory(messages: StoredMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const trimmed = messages.slice(-MAX_HISTORY);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // 存储空间满或隐私模式，静默失败
  }
}

/**
 * 清空本地对话历史
 */
export function clearChatHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch {
    // ignore
  }
}
