"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type FontVariant, detectFontVariant, saveFontVariant, getFontsUrl, getSerifFont, getSansFont } from "@/lib/locale";

const CANTONESE_KEY = "foshuo_cantonese";

interface LocaleCtx {
  variant: FontVariant;
  toggle: () => void;
  cantonese: boolean;           // 是否使用粵語朗讀
  toggleCantonese: () => void;  // 切換粵語/普通話
}
const LocaleContext = createContext<LocaleCtx>({
  variant: "TC", toggle: () => {},
  cantonese: true, toggleCantonese: () => {},
});

export function useLocale(): LocaleCtx { return useContext(LocaleContext); }

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [variant,    setVariant]    = useState<FontVariant>("TC");
  // 預設粵語（true），除非用戶曾主動切換為普通話（localStorage 存 "0"）
  const [cantonese,  setCantonese]  = useState(true);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    setVariant(detectFontVariant());
    try {
      const saved = localStorage.getItem(CANTONESE_KEY);
      // 未設置過（null）→ 保持預設粵語 true
      // 已設置過 → 以用戶選擇為準
      if (saved !== null) setCantonese(saved === "1");
    } catch { /**/ }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const LINK_ID = "dynamic-fonts";
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID; link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = getFontsUrl(variant);
    const root = document.documentElement;
    root.style.setProperty("--font-serif", getSerifFont(variant));
    root.style.setProperty("--font-sans",  getSansFont(variant));
    root.lang = variant === "SC" ? "zh-CN" : "zh-TW";
  }, [variant, mounted]);

  const toggle = useCallback(() => {
    setVariant((prev) => {
      const next: FontVariant = prev === "SC" ? "TC" : "SC";
      saveFontVariant(next);
      return next;
    });
  }, []);

  const toggleCantonese = useCallback(() => {
    setCantonese((prev) => {
      const next = !prev;
      try { localStorage.setItem(CANTONESE_KEY, next ? "1" : "0"); } catch { /**/ }
      return next;
    });
  }, []);

  return (
    <LocaleContext.Provider value={{ variant, toggle, cantonese, toggleCantonese }}>
      {children}
    </LocaleContext.Provider>
  );
}
