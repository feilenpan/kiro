"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type FontVariant, detectFontVariant, saveFontVariant, getFontsUrl, getSerifFont, getSansFont } from "@/lib/locale";

interface LocaleCtx { variant: FontVariant; toggle: () => void; }
const LocaleContext = createContext<LocaleCtx>({ variant: "SC", toggle: () => {} });

export function useLocale(): LocaleCtx { return useContext(LocaleContext); }

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariant] = useState<FontVariant>("SC");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setVariant(detectFontVariant());
    setMounted(true);
  }, []);

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

  return <LocaleContext.Provider value={{ variant, toggle }}>{children}</LocaleContext.Provider>;
}
