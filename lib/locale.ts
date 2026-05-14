/**
 * 繁簡體偵測與字體切換
 *
 * 邏輯：
 *   - 根據瀏覽器語言自動判斷用簡體（SC）或繁體（TC）字體
 *   - zh-CN / zh-SG → 簡體字體（Noto Serif SC / Noto Sans SC）
 *   - zh-TW / zh-HK / 其他 → 繁體字體（Noto Serif TC / Noto Sans TC）
 *   - 用戶可手動切換，選擇存入 localStorage
 */

export type FontVariant = "SC" | "TC";

const LOCALE_STORAGE_KEY = "foshuo_font_variant";

/**
 * 根據瀏覽器語言判斷預設字體變體
 */
export function detectFontVariant(): FontVariant {
  if (typeof window === "undefined") return "SC";

  // 優先讀取用戶手動選擇
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "SC" || saved === "TC") return saved;
  } catch {
    // ignore
  }

  // 根據瀏覽器語言判斷
  const lang = navigator.language || "";
  const langs = navigator.languages || [lang];

  for (const l of langs) {
    const lower = l.toLowerCase();
    if (lower.startsWith("zh-cn") || lower.startsWith("zh-sg") || lower === "zh-hans") {
      return "SC";
    }
    if (lower.startsWith("zh-tw") || lower.startsWith("zh-hk") || lower === "zh-hant") {
      return "TC";
    }
  }

  // 默認簡體（你的主要用戶群）
  return "SC";
}

/**
 * 保存用戶手動選擇的字體變體
 */
export function saveFontVariant(variant: FontVariant): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, variant);
  } catch {
    // ignore
  }
}

/**
 * 獲取 Google Fonts URL
 */
export function getFontsUrl(variant: FontVariant): string {
  const serif = `Noto+Serif+${variant}:wght@400;500;600;700`;
  const sans = `Noto+Sans+${variant}:wght@300;400;500`;
  return `https://fonts.googleapis.com/css2?family=${serif}&family=${sans}&display=swap`;
}

/**
 * 獲取 serif 字體名
 */
export function getSerifFont(variant: FontVariant): string {
  return `'Noto Serif ${variant}', Georgia, serif`;
}

/**
 * 獲取 sans 字體名
 */
export function getSansFont(variant: FontVariant): string {
  return `'Noto Sans ${variant}', sans-serif`;
}
