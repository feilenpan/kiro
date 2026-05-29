import Header from "@/components/Header";
import DailySutraCard from "@/components/DailySutraCard";
import ChatInterface from "@/components/ChatInterface";
import { FeatureCards, SutraCategories } from "@/components/FeatureCards";
import MokyugyoHero from "@/components/MokyugyoHero";
import { getTodaySutra, getTodayAISutra, getDailyAudioUrl } from "@/lib/sutras";

export default async function HomePage() {
  const aiSutra    = await getTodayAISutra();
  const todaySutra = aiSutra ?? getTodaySutra();
  const dailyAudio = getDailyAudioUrl();

  return (
    <>
      <Header />

      {/* ── 第一屏：木魚互動區 ── */}
      <MokyugyoHero />

      {/* ── 第二屏以下：原有功能 ── */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "0 1.25rem 4rem" }}>

        {/* 今日金句 */}
        <section style={{ marginBottom: "2.5rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>今日金句</span>
          </div>
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

        {/* 佛經典籍 */}
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
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.8rem", color: "#bc8f5e", marginBottom: "0.5rem" }}>
          本站 AI 回答仅供佛法学习参考，非正式佛法开示
        </p>
        <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.75rem", color: "#bc8f5e" }}>
          <a href="/privacy" style={{ color: "#a06810", textDecoration: "underline" }}>隐私政策</a>
        </p>
      </footer>
    </>
  );
}
