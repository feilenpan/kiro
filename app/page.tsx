import Link from "next/link";
import Header from "@/components/Header";
import DailySutraCard from "@/components/DailySutraCard";
import ChatInterface from "@/components/ChatInterface";
import { FeatureCards, SutraCategories } from "@/components/FeatureCards";
import { getTodaySutra, getDailyAudioUrl } from "@/lib/sutras";

export default function HomePage() {
  // Server Component：在服務端拼好 R2 URL，傳給客戶端組件
  const todaySutra  = getTodaySutra();
  const dailyAudio  = getDailyAudioUrl(); // R2 未配置時返回 null

  return (
    <>
      <Header />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        {/* Hero */}
        <section style={{ textAlign: "center", padding: "2.5rem 0 2rem" }}>
          <div className="float-gentle" style={{ fontSize: "4rem", marginBottom: "1rem" }}>☸️</div>
          <h1 style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 700,
            color: "#2c1810", marginBottom: "0.75rem", letterSpacing: "0.15em",
          }}>
            佛說
          </h1>
          <p style={{
            fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1.1rem",
            color: "#8a5a2f", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 2rem",
          }}>
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

        {/* 今日金句 — 傳入服務端已解析的 R2 URL */}
        <section style={{ marginBottom: "2.5rem" }}>
          <DailySutraCard sutra={todaySutra} audioUrl={dailyAudio} />
        </section>

        {/* 功能介紹 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>功能介紹</span>
          </div>
          <FeatureCards />
        </section>

        {/* 快速問佛 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>快速問佛</span>
          </div>
          <div className="zen-card" style={{ padding: "1.75rem" }}>
            <ChatInterface />
          </div>
        </section>

        {/* 佛經典籍分類 */}
        <section>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>佛經典籍</span>
          </div>
          <SutraCategories />
        </section>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(201, 138, 22, 0.2)",
        padding: "1.5rem 1.25rem", textAlign: "center",
      }}>
        <p style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#a06810", marginBottom: "0.5rem" }}>
          🙏 願一切眾生離苦得樂 · 阿彌陀佛
        </p>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.8rem", color: "#bc8f5e" }}>
          本站 AI 回答僅供佛法學習參考，非正式佛法開示
        </p>
      </footer>
    </>
  );
}
