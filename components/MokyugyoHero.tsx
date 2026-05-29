"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── 飄字文字池（繁體）────────────────────────────────────────────
const FLOAT_TEXTS = [
  "阿彌陀佛", "南無佛", "般若", "菩提", "涅槃", "慈悲",
  "空", "禪", "悟", "淨", "佛", "法", "僧",
  "🙏", "☸️", "🪷", "📿",
  "諸行無常", "色即是空", "放下", "自在", "清淨",
  "善哉", "功德", "迴向", "本來無一物",
];

const MILESTONES = [10, 21, 36, 49, 72, 108, 180, 360, 500, 1000];

// ── 樂器類型 ──────────────────────────────────────────────────────
type Instrument = "mokugyo" | "bell";

// ── 音效合成：木魚（改良版，更真實的木質感）─────────────────────
function playMokyugyo(ctx: AudioContext) {
  const now = ctx.currentTime;

  // 1. 衝擊瞬態（Click transient）— 模擬木棒敲擊的"咄"
  const clickBuf = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
  const clickData = clickBuf.getChannelData(0);
  for (let i = 0; i < clickData.length; i++) {
    clickData[i] = (Math.random() * 2 - 1) * (1 - i / clickData.length);
  }
  const clickSrc = ctx.createBufferSource();
  clickSrc.buffer = clickBuf;
  const clickFilter = ctx.createBiquadFilter();
  clickFilter.type = "highpass";
  clickFilter.frequency.value = 1200;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.7, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
  clickSrc.connect(clickFilter);
  clickFilter.connect(clickGain);
  clickGain.connect(ctx.destination);
  clickSrc.start(now);

  // 2. 主體共鳴音（低頻 + 中頻疊加，模擬中空木頭）
  [[180, 0.8, 0.18], [360, 0.4, 0.10], [540, 0.2, 0.07]].forEach(([freq, gain0, decay]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.value = freq;
    f.type = "bandpass";
    f.frequency.value = freq;
    f.Q.value = 8;
    g.gain.setValueAtTime(gain0, now + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, now + decay);
    osc.connect(f); f.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + decay + 0.05);
  });

  // 3. 木質高頻泛音（"篤"的木感）
  const osc3 = ctx.createOscillator();
  const g3 = ctx.createGain();
  osc3.type = "triangle";
  osc3.frequency.setValueAtTime(900, now);
  osc3.frequency.exponentialRampToValueAtTime(600, now + 0.04);
  g3.gain.setValueAtTime(0.25, now);
  g3.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc3.connect(g3); g3.connect(ctx.destination);
  osc3.start(now); osc3.stop(now + 0.08);
}

// ── 音效合成：銅鐘（真實磬聲，長尾衰減）────────────────────────
function playBell(ctx: AudioContext, isStrike = false) {
  const now = ctx.currentTime;
  const vol = isStrike ? 1.0 : 0.6;
  // 銅鐘頻率比（基音 + 非整數泛音，產生金屬感）
  const partials: [number, number, number][] = [
    [220, vol * 0.9, 4.5],
    [275, vol * 0.5, 3.2],
    [440, vol * 0.35, 2.8],
    [660, vol * 0.2, 2.0],
    [880, vol * 0.1, 1.2],
    [1320, vol * 0.05, 0.8],
  ];
  partials.forEach(([freq, amp, dur]) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(now); osc.stop(now + dur + 0.1);
  });
  // 敲擊噪聲（金屬碰撞）
  if (isStrike) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.015, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 3000; f.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(now);
  }
}


// ── 飄字粒子 ──────────────────────────────────────────────────────
interface FloatParticle {
  id: number; text: string; x: number;
  size: number; duration: number; delay: number; rotate: number; color: string;
}
const COLORS = ["#c98a16", "#e5ab28", "#a06810", "#c98a16", "#e5ab28", "#8b2252", "#1a5a8a"];
let _pid = 0;
function makeParticle(): FloatParticle {
  return {
    id: _pid++,
    text: FLOAT_TEXTS[Math.floor(Math.random() * FLOAT_TEXTS.length)],
    x: 10 + Math.random() * 80,
    size: 13 + Math.floor(Math.random() * 18),
    duration: 1600 + Math.random() * 1200,
    delay: Math.random() * 150,
    rotate: -35 + Math.random() * 70,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

// ── 主組件 ────────────────────────────────────────────────────────
export default function MokyugyoHero() {
  // 隨機樂器（客戶端渲染後才決定，避免 SSR 不一致）
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [count, setCount] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [ripple, setRipple] = useState(false);          // 敲擊漣漪
  const [particles, setParticles] = useState<FloatParticle[]>([]);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [golden, setGolden] = useState(false);
  const [bellCooldown, setBellCooldown] = useState(false); // 鐘：餘音期間禁止再敲

  const audioCtxRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const milestoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap = useRef(0);

  // 客戶端初始化：隨機樂器 + 恢復功德數
  useEffect(() => {
    setInstrument(Math.random() < 0.5 ? "mokugyo" : "bell");
    try {
      const saved = localStorage.getItem("foshuo_merit_count");
      if (saved) setCount(parseInt(saved, 10) || 0);
    } catch { /* ignore */ }
  }, []);

  // 清理粒子
  useEffect(() => {
    if (particles.length > 50) setParticles(p => p.slice(-35));
  }, [particles]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const handleStrike = useCallback(() => {
    if (instrument === "bell" && bellCooldown) return; // 鐘：餘音期間鎖定
    const now = Date.now();
    if (now - lastTap.current < 80) return;
    lastTap.current = now;

    const newCount = count + 1;
    setCount(newCount);
    try { localStorage.setItem("foshuo_merit_count", String(newCount)); } catch { /**/ }

    // 敲擊動效
    setPressing(true);
    setRipple(false);
    requestAnimationFrame(() => { setTimeout(() => setRipple(true), 10); });
    setTimeout(() => { setPressing(false); }, instrument === "bell" ? 180 : 110);

    // 鐘：敲後禁止 2.5 秒（讓鐘聲有尊嚴地響完）
    if (instrument === "bell") {
      setBellCooldown(true);
      setTimeout(() => setBellCooldown(false), 2500);
    }

    if (navigator.vibrate) navigator.vibrate(instrument === "bell" ? [25, 0, 15] : 18);

    // 音效
    try {
      const ctx = getCtx();
      if (instrument === "mokugyo") playMokyugyo(ctx);
      else playBell(ctx, true);
    } catch { /**/ }

    // 飄字（木魚 1~2 個，鐘 2~4 個）
    const n = instrument === "bell" ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    setParticles(p => [...p, ...Array.from({ length: n }, makeParticle)]);

    // 里程碑
    if (MILESTONES.includes(newCount)) {
      try {
        const ctx = getCtx();
        playBell(ctx, false);
      } catch { /**/ }
      setGolden(true);
      const msg = newCount === 108 ? "🌟 一百單八煩惱皆消！功德圓滿！"
        : newCount === 1000 ? "🏆 千聲功德，殊勝無比！"
        : `✨ 已敲 ${newCount} 下，功德殊勝！`;
      setMilestone(msg);
      if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
      milestoneTimer.current = setTimeout(() => { setMilestone(null); setGolden(false); }, 3200);
    }
  }, [count, instrument, bellCooldown, getCtx]);

  // 鍵盤支持
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); handleStrike(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleStrike]);

  const meritLabel = () => {
    if (!instrument) return "";
    if (count === 0) return instrument === "bell" ? "敲鐘祈福，聲聞十方" : "敲木魚，積累功德";
    if (count < 10)  return "功德已起，繼續吧 🙏";
    if (count < 108) return `距 108 還差 ${108 - count} 下`;
    if (count === 108) return "🎉 一百單八，功德圓滿！";
    return `今日功德：${count} 聲`;
  };

  const isLarge = typeof window !== "undefined" && window.innerWidth > 380;
  const svgSize = isLarge ? 210 : 175;

  // 未初始化前渲染佔位，避免閃爍
  if (!instrument) {
    return (
      <div style={{
        height: "calc(100svh - 64px)", display: "flex", alignItems: "center",
        justifyContent: "center", background: "#f5f0e8",
      }}>
        <div style={{ fontSize: "4rem", animation: "floatGentle 3s ease-in-out infinite" }}>☸️</div>
      </div>
    );
  }


  return (
    <div
      ref={containerRef}
      id="mokugyo"
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        // 100svh 减去 Header 高度，确保手机首屏完整显示
        height: "calc(100svh - 64px)",
        minHeight: "480px",
        background: golden
          ? "radial-gradient(ellipse at 50% 60%, #fff8e1 0%, #f5f0e8 65%)"
          : "radial-gradient(ellipse at 50% 40%, #fdf6e3 0%, #f5f0e8 70%)",
        transition: "background 1s ease",
      }}
    >
      {/* ── 背景裝飾光環（常態呼吸動畫）── */}
      <div style={{
        position: "absolute",
        width: "260px", height: "260px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(229,171,40,0.08) 0%, transparent 70%)",
        animation: "heroGlow 4s ease-in-out infinite",
        pointerEvents: "none",
        zIndex: 1,
      }} />

      {/* ── 飄字層 ── */}
      {particles.map(p => <FloatingChar key={p.id} particle={p} />)}

      {/* ── 里程碑橫幅 ── */}
      {milestone && (
        <div style={{
          position: "absolute", top: "8%", left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #f9edcc, #e5ab28)",
          border: "2px solid #c98a16", borderRadius: "9999px",
          padding: "0.6rem 1.6rem",
          fontFamily: "'Noto Serif TC', 'Noto Serif SC', serif",
          fontSize: "clamp(0.85rem, 3.5vw, 1rem)",
          color: "#2c1810", whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(201,138,22,0.45)",
          zIndex: 20, animation: "milestoneIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>
          {milestone}
        </div>
      )}

      {/* ── 頂部提示語 ── */}
      <p style={{
        fontFamily: "'Noto Serif TC', 'Noto Serif SC', serif",
        fontSize: "clamp(1rem, 3.5vw, 1.2rem)",
        color: "#8a5a2f", letterSpacing: "0.12em",
        margin: "0 0 0.75rem 0", zIndex: 10,
        opacity: 0.9,
      }}>
        {meritLabel()}
      </p>

      {/* ── 主體：樂器按鈕 ── */}
      <button
        onPointerDown={handleStrike}
        onContextMenu={e => e.preventDefault()}
        aria-label={instrument === "bell" ? "敲鐘" : "敲木魚"}
        disabled={instrument === "bell" && bellCooldown}
        style={{
          background: "none", border: "none", cursor: bellCooldown ? "not-allowed" : "pointer",
          padding: 0, outline: "none",
          WebkitTapHighlightColor: "transparent",
          zIndex: 10, position: "relative",
          transform: pressing
            ? instrument === "bell"
              ? "scale(0.94) translateY(4px) rotate(-2deg)"
              : "scale(0.87) translateY(7px)"
            : "scale(1)",
          transition: pressing ? "transform 0.07s ease-in" : "transform 0.22s cubic-bezier(0.34,1.56,0.64,1)",
          filter: golden
            ? "drop-shadow(0 0 28px rgba(229,171,40,0.95))"
            : pressing
            ? "drop-shadow(0 3px 10px rgba(80,40,10,0.5))"
            : "drop-shadow(0 8px 22px rgba(80,40,10,0.22))",
          // 靜止呼吸動效（未敲時）
          animation: (!pressing && !golden)
            ? (instrument === "bell" ? "bellFloat 5s ease-in-out infinite" : "mokoFloat 4s ease-in-out infinite")
            : "none",
          userSelect: "none",
          opacity: (instrument === "bell" && bellCooldown) ? 0.75 : 1,
        }}
      >
        {instrument === "mokugyo"
          ? <MokyugyoSVG size={svgSize} golden={golden} />
          : <BellSVG size={svgSize} golden={golden} pressing={pressing} />
        }
      </button>

      {/* ── 敲擊漣漪 ── */}
      {ripple && (
        <div key={_pid} style={{
          position: "absolute",
          width: "180px", height: "180px",
          borderRadius: "50%",
          border: `2px solid ${golden ? "#e5ab28" : "rgba(201,138,22,0.5)"}`,
          animation: "rippleOut 0.7s ease-out forwards",
          pointerEvents: "none", zIndex: 8,
        }} />
      )}

      {/* ── 首次提示（第 0 次）── */}
      {count === 0 && (
        <div style={{
          marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
          animation: "bounceHint 1.8s ease-in-out infinite", zIndex: 10,
        }}>
          <span style={{ fontSize: "1.8rem" }}>👆</span>
          <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem", color: "#a06810" }}>
            {instrument === "bell" ? "敲！" : "點我！"}
          </span>
        </div>
      )}

      {/* ── 鐘冷卻提示 ── */}
      {instrument === "bell" && bellCooldown && (
        <p style={{
          marginTop: "0.75rem", zIndex: 10,
          fontFamily: "'Noto Sans SC', sans-serif",
          fontSize: "0.85rem", color: "#a06810",
          animation: "fadeIn 0.3s ease",
        }}>
          🔔 靜聽鐘聲…
        </p>
      )}

      {/* ── 計數器 ── */}
      {count > 0 && (
        <div style={{
          marginTop: instrument === "bell" ? "0.75rem" : "1rem",
          zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
        }}>
          <span style={{
            fontFamily: "'Noto Serif TC', 'Noto Serif SC', serif",
            fontSize: "clamp(2.8rem, 11vw, 4.5rem)",
            fontWeight: 700, color: golden ? "#c98a16" : "#2c1810", lineHeight: 1,
            transition: "color 0.5s",
            textShadow: golden ? "0 0 20px rgba(229,171,40,0.5)" : "none",
          }}>
            {count}
          </span>
          <span style={{ fontFamily: "'Noto Sans SC',sans-serif", fontSize: "0.85rem", color: "#a06810", letterSpacing: "0.2em" }}>
            聲
          </span>
          {count < 108 && (
            <div style={{ width: "140px", marginTop: "0.35rem" }}>
              <div style={{ height: "3px", background: "rgba(201,138,22,0.18)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "2px",
                  width: `${Math.min((count / 108) * 100, 100)}%`,
                  background: "linear-gradient(to right, #e5ab28, #c98a16)",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{ textAlign: "right", fontSize: "0.7rem", color: "#bc8f5e", marginTop: "0.2rem", fontFamily: "'Noto Sans SC',sans-serif" }}>
                {count}/108
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 向下滾動提示 ── */}
      {count >= 3 && (
        <div style={{
          position: "absolute", bottom: "1.2rem", left: "50%",
          transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
          zIndex: 10, opacity: 0.55, animation: "fadeInUp 1s ease 0.8s both",
        }}>
          <span style={{ fontFamily: "'Noto Sans SC',sans-serif", fontSize: "0.75rem", color: "#a06810" }}>
            向下探索更多
          </span>
          <span style={{ fontSize: "1rem", animation: "bounceDown 2s ease-in-out infinite" }}>↓</span>
        </div>
      )}
    </div>
  );
}


// ── 飄字粒子組件 ──────────────────────────────────────────────────
function FloatingChar({ particle: p }: { particle: FloatParticle }) {
  return (
    <div style={{
      position: "absolute",
      left: `${p.x}%`,
      bottom: "42%",
      fontSize: `${p.size}px`,
      color: p.color,
      fontFamily: "'Noto Serif TC', 'Noto Serif SC', serif",
      fontWeight: 600,
      pointerEvents: "none",
      zIndex: 5,
      animation: `floatUp ${p.duration}ms ease-out ${p.delay}ms both`,
      transform: `rotate(${p.rotate}deg)`,
      opacity: 0,
      whiteSpace: "nowrap",
      textShadow: "0 1px 6px rgba(201,138,22,0.25)",
    }}>
      {p.text}
    </div>
  );
}

// ── 木魚 SVG ──────────────────────────────────────────────────────
function MokyugyoSVG({ size = 210, golden = false }: { size?: number; golden?: boolean }) {
  const body   = golden ? "#c98a16" : "#7B3A10";
  const shadow = golden ? "#9a6010" : "#4A2008";
  const shine  = golden ? "#f5d060" : "#C4622A";
  const eye    = golden ? "#fff8e1" : "#FFF3E0";

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 靜止呼吸光暈 */}
      <ellipse cx="100" cy="112" rx="78" ry="64"
        fill="rgba(201,138,22,0.07)"
        style={{ animation: "mokoGlow 4s ease-in-out infinite" }} />

      {/* 陰影 */}
      <ellipse cx="103" cy="118" rx="68" ry="55" fill="rgba(0,0,0,0.13)" />
      {/* 主體 */}
      <ellipse cx="100" cy="112" rx="68" ry="55" fill={body} />
      {/* 高光 */}
      <ellipse cx="84" cy="88" rx="32" ry="20" fill={shine} opacity="0.38" />
      {/* 中縫 */}
      <path d="M100 60 C93 76,91 90,92 112 C93 132,95 143,100 155 C105 143,107 132,108 112 C109 90,107 76,100 60Z"
        fill={shadow} opacity="0.82" />
      <path d="M100 65 C98 77,97 90,97.5 112 C98 132,99 141,100 153"
        stroke={shine} strokeWidth="1.5" opacity="0.45" strokeLinecap="round" />
      {/* 左眼 */}
      <ellipse cx="71" cy="98" rx="9" ry="10" fill={shadow} />
      <ellipse cx="71" cy="98" rx="6" ry="7" fill={eye} />
      <ellipse cx="72" cy="97" rx="2.5" ry="3" fill={shadow} />
      <ellipse cx="73" cy="96" rx="1" ry="1" fill="white" opacity="0.9" />
      {/* 右眼 */}
      <ellipse cx="129" cy="98" rx="9" ry="10" fill={shadow} />
      <ellipse cx="129" cy="98" rx="6" ry="7" fill={eye} />
      <ellipse cx="130" cy="97" rx="2.5" ry="3" fill={shadow} />
      <ellipse cx="131" cy="96" rx="1" ry="1" fill="white" opacity="0.9" />
      {/* 嘴（微笑） */}
      <path d="M87 128 Q100 138 113 128" stroke={shadow} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 頂部榫頭 */}
      <rect x="89" y="40" width="22" height="22" rx="5" fill={shadow} />
      <rect x="92" y="37" width="16" height="9" rx="4" fill={body} />
      <rect x="94" y="35" width="12" height="7" rx="3" fill={shine} opacity="0.55" />
      {/* 木棰 */}
      <g transform="translate(150,30) rotate(38)">
        <ellipse cx="0" cy="0" rx="12" ry="10" fill={shadow} />
        <ellipse cx="-2" cy="-2" rx="7" ry="6" fill={shine} opacity="0.45" />
        <rect x="-3.5" y="9" width="7" height="40" rx="3.5" fill={golden ? "#9a6010" : "#5A2E10"} />
        <rect x="-1.5" y="11" width="3" height="36" rx="2" fill={shine} opacity="0.28" />
      </g>
    </svg>
  );
}

// ── 銅鐘 SVG ──────────────────────────────────────────────────────
function BellSVG({ size = 210, golden = false, pressing = false }: { size?: number; golden?: boolean; pressing?: boolean }) {
  const body   = golden ? "#c98a16" : "#8B6914";
  const shadow = golden ? "#9a6010" : "#5C4209";
  const shine  = golden ? "#f5d060" : "#D4A832";
  const rim    = golden ? "#a06810" : "#6B4E0A";

  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 200 210" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 鐘繩/掛鉤 */}
      <rect x="96" y="8" width="8" height="22" rx="4" fill={shadow} />
      <ellipse cx="100" cy="8" rx="10" ry="6" fill={shadow} />
      <ellipse cx="100" cy="8" rx="7" ry="4" fill={shine} opacity="0.5" />

      {/* 鐘身陰影 */}
      <path d="M42 155 Q40 170 100 178 Q160 170 158 155 L152 72 Q148 40 100 38 Q52 40 48 72 Z"
        fill="rgba(0,0,0,0.14)" transform="translate(2,4)" />

      {/* 鐘身主體 */}
      <path d="M42 155 Q40 168 100 176 Q160 168 158 155 L152 72 Q148 40 100 38 Q52 40 48 72 Z"
        fill={body} />

      {/* 鐘身高光（左側） */}
      <path d="M58 70 Q56 100 60 140 Q70 105 68 68 Z" fill={shine} opacity="0.30" />

      {/* 裝飾橫紋 */}
      {[90, 110, 130].map((y, i) => (
        <path key={i}
          d={`M${52 + i * 2} ${y} Q100 ${y + 3} ${148 - i * 2} ${y}`}
          stroke={shadow} strokeWidth="2" fill="none" opacity="0.5" />
      ))}

      {/* 蓮花紋飾（中央） */}
      <circle cx="100" cy="112" r="16" fill="none" stroke={shine} strokeWidth="1.5" opacity="0.55" />
      <text x="100" y="118" textAnchor="middle" fontSize="16" fill={shine} opacity="0.7"
        fontFamily="serif">佛</text>

      {/* 鐘口邊緣（加厚） */}
      <path d="M38 155 Q36 175 100 182 Q164 175 162 155 L158 152 Q155 170 100 177 Q45 170 42 152 Z"
        fill={rim} />
      <path d="M42 155 Q40 168 100 176 Q160 168 158 155" stroke={shine} strokeWidth="1.5" fill="none" opacity="0.4" />

      {/* 鐘鐘槌（敲擊時略偏） */}
      <g transform={`translate(${pressing ? 148 : 152}, 112) rotate(${pressing ? -15 : -25})`}>
        <rect x="-3" y="-30" width="6" height="35" rx="3" fill={shadow} />
        <ellipse cx="0" cy="-30" rx="8" ry="7" fill={shadow} />
        <ellipse cx="-2" cy="-32" rx="5" ry="4" fill={shine} opacity="0.4" />
        <rect x="-1.5" y="-28" width="3" height="30" rx="1.5" fill={shine} opacity="0.2" />
      </g>

      {/* 金光模式：外圈光環 */}
      {golden && (
        <ellipse cx="100" cy="110" rx="90" ry="80"
          fill="none" stroke="#e5ab28" strokeWidth="4" opacity="0.25" />
      )}
    </svg>
  );
}
