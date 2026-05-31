"use client";

import { useState } from "react";
import { track, events } from "@/lib/analytics";

interface ShareButtonProps {
  text: string;
  source: string;
  explanation?: string;
  size?: "sm" | "md";
}

// ── Canvas 中文逐字換行 ───────────────────────────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    if (ch === "\n") { lines.push(line); line = ""; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// ── 生成金句分享圖（1080×1350 豎版）───────────────────────────────
async function buildShareImage(
  text: string,
  source: string,
  explanation?: string
): Promise<Blob | null> {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 等字體加載完成，避免畫成預設字體
  try { await (document as Document & { fonts: FontFaceSet }).fonts.ready; } catch { /**/ }

  // 背景漸層（米白 → 暖金）
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#fdf8ec");
  bg.addColorStop(1, "#f5f0e8");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 外金框
  ctx.strokeStyle = "#e5ab28";
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = "rgba(201,138,22,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  // 背景大「佛」字水印
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#c98a16";
  ctx.font = "700 600px 'Noto Serif TC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("佛", W / 2, H / 2 + 40);
  ctx.restore();

  // 頂部徽章
  ctx.fillStyle = "#a06810";
  ctx.font = "500 34px 'Noto Sans TC', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("☸  佛 說  ·  今 日 金 句  ☸", W / 2, 150);

  // 蓮花分隔
  ctx.fillStyle = "#e5ab28";
  ctx.font = "40px serif";
  ctx.fillText("🪷", W / 2, 230);

  // 金句正文（大字 serif）
  ctx.fillStyle = "#2c1810";
  ctx.font = "600 64px 'Noto Serif TC', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const quoteLines = wrapText(ctx, text, W - 240);
  let y = 360;
  const lineH = 96;
  quoteLines.forEach((ln) => {
    ctx.fillText(ln, W / 2, y);
    y += lineH;
  });

  // 出處
  y += 30;
  ctx.fillStyle = "#a06810";
  ctx.font = "400 38px 'Noto Sans TC', sans-serif";
  ctx.fillText(`—— ${source}`, W / 2, y);
  y += 90;

  // 白話解讀（小字，灰棕，多行）
  if (explanation) {
    ctx.fillStyle = "#5c3d2e";
    ctx.font = "400 36px 'Noto Sans TC', sans-serif";
    const expLines = wrapText(ctx, explanation, W - 280);
    // 最多顯示 6 行，避免溢出
    expLines.slice(0, 6).forEach((ln) => {
      ctx.fillText(ln, W / 2, y);
      y += 56;
    });
  }

  // 底部品牌 + 引導
  ctx.fillStyle = "#a06810";
  ctx.font = "500 40px 'Noto Serif TC', serif";
  ctx.fillText("🙏 願您離苦得樂 · 阿彌陀佛", W / 2, H - 200);

  ctx.fillStyle = "#bc8f5e";
  ctx.font = "400 32px 'Noto Sans TC', sans-serif";
  ctx.fillText("AI 佛學智慧 · 每日金句 · 問佛解惑", W / 2, H - 130);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png", 0.95);
  });
}

export default function ShareButton({ text, source, explanation, size = "md" }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);

  const s = size === "sm"
    ? { fontSize: "0.85rem", padding: "0.4rem 0.9rem" }
    : { fontSize: "1rem", padding: "0.55rem 1.2rem" };

  const handleShare = async () => {
    if (loading) return;
    setLoading(true);
    track(events.SHARE, { source, len: text.length });

    try {
      const blob = await buildShareImage(text, source, explanation);
      if (!blob) throw new Error("生成圖片失敗");

      const file = new File([blob], "佛說金句.png", { type: "image/png" });
      const shareText = `「${text}」—— ${source}\n\n來自「佛說」AI 佛學智慧 🙏`;

      // 優先：Web Share API（手機原生分享，可帶圖片）
      const nav = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
        share?: (data: ShareData) => Promise<void>;
      };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], text: shareText, title: "佛說 · 今日金句" });
        setLoading(false);
        return;
      }

      // 降級：直接下載圖片
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "佛說金句.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // 用戶取消分享不算錯誤
      if ((err as Error)?.name !== "AbortError") {
        console.error("[Share] 失敗:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="btn-outline"
      style={{
        minWidth: "80px",
        fontSize: s.fontSize,
        padding: s.padding,
        cursor: loading ? "wait" : "pointer",
        opacity: loading ? 0.7 : 1,
      }}
      title="分享金句圖片"
    >
      {loading ? "⏳ 生成中…" : "📤 分享"}
    </button>
  );
}
