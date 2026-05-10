"use client";

import { useState, useRef, useEffect } from "react";
import { track, EventName } from "@/lib/analytics";

interface AudioPlayerProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  voiceId?: string;
  /**
   * isStatic=true：固定內容（金句/佛經/早晚課）
   * 優先級：audioUrl > /api/tts > 瀏覽器降級
   */
  isStatic?: boolean;
  /**
   * 直接傳入 R2 CDN URL，完全繞過 API，零延遲零 token
   * 由頁面層根據 R2_PUBLIC_URL 拼接後傳入
   */
  audioUrl?: string | null;
  /** 埋點事件名稱，用於追蹤用戶點擊了哪類朗讀 */
  trackEvent?: EventName;
  /** 埋點附帶屬性 */
  trackProps?: Record<string, string | number | boolean | null>;
}

export default function AudioPlayer({
  text,
  label      = "朗讀",
  size       = "md",
  voiceId    = "female-shaonv",
  isStatic   = false,
  audioUrl   = null,
  trackEvent,
  trackProps,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 客戶端 blob URL 緩存（頁面生命週期內）
  const blobUrlCache = useRef<string | null>(null);
  const audioEl      = useRef<HTMLAudioElement | null>(null);

  const sizeMap = {
    sm: { fontSize: "0.85rem", padding: "0.4rem 0.9rem",  iconSize: "1rem"    },
    md: { fontSize: "1rem",    padding: "0.6rem 1.2rem",  iconSize: "1.1rem"  },
    lg: { fontSize: "1.1rem",  padding: "0.75rem 1.5rem", iconSize: "1.25rem" },
  };
  const s = sizeMap[size];

  useEffect(() => {
    return () => {
      audioEl.current?.pause();
      if (blobUrlCache.current) URL.revokeObjectURL(blobUrlCache.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ── 降級：瀏覽器內建語音 ────────────────────────────────────────
  const playWithBrowser = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u    = new SpeechSynthesisUtterance(text);
    u.lang     = "zh-TW";
    u.rate     = 0.85;
    u.pitch    = 1.0;
    u.volume   = 1.0;
    const vs   = window.speechSynthesis.getVoices();
    const best = vs.find((v) =>
      v.lang.startsWith("zh") &&
      (v.name.includes("Female") || v.name.includes("Hsiao") || v.name.includes("Xiaoxiao"))
    ) ?? vs.find((v) => v.lang.startsWith("zh"));
    if (best) u.voice = best;
    u.onstart = () => { setIsPlaying(true);  setIsLoading(false); };
    u.onend   = () => { setIsPlaying(false); setIsPaused(false);  };
    u.onerror = () => { setIsPlaying(false); setIsPaused(false);  setIsLoading(false); };
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
  };

  // ── 播放一個 URL（R2 CDN 或 blob）──────────────────────────────
  const playUrl = async (src: string) => {
    const audio          = new Audio(src);
    audioEl.current      = audio;
    audio.onplay   = () => { setIsPlaying(true);  setIsLoading(false); };
    audio.onpause  = () => { setIsPlaying(false); setIsPaused(true);   };
    audio.onended  = () => { setIsPlaying(false); setIsPaused(false);  };
    audio.onerror  = () => {
      setIsPlaying(false); setIsPaused(false); setIsLoading(false);
      playWithBrowser();
    };
    await audio.play();
  };

  // ── 主播放邏輯 ───────────────────────────────────────────────────
  const play = async () => {
    if (isLoading) return;

    // 繼續暫停中的音頻
    if (isPaused && audioEl.current) {
      audioEl.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    stopAll();
    setIsLoading(true);

    // 上報埋點（僅在用戶主動觸發時）
    if (trackEvent) {
      track(trackEvent, { ...(trackProps ?? {}), source: audioUrl ? "cdn" : "api" });
    }

    try {
      // ① 最優先：直接播放 R2 CDN URL（零延遲、零 token）
      if (audioUrl) {
        await playUrl(audioUrl);
        return;
      }

      // ② 客戶端已緩存 blob → 直接重用（0 網絡請求）
      if (blobUrlCache.current) {
        await playUrl(blobUrlCache.current);
        return;
      }

      // ③ 調用 /api/tts（服務端緩存 or 實時生成）
      const res = await fetch("/api/tts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: voiceId, isStatic }),
      });

      const contentType = res.headers.get("Content-Type") ?? "";
      if (!res.ok || contentType.includes("application/json")) {
        // 服務端 fallback 指令 or 錯誤 → 瀏覽器降級
        setIsLoading(false);
        playWithBrowser();
        return;
      }

      const blob   = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      if (isStatic) blobUrlCache.current = blobUrl; // 固定內容客戶端緩存
      await playUrl(blobUrl);

    } catch (err) {
      console.error("AudioPlayer error:", err);
      setIsLoading(false);
      playWithBrowser();
    }
  };

  const pause = () => {
    audioEl.current ? audioEl.current.pause() : window.speechSynthesis?.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const stopAll = () => {
    audioEl.current?.pause();
    audioEl.current = null;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const btnLabel = isLoading ? "載入中…" : isPlaying ? "暫停" : isPaused ? "繼續" : label;
  const btnIcon  = isLoading ? "⏳"      : isPlaying ? "⏸️"  : isPaused ? "▶️"  : "🔊";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <button
        onClick={isPlaying ? pause : play}
        disabled={isLoading}
        className={isPlaying ? "pulse-gold" : ""}
        style={{
          display:      "flex",
          alignItems:   "center",
          gap:          "0.35rem",
          padding:      s.padding,
          fontSize:     s.fontSize,
          background:   isPlaying
            ? "linear-gradient(to bottom, #c98a16, #a06810)"
            : "linear-gradient(to bottom, #e5ab28, #c98a16)",
          color:        "white",
          border:       "none",
          borderRadius: "9999px",
          cursor:       isLoading ? "wait" : "pointer",
          transition:   "all 0.2s",
          boxShadow:    "0 4px 12px rgba(201, 138, 22, 0.3)",
          fontFamily:   "'Noto Sans SC', sans-serif",
          fontWeight:   500,
          minWidth:     "88px",
          opacity:      isLoading ? 0.75 : 1,
        }}
        title={btnLabel}
      >
        <span style={{ fontSize: s.iconSize }}>{btnIcon}</span>
        <span>{btnLabel}</span>
      </button>

      {(isPlaying || isPaused) && (
        <button
          onClick={stopAll}
          style={{
            padding:      "0.5rem 0.75rem",
            fontSize:     s.fontSize,
            background:   "rgba(44, 24, 16, 0.08)",
            color:        "#5c3d2e",
            border:       "1px solid rgba(44, 24, 16, 0.15)",
            borderRadius: "9999px",
            cursor:       "pointer",
            transition:   "all 0.2s",
            fontFamily:   "'Noto Sans SC', sans-serif",
          }}
          title="停止"
        >
          ⏹️
        </button>
      )}
    </div>
  );
}
