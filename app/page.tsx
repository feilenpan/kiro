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

        <section style={{ textAlign: "center", padding: "1.75rem 0 1.5rem" }}>
          <div className="float-gentle" style={{ fontSize: "3.5rem", marginBottom: "0.75rem" }}>☸️</div>
          <h1 style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(1.8rem, 8vw, 3rem)", fontWeight: 700,
            color: "#2c1810", marginBottom: "0.75rem", letterSpacing: "0.15em",
          }}>
            佛說
          </h1>
          <p style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "clamp(0.95rem, 3vw, 1.1rem)",
            color: "#8a5a2f", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 1.5rem",
          }}>
            以 AI 之力，弘扬佛法智慧<br />
            每日金句 · 问佛解惑 · 佛经朗诵
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ask">
              <button className="btn-gold" style={{ fontSize: "1rem", padding: "0.75rem 1.5rem" }}>
                🙏 向AI问佛
              </button>
            </Link>
            <Link href="/sutras">
              <button className="btn-outline" style={{ fontSize: "1rem", padding: "0.75rem 1.5rem" }}>
                📖 浏览佛经
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
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>功能介绍</span>
          </div>
          <FeatureCards />
        </section>

        {/* 快速問佛 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>快速问佛</span>
          </div>
          <div className="zen-card" style={{ padding: "clamp(1rem, 3vw, 1.75rem)" }}>
            <ChatInterface />
          </div>
        </section>

        {/* 佛經典籍分類 */}
        <section>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>佛经典籍</span>
          </div>
          <SutraCategories />
        </section>
      </main>

      <footer style={{
        borderTop: "1px solid rgba(201, 138, 22, 0.2)",
        padding: "1.5rem 1.25rem", textAlign: "center",
      }}>
        <p style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#a06810", marginBottom: "0.5rem" }}>
          🙏 愿一切众生离苦得乐 · 阿弥陀佛
        </p>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.8rem", color: "#bc8f5e" }}>
          本站 AI 回答仅供佛法学习参考，非正式佛法开示
        </p>
      </footer>
    </>
  );
}
