"use client";

/**
 * LocaleProvider — 繁簡字體自動切換
 *
 * 在 <body> 上動態加載 SC 或 TC 字體，並更新 CSS 變量
 * 子組件通過 useLocale() 獲取當前狀態和切換函數
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  type FontVariant,
  detectFontVariant,
  saveFontVariant,
  getFontsUrl,
  getSerifFont,
  getSansFont,
} from "@/lib/locale";

interface LocaleCtx {
  variant: FontVariant;
  toggle: () => void;
}

const LocaleContext = createContext<LocaleCtx>({
  variant: "SC",
  toggle: () => {},
});

export function useLocale(): LocaleCtx {
  return useContext(LocaleContext);
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<FontVariant>("SC");
  const [mounted, setMounted] = useState(false);

  // 客戶端掛載後偵測語言
  useEffect(() => {
    const detected = detectFontVariant();
    setVariant(detected);
    setMounted(true);
  }, []);

  // 字體變體改變時，動態更新 <link> 和 CSS 變量
  useEffect(() => {
    if (!mounted) return;

    // ── 更新 Google Fonts <link> ──────────────────────────────
    const LINK_ID = "dynamic-fonts";
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = getFontsUrl(variant);

    // ── 更新 CSS 變量 ─────────────────────────────────────────
    const root = document.documentElement;
    root.style.setProperty("--font-serif", getSerifFont(variant));
    root.style.setProperty("--font-sans", getSansFont(variant));

    // ── 更新 html lang ────────────────────────────────────────
    root.lang = variant === "SC" ? "zh-CN" : "zh-TW";
  }, [variant, mounted]);

  const toggle = useCallback(() => {
    setVariant((prev) => {
      const next: FontVariant = prev === "SC" ? "TC" : "SC";
      saveFontVariant(next);
      return next;
    });
  }, []);

  return (
    <LocaleContext.Provider value={{ variant, toggle }}>
      {children}
    </LocaleContext.Provider>
  );
}
