import Link from "next/link";
import Header from "@/components/Header";
import DailySutraCard from "@/components/DailySutraCard";
import ChatInterface from "@/components/ChatInterface";
import { getTodaySutra, sutraCategories } from "@/lib/sutras";

export default function HomePage() {
  const todaySutra = getTodaySutra();

  return (
    <>
      <Header />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {/* ── Hero 區塊 ── */}
        <section style={{ textAlign: "center", padding: "2.5rem 0 2rem" }}>
          <div className="float-gentle" style={{ fontSize: "4rem", marginBottom: "1rem" }}>
            ☸️
          </div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 700,
              color: "#2c1810",
              marginBottom: "0.75rem",
              letterSpacing: "0.15em",
            }}
          >
            佛說
          </h1>
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "1.1rem",
              color: "#8a5a2f",
              lineHeight: 1.8,
              maxWidth: "480px",
              margin: "0 auto 2rem",
            }}
          >
            以 AI 之力，弘揚佛法智慧<br />
            每日金句 · 問佛解惑 · 佛經朗誦
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ask">
              <button className="btn-gold" style={{ fontSize: "1.1rem", padding: "0.85rem 2rem" }}>
                🙏 向AI問佛
              </button>
            </Link>
            <Link href="/sutras">
              <button className="btn-outline" style={{ fontSize: "1.1rem", padding: "0.85rem 2rem" }}>
                📖 瀏覽佛經
              </button>
            </Link>
          </div>
        </section>

        {/* ── 今日金句 ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <DailySutraCard sutra={todaySutra} />
        </section>

        {/* ── 功能卡片 ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>功能介紹</span>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              {
                icon: "🙏",
                title: "AI 問佛",
                desc: "說出您的煩惱，AI 法師以佛法智慧為您開示指引",
                href: "/ask",
                color: "#f9edcc",
              },
              {
                icon: "📖",
                title: "佛經閱覽",
                desc: "精選心經、金剛經等經典，大字顯示，支持語音朗誦",
                href: "/sutras",
                color: "#f0f9ec",
              },
              {
                icon: "☀️",
                title: "每日修行",
                desc: "每日金句、修行提醒、靜心禪語，陪伴您的日常修行",
                href: "/daily",
                color: "#ecf0f9",
              },
            ].map((card) => (
              <Link key={card.href} href={card.href} style={{ textDecoration: "none" }}>
                <div
                  className="zen-card"
                  style={{
                    padding: "1.5rem",
                    cursor: "pointer",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    background: card.color,
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
        </section>

        {/* ── AI 快速問佛 ── */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>快速問佛</span>
          </div>
          <div className="zen-card" style={{ padding: "1.75rem" }}>
            <ChatInterface />
          </div>
        </section>

        {/* ── 佛經分類 ── */}
        <section>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>佛經典籍</span>
          </div>
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
        </section>
      </main>

      {/* 頁腳 */}
      <footer
        style={{
          borderTop: "1px solid rgba(201, 138, 22, 0.2)",
          padding: "1.5rem 1.25rem",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "1rem",
            color: "#a06810",
            marginBottom: "0.5rem",
          }}
        >
          🙏 願一切眾生離苦得樂 · 阿彌陀佛
        </p>
        <p
          style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "0.8rem",
            color: "#bc8f5e",
          }}
        >
          本站 AI 回答僅供佛法學習參考，非正式佛法開示
        </p>
      </footer>
    </>
  );
}
