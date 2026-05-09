"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  voiceId?: string;
  /** isStatic=true：固定內容（金句/佛經/早晚課），服務端永久緩存，節省 token */
  isStatic?: boolean;
}

export default function AudioPlayer({
  text,
  label    = "朗讀",
  size     = "md",
  voiceId  = "Wise_Woman",
  isStatic = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 客戶端內存緩存：同一組件內二次點擊無需重新請求
  const audioBlobUrl = useRef<string | null>(null);
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
      if (audioBlobUrl.current) URL.revokeObjectURL(audioBlobUrl.current);
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

    try {
      // 客戶端已有緩存的 blob URL → 直接重用，0 網絡請求
      let blobUrl = audioBlobUrl.current;

      if (!blobUrl) {
        const res = await fetch("/api/tts", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice_id: voiceId,
            isStatic,   // 告知服務端是否永久緩存
          }),
        });

        const contentType = res.headers.get("Content-Type") ?? "";

        // 服務端返回 JSON → fallback
        if (!res.ok || contentType.includes("application/json")) {
          setIsLoading(false);
          playWithBrowser();
          return;
        }

        const blob = await res.blob();
        blobUrl    = URL.createObjectURL(blob);
        // 固定內容：客戶端也緩存，頁面生命週期內不再重複請求
        if (isStatic) audioBlobUrl.current = blobUrl;
      }

      const audio          = new Audio(blobUrl);
      audioEl.current      = audio;
      audio.onplay   = () => { setIsPlaying(true);  setIsLoading(false); };
      audio.onpause  = () => { setIsPlaying(false); setIsPaused(true);   };
      audio.onended  = () => { setIsPlaying(false); setIsPaused(false);  };
      audio.onerror  = () => {
        setIsPlaying(false); setIsPaused(false); setIsLoading(false);
        playWithBrowser();
      };
      await audio.play();

    } catch (err) {
      console.error("TTS play error:", err);
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

  const btnLabel = isLoading ? "生成中…" : isPlaying ? "暫停" : isPaused ? "繼續" : label;
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
