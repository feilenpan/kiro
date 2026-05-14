"use client";

import { useState, useRef, useEffect } from "react";
import AudioPlayer from "./AudioPlayer";
import { track, events } from "@/lib/analytics";
import {
  getDeviceId,
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

export default function ChatInterface() {
  const [messages,          setMessages]          = useState<Message[]>([]);
  const [input,             setInput]             = useState("");
  const [isLoading,         setIsLoading]         = useState(false);
  const [isMock,            setIsMock]            = useState(false);
  const [deviceId,          setDeviceId]          = useState<string>("");
  const [isRestoredHistory, setIsRestoredHistory] = useState(false);
  const [resumeDate,        setResumeDate]        = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // 初始化：读取设备ID + 加载本地历史记录
  useEffect(() => {
    const id = getDeviceId();
    setDeviceId(id);

    const stored = loadChatHistory();
    if (stored.length > 0) {
      setMessages(
        stored.map((m: StoredMessage) => ({ role: m.role, content: m.content }))
      );
      setIsRestoredHistory(true);

      // 取最后一条消息的时间戳，格式化为易读字符串
      const last = stored[stored.length - 1];
      if (last.timestamp) {
        const d = new Date(last.timestamp);
        const now = new Date();
        const isToday =
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate();
        const isYesterday =
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate() - 1;
        if (isToday) {
          setResumeDate(`今天 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
        } else if (isYesterday) {
          setResumeDate("昨天");
        } else {
          setResumeDate(`${d.getMonth() + 1}月${d.getDate()}日`);
        }
      }
    }
  }, []);

  // 有历史恢复时，自动滚到最底部
  useEffect(() => {
    if (isRestoredHistory && messages.length > 0) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }, 50);
    }
  }, [isRestoredHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  // 每次新消息也滾動到底部
  useEffect(() => {
    if (!isRestoredHistory) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isRestoredHistory]);

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
      round:   messages.length / 2,
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          deviceId,
        }),
      });

      const data = await res.json();
      setIsMock(data.isMock);
      const assistantMessage: Message = { role: "assistant", content: data.reply };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);

      // 保存到 localStorage（含时间戳）
      saveChatHistory(
        finalMessages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: Date.now(),
        }))
      );
      // 新消息发出后取消"续上次"状态
      setIsRestoredHistory(false);
    } catch {
      const errorMessage: Message = {
        role: "assistant",
        content: "阿彌陀佛，網絡不通暢，請稍後再試。🙏",
      };
      setMessages([...newMessages, errorMessage]);
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
          {/* 固定歡迎語，替代 AI 自我介紹，避免模型輸出「貧僧」 */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "flex-end",
              marginBottom: "1.25rem",
            }}
          >
            <div
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "linear-gradient(135deg, #f9edcc, #e5ab28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.1rem", flexShrink: 0,
              }}
            >
              ☸️
            </div>
            <div
              className="chat-bubble-ai"
              style={{ whiteSpace: "pre-wrap", maxWidth: "78%" }}
            >
              {`阿彌陀佛，歡迎來到「佛說」。

我是這裡的佛法助手，願以佛法智慧陪伴您。無論是人生煩惱、修行疑問，還是經文解讀，都可以告訴我。

願您心得清涼，吉祥如意。🙏`}
            </div>
          </div>
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "0.95rem",
              color: "#8a5a2f",
              marginBottom: "0.75rem",
              textAlign: "center",
            }}
          >
            🙏 您有什麼想請教的？
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
        {/* 「续上次对话」提示条 */}
        {isRestoredHistory && messages.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              background: "rgba(249, 237, 204, 0.6)",
              border: "1px solid rgba(201, 138, 22, 0.2)",
              borderRadius: "0.75rem",
              fontSize: "0.82rem",
              color: "#8a5a2f",
              fontFamily: "'Noto Sans SC', sans-serif",
            }}
          >
            <span style={{ fontSize: "1rem" }}>🕰️</span>
            <span>
              續上次對話
              {resumeDate ? `（${resumeDate}）` : ""}
              — 法師記得您之前說的話
            </span>
          </div>
        )}

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

              {/* AI 回答底部：語音播放 */}
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
                法師正在思考…
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
          ℹ️ 目前使用示範回答，配置 MINIMAX_API_KEY 後可啟用完整 AI 功能
        </div>
      )}

      {/* 輸入區域 — 手機垂直排列 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.75rem" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="請說出您的煩惱或問題…"
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
          {isLoading ? "⏳ 法師思考中…" : "🙏 問佛"}
        </button>

        {/* 清空歷史按鈕（有對話記錄時才顯示） */}
        {messages.length > 0 && (
          <button
            onClick={() => {
              clearChatHistory();
              setMessages([]);
              setIsRestoredHistory(false);
            }}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "0.5rem",
              background: "transparent",
              border: "1px solid rgba(201, 138, 22, 0.25)",
              borderRadius: "0.5rem",
              fontSize: "0.85rem",
              color: "#a06810",
              fontFamily: "'Noto Sans SC', sans-serif",
              cursor: "pointer",
              opacity: 0.7,
            }}
          >
            🗑️ 清空對話記錄
          </button>
        )}
      </div>
    </div>
  );
}
