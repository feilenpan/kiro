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
  const { variant, toggle } = useLocale();

  const btnStyle = {
    padding: "0.4rem 0.75rem",
    borderRadius: "0.5rem",
    border: "1px solid rgba(201, 138, 22, 0.3)",
    background: "rgba(249, 237, 204, 0.6)",
    color: "#7a4c10",
    cursor: "pointer",
    fontSize: "0.85rem",
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

            {/* 繁／簡切換（同時自動切換語音語言） */}
            <button
              onClick={toggle}
              title={variant === "TC" ? "切換簡體（普通話朗讀）" : "切換繁體（粵語朗讀）"}
              style={{ ...btnStyle, marginLeft: "0.5rem" }}
            >
              {variant === "TC" ? "簡" : "繁"}
            </button>
          </nav>

          {/* 手機端右側 */}
          <div className="show-mobile" style={{ alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={toggle}
              title={variant === "TC" ? "切換簡體（普通話朗讀）" : "切換繁體（粵語朗讀）"}
              style={btnStyle}
            >
              {variant === "TC" ? "簡" : "繁"}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", padding: "0.5rem", color: "#2c1810" }}
              aria-label="菜單"
            >
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

            {/* 語言說明 */}
            <div style={{
              borderTop: "1px solid rgba(201,138,22,0.15)",
              marginTop: "0.5rem", paddingTop: "0.75rem",
            }}>
              <p style={{
                fontSize: "0.82rem", color: "#8a5a2f", margin: 0,
                fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif",
                lineHeight: 1.6,
              }}>
                🔊 繁體 → 粵語朗讀 &nbsp;|&nbsp; 簡體 → 普通話朗讀
              </p>
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
