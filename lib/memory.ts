/**
 * 用户记忆模块 — 基于 Vercel KV（Redis）
 *
 * 数据结构：
 *   kv key: `memory:{userId}`
 *   value: UserMemory JSON
 *
 * 记忆策略（摘要记忆）：
 *   - 每次对话后追加到 recentTurns（最多保留 10 条）
 *   - 每满 5 轮，调用 AI 将 recentTurns 压缩成 summary 摘要
 *   - 每次对话时，把 summary + recentTurns 一起注入 System Prompt
 *   - 摘要约 200 tokens，成本极低
 *
 * KV 未配置时：静默降级，应用正常运行，只是没有记忆功能
 */

import { kv } from "@vercel/kv";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export interface UserMemory {
  userId:       string;
  summary:      string;              // AI 压缩的摘要（~200字）
  recentTurns:  ConversationTurn[];  // 最近 10 条对话
  totalTurns:   number;              // 累计对话轮数
  createdAt:    number;
  updatedAt:    number;
}

const MEMORY_TTL   = 60 * 60 * 24 * 90; // 90天 TTL
const MAX_RECENT   = 10;                 // 保留最近 10 条
const SUMMARY_EVERY = 5;                 // 每 5 轮压缩一次摘要

// ── 判断 KV 是否可用 ──────────────────────────────────────────────
function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ── 读取用户记忆 ──────────────────────────────────────────────────
export async function getMemory(userId: string): Promise<UserMemory | null> {
  if (!isKvAvailable()) return null;
  try {
    const data = await kv.get<UserMemory>(`memory:${userId}`);
    return data ?? null;
  } catch (e) {
    console.error("[Memory] 读取失败:", e);
    return null;
  }
}

// ── 保存用户记忆 ──────────────────────────────────────────────────
export async function saveMemory(memory: UserMemory): Promise<void> {
  if (!isKvAvailable()) return;
  try {
    await kv.set(`memory:${userId(memory)}`, memory, { ex: MEMORY_TTL });
  } catch (e) {
    console.error("[Memory] 保存失败:", e);
  }
}

function userId(m: UserMemory) { return m.userId; }

// ── 追加新的一轮对话 ──────────────────────────────────────────────
export async function appendTurn(
  userId: string,
  userMsg: string,
  assistantMsg: string
): Promise<UserMemory> {
  const existing = await getMemory(userId);
  const now = Date.now();

  const memory: UserMemory = existing ?? {
    userId,
    summary:     "",
    recentTurns: [],
    totalTurns:  0,
    createdAt:   now,
    updatedAt:   now,
  };

  // 追加本轮
  memory.recentTurns.push({ role: "user",      content: userMsg      });
  memory.recentTurns.push({ role: "assistant", content: assistantMsg });
  memory.totalTurns += 1;
  memory.updatedAt   = now;

  // 超出 MAX_RECENT 则截断（保留最新的）
  if (memory.recentTurns.length > MAX_RECENT) {
    memory.recentTurns = memory.recentTurns.slice(-MAX_RECENT);
  }

  await saveMemory(memory);
  return memory;
}

// ── 压缩摘要（每 SUMMARY_EVERY 轮触发一次）────────────────────────
export async function compressSummaryIfNeeded(
  memory: UserMemory,
  apiKey: string,
  baseURL: string
): Promise<UserMemory> {
  if (memory.totalTurns % SUMMARY_EVERY !== 0) return memory;
  if (memory.recentTurns.length === 0) return memory;

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey, baseURL });

    const historyText = memory.recentTurns
      .map((t) => `${t.role === "user" ? "用户" : "法师"}：${t.content}`)
      .join("\n");

    const prevSummary = memory.summary
      ? `之前的了解：${memory.summary}\n\n`
      : "";

    const prompt = `${prevSummary}以下是最近的对话记录：\n${historyText}\n\n请用100字以内，以第三人称简洁概括这位用户的基本情况、主要烦恼和修行偏好，供AI法师下次对话参考。只输出概括内容，不要加任何前缀。`;

    const res = await client.chat.completions.create({
      model: "MiniMax-M2.5",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });

    const newSummary = res.choices[0]?.message?.content?.trim() ?? "";
    if (newSummary) {
      memory.summary = newSummary;
      await saveMemory(memory);
      console.log(`[Memory] 摘要已更新 userId=${memory.userId}: ${newSummary.slice(0, 40)}…`);
    }
  } catch (e) {
    console.error("[Memory] 摘要压缩失败:", e);
  }

  return memory;
}

// ── 构建注入 System Prompt 的记忆段落 ────────────────────────────
export function buildMemoryContext(memory: UserMemory | null): string {
  if (!memory) return "";
  if (!memory.summary && memory.recentTurns.length === 0) return "";

  const lines: string[] = ["【关于这位施主的了解】"];

  if (memory.summary) {
    lines.push(memory.summary);
  }

  if (memory.totalTurns > 0) {
    lines.push(`（已陪伴 ${memory.totalTurns} 轮对话）`);
  }

  return lines.join("\n");
}
