"use client";

import { useState, useRef, useEffect } from "react";
import { track, EventName } from "@/lib/analytics";
import { useLocale } from "./LocaleProvider";

interface AudioPlayerProps {
  text: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  voiceId?: string;       // 明確指定聲線；不傳則根據粵語設定自動選
  isStatic?: boolean;
  audioUrl?: string | null;
  trackEvent?: EventName;
  trackProps?: Record<string, string | number | boolean | null>;
}

export default function AudioPlayer({
  text,
  label      = "朗讀",
  size       = "md",
  voiceId,
  isStatic   = false,
  audioUrl   = null,
  trackEvent,
  trackProps,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused,  setIsPaused]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 粵語設定從全局 Context 讀取
  const { cantonese } = useLocale();

  const blobUrlCache  = useRef<string | null>(null);
  const audioEl       = useRef<HTMLAudioElement | null>(null);
  const prevCantonese = useRef(cantonese);

  // 語言切換時清除舊緩存、停止播放
  useEffect(() => {
    if (prevCantonese.current !== cantonese) {
      stopAll();
      if (blobUrlCache.current) {
        URL.revokeObjectURL(blobUrlCache.current);
        blobUrlCache.current = null;
      }
      prevCantonese.current = cantonese;
    }
  }, [cantonese]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      audioEl.current?.pause();
      if (blobUrlCache.current) URL.revokeObjectURL(blobUrlCache.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const sizeMap = {
    sm: { fontSize: "0.85rem", padding: "0.4rem 0.9rem",  iconSize: "1rem"    },
    md: { fontSize: "1rem",    padding: "0.6rem 1.2rem",  iconSize: "1.1rem"  },
    lg: { fontSize: "1.1rem",  padding: "0.75rem 1.5rem", iconSize: "1.25rem" },
  };
  const s = sizeMap[size];

  // ── 降級：瀏覽器內建語音 ─────────────────────────────────────────
  const playWithBrowser = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // 粵語模式用 zh-HK，普通話用 zh-TW
    u.lang   = cantonese ? "zh-HK" : "zh-TW";
    u.rate   = 0.85;
    u.pitch  = 1.0;
    u.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const best = cantonese
      ? (voices.find(v => v.lang === "zh-HK") ?? voices.find(v => v.lang.startsWith("zh")))
      : (voices.find(v => v.lang === "zh-TW") ?? voices.find(v => v.lang.startsWith("zh")));
    if (best) u.voice = best;
    u.onstart = () => { setIsPlaying(true);  setIsLoading(false); };
    u.onend   = () => { setIsPlaying(false); setIsPaused(false);  };
    u.onerror = () => { setIsPlaying(false); setIsPaused(false);  setIsLoading(false); };
    window.speechSynthesis.speak(u);
    setIsPlaying(true);
  };

  const playUrl = async (src: string) => {
    const audio     = new Audio(src);
    audioEl.current = audio;
    audio.onplay  = () => { setIsPlaying(true);  setIsLoading(false); };
    audio.onpause = () => { setIsPlaying(false); setIsPaused(true);   };
    audio.onended = () => { setIsPlaying(false); setIsPaused(false);  };
    audio.onerror = () => {
      setIsPlaying(false); setIsPaused(false); setIsLoading(false);
      playWithBrowser();
    };
    await audio.play();
  };

  const play = async () => {
    if (isLoading) return;

    if (isPaused && audioEl.current) {
      audioEl.current.play();
      setIsPlaying(true); setIsPaused(false);
      return;
    }

    stopAll();
    setIsLoading(true);

    if (trackEvent) {
      track(trackEvent, {
        ...(trackProps ?? {}),
        source: audioUrl ? "cdn" : "api",
        lang: cantonese ? "yue" : "zh",
      });
    }

    try {
      // ① R2 CDN：粵語模式時跳過（CDN 存的是普通話版本）
      if (audioUrl && !cantonese) {
        await playUrl(audioUrl);
        return;
      }

      // ② 客戶端 blob 緩存（同語言才復用）
      if (blobUrlCache.current) {
        await playUrl(blobUrlCache.current);
        return;
      }

      // ③ 調用 /api/tts，傳入語言和聲線
      const res = await fetch("/api/tts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          lang:     cantonese ? "yue" : "zh",
          voice_id: voiceId ?? undefined,   // undefined → 後端按語言選預設
          isStatic: isStatic && !cantonese, // 粵語不緩存（固定音頻是普通話）
        }),
      });

      const contentType = res.headers.get("Content-Type") ?? "";
      if (!res.ok || contentType.includes("application/json")) {
        setIsLoading(false);
        playWithBrowser();
        return;
      }

      const blob    = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      // 靜態內容且是普通話才長期緩存（粵語每次都重新合成）
      if (isStatic && !cantonese) blobUrlCache.current = blobUrl;
      await playUrl(blobUrl);

    } catch (err) {
      console.error("AudioPlayer error:", err);
      setIsLoading(false);
      playWithBrowser();
    }
  };

  const pause = () => {
    audioEl.current ? audioEl.current.pause() : window.speechSynthesis?.pause();
    setIsPlaying(false); setIsPaused(true);
  };

  const stopAll = () => {
    audioEl.current?.pause();
    audioEl.current = null;
    window.speechSynthesis?.cancel();
    setIsPlaying(false); setIsPaused(false);
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
          display: "flex", alignItems: "center", gap: "0.35rem",
          padding: s.padding, fontSize: s.fontSize,
          background: isPlaying
            ? "linear-gradient(to bottom, #c98a16, #a06810)"
            : "linear-gradient(to bottom, #e5ab28, #c98a16)",
          color: "white", border: "none", borderRadius: "9999px",
          cursor: isLoading ? "wait" : "pointer", transition: "all 0.2s",
          boxShadow: "0 4px 12px rgba(201, 138, 22, 0.3)",
          fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
          fontWeight: 500, minWidth: "88px", opacity: isLoading ? 0.75 : 1,
        }}
        title={btnLabel}
      >
        <span style={{ fontSize: s.iconSize }}>{btnIcon}</span>
        <span>{btnLabel}</span>
      </button>

      {(isPlaying || isPaused) && (
        <button onClick={stopAll} style={{
          padding: "0.5rem 0.75rem", fontSize: s.fontSize,
          background: "rgba(44, 24, 16, 0.08)", color: "#5c3d2e",
          border: "1px solid rgba(44, 24, 16, 0.15)", borderRadius: "9999px",
          cursor: "pointer", transition: "all 0.2s",
          fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
        }} title="停止">⏹️</button>
      )}
    </div>
  );
}
