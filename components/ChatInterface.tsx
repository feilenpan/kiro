"use client";

import { useState, useRef, useEffect } from "react";
import AudioPlayer from "./AudioPlayer";
import { track, events } from "@/lib/analytics";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "我最近很焦虑，怎么办？",
  "如何让心静下来？",
  "《心经》是什么意思？",
  "失眠应该如何调整？",
  "如何与家人和睦相处？",
  "什么是念佛？",
];

export default function ChatInterface() {
  const [messages,    setMessages]    = useState<Message[]>([]);
  const [input,       setInput]       = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [isMock,      setIsMock]      = useState(false);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLTextAreaElement>(null);

  // 自動滾動到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // 埋點：用戶發起 AI 問佛（核心價值指標）
    track(events.ASK_AI, {
      length:  text.trim().length,
      round:   messages.length / 2, // 第幾輪對話
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      setIsMock(data.isMock);
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "阿弥陀佛，网络不通畅，请稍后再试。🙏" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* 建議問題（首次顯示） */}
      {messages.length === 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "0.95rem",
              color: "#8a5a2f",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            🙏 您有什么想请教的？
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              justifyContent: "center",
            }}
          >
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "rgba(249, 237, 204, 0.8)",
                  border: "1px solid rgba(201, 138, 22, 0.35)",
                  borderRadius: "9999px",
                  fontSize: "0.95rem",
                  color: "#7a4c10",
                  fontFamily: "'Noto Sans SC', sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(229, 171, 40, 0.2)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(249, 237, 204, 0.8)";
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 對話列表 */}
      <div
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
            {/* AI 頭像 */}
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

              {/* AI 回答底部：語音播放（動態內容，不永久緩存） */}
              {msg.role === "assistant" && (
                <div style={{ marginTop: "0.5rem", paddingLeft: "0.25rem" }}>
                  <AudioPlayer
                    text={msg.content}
                    label="聆听回答"
                    size="sm"
                    isStatic={false}
                    trackEvent={events.LISTEN_AI}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 載入動畫 */}
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
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.9rem",
                  color: "#8a5a2f",
                  fontFamily: "'Noto Sans SC', sans-serif",
                }}
              >
                法师正在思考…
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 模擬回答提示 */}
      {isMock && (
        <div
          style={{
            padding: "0.4rem 0.75rem",
            background: "rgba(249, 237, 204, 0.7)",
            borderRadius: "0.5rem",
            fontSize: "0.8rem",
            color: "#a06810",
            fontFamily: "'Noto Sans SC', sans-serif",
            marginBottom: "0.75rem",
            textAlign: "center",
          }}
        >
          ℹ️ 目前使用示范回答，配置 MINIMAX_API_KEY 后可启用完整 AI 功能
        </div>
      )}

      {/* 輸入區域 — 手機垂直排列 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="请说出您的烦恼或问题…"
          rows={2}
          className="zen-input"
          style={{
            resize: "none",
            lineHeight: 1.7,
            fontSize: "1rem",
            width: "100%",
            boxSizing: "border-box",
          }}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isLoading}
          className="btn-gold"
          style={{
            width: "100%",
            padding: "0.85rem 1rem",
            fontSize: "1.05rem",
            letterSpacing: "0.05em",
            boxSizing: "border-box",
          }}
        >
          {isLoading ? "⏳ 法师思考中…" : "🙏 问佛"}
        </button>
      </div>
    </div>
  );
}
