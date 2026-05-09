"use client";

import { useState } from "react";
import Header from "@/components/Header";
import DailySutraCard from "@/components/DailySutraCard";
import AudioPlayer from "@/components/AudioPlayer";
import { dailySutras, DailySutra } from "@/lib/sutras";
import { track, events } from "@/lib/analytics";

// ── 禪修計時器 ────────────────────────────────────────────────────
function MeditationTimer() {
  const [duration,   setDuration]   = useState(10);
  const [timeLeft,   setTimeLeft]   = useState<number | null>(null);
  const [isRunning,  setIsRunning]  = useState(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (isRunning) return;
    const secs = duration * 60;
    setTimeLeft(secs);
    setIsRunning(true);
    track(events.MEDITATE_START, { duration });
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(id);
          setIsRunning(false);
          track(events.MEDITATE_DONE, { duration });
          if (window.speechSynthesis) {
            const u = new SpeechSynthesisUtterance("禪修結束，阿彌陀佛。");
            u.lang = "zh-TW";
            window.speechSynthesis.speak(u);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setIntervalId(id);
  };

  const stop = () => {
    if (intervalId) clearInterval(intervalId);
    setIsRunning(false);
    setTimeLeft(null);
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const progress = timeLeft !== null ? timeLeft / (duration * 60) : 1;
  const R = 60, C = 2 * Math.PI * R;

  return (
    <div className="zen-card" style={{ padding: "1.75rem", textAlign: "center" }}>
      <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.2rem", color: "#2c1810", marginBottom: "1.25rem" }}>
        🧘 靜心禪修計時
      </h3>
      <div style={{ position: "relative", width: "140px", height: "140px", margin: "0 auto 1.5rem" }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={R} fill="none" stroke="#f3d88a" strokeWidth="8" />
          <circle cx="70" cy="70" r={R} fill="none" stroke="#c98a16" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={C}
            strokeDashoffset={C * (1 - progress)} transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.6rem", fontWeight: 600, color: "#2c1810" }}>
            {timeLeft !== null ? fmt(timeLeft) : `${duration}:00`}
          </span>
          <span style={{ fontSize: "0.8rem", color: "#8a5a2f", fontFamily: "'Noto Sans SC', sans-serif" }}>
            {isRunning ? "禪修中…" : "準備就緒"}
          </span>
        </div>
      </div>
      {!isRunning && (
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[5, 10, 15, 20, 30].map((m) => (
            <button key={m} onClick={() => setDuration(m)} style={{
              padding: "0.4rem 0.75rem", borderRadius: "9999px",
              border: duration === m ? "2px solid #e5ab28" : "1px solid #e4d4be",
              background: duration === m ? "#f9edcc" : "white",
              color: "#5c3d2e", cursor: "pointer", fontSize: "0.9rem",
              fontFamily: "'Noto Sans SC', sans-serif",
            }}>{m}分</button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
        {!isRunning
          ? <button className="btn-gold" onClick={start}>▶ 開始禪修</button>
          : <button onClick={stop} style={{
              padding: "0.75rem 1.5rem", background: "rgba(44,24,16,0.1)",
              border: "1px solid rgba(44,24,16,0.2)", borderRadius: "9999px",
              color: "#2c1810", cursor: "pointer", fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem",
            }}>⏹ 結束</button>
        }
      </div>
      {timeLeft === 0 && (
        <div className="fade-in" style={{
          marginTop: "1rem", padding: "0.75rem",
          background: "rgba(249,237,204,0.8)", borderRadius: "0.75rem",
          fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#7a4c10",
        }}>
          🙏 禪修圓滿，阿彌陀佛
        </div>
      )}
    </div>
  );
}

// ── 每日頁主體（Client Component）────────────────────────────────
interface Props {
  todaySutra:   DailySutra;
  dailyAudio:   string | null;  // 今日金句 R2 URL
  morningAudio: string | null;  // 早課 R2 URL
  eveningAudio: string | null;  // 晚課 R2 URL
  quoteAudios:  (string | null)[]; // 金句典藏 R2 URL 陣列
}

export default function DailyPageClient({
  todaySutra, dailyAudio, morningAudio, eveningAudio, quoteAudios,
}: Props) {
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const morningText = "清晨時分，萬物初醒。願您以清淨心迎接新的一天。南無阿彌陀佛。";
  const eveningText = "日暮時分，塵囂漸息。回顧今日，若有過失，輕輕放下，明日再來。南無阿彌陀佛。";

  return (
    <>
      <Header />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* 頁頭 */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>☀️</div>
          <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.8rem", fontWeight: 700, color: "#2c1810", marginBottom: "0.5rem" }}>
            每日修行
          </h1>
          <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem", color: "#8a5a2f" }}>
            每日一句，靜心禪修，陪伴您的修行之路
          </p>
        </div>

        {/* 今日金句 — R2 URL 直接注入 */}
        <section style={{ marginBottom: "2rem" }}>
          <DailySutraCard sutra={todaySutra} audioUrl={dailyAudio} />
        </section>

        {/* 早晚課誦 — R2 URL 直接注入 */}
        <section style={{ marginBottom: "2rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.1rem", color: "#c98a16" }}>早晚課誦</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { title: "🌅 早課祝福", text: morningText, desc: "以清淨心迎接新一天", url: morningAudio },
              { title: "🌙 晚課迴向", text: eveningText, desc: "回顧今日，安然入眠",  url: eveningAudio },
            ].map((item) => (
              <div key={item.title} className="zen-card" style={{ padding: "1.25rem" }}>
                <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#2c1810", marginBottom: "0.5rem" }}>
                  {item.title}
                </h3>
                <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem", color: "#8a5a2f", marginBottom: "0.75rem" }}>
                  {item.desc}
                </p>
                <AudioPlayer
                  text={item.text}
                  label="聆聽"
                  size="sm"
                  isStatic={true}
                  audioUrl={item.url}
                  trackEvent={events.LISTEN_COURSE}
                  trackProps={{ course: item.title.includes("早") ? "morning" : "evening" }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 禪修計時器 */}
        <section style={{ marginBottom: "2rem" }}>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.1rem", color: "#c98a16" }}>靜心禪修</span>
          </div>
          <MeditationTimer />
        </section>

        {/* 金句典藏 — R2 URL 直接注入 */}
        <section>
          <div className="lotus-divider">
            <span style={{ fontSize: "1.1rem", color: "#c98a16" }}>金句典藏</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {dailySutras.map((sutra, idx) => (
              <div
                key={sutra.id}
                className="zen-card"
                style={{
                  padding: "1.25rem", cursor: "pointer",
                  border: selectedIdx === idx ? "2px solid #e5ab28" : "1px solid rgba(201,138,22,0.25)",
                  transition: "all 0.2s",
                }}
                onClick={() => {
                  const newIdx = selectedIdx === idx ? -1 : idx;
                  setSelectedIdx(newIdx);
                  if (newIdx !== -1) track(events.VIEW_QUOTE, { sutraId: sutra.id });
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <p style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#2c1810", lineHeight: 1.8, margin: 0, flex: 1 }}>
                    「{sutra.text}」
                  </p>
                  <span style={{ fontSize: "1.2rem", flexShrink: 0 }}>{selectedIdx === idx ? "▲" : "▼"}</span>
                </div>

                {selectedIdx === idx && (
                  <div className="fade-in" style={{ marginTop: "1rem" }}>
                    <p style={{ fontSize: "0.9rem", color: "#a06810", fontFamily: "'Noto Sans SC', sans-serif", marginBottom: "0.75rem" }}>
                      —— {sutra.source}
                    </p>
                    <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.95rem", lineHeight: 1.8, color: "#5c3d2e", marginBottom: "0.75rem" }}>
                      💡 {sutra.explanation}
                    </p>
                    <AudioPlayer
                      text={`${sutra.text}。摘自${sutra.source}。${sutra.explanation}`}
                      label="朗讀"
                      size="sm"
                      isStatic={true}
                      audioUrl={quoteAudios[idx] ?? null}
                      trackEvent={events.LISTEN_QUOTE}
                      trackProps={{ sutraId: sutra.id }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
