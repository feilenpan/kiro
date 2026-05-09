"use client";

import { useEffect, useState } from "react";
import { track, events } from "@/lib/analytics";

// beforeinstallprompt 事件類型（TS 尚未內建）
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISSED_KEY = "foshuo_pwa_dismissed_at";
const DISMISS_DAYS  = 7; // 關閉後 7 天內不再提示

/**
 * PWA 安裝提示 — 友善地引導中老年用戶「添加到桌面」
 *
 * 邏輯：
 *   - Android/桌面 Chrome：捕獲 beforeinstallprompt，顯示安裝按鈕
 *   - iOS Safari：顯示手動引導（因為 iOS 不支持 API）
 *   - 用戶關閉後 7 天內不再顯示
 */
export default function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [show,         setShow]         = useState(false);
  const [isIOS,        setIsIOS]        = useState(false);

  useEffect(() => {
    // 是否最近關閉過
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DAYS * 86400000) {
      return;
    }

    // 是否已安裝（standalone 模式）
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // iOS 判斷
    const ua  = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !/crios|fxios/.test(ua);
    if (ios) {
      setIsIOS(true);
      // iOS 延遲 8 秒顯示，避免剛打開就彈
      const t = setTimeout(() => { setShow(true); track(events.PWA_PROMPT, { platform: "ios" }); }, 8000);
      return () => clearTimeout(t);
    }

    // Android / 桌面 Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setShow(true);
      track(events.PWA_PROMPT, { platform: "android" });
    };
    window.addEventListener("beforeinstallprompt", handler);

    // 安裝完成
    const installedHandler = () => {
      track(events.PWA_INSTALLED);
      setShow(false);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      track(events.PWA_INSTALLED);
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="fade-in"
      style={{
        position:     "fixed",
        bottom:       "1rem",
        left:         "50%",
        transform:    "translateX(-50%)",
        width:        "calc(100% - 2rem)",
        maxWidth:     "420px",
        background:   "linear-gradient(135deg, #fdf8ec, #f3d88a)",
        border:       "1px solid rgba(201,138,22,0.4)",
        borderRadius: "1rem",
        padding:      "1rem 1.25rem",
        boxShadow:    "0 8px 24px rgba(44,24,16,0.15)",
        zIndex:       100,
        fontFamily:   "'Noto Sans SC', sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "1.75rem" }}>📿</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", fontWeight: 600, color: "#2c1810" }}>
            添加到桌面
          </div>
          <div style={{ fontSize: "0.85rem", color: "#7a4c10", marginTop: "0.15rem" }}>
            像 App 一樣使用「佛說」，打開更方便
          </div>
        </div>
      </div>

      {isIOS ? (
        <div style={{
          fontSize:    "0.85rem", color: "#5c3d2e", lineHeight: 1.7,
          background:  "rgba(255,255,255,0.6)",
          padding:     "0.6rem 0.8rem", borderRadius: "0.5rem", marginBottom: "0.6rem",
        }}>
          1. 點擊底部 <span style={{ fontSize: "1.1rem" }}>⬆️</span> 分享按鈕<br/>
          2. 選擇「加入主畫面」
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
        <button
          onClick={dismiss}
          style={{
            padding:     "0.4rem 0.9rem",
            fontSize:    "0.9rem",
            background:  "transparent",
            border:      "1px solid rgba(44,24,16,0.2)",
            borderRadius:"9999px",
            color:       "#5c3d2e",
            cursor:      "pointer",
            fontFamily:  "'Noto Sans SC', sans-serif",
          }}
        >
          暫不
        </button>
        {!isIOS && (
          <button onClick={install} className="btn-gold" style={{ padding: "0.4rem 1.1rem", fontSize: "0.9rem" }}>
            立即添加
          </button>
        )}
      </div>
    </div>
  );
}
