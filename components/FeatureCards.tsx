"use client";

import Link from "next/link";
import { sutraCategories } from "@/lib/sutras";

const features = [
  {
    icon: "🙏",
    title: "AI 问佛",
    desc: "说出您的烦恼，AI 法师以佛法智慧为您开示指引",
    href: "/ask",
    bg: "#f9edcc",
  },
  {
    icon: "📖",
    title: "佛经阅览",
    desc: "精选心经、金刚经等经典，大字显示，支持语音朗诵",
    href: "/sutras",
    bg: "#f0f9ec",
  },
  {
    icon: "☀️",
    title: "每日修行",
    desc: "每日金句、修行提醒、静心禅语，陪伴您的日常修行",
    href: "/daily",
    bg: "#ecf0f9",
  },
];

export function FeatureCards() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "1rem",
      }}
    >
      {features.map((card) => (
        <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
          <div
            className="zen-card"
            style={{
              padding: "1.5rem",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              background: card.bg,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 24px rgba(201, 138, 22, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "";
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{card.icon}</div>
            <h3
              style={{
                fontFamily: "'Noto Serif SC', serif",
                fontSize: "1.2rem",
                color: "#2c1810",
                marginBottom: "0.5rem",
              }}
            >
              {card.title}
            </h3>
            <p
              style={{
                fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: "0.95rem",
                color: "#5c3d2e",
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {card.desc}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function SutraCategories() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {sutraCategories.map((cat) => (
        <Link key={cat.id} href={`/sutras#${cat.id}`} style={{ textDecoration: "none" }}>
          <div
            className="zen-card"
            style={{
              padding: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
            }}
          >
            <span style={{ fontSize: "1.75rem" }}>{cat.icon}</span>
            <div>
              <div
                style={{
                  fontFamily: "'Noto Serif SC', serif",
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#2c1810",
                }}
              >
                {cat.name}
              </div>
              <div
                style={{
                  fontFamily: "'Noto Sans SC', sans-serif",
                  fontSize: "0.85rem",
                  color: "#8a5a2f",
                }}
              >
                {cat.description}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
