"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
}

export default function AudioPlayer({ text, label = "朗讀", size = "md" }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const sizeMap = {
    sm: { fontSize: "0.85rem", padding: "0.4rem 0.9rem", iconSize: "1rem" },
    md: { fontSize: "1rem",    padding: "0.6rem 1.2rem", iconSize: "1.1rem" },
    lg: { fontSize: "1.1rem",  padding: "0.75rem 1.5rem", iconSize: "1.25rem" },
  };
  const s = sizeMap[size];

  // 清理：組件卸載時停止播放
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const play = () => {
    if (!window.speechSynthesis) {
      alert("您的瀏覽器不支持語音功能，請使用 Chrome 或 Edge 瀏覽器。");
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang  = "zh-TW";
    utterance.rate  = 0.85;  // 語速稍慢，適合中老年
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // 嘗試選擇中文語音
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (v) => v.lang.startsWith("zh") && (v.name.includes("Female") || v.name.includes("Hsiao") || v.name.includes("Xiaoxiao"))
    ) || voices.find((v) => v.lang.startsWith("zh"));
    if (chineseVoice) utterance.voice = chineseVoice;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend   = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false); };
    utterance.onpause = () => { setIsPlaying(false); setIsPaused(true);  };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const pause = () => {
    window.speechSynthesis?.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const stop = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* 播放/暫停按鈕 */}
      <button
        onClick={isPlaying ? pause : play}
        className={isPlaying ? "pulse-gold" : ""}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: s.padding,
          fontSize: s.fontSize,
          background: isPlaying
            ? "linear-gradient(to bottom, #c98a16, #a06810)"
            : "linear-gradient(to bottom, #e5ab28, #c98a16)",
          color: "white",
          border: "none",
          borderRadius: "9999px",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: "0 4px 12px rgba(201, 138, 22, 0.3)",
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 500,
          minWidth: "80px",
        }}
        title={isPlaying ? "暫停" : isPaused ? "繼續" : label}
      >
        <span style={{ fontSize: s.iconSize }}>
          {isPlaying ? "⏸️" : isPaused ? "▶️" : "🔊"}
        </span>
        <span>{isPlaying ? "暫停" : isPaused ? "繼續" : label}</span>
      </button>

      {/* 停止按鈕（播放或暫停時顯示） */}
      {(isPlaying || isPaused) && (
        <button
          onClick={stop}
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: s.fontSize,
            background: "rgba(44, 24, 16, 0.08)",
            color: "#5c3d2e",
            border: "1px solid rgba(44, 24, 16, 0.15)",
            borderRadius: "9999px",
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "'Noto Sans SC', sans-serif",
          }}
          title="停止"
        >
          ⏹️
        </button>
      )}
    </div>
  );
}
