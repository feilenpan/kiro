import type { MetadataRoute } from "next";

/**
 * PWA Manifest — 讓網站可「添加到主屏幕」，像原生 App 一樣使用
 *
 * 用戶體驗：
 *   iPhone Safari：分享 → 添加到主屏幕
 *   Android Chrome：會自動彈出「安裝」提示
 *   桌面 Chrome/Edge：地址欄出現安裝圖標
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "佛說 — AI 佛學智慧",
    short_name: "佛說",
    description: "以 AI 之力，弘揚佛法智慧。每日金句、AI 問佛、佛經朗誦，陪伴您的修行之路。",
    start_url: "/",
    display: "standalone",           // 全屏，去除瀏覽器外殼
    orientation: "portrait",          // 豎屏為主
    background_color: "#f5f0e8",      // 啟動時背景色（米白）
    theme_color: "#c98a16",           // 狀態欄顏色（金色）
    lang: "zh-TW",
    dir: "ltr",
    categories: ["lifestyle", "education", "books"],
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "今日金句",
        short_name: "金句",
        description: "查看今日的佛法金句",
        url: "/daily",
        icons: [{ src: "/icon-192.svg", sizes: "192x192" }],
      },
      {
        name: "問佛",
        short_name: "問佛",
        description: "向 AI 法師請教",
        url: "/ask",
        icons: [{ src: "/icon-192.svg", sizes: "192x192" }],
      },
    ],
  };
}
