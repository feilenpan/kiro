/**
 * 繁簡體偵測與字體切換
 * zh-CN / zh-SG → 簡體字體（SC）
 * zh-TW / zh-HK → 繁體字體（TC）
 */

export type FontVariant = "SC" | "TC";

const LOCALE_STORAGE_KEY = "foshuo_font_variant";

export function detectFontVariant(): FontVariant {
  if (typeof window === "undefined") return "SC";

  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "SC" || saved === "TC") return saved;
  } catch { /* ignore */ }

  const lang = navigator.language || "";
  const langs = navigator.languages || [lang];

  for (const l of langs) {
    const lower = l.toLowerCase();
    if (lower.startsWith("zh-cn") || lower.startsWith("zh-sg") || lower === "zh-hans") return "SC";
    if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower === "zh-hant") return "TC";
  }

  return "SC"; // 默認簡體
}

export function saveFontVariant(variant: FontVariant): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LOCALE_STORAGE_KEY, variant); } catch { /* ignore */ }
}

export function getFontsUrl(variant: FontVariant): string {
  const serif = `Noto+Serif+${variant}:wght@400;500;600;700`;
  const sans  = `Noto+Sans+${variant}:wght@300;400;500`;
  return `https://fonts.googleapis.com/css2?family=${serif}&family=${sans}&display=swap`;
}

export function getSerifFont(variant: FontVariant): string {
  return `'Noto Serif ${variant}', Georgia, serif`;
}

export function getSansFont(variant: FontVariant): string {
  return `'Noto Sans ${variant}', sans-serif`;
}
