"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

interface NavItem { href: string; label: string; icon: string; }

const navItems: NavItem[] = [
  { href: "/",         label: "首頁", icon: "🏠" },
  { href: "/#mokugyo", label: "木魚", icon: "🪘" },
  { href: "/ask",      label: "問佛", icon: "🙏" },
  { href: "/sutras",   label: "佛經", icon: "📖" },
  { href: "/daily",    label: "每日", icon: "☀️" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { variant, toggle, cantonese, toggleCantonese } = useLocale();

  // 粵語切換按鈕樣式（高亮 = 已啟用）
  const cantoneseStyle = (active: boolean) => ({
    padding: "0.4rem 0.65rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(201, 138, 22, 0.35)",
    background: active
      ? "linear-gradient(to bottom, #e5ab28, #c98a16)"
      : "rgba(249, 237, 204, 0.6)",
    color: active ? "white" : "#7a4c10",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
    fontWeight: active ? 600 : 400,
    transition: "all 0.2s",
    whiteSpace: "nowrap" as const,
  });

  const variantStyle = {
    padding: "0.4rem 0.65rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(201, 138, 22, 0.3)",
    background: "rgba(249, 237, 204, 0.6)",
    color: "#7a4c10",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
    transition: "all 0.2s",
  };

  return (
    <>
      <header style={{
        background: "rgba(245, 240, 232, 0.97)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid rgba(201, 138, 22, 0.2)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: "900px", margin: "0 auto", padding: "0 1.25rem",
          height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>

          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "1.75rem" }}>☸️</span>
              <span style={{
                fontFamily: "'Noto Serif TC','Noto Serif SC',serif",
                fontSize: "1.4rem", fontWeight: 700, color: "#2c1810", letterSpacing: "0.1em",
              }}>佛說</span>
            </div>
          </Link>

          {/* 桌面導航 */}
          <nav style={{ display: "flex", gap: "0.25rem", alignItems: "center" }} className="hidden-mobile">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} style={{
                display: "flex", alignItems: "center", gap: "0.3rem",
                padding: "0.5rem 0.85rem", borderRadius: "0.75rem",
                fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
                fontSize: "0.95rem", color: "#5c3d2e", textDecoration: "none", transition: "background 0.2s",
              }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(201, 138, 22, 0.12)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* 語音語言切換：粵語 / 普通話 */}
            <div style={{ display: "flex", gap: "0.25rem", marginLeft: "0.5rem", alignItems: "center" }}>
              <button onClick={() => { if (!cantonese) toggleCantonese(); }}
                title="粵語朗讀" style={cantoneseStyle(cantonese)}>
                🔊 粵
              </button>
              <button onClick={() => { if (cantonese) toggleCantonese(); }}
                title="普通話朗讀" style={cantoneseStyle(!cantonese)}>
                🔊 普
              </button>
            </div>

            {/* 繁簡切換 */}
            <button onClick={toggle} title={variant === "SC" ? "切換到繁體" : "切換到簡體"}
              style={{ ...variantStyle, marginLeft: "0.25rem" }}>
              {variant === "SC" ? "繁" : "簡"}
            </button>
          </nav>

          {/* 手機端右側：粵/普快捷 + 漢堡 */}
          <div className="show-mobile" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            {/* 粵語快捷切換（點擊在粵/普之間切換） */}
            <button
              onClick={toggleCantonese}
              title={cantonese ? "切換為普通話" : "切換為粵語"}
              style={cantoneseStyle(cantonese)}
            >
              {cantonese ? "🔊 粵" : "🔊 普"}
            </button>
            <button onClick={toggle} style={variantStyle}>
              {variant === "SC" ? "繁" : "簡"}
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              background: "none", border: "none", fontSize: "1.5rem",
              cursor: "pointer", padding: "0.5rem", color: "#2c1810",
            }} aria-label="菜單">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* 手機下拉菜單 */}
        {menuOpen && (
          <div style={{
            borderTop: "1px solid rgba(201, 138, 22, 0.2)",
            padding: "0.75rem 1.25rem",
            background: "rgba(245, 240, 232, 0.98)",
          }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} style={{
                display: "flex", alignItems: "center", gap: "0.75rem",
                padding: "0.85rem 1rem", borderRadius: "0.75rem",
                fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
                fontSize: "1.1rem", color: "#2c1810", textDecoration: "none", marginBottom: "0.25rem",
              }}>
                <span style={{ fontSize: "1.3rem" }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            {/* 菜單內語音選擇區 */}
            <div style={{
              borderTop: "1px solid rgba(201,138,22,0.15)",
              marginTop: "0.5rem", paddingTop: "0.75rem",
              display: "flex", gap: "0.5rem", alignItems: "center",
            }}>
              <span style={{ fontSize: "0.85rem", color: "#8a5a2f", fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif" }}>
                朗讀語言：
              </span>
              <button onClick={() => { if (!cantonese) toggleCantonese(); }} style={cantoneseStyle(cantonese)}>
                🔊 粵語
              </button>
              <button onClick={() => { if (cantonese) toggleCantonese(); }} style={cantoneseStyle(!cantonese)}>
                🔊 普通話
              </button>
            </div>
          </div>
        )}
      </header>

      <style>{`
        .hidden-mobile { display: flex; }
        .show-mobile   { display: none; }
        @media (max-width: 640px) {
          .hidden-mobile { display: none !important; }
          .show-mobile   { display: flex !important; }
        }
      `}</style>
    </>
  );
}
