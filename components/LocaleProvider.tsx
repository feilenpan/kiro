"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  /** 粵語朗讀：自動由 variant 決定，TC = 粵語，SC = 普通話，無需手動設定 */
  cantonese: boolean;
}

const LocaleContext = createContext<LocaleCtx>({
  variant: "TC",
  toggle: () => {},
  cantonese: true,   // 預設 TC → 粵語
});

export function useLocale(): LocaleCtx {
  return useContext(LocaleContext);
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  // 預設繁體（TC），客戶端掛載後改用瀏覽器語言偵測結果
  const [variant, setVariant] = useState<FontVariant>("TC");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setVariant(detectFontVariant());
    setMounted(true);
  }, []);

  // variant 變化時同步字體、lang 屬性
  useEffect(() => {
    if (!mounted) return;
    const LINK_ID = "dynamic-fonts";
    let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.id = LINK_ID;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = getFontsUrl(variant);
    const root = document.documentElement;
    root.style.setProperty("--font-serif", getSerifFont(variant));
    root.style.setProperty("--font-sans", getSansFont(variant));
    root.lang = variant === "SC" ? "zh-CN" : "zh-TW";
  }, [variant, mounted]);

  const toggle = useCallback(() => {
    setVariant((prev) => {
      const next: FontVariant = prev === "SC" ? "TC" : "SC";
      saveFontVariant(next);
      return next;
    });
  }, []);

  // 粵語完全由 variant 決定：TC = 粵語，SC = 普通話
  const cantonese = variant === "TC";

  return (
    <LocaleContext.Provider value={{ variant, toggle, cantonese }}>
      {children}
    </LocaleContext.Provider>
  );
}
