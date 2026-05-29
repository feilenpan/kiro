"use client";

import { useEffect } from "react";

/**
 * 每次頁面掛載時強制滾回頂部。
 *
 * 解決問題：
 * 1. 瀏覽器 scrollRestoration 預設 "auto"，會記住上次離開時的滾動位置，
 *    重新進入頁面時自動滾到底部。
 * 2. ChatInterface 的 scrollIntoView 即使已改為容器滾動，
 *    但某些瀏覽器仍可能把 scroll-snap 容器帶動到底。
 *
 * 做法：把 history.scrollRestoration 設為 "manual"，
 * 並在每次掛載後把 snap 容器和 window 都重置到 0。
 */
export default function ScrollRestore() {
  useEffect(() => {
    // 1. 關閉瀏覽器自動恢復滾動位置
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    // 2. window / document 滾回頂部
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

    // 3. scroll-snap 容器滾回頂部（找第一個 overflow:scroll 的子容器）
    const snapEl = document.querySelector<HTMLElement>("[data-snap-container]");
    if (snapEl) {
      snapEl.scrollTop = 0;
    }
  }, []);

  return null;
}
