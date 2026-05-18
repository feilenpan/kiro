import Link from "next/link";
import Header from "@/components/Header";
import DailySutraCard from "@/components/DailySutraCard";
import ChatInterface from "@/components/ChatInterface";
import { FeatureCards, SutraCategories } from "@/components/FeatureCards";
import { getTodaySutra, getTodayAISutra, getDailyAudioUrl } from "@/lib/sutras";

export default async function HomePage() {
  const aiSutra    = await getTodayAISutra();
  const todaySutra = aiSutra ?? getTodaySutra();
  const dailyAudio = getDailyAudioUrl();

  return (
    <>
      <Header />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "1.5rem 1.25rem 4rem" }}>

        <section style={{ textAlign: "center", padding: "2rem 0 1.5rem" }}>
          <div className="float-gentle" style={{ fontSize: "4rem", marginBottom: "1rem" }}>☸️</div>
          <h1 style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(2.2rem, 10vw, 3.5rem)", fontWeight: 700,
            color: "#2c1810", marginBottom: "0.75rem", letterSpacing: "0.18em",
          }}>
            佛說
          </h1>
          <p style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
            color: "#8a5a2f", lineHeight: 1.8, maxWidth: "480px", margin: "0 auto 1.5rem",
          }}>
            以 AI 之力，弘揚佛法智慧<br />
            每日金句 · 問佛解惑 · 佛經朗誦
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/ask">
              <button className="btn-gold" style={{ fontSize: "0.95rem", padding: "0.55rem 1.4rem" }}>
                🙏 向AI問佛
              </button>
            </Link>
            <Link href="/sutras">
              <button className="btn-outline" style={{ fontSize: "0.95rem", padding: "0.55rem 1.4rem" }}>
                📖 瀏覽佛經
              </button>
            </Link>
          </div>
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <DailySutraCard sutra={todaySutra} audioUrl={dailyAudio} />
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>功能介紹</span>
          </div>
          <FeatureCards />
        </section>

        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>快速問佛</span>
          </div>
          <div className="zen-card" style={{ padding: "clamp(1rem, 3vw, 1.75rem)" }}>
            <ChatInterface />
          </div>
        </section>

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
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.8rem", color: "#bc8f5e", marginBottom: "0.5rem" }}>
          本站 AI 回答僅供佛法學習參考，非正式佛法開示
        </p>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.75rem", color: "#bc8f5e" }}>
          <a href="/privacy" style={{ color: "#a06810", textDecoration: "underline" }}>隱私政策</a>
        </p>
      </footer>
    </>
  );
}
