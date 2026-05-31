"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AudioPlayer from "./AudioPlayer";
import { track, events } from "@/lib/analytics";
import {
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  type StoredMessage,
} from "@/lib/storage";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "我最近很焦慮，怎麼辦？",
  "如何讓心靜下來？",
  "《心經》是什麼意思？",
  "失眠應該如何調整？",
  "如何與家人和睦相處？",
  "什麼是念佛？",
];

const USER_ID_KEY = "foshuoUserId";

// ── 获取或生成用户匿名 ID ────────────────────────────────────────
async function getOrCreateUserId(): Promise<string> {
  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) return stored;
  try {
    const res = await fetch("/api/user-id");
    const data = await res.json();
    const userId: string = data.userId;
    localStorage.setItem(USER_ID_KEY, userId);
    return userId;
  } catch {
    const fallback = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, fallback);
    return fallback;
  }
}

export default function ChatInterface() {
  const [messages,          setMessages]          = useState<Message[]>([]);
  const [input,             setInput]             = useState("");
  const [isLoading,         setIsLoading]         = useState(false);
  const [isMock,            setIsMock]            = useState(false);
  const [hasMemory,         setHasMemory]         = useState(false);
  const [isRestoredHistory, setIsRestoredHistory] = useState(false);
  const [resumeDate,        setResumeDate]        = useState<string>("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const userIdRef = useRef<string | null>(null);

  // 组件挂载：初始化 userId + 从 localStorage 恢复对话历史
  useEffect(() => {
    getOrCreateUserId().then((id) => {
      userIdRef.current = id;
    });

    const stored = loadChatHistory();
    if (stored.length > 0) {
      setMessages(stored.map((m: StoredMessage) => ({ role: m.role, content: m.content })));
      setIsRestoredHistory(true);
      setHasMemory(true);

      // 格式化上次对话时间
      const last = stored[stored.length - 1];
      if (last.timestamp) {
        const d = new Date(last.timestamp);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
        if (diffDays === 0) {
          setResumeDate(`今天 ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`);
        } else if (diffDays === 1) {
          setResumeDate("昨天");
        } else {
          setResumeDate(`${d.getMonth() + 1}月${d.getDate()}日`);
        }
      }
    }
  }, []);

  // 歷史恢復時，只在聊天列表容器內滾動，不影響頁面外層
  useEffect(() => {
    if (isRestoredHistory && messages.length > 0) {
      setTimeout(() => {
        const el = bottomRef.current;
        if (!el) return;
        // 只滾動最近的可捲動祖先（聊天 div），不觸發 window/body 滾動
        const container = el.closest("[data-chat-scroll]") as HTMLElement | null;
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 50);
    }
  }, [isRestoredHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // 新消息時，只在聊天容器內部滾動
  useEffect(() => {
    if (!isRestoredHistory) {
      const el = bottomRef.current;
      if (!el) return;
      const container = el.closest("[data-chat-scroll]") as HTMLElement | null;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [messages, isRestoredHistory]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setIsRestoredHistory(false); // 发消息后取消「续上次」状态

    track(events.ASK_AI, {
      length: text.trim().length,
      round:  messages.length / 2,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          userId:  userIdRef.current,
        }),
      });

      const data = await res.json();
      setIsMock(data.isMock);
      setHasMemory(true);
      const finalMessages = [...newMessages, { role: "assistant", content: data.reply } as Message];
      setMessages(finalMessages);

      // 保存到 localStorage
      saveChatHistory(finalMessages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: Date.now(),
      })));
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "阿彌陀佛，網絡不通暢，請稍後再試。🙏" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* 「續上次對話」提示條 — 從歷史恢復時顯示 */}
      {isRestoredHistory && messages.length > 0 && (
        <div
          className="fade-in"
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            background: "rgba(229, 171, 40, 0.1)",
            border: "1px solid rgba(201, 138, 22, 0.2)",
            borderRadius: "0.5rem", fontSize: "0.8rem", color: "#a06810",
            fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
            marginBottom: "0.75rem",
          }}
        >
          <span>🕰️</span>
          <span>續上次對話{resumeDate ? `（${resumeDate}）` : ""} — 法師記得您之前說的話</span>
        </div>
      )}

      {/* 記憶提示（有過對話才顯示，且不是恢復狀態）*/}
      {hasMemory && !isRestoredHistory && (
        <div
          className="fade-in"
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.4rem 0.75rem",
            background: "rgba(229, 171, 40, 0.1)",
            borderRadius: "0.5rem", fontSize: "0.8rem", color: "#a06810",
            fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
            marginBottom: "0.75rem",
          }}
        >
          <span>🧠</span>
          <span>法師已記住您的情況，下次對話將延續關懷</span>
        </div>
      )}

      {/* 建議問題（首次顯示）*/}
      {messages.length === 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p style={{
            fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
            fontSize: "0.95rem", color: "#8a5a2f",
            marginBottom: "0.75rem", textAlign: "center",
          }}>
            🙏 您有什麼想請教的？
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                padding: "0.5rem 1rem",
                background: "rgba(249, 237, 204, 0.8)",
                border: "1px solid rgba(201, 138, 22, 0.35)",
                borderRadius: "9999px", fontSize: "0.95rem", color: "#7a4c10",
                fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
                cursor: "pointer", transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(229, 171, 40, 0.2)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(249, 237, 204, 0.8)"; }}
              >{q}</button>
            ))}
          </div>
        </div>
      )}

      {/* 對話列表 */}
      <div
        data-chat-scroll="true"
        style={{
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          paddingBottom: "0.5rem",
          maxHeight: "50vh",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className="fade-in"
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              gap: "0.5rem",
              alignItems: "flex-end",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #f9edcc, #e5ab28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.1rem",
                  flexShrink: 0,
                }}
              >
                ☸️
              </div>
            )}

            <div style={{ maxWidth: "78%" }}>
              <div
                className={msg.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>

              {msg.role === "assistant" && (
                <div style={{ marginTop: "0.5rem", paddingLeft: "0.25rem" }}>
                  <AudioPlayer
                    text={msg.content}
                    label="聆聽回答"
                    size="sm"
                    isStatic={false}
                    trackEvent={events.LISTEN_AI}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 加载动画 */}
        {isLoading && (
          <div className="fade-in" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f9edcc, #e5ab28)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.1rem",
              }}
            >
              ☸️
            </div>
            <div
              className="chat-bubble-ai"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                padding: "0.75rem 1rem",
              }}
            >
              <span style={{ color: "#c98a16", fontSize: "1.5rem", lineHeight: 1 }}>•</span>
              <span
                style={{ color: "#c98a16", fontSize: "1.5rem", lineHeight: 1, animationDelay: "0.2s" }}
                className="pulse-gold"
              >•</span>
              <span style={{ color: "#c98a16", fontSize: "1.5rem", lineHeight: 1, animationDelay: "0.4s" }}>•</span>
              <span style={{
                marginLeft: "0.5rem", fontSize: "0.9rem", color: "#8a5a2f",
                fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
              }}>
                法師正在思考…
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 模擬回答提示 */}
      {isMock && (
        <div style={{
          padding: "0.4rem 0.75rem", background: "rgba(249, 237, 204, 0.7)",
          borderRadius: "0.5rem", fontSize: "0.8rem", color: "#a06810",
          fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
          marginBottom: "0.75rem", textAlign: "center",
        }}>
          ℹ️ 目前使用示範回答，配置 MINIMAX_API_KEY 後可啟用完整 AI 功能
        </div>
      )}

      {/* 輸入區域 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="請說出您的煩惱或問題…"
          rows={2}
          className="zen-input"
          style={{ resize: "none", lineHeight: 1.7, fontSize: "1rem", width: "100%", boxSizing: "border-box" }}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="btn-gold"
          style={{ width: "100%", padding: "0.85rem 1rem", fontSize: "1.05rem", letterSpacing: "0.05em", boxSizing: "border-box" }}
        >
          {isLoading ? "⏳ 法師思考中…" : "🙏 問佛"}
        </button>

        {/* 清空歷史（有對話記錄時顯示）*/}
        {messages.length > 0 && (
          <button
            onClick={() => { clearChatHistory(); setMessages([]); setIsRestoredHistory(false); setHasMemory(false); }}
            disabled={isLoading}
            style={{
              width: "100%", padding: "0.5rem", background: "transparent",
              border: "1px solid rgba(201, 138, 22, 0.25)", borderRadius: "0.5rem",
              fontSize: "0.85rem", color: "#a06810",
              fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
              cursor: "pointer", opacity: 0.7,
            }}
          >
            🗑️ 清空對話記錄
          </button>
        )}
      </div>
    </div>
  );
}
