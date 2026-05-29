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

      {/*
        scroll-snap 容器：
        - 第一個 snap 點 = 木魚區（佔滿視口，用戶打開就看到）
        - 往下滑才進入第二屏（今日金句等內容）
        - mandatory：滑動必須停在 snap 點，不會停在中間
      */}
      <div style={{
        overflowY: "scroll",
        height: "calc(100svh - 64px)",
        scrollSnapType: "y mandatory",
        WebkitOverflowScrolling: "touch",
      }}>

        {/* ── 第一屏：木魚（snap 點）── */}
        <div style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}>
          <MokyugyoHero />
        </div>

        {/* ── 第二屏以下：不强制 snap，自由滾動 ── */}
        <div style={{ scrollSnapAlign: "start" }}>
          <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

            <section style={{ marginBottom: "2.5rem" }}>
              <div className="lotus-divider">
                <span style={{ fontSize: "1.2rem", color: "#c98a16" }}>今日金句</span>
              </div>
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
            <p style={{ fontFamily: "'Noto Serif TC','Noto Serif SC',serif", fontSize: "1rem", color: "#a06810", marginBottom: "0.5rem" }}>
              🙏 願一切眾生離苦得樂 · 阿彌陀佛
            </p>
            <p style={{ fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif", fontSize: "0.8rem", color: "#bc8f5e", marginBottom: "0.5rem" }}>
              本站 AI 回答僅供佛法學習參考，非正式佛法開示
            </p>
            <p style={{ fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif", fontSize: "0.75rem", color: "#bc8f5e" }}>
              <a href="/privacy" style={{ color: "#a06810", textDecoration: "underline" }}>隱私政策</a>
            </p>
          </footer>
        </div>

      </div>
    </>
  );
}
