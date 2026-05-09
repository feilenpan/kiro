"use client";

import { useState, useRef, useEffect } from "react";

interface AudioPlayerProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  voiceId?: string;
}

export default function AudioPlayer({
  text,
  label   = "朗讀",
  size    = "md",
  voiceId = "Wise_Woman",
}: AudioPlayerProps) {
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [isPaused,   setIsPaused]   = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);

  const audioRef    = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<string | null>(null);   // Object URL 緩存

  const sizeMap = {
    sm: { fontSize: "0.85rem", padding: "0.4rem 0.9rem",  iconSize: "1rem"   },
    md: { fontSize: "1rem",    padding: "0.6rem 1.2rem",  iconSize: "1.1rem" },
    lg: { fontSize: "1.1rem",  padding: "0.75rem 1.5rem", iconSize: "1.25rem"},
  };
  const s = sizeMap[size];

  // 清理：卸載時釋放資源
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ── 瀏覽器原生語音（Fallback） ── */
  const playWithBrowser = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance  = new SpeechSynthesisUtterance(text);
    utterance.lang   = "zh-TW";
    utterance.rate   = 0.85;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    const voices       = window.speechSynthesis.getVoices();
    const chineseVoice =
      voices.find((v) => v.lang.startsWith("zh") &&
        (v.name.includes("Female") || v.name.includes("Hsiao") || v.name.includes("Xiaoxiao"))) ||
      voices.find((v) => v.lang.startsWith("zh"));
    if (chineseVoice) utterance.voice = chineseVoice;

    utterance.onstart = () => { setIsPlaying(true);  setIsLoading(false); };
    utterance.onend   = () => { setIsPlaying(false); setIsPaused(false);  };
    utterance.onerror = () => { setIsPlaying(false); setIsPaused(false);  setIsLoading(false); };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  /* ── MiniMax TTS 播放 ── */
  const play = async () => {
    if (isLoading) return;

    // 若已暫停，繼續播放
    if (isPaused && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // 停掉之前的
    stopAll();
    setIsLoading(true);

    try {
      const res = await fetch("/api/tts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text, voice_id: voiceId }),
      });

      // fallback：使用瀏覽器語音
      if (!res.ok || res.headers.get("Content-Type")?.includes("application/json")) {
        setIsLoading(false);
        playWithBrowser();
        return;
      }

      const blob     = await res.blob();
      const blobUrl  = URL.createObjectURL(blob);
      if (audioBlobRef.current) URL.revokeObjectURL(audioBlobRef.current);
      audioBlobRef.current = blobUrl;

      const audio = new Audio(blobUrl);
      audioRef.current = audio;

      audio.onplay   = () => { setIsPlaying(true);  setIsLoading(false); };
      audio.onpause  = () => { setIsPlaying(false); setIsPaused(true);   };
      audio.onended  = () => { setIsPlaying(false); setIsPaused(false);  };
      audio.onerror  = () => {
        setIsPlaying(false); setIsPaused(false); setIsLoading(false);
        playWithBrowser();   // 出錯時降級
      };

      await audio.play();

    } catch (err) {
      console.error("TTS play error:", err);
      setIsLoading(false);
      playWithBrowser();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else {
      window.speechSynthesis?.pause();
    }
    setIsPlaying(false);
    setIsPaused(true);
  };

  const stopAll = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  const btnLabel = isLoading ? "生成中…" : isPlaying ? "暫停" : isPaused ? "繼續" : label;
  const btnIcon  = isLoading ? "⏳" : isPlaying ? "⏸️" : isPaused ? "▶️" : "🔊";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      {/* 主按鈕 */}
      <button
        onClick={isPlaying ? pause : play}
        disabled={isLoading}
        className={isPlaying ? "pulse-gold" : ""}
        style={{
          display:     "flex",
          alignItems:  "center",
          gap:         "0.35rem",
          padding:     s.padding,
          fontSize:    s.fontSize,
          background:  isPlaying
            ? "linear-gradient(to bottom, #c98a16, #a06810)"
            : "linear-gradient(to bottom, #e5ab28, #c98a16)",
          color:       "white",
          border:      "none",
          borderRadius:"9999px",
          cursor:      isLoading ? "wait" : "pointer",
          transition:  "all 0.2s",
          boxShadow:   "0 4px 12px rgba(201, 138, 22, 0.3)",
          fontFamily:  "'Noto Sans SC', sans-serif",
          fontWeight:  500,
          minWidth:    "88px",
          opacity:     isLoading ? 0.75 : 1,
        }}
        title={btnLabel}
      >
        <span style={{ fontSize: s.iconSize }}>{btnIcon}</span>
        <span>{btnLabel}</span>
      </button>

      {/* 停止按鈕 */}
      {(isPlaying || isPaused) && (
        <button
          onClick={stopAll}
          style={{
            padding:     "0.5rem 0.75rem",
            fontSize:    s.fontSize,
            background:  "rgba(44, 24, 16, 0.08)",
            color:       "#5c3d2e",
            border:      "1px solid rgba(44, 24, 16, 0.15)",
            borderRadius:"9999px",
            cursor:      "pointer",
            transition:  "all 0.2s",
            fontFamily:  "'Noto Sans SC', sans-serif",
          }}
          title="停止"
        >
          ⏹️
        </button>
      )}
    </div>
  );
}
