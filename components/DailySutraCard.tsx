"use client";

import { useState } from "react";
import AudioPlayer from "./AudioPlayer";
import { DailySutra } from "@/lib/sutras";
import { track, events } from "@/lib/analytics";

interface DailySutraCardProps {
  sutra: DailySutra;
  /** 由 Server Component 傳入的 R2 CDN URL，null 表示 R2 未配置 */
  audioUrl?: string | null;
}

export default function DailySutraCard({ sutra, audioUrl }: DailySutraCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);

  const readText = `${sutra.text}。摘自${sutra.source}。${sutra.explanation}`;

  return (
    <div
      className="zen-card"
      style={{ padding: "2rem", textAlign: "center", position: "relative", overflow: "hidden" }}
    >
      {/* 背景裝飾 */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute", top: "-20px", right: "-20px",
          fontSize: "8rem", opacity: 0.04, fontFamily: "serif",
          lineHeight: 1, userSelect: "none", pointerEvents: "none",
        }}
      >
        佛
      </div>

      {/* 標題徽章 */}
      <div style={{ marginBottom: "1.25rem" }}>
        <span style={{
          display: "inline-block", padding: "0.25rem 0.9rem",
          background: "linear-gradient(135deg, #f9edcc, #f3d88a)",
          borderRadius: "9999px", fontSize: "0.85rem", color: "#a06810",
          fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500, letterSpacing: "0.05em",
        }}>
          ☀️ 今日金句
        </span>
      </div>

      {/* 金句正文 */}
      <blockquote style={{
        fontFamily: "'Noto Serif SC', serif", fontSize: "1.25rem",
        lineHeight: 2, color: "#2c1810", margin: "0 0 1rem 0", fontWeight: 500,
      }}>
        「{sutra.text}」
      </blockquote>

      {/* 出處 */}
      <p style={{
        fontSize: "0.9rem", color: "#a06810",
        fontFamily: "'Noto Sans SC', sans-serif", marginBottom: "1.5rem",
      }}>
        —— {sutra.source}
      </p>

      <div className="lotus-divider">
        <span style={{ color: "#e5ab28", fontSize: "1rem" }}>🪷</span>
      </div>

      {/* 按鈕行 */}
      <div style={{
        display: "flex", justifyContent: "center", gap: "0.75rem",
        flexWrap: "wrap", marginBottom: showExplanation ? "1.25rem" : "0",
      }}>
        {/* audioUrl 有值 → 直接 CDN 播放（零延遲）；null → 降級走 API */}
        <AudioPlayer
          text={readText}
          label="聆聽"
          size="md"
          isStatic={true}
          audioUrl={audioUrl}
          trackEvent={events.LISTEN_DAILY}
          trackProps={{ sutraId: sutra.id }}
        />
        <button
          onClick={() => {
            setShowExplanation(!showExplanation);
            if (!showExplanation) track(events.VIEW_DAILY, { sutraId: sutra.id, action: "expand" });
          }}
          className="btn-outline"
          style={{ minWidth: "80px" }}
        >
          {showExplanation ? "收起" : "📖 解讀"}
        </button>
      </div>

      {/* 白話解釋 */}
      {showExplanation && (
        <div className="fade-in" style={{
          background: "rgba(249, 237, 204, 0.5)", borderRadius: "0.75rem",
          padding: "1rem 1.25rem", textAlign: "left",
        }}>
          <p style={{
            fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem",
            lineHeight: 1.8, color: "#5c3d2e", margin: 0,
          }}>
            💡 {sutra.explanation}
          </p>
        </div>
      )}
    </div>
  );
}
