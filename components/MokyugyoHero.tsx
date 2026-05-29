"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── 飄字文字池 ────────────────────────────────────────────────────
const FLOAT_TEXTS = [
  "阿彌陀佛", "南無佛", "般若", "菩提", "涅槃", "慈悲",
  "空", "禪", "悟", "淨", "佛", "法", "僧",
  "🙏", "☸️", "🪷", "📿",
  "諸行無常", "色即是空", "放下", "自在", "清淨",
  "善哉", "功德", "迴向",
];
const MILESTONES = [10, 21, 36, 49, 72, 108, 180, 360, 500, 1000];
type Instrument = "mokugyo" | "bell";

// ── 木魚音效：白噪聲 + 諧振濾波器，模擬真實木頭中空共鳴 ────────
function playMokyugyo(ctx: AudioContext) {
  const now = ctx.currentTime;
  const sr = ctx.sampleRate;

  // === 木質衝擊核心：短時白噪聲通過帶通濾波，頻率快速下掃 ===
  const impulseDur = 0.065;
  const buf = ctx.createBuffer(1, Math.ceil(sr * impulseDur), sr);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.exp(-i / (sr * 0.018));  // 快速指數衰減
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;

  // 帶通濾波：中心頻率從 800Hz 下掃到 320Hz，模擬木頭共鳴腔
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(820, now);
  bp.frequency.exponentialRampToValueAtTime(320, now + 0.055);
  bp.Q.value = 12;

  const ng = ctx.createGain();
  ng.gain.setValueAtTime(3.0, now);
  ng.gain.exponentialRampToValueAtTime(0.001, now + impulseDur);

  noise.connect(bp);
  bp.connect(ng);
  ng.connect(ctx.destination);
  noise.start(now);

  // === 低頻體鳴：模擬中空木頭的低頻共振「嗡」尾音 ===
  const bodyFreqs: [number, number, number][] = [
    [165, 0.55, 0.22],
    [330, 0.25, 0.12],
    [495, 0.12, 0.07],
  ];
  bodyFreqs.forEach(([freq, amp, dur]) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.003);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + dur + 0.05);
  });

  // === 硬質打擊感：極短高頻衝擊（"噠"的點） ===
  const clickBuf = ctx.createBuffer(1, Math.ceil(sr * 0.005), sr);
  const cd = clickBuf.getChannelData(0);
  for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * (1 - i / cd.length);
  const click = ctx.createBufferSource();
  click.buffer = clickBuf;
  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass"; hpf.frequency.value = 2500;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(1.2, now);
  cg.gain.exponentialRampToValueAtTime(0.001, now + 0.005);
  click.connect(hpf); hpf.connect(cg); cg.connect(ctx.destination);
  click.start(now);
}

// ── 銅鐘音效：非整數泛音疊加，真實金屬鐘聲 ─────────────────────
function playBell(ctx: AudioContext, isStrike = false) {
  const now = ctx.currentTime;
  const vol = isStrike ? 1.0 : 0.55;
  // 真實銅鐘泛音比（非整數倍，這才是金屬感的來源）
  const partials: [number, number, number][] = [
    [220,  vol * 1.0,  5.0],
    [293,  vol * 0.6,  3.8],
    [440,  vol * 0.4,  3.0],
    [587,  vol * 0.22, 2.2],
    [880,  vol * 0.12, 1.5],
    [1174, vol * 0.06, 0.9],
    [1760, vol * 0.03, 0.5],
  ];
  partials.forEach(([freq, amp, dur]) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(amp, now + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + dur + 0.1);
  });
  // 撞擊瞬態
  if (isStrike) {
    const sr = ctx.sampleRate;
    const b = ctx.createBuffer(1, Math.ceil(sr * 0.012), sr);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.004));
    const s = ctx.createBufferSource(); s.buffer = b;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 4000; f.Q.value = 1.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    s.connect(f); f.connect(g); g.connect(ctx.destination); s.start(now);
  }
}

// ── 飄字粒子 ──────────────────────────────────────────────────────
interface Particle { id: number; text: string; x: number; size: number; dur: number; delay: number; rot: number; color: string; }
const COLORS = ["#c98a16","#e5ab28","#a06810","#c98a16","#e5ab28","#7a3a8a","#1a5a8a"];
let _pid = 0;
const mkParticle = (): Particle => ({
  id: _pid++,
  text: FLOAT_TEXTS[Math.floor(Math.random() * FLOAT_TEXTS.length)],
  x: 8 + Math.random() * 84, size: 14 + Math.floor(Math.random() * 18),
  dur: 1800 + Math.random() * 1400, delay: Math.random() * 120,
  rot: -40 + Math.random() * 80,
  color: COLORS[Math.floor(Math.random() * COLORS.length)],
});

function FloatingChar({ p }: { p: Particle }) {
  return (
    <div style={{
      position: "absolute", left: `${p.x}%`, bottom: "38%",
      fontSize: `${p.size}px`, color: p.color,
      fontFamily: "'Noto Serif TC','Noto Serif SC',serif", fontWeight: 700,
      pointerEvents: "none", zIndex: 5, whiteSpace: "nowrap",
      opacity: 0, textShadow: "0 1px 8px rgba(201,138,22,0.3)",
      animation: `floatUp ${p.dur}ms ease-out ${p.delay}ms both`,
      transform: `rotate(${p.rot}deg)`,
    }}>{p.text}</div>
  );
}


// ── 木魚 SVG（放大版，加眨眼 + 木棰搖擺動畫）────────────────────
function MokyugyoSVG({ size = 260, golden = false, idle = true }: { size?: number; golden?: boolean; idle?: boolean }) {
  const body = golden ? "#c98a16" : "#7B3A10";
  const shad = golden ? "#9a6010" : "#4A2008";
  const lite = golden ? "#f5d060" : "#C4622A";
  const eyeW = golden ? "#fff8e1" : "#FFF3E0";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 外發光暈（idle 時呼吸） */}
      <ellipse cx="100" cy="112" rx="82" ry="66"
        fill={golden ? "rgba(229,171,40,0.15)" : "rgba(201,138,22,0.08)"}
        style={{ animationName: idle ? "mokoGlow" : "none", animationDuration: "3.5s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }} />
      {/* 第二層光暈 */}
      {idle && <ellipse cx="100" cy="112" rx="72" ry="58"
        fill="rgba(229,171,40,0.06)"
        style={{ animationName: "mokoGlow", animationDuration: "3.5s", animationDelay: "0.8s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }} />}
      {/* 陰影 */}
      <ellipse cx="103" cy="120" rx="67" ry="54" fill="rgba(0,0,0,0.14)" />
      {/* 主體 */}
      <ellipse cx="100" cy="113" rx="67" ry="54" fill={body} />
      {/* 高光 */}
      <ellipse cx="82" cy="89" rx="30" ry="19" fill={lite} opacity="0.36" />
      {/* 中縫 */}
      <path d="M100 62 C93 77,91 91,92 113 C93 133,95 144,100 156 C105 144,107 133,108 113 C109 91,107 77,100 62Z" fill={shad} opacity="0.80" />
      <path d="M100 67 C98 79,97 91,97.5 113 C98 133,99 142,100 154" stroke={lite} strokeWidth="1.5" opacity="0.42" strokeLinecap="round" />

      {/* 左眼（含眨眼動畫） */}
      <ellipse cx="70" cy="99" rx="9" ry="10" fill={shad} />
      <ellipse cx="70" cy="99" rx="6" ry="7" fill={eyeW}
        style={idle ? { animationName: "eyeBlink", animationDuration: "4s", animationDelay: "1s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" } : {}} />
      <ellipse cx="71" cy="98" rx="2.5" ry="3" fill={shad}
        style={idle ? { animationName: "eyeBlink", animationDuration: "4s", animationDelay: "1s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" } : {}} />
      <ellipse cx="72" cy="97" rx="1" ry="1" fill="white" opacity="0.9" />
      {/* 右眼 */}
      <ellipse cx="130" cy="99" rx="9" ry="10" fill={shad} />
      <ellipse cx="130" cy="99" rx="6" ry="7" fill={eyeW}
        style={idle ? { animationName: "eyeBlink", animationDuration: "4s", animationDelay: "1s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" } : {}} />
      <ellipse cx="131" cy="98" rx="2.5" ry="3" fill={shad}
        style={idle ? { animationName: "eyeBlink", animationDuration: "4s", animationDelay: "1s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" } : {}} />
      <ellipse cx="132" cy="97" rx="1" ry="1" fill="white" opacity="0.9" />
      {/* 嘴 */}
      <path d="M87 129 Q100 140 113 129" stroke={shad} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* 頂部榫頭 */}
      <rect x="89" y="42" width="22" height="22" rx="5" fill={shad} />
      <rect x="92" y="39" width="16" height="9" rx="4" fill={body} />
      <rect x="94" y="37" width="12" height="7" rx="3" fill={lite} opacity="0.5" />
      {/* 木棰（idle 時自動搖擺吸引點擊） */}
      <g style={idle ? {
        transformOrigin: "148px 28px",
        animationName: "malletSwing",
        animationDuration: "2.4s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
      } : { transform: "rotate(38deg)", transformOrigin: "148px 28px" }}
        transform="rotate(38, 148, 28)">
        <ellipse cx="148" cy="28" rx="13" ry="11" fill={shad} />
        <ellipse cx="146" cy="26" rx="8" ry="7" fill={lite} opacity="0.42" />
        <rect x="144" y="38" width="8" height="44" rx="4" fill={golden ? "#9a6010" : "#5A2E10"} />
        <rect x="146" y="40" width="3" height="40" rx="2" fill={lite} opacity="0.26" />
      </g>
    </svg>
  );
}

// ── 銅鐘 SVG（放大版） ────────────────────────────────────────────
function BellSVG({ size = 260, golden = false, pressing = false, idle = true }: { size?: number; golden?: boolean; pressing?: boolean; idle?: boolean }) {
  const body = golden ? "#c98a16" : "#8B6914";
  const shad = golden ? "#9a6010" : "#5C4209";
  const lite = golden ? "#f5d060" : "#D4A832";
  const rim  = golden ? "#a06810" : "#6B4E0A";
  return (
    <svg width={size} height={Math.round(size * 1.08)} viewBox="0 0 200 216" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 掛繩 */}
      <rect x="96" y="6" width="8" height="24" rx="4" fill={shad} />
      <ellipse cx="100" cy="6" rx="11" ry="6" fill={shad} />
      <ellipse cx="100" cy="6" rx="8" ry="4" fill={lite} opacity="0.45" />

      {/* 光暈（idle 呼吸） */}
      {idle && <ellipse cx="100" cy="120" rx="88" ry="76"
        fill={golden ? "rgba(229,171,40,0.13)" : "rgba(201,138,22,0.07)"}
        style={{ animationName: "mokoGlow", animationDuration: "4s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite" }} />}

      {/* 鐘身陰影 */}
      <path d="M40 158 Q38 174 100 182 Q162 174 160 158 L154 74 Q150 40 100 38 Q50 40 46 74 Z"
        fill="rgba(0,0,0,0.15)" transform="translate(2,4)" />
      {/* 鐘身 */}
      <path d="M40 158 Q38 172 100 180 Q162 172 160 158 L154 74 Q150 40 100 38 Q50 40 46 74 Z" fill={body} />
      {/* 左側高光 */}
      <path d="M56 72 Q54 104 58 144 Q68 108 66 70 Z" fill={lite} opacity="0.28" />
      {/* 三道橫紋 */}
      {[94,114,134].map((y,i)=>(
        <path key={i} d={`M${50+i*2} ${y} Q100 ${y+3} ${150-i*2} ${y}`}
          stroke={shad} strokeWidth="2.2" fill="none" opacity="0.45" />
      ))}
      {/* 中央蓮紋圈 + 佛字 */}
      <circle cx="100" cy="116" r="18" fill="none" stroke={lite} strokeWidth="1.8" opacity="0.5" />
      <text x="100" y="123" textAnchor="middle" fontSize="17" fill={lite} opacity="0.68" fontFamily="serif">佛</text>
      {/* 底邊加厚 */}
      <path d="M36 158 Q34 180 100 188 Q166 180 164 158 L160 155 Q157 175 100 182 Q43 175 40 155 Z" fill={rim} />
      <path d="M40 158 Q38 172 100 180 Q162 172 160 158" stroke={lite} strokeWidth="1.5" fill="none" opacity="0.38" />

      {/* 金光模式外圈 */}
      {golden && <ellipse cx="100" cy="114" rx="92" ry="82" fill="none" stroke="#e5ab28" strokeWidth="4" opacity="0.22" />}

      {/* 鐘槌（idle 時自動搖擺） */}
      <g style={idle && !pressing ? {
        transformOrigin: "155px 116px",
        animationName: "malletSwingBell",
        animationDuration: "3s", animationTimingFunction: "ease-in-out", animationIterationCount: "infinite",
      } : { transform: pressing ? "rotate(-12deg)" : "rotate(-22deg)", transformOrigin: "155px 116px" }}
        transform={pressing ? "rotate(-12, 155, 116)" : "rotate(-22, 155, 116)"}>
        <rect x="152" y="82" width="6" height="38" rx="3" fill={shad} />
        <ellipse cx="155" cy="80" rx="9" ry="8" fill={shad} />
        <ellipse cx="153" cy="78" rx="5.5" ry="5" fill={lite} opacity="0.38" />
        <rect x="153.5" y="84" width="3" height="34" rx="1.5" fill={lite} opacity="0.2" />
      </g>
    </svg>
  );
}


// ── 主組件 ────────────────────────────────────────────────────────
export default function MokyugyoHero() {
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [count,      setCount]      = useState(0);
  const [pressing,   setPressing]   = useState(false);
  const [particles,  setParticles]  = useState<Particle[]>([]);
  const [milestone,  setMilestone]  = useState<string | null>(null);
  const [golden,     setGolden]     = useState(false);
  const [cooldown,   setCooldown]   = useState(false);
  // ripple key — 每次敲擊重置，觸發 re-mount 重播動畫
  const [rippleKey,  setRippleKey]  = useState(0);
  const [showRipple, setShowRipple] = useState(false);

  const audioCtxRef    = useRef<AudioContext | null>(null);
  const milestoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap        = useRef(0);

  // 客戶端初始化
  useEffect(() => {
    setInstrument(Math.random() < 0.5 ? "mokugyo" : "bell");
    try {
      const saved = localStorage.getItem("foshuo_merit_count");
      if (saved) setCount(parseInt(saved, 10) || 0);
    } catch { /**/ }
  }, []);

  // 粒子上限
  useEffect(() => {
    if (particles.length > 55) setParticles(p => p.slice(-40));
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
    if (cooldown) return;
    const now = Date.now();
    if (now - lastTap.current < 85) return;
    lastTap.current = now;

    const nc = count + 1;
    setCount(nc);
    try { localStorage.setItem("foshuo_merit_count", String(nc)); } catch { /**/ }

    // 按壓動效
    setPressing(true);
    setRippleKey(k => k + 1);
    setShowRipple(true);
    setTimeout(() => { setPressing(false); setShowRipple(false); }, instrument === "bell" ? 200 : 120);

    // 銅鐘餘音冷卻
    if (instrument === "bell") {
      setCooldown(true);
      setTimeout(() => setCooldown(false), 2800);
    }

    if (navigator.vibrate) navigator.vibrate(instrument === "bell" ? [30, 0, 18] : 20);

    // 音效
    try {
      const ctx = getCtx();
      if (instrument === "mokugyo") playMokyugyo(ctx);
      else playBell(ctx, true);
    } catch { /**/ }

    // 飄字
    const n = instrument === "bell" ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
    setParticles(p => [...p, ...Array.from({ length: n }, mkParticle)]);

    // 里程碑
    if (MILESTONES.includes(nc)) {
      try { playBell(getCtx(), false); } catch { /**/ }
      setGolden(true);
      const msg = nc === 108 ? "🌟 一百單八煩惱皆消！功德圓滿！"
        : nc === 1000 ? "🏆 千聲功德，殊勝無比！"
        : `✨ 已敲 ${nc} 下，功德殊勝！`;
      setMilestone(msg);
      if (milestoneTimer.current) clearTimeout(milestoneTimer.current);
      milestoneTimer.current = setTimeout(() => { setMilestone(null); setGolden(false); }, 3500);
    }
  }, [count, instrument, cooldown, getCtx]);

  // 鍵盤
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); handleStrike(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleStrike]);

  const label = () => {
    if (!instrument) return "";
    if (count === 0) return instrument === "bell" ? "敲鐘祈福，聲聞十方" : "敲木魚，積累功德";
    if (count < 10)  return "功德已起，繼續吧 🙏";
    if (count < 108) return `距 108 還差 ${108 - count} 下`;
    if (count === 108) return "🎉 一百單八，功德圓滿！";
    return `今日功德：${count} 聲`;
  };

  // SVG 尺寸：手機 260，大屏 310
  const svgSize = typeof window !== "undefined" && window.innerWidth >= 420 ? 310 : 260;
  const isIdle  = !pressing && !golden;

  // 佔位
  if (!instrument) return (
    <div style={{ height: "calc(100svh - 64px)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f0e8" }}>
      <div style={{ fontSize: "5rem", animation: "mokoFloat 3s ease-in-out infinite" }}>☸️</div>
    </div>
  );

  return (
    <div
      id="mokugyo"
      style={{
        position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        // 精確佔滿視口，不允許超出，防止首屏滾動
        height: "calc(100svh - 64px)",
        maxHeight: "calc(100svh - 64px)",
        minHeight: "520px",
        background: golden
          ? "radial-gradient(ellipse at 50% 55%, #fff8e1 0%, #f5f0e8 65%)"
          : "radial-gradient(ellipse at 50% 40%, #fdf6e3 0%, #f5f0e8 72%)",
        transition: "background 0.9s ease",
      }}
    >
      {/* 背景呼吸光圈 */}
      <div style={{
        position: "absolute", width: "300px", height: "300px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(229,171,40,0.09) 0%, transparent 70%)",
        animation: "heroGlow 4s ease-in-out infinite",
        pointerEvents: "none", zIndex: 1,
      }} />

      {/* idle 時：旋轉粒子環（6個光點繞樂器一圈） */}
      {isIdle && count === 0 && (
        <div style={{
          position: "absolute", width: "320px", height: "320px",
          animation: "orbitRing 8s linear infinite",
          pointerEvents: "none", zIndex: 2,
        }}>
          {[0,60,120,180,240,300].map((deg, i) => (
            <div key={i} style={{
              position: "absolute", top: "50%", left: "50%",
              width: i % 2 === 0 ? "8px" : "5px",
              height: i % 2 === 0 ? "8px" : "5px",
              borderRadius: "50%",
              background: i % 3 === 0 ? "#e5ab28" : i % 3 === 1 ? "#c98a16" : "#f5d060",
              boxShadow: "0 0 6px rgba(229,171,40,0.8)",
              transform: `rotate(${deg}deg) translate(150px) translate(-50%,-50%)`,
              opacity: 0.7 + (i % 3) * 0.1,
            }} />
          ))}
        </div>
      )}

      {/* 飄字 */}
      {particles.map(p => <FloatingChar key={p.id} p={p} />)}

      {/* 里程碑 */}
      {milestone && (
        <div style={{
          position: "absolute", top: "7%", left: "50%", transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #f9edcc, #e5ab28)",
          border: "2px solid #c98a16", borderRadius: "9999px",
          padding: "0.6rem 1.8rem",
          fontFamily: "'Noto Serif TC','Noto Serif SC',serif",
          fontSize: "clamp(0.82rem, 3.5vw, 1rem)", color: "#2c1810", whiteSpace: "nowrap",
          boxShadow: "0 4px 24px rgba(201,138,22,0.5)",
          zIndex: 20, animation: "milestoneIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}>{milestone}</div>
      )}

      {/* 提示語 */}
      <p style={{
        fontFamily: "'Noto Serif TC','Noto Serif SC',serif",
        fontSize: "clamp(0.95rem, 3.5vw, 1.15rem)", color: "#8a5a2f",
        letterSpacing: "0.12em", margin: "0 0 0.5rem 0", zIndex: 10,
      }}>{label()}</p>

      {/* 主體按鈕 */}
      <button
        onPointerDown={handleStrike}
        onContextMenu={e => e.preventDefault()}
        aria-label={instrument === "bell" ? "敲鐘" : "敲木魚"}
        disabled={cooldown}
        style={{
          background: "none", border: "none",
          cursor: cooldown ? "default" : "pointer",
          padding: 0, outline: "none",
          WebkitTapHighlightColor: "transparent",
          zIndex: 10, position: "relative",
          transform: pressing
            ? instrument === "bell" ? "scale(0.91) translateY(6px) rotate(-3deg)" : "scale(0.84) translateY(9px)"
            : "scale(1)",
          transition: pressing ? "transform 0.07s ease-in" : "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          filter: golden
            ? "drop-shadow(0 0 32px rgba(229,171,40,1))"
            : pressing
            ? "drop-shadow(0 2px 8px rgba(60,30,5,0.55))"
            : "drop-shadow(0 10px 28px rgba(60,30,5,0.20))",
          // idle 浮動（CSS animation 在按下時關掉）
          animation: isIdle
            ? (instrument === "bell" ? "bellFloat 5s ease-in-out infinite" : "mokoFloat 4s ease-in-out infinite")
            : "none",
          userSelect: "none",
          opacity: cooldown ? 0.72 : 1,
        }}
      >
        {instrument === "mokugyo"
          ? <MokyugyoSVG size={svgSize} golden={golden} idle={isIdle} />
          : <BellSVG size={svgSize} golden={golden} pressing={pressing} idle={isIdle} />
        }
      </button>

      {/* 敲擊漣漪 */}
      {showRipple && (
        <div key={rippleKey} style={{
          position: "absolute",
          width: `${svgSize * 0.85}px`, height: `${svgSize * 0.85}px`,
          borderRadius: "50%",
          border: `2px solid ${golden ? "#e5ab28" : "rgba(201,138,22,0.55)"}`,
          animation: "rippleOut 0.75s ease-out forwards",
          pointerEvents: "none", zIndex: 8,
        }} />
      )}

      {/* 首次提示箭頭 + 文字 */}
      {count === 0 && !pressing && (
        <div style={{
          marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem",
          zIndex: 10, animation: "pulseHint 1.6s ease-in-out infinite",
        }}>
          <span style={{ fontSize: "2rem" }}>👆</span>
          <span style={{ fontFamily: "'Noto Sans TC','Noto Sans SC',sans-serif", fontSize: "1.05rem", color: "#a06810", fontWeight: 500 }}>
            {instrument === "bell" ? "敲！" : "點我！"}
          </span>
        </div>
      )}

      {/* 銅鐘餘音提示 */}
      {instrument === "bell" && cooldown && (
        <p style={{
          marginTop: "0.6rem", zIndex: 10,
          fontFamily: "'Noto Sans SC',sans-serif", fontSize: "0.88rem", color: "#a06810",
          animation: "fadeIn 0.3s ease",
        }}>🔔 靜聽鐘聲…</p>
      )}

      {/* 計數器 */}
      {count > 0 && (
        <div style={{ marginTop: "0.65rem", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.15rem" }}>
          <span style={{
            fontFamily: "'Noto Serif TC','Noto Serif SC',serif",
            fontSize: "clamp(2.6rem, 11vw, 4.2rem)", fontWeight: 700,
            color: golden ? "#c98a16" : "#2c1810", lineHeight: 1,
            textShadow: golden ? "0 0 22px rgba(229,171,40,0.55)" : "none",
            transition: "color 0.5s, text-shadow 0.5s",
          }}>{count}</span>
          <span style={{ fontFamily: "'Noto Sans SC',sans-serif", fontSize: "0.82rem", color: "#a06810", letterSpacing: "0.22em" }}>聲</span>
          {count < 108 && (
            <div style={{ width: "130px", marginTop: "0.3rem" }}>
              <div style={{ height: "3px", background: "rgba(201,138,22,0.18)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min((count / 108) * 100, 100)}%`, background: "linear-gradient(to right, #e5ab28, #c98a16)", borderRadius: "2px", transition: "width 0.3s" }} />
              </div>
              <div style={{ textAlign: "right", fontSize: "0.68rem", color: "#bc8f5e", marginTop: "0.18rem", fontFamily: "'Noto Sans SC',sans-serif" }}>{count}/108</div>
            </div>
          )}
        </div>
      )}

      {/* 向下滾動提示（敲 3 下後出現） */}
      {count >= 3 && (
        <div style={{
          position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem",
          zIndex: 10, opacity: 0.5, animation: "fadeInUp 1s ease 1s both",
        }}>
          <span style={{ fontFamily: "'Noto Sans SC',sans-serif", fontSize: "0.72rem", color: "#a06810" }}>向下探索更多</span>
          <span style={{ fontSize: "0.9rem", animation: "bounceDown 2s ease-in-out infinite" }}>↓</span>
        </div>
      )}
    </div>
  );
}
