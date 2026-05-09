"use client";

import { useState } from "react";
import Header from "@/components/Header";
import AudioPlayer from "@/components/AudioPlayer";
import { sutraCategories, Sutra } from "@/lib/sutras";

interface Props {
  /** 服務端傳入的 R2 URL，key = sutra.id */
  sutraAudios: Record<string, string | null>;
}

export default function SutrasPageClient({ sutraAudios }: Props) {
  const [selectedSutra, setSelectedSutra] = useState<Sutra | null>(null);
  const [fontSize, setFontSize] = useState(20);

  return (
    <>
      <Header />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* 頁頭 */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>📖</div>
          <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.8rem", fontWeight: 700, color: "#2c1810", marginBottom: "0.5rem" }}>
            佛經典籍
          </h1>
          <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem", color: "#8a5a2f" }}>
            精選佛教經典，大字顯示，支持語音朗誦
          </p>
        </div>

        {/* 字體大小控制 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.5rem", marginBottom: "1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#8a5a2f", fontFamily: "'Noto Sans SC', sans-serif" }}>字體大小：</span>
          {[16, 20, 24, 28].map((sz) => (
            <button key={sz} onClick={() => setFontSize(sz)} style={{
              padding: "0.35rem 0.75rem", borderRadius: "0.5rem",
              border: fontSize === sz ? "2px solid #e5ab28" : "1px solid #e4d4be",
              background: fontSize === sz ? "#f9edcc" : "white",
              color: "#5c3d2e", cursor: "pointer",
              fontSize: `${Math.max(12, sz - 4)}px`, fontFamily: "'Noto Sans SC', sans-serif",
            }}>文</button>
          ))}
        </div>

        {selectedSutra ? (
          /* ── 經文詳情 ── */
          <div className="zen-card fade-in" style={{ padding: "2rem", marginBottom: "1.5rem" }}>
            <button onClick={() => setSelectedSutra(null)} style={{
              display: "flex", alignItems: "center", gap: "0.35rem",
              padding: "0.5rem 0.75rem", background: "rgba(201,138,22,0.1)",
              border: "none", borderRadius: "0.5rem", color: "#7a4c10",
              cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Noto Sans SC', sans-serif",
              marginBottom: "1.5rem",
            }}>← 返回列表</button>

            <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.6rem", color: "#2c1810", marginBottom: "0.5rem" }}>
              {selectedSutra.title}
            </h2>
            <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem", color: "#a06810", marginBottom: "1.5rem" }}>
              {selectedSutra.dynasty}代 · {selectedSutra.translator}譯
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <AudioPlayer
                text={selectedSutra.excerpt}
                label="朗誦經文"
                size="lg"
                isStatic={true}
                audioUrl={sutraAudios[selectedSutra.id] ?? null}
              />
            </div>

            <div className="lotus-divider">
              <span style={{ color: "#e5ab28" }}>🪷</span>
            </div>

            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: `${fontSize}px`, lineHeight: 2.2, color: "#2c1810", letterSpacing: "0.05em" }}>
              {selectedSutra.excerpt}
            </div>
            {selectedSutra.fullText && (
              <div style={{ marginTop: "1.5rem", fontFamily: "'Noto Serif SC', serif", fontSize: `${fontSize}px`, lineHeight: 2.2, color: "#2c1810" }}>
                {selectedSutra.fullText}
              </div>
            )}
          </div>

        ) : (
          /* ── 分類列表 ── */
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {sutraCategories.map((cat) => (
              <section key={cat.id} id={cat.id}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "1.5rem" }}>{cat.icon}</span>
                  <h2 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.2rem", color: "#2c1810", margin: 0 }}>{cat.name}</h2>
                  <span style={{ fontSize: "0.85rem", color: "#8a5a2f", fontFamily: "'Noto Sans SC', sans-serif" }}>— {cat.description}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {cat.sutras.map((sutra) => (
                    <div key={sutra.id} className="zen-card" style={{ padding: "1.5rem", cursor: "pointer" }}
                      onClick={() => setSelectedSutra(sutra)}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.15rem", color: "#2c1810", margin: 0, marginBottom: "0.25rem" }}>
                            {sutra.title}
                          </h3>
                          <span style={{ fontSize: "0.85rem", color: "#a06810", fontFamily: "'Noto Sans SC', sans-serif" }}>
                            {sutra.dynasty}代 · {sutra.translator}譯
                          </span>
                        </div>
                        <div onClick={(e) => e.stopPropagation()}>
                          <AudioPlayer
                            text={sutra.excerpt}
                            label="試聽"
                            size="sm"
                            isStatic={true}
                            audioUrl={sutraAudios[sutra.id] ?? null}
                          />
                        </div>
                      </div>

                      <p style={{
                        fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", lineHeight: 1.9,
                        color: "#5c3d2e", margin: 0, display: "-webkit-box",
                        WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {sutra.excerpt}
                      </p>
                      <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#c98a16", fontFamily: "'Noto Sans SC', sans-serif" }}>
                        點擊閱讀全文 →
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
