"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── 飘出的文字池 ──────────────────────────────────────────────────
const FLOAT_TEXTS = [
  "阿彌陀佛", "南無佛", "般若", "菩提", "涅槃", "慈悲",
  "空", "禪", "悟", "淨", "佛", "法", "僧",
  "🙏", "☸️", "🪷", "📿",
  "諸行無常", "色即是空", "放下", "自在", "清淨",
  "善哉", "阿門", "功德", "迴向",
];

// 里程碑：达到这些数字时触发特效
const MILESTONES = [10, 21, 36, 49, 72, 108, 180, 216, 360, 500, 1000];

// ── Web Audio 合成木鱼声 ──────────────────────────────────────────
function createMokyugyoSound(ctx: AudioContext, intensity: number = 1) {
  const now = ctx.currentTime;

  // 主体：短促的低频敲击（木质感）
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = "sine";
  osc.frequency.setValueAtTime(320 * intensity, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

  filter.type = "bandpass";
  filter.frequency.value = 400;
  filter.Q.value = 2;

  gainNode.gain.setValueAtTime(0.9, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.25);

  // 泛音：木质碰撞感
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(640, now);
  osc2.frequency.exponentialRampToValueAtTime(320, now + 0.05);
  gain2.gain.setValueAtTime(0.3, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 0.12);
}

// ── 里程碑磬声（悠长） ────────────────────────────────────────────
function createBellSound(ctx: AudioContext) {
  const now = ctx.currentTime;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25 - i * 0.04, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 3.5);
  });
}

// ── 飘字粒子类型 ──────────────────────────────────────────────────
interface FloatParticle {
  id: number;
  text: string;
  x: number;       // vw 百分比
  startY: number;  // 起始 px（相对容器）
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  color: string;
}

const COLORS = [
  "#c98a16", "#e5ab28", "#a06810",
  "#8b2252", "#2c7a3f", "#1a5a8a",
  "#c98a16",  // 金色权重更高
];

let particleCounter = 0;

function makeParticle(containerHeight: number): FloatParticle {
  return {
    id: particleCounter++,
    text: FLOAT_TEXTS[Math.floor(Math.random() * FLOAT_TEXTS.length)],
    x: 15 + Math.random() * 70,         // 15%~85% 水平分布
    startY: containerHeight * 0.55,      // 从木鱼附近飘出
    size: 14 + Math.floor(Math.random() * 20),
    duration: 1800 + Math.random() * 1400,
    delay: Math.random() * 200,
    rotate: -30 + Math.random() * 60,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

// ── 主组件 ────────────────────────────────────────────────────────
export default function MokyugyoHero() {
  const [count, setCount] = useState(0);
  const [pressing, setPressing] = useState(false);
  const [particles, setParticles] = useState<FloatParticle[]>([]);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [goldenMode, setGoldenMode] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const milestoneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef<number>(0);

  // 从 localStorage 恢复功德数
  useEffect(() => {
    try {
      const saved = localStorage.getItem("foshuo_merit_count");
      if (saved) setCount(parseInt(saved, 10) || 0);
    } catch { /* ignore */ }
  }, []);

  // 清理超过 40 个粒子，防止 DOM 膨胀
  useEffect(() => {
    if (particles.length > 40) {
      setParticles((prev: FloatParticle[]) => prev.slice(-30));
    }
  }, [particles]);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const handleStrike = useCallback(() => {
    // 防抖：80ms 内不重复触发（手机长按保护）
    const now = Date.now();
    if (now - lastTapRef.current < 80) return;
    lastTapRef.current = now;

    const newCount = count + 1;
    setCount(newCount);

    // 存储
    try { localStorage.setItem("foshuo_merit_count", String(newCount)); } catch { /* ignore */ }

    // 敲击动效
    setPressing(true);
    setTimeout(() => setPressing(false), 120);

    // 震动（手机触觉反馈）
    if (navigator.vibrate) navigator.vibrate(18);

    // 音效
    try {
      const ctx = getAudioCtx();
      createMokyugyoSound(ctx);
    } catch { /* Safari 可能需要用户手势 */ }

    // 飘字（每次 1~3 个）
    const containerH = containerRef.current?.clientHeight ?? 500;
    const count2 = 1 + Math.floor(Math.random() * 2);
    const newParticles = Array.from({ length: count2 }, () => makeParticle(containerH));
    setParticles((prev: FloatParticle[]) => [...prev, ...newParticles]);

    // 里程碑检测
    if (MILESTONES.includes(newCount)) {
      // 特效音
      try { createBellSound(getAudioCtx()); } catch { /* ignore */ }
      setGoldenMode(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);

      const msg = newCount === 108
        ? "🌟 一百单八烦恼皆消！功德圆满！"
        : newCount === 1000
        ? "🏆 千声木鱼，大功告成！"
        : `✨ 已敲 ${newCount} 下，功德殊胜！`;

      setMilestone(msg);
      if (milestoneTimerRef.current) clearTimeout(milestoneTimerRef.current);
      milestoneTimerRef.current = setTimeout(() => {
        setMilestone(null);
        setGoldenMode(false);
      }, 3000);
    }
  }, [count, getAudioCtx]);

  // 键盘支持（空格/回车）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleStrike();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleStrike]);

  // 功德标语
  const getMeritLabel = () => {
    if (count === 0) return "點擊木魚，積累功德";
    if (count < 10)  return "功德已起，繼續敲吧 🙏";
    if (count < 36)  return "心誠則靈，越敲越靜";
    if (count < 108) return `距 108 下還差 ${108 - count} 下`;
    if (count === 108) return "🎉 一百单八，功德圓滿！";
    return `今日功德：${count} 聲`;
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "88vh",
        padding: "2rem 1rem",
        background: goldenMode
          ? "radial-gradient(ellipse at center, #fff8e1 0%, #f5f0e8 60%)"
          : "#f5f0e8",
        transition: "background 0.8s ease",
      }}
    >
      {/* ── 飘字层 ── */}
      {particles.map((p: FloatParticle) => (
        <FloatingChar key={p.id} particle={p} />
      ))}

      {/* ── 里程碑横幅 ── */}
      {milestone && (
        <div
          style={{
            position: "absolute",
            top: "12%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #f9edcc, #e5ab28)",
            border: "2px solid #c98a16",
            borderRadius: "9999px",
            padding: "0.65rem 1.8rem",
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(0.9rem, 3.5vw, 1.1rem)",
            color: "#2c1810",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(201,138,22,0.4)",
            zIndex: 20,
            animation: "milestoneIn 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {milestone}
        </div>
      )}

      {/* ── 顶部功德标题 ── */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem", zIndex: 10 }}>
        <p style={{
          fontFamily: "'Noto Serif SC', serif",
          fontSize: "clamp(1.1rem, 4vw, 1.4rem)",
          color: "#8a5a2f",
          letterSpacing: "0.15em",
          margin: 0,
        }}>
          {getMeritLabel()}
        </p>
      </div>

      {/* ── 木鱼主体 ── */}
      <button
        onPointerDown={handleStrike}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="敲木魚"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          outline: "none",
          WebkitTapHighlightColor: "transparent",
          zIndex: 10,
          transform: pressing
            ? "scale(0.88) translateY(6px)"
            : shake
            ? "scale(1.08)"
            : "scale(1)",
          transition: pressing
            ? "transform 0.07s ease-in"
            : "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
          filter: goldenMode
            ? "drop-shadow(0 0 24px rgba(229,171,40,0.9))"
            : pressing
            ? "drop-shadow(0 4px 12px rgba(100,60,20,0.4))"
            : "drop-shadow(0 8px 20px rgba(100,60,20,0.25))",
          userSelect: "none",
        }}
      >
        <MokyugyoSVG size={typeof window !== "undefined" && window.innerWidth > 380 ? 220 : 180} golden={goldenMode} />
      </button>

      {/* ── 锤子/木棰提示（仅初始显示） ── */}
      {count === 0 && (
        <div
          style={{
            marginTop: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            animation: "bounceHint 1.5s ease-in-out infinite",
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: "2rem" }}>👆</span>
          <span style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "1rem",
            color: "#a06810",
          }}>點我！</span>
        </div>
      )}

      {/* ── 计数器 ── */}
      {count > 0 && (
        <div
          style={{
            marginTop: "2rem",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          {/* 大数字 */}
          <div
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "clamp(3rem, 12vw, 5rem)",
              fontWeight: 700,
              color: goldenMode ? "#c98a16" : "#2c1810",
              lineHeight: 1,
              transition: "color 0.5s",
              textShadow: goldenMode ? "0 0 20px rgba(229,171,40,0.6)" : "none",
            }}
          >
            {count}
          </div>
          <div style={{
            fontFamily: "'Noto Sans SC', sans-serif",
            fontSize: "0.9rem",
            color: "#a06810",
            letterSpacing: "0.2em",
          }}>
            聲
          </div>

          {/* 进度条（奔向108） */}
          {count < 108 && (
            <div style={{ width: "160px", marginTop: "0.5rem" }}>
              <div style={{
                height: "4px",
                background: "rgba(201,138,22,0.15)",
                borderRadius: "2px",
                overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${Math.min((count / 108) * 100, 100)}%`,
                  background: "linear-gradient(to right, #e5ab28, #c98a16)",
                  borderRadius: "2px",
                  transition: "width 0.3s ease",
                }} />
              </div>
              <div style={{
                textAlign: "right",
                fontFamily: "'Noto Sans SC', sans-serif",
                fontSize: "0.75rem",
                color: "#bc8f5e",
                marginTop: "0.25rem",
              }}>
                {count}/108
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 向下滚动提示 ── */}
      {count >= 3 && (
        <div
          style={{
            position: "absolute",
            bottom: "1.5rem",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
            opacity: 0.6,
            animation: "fadeInUp 1s ease 0.5s both",
            zIndex: 10,
          }}
        >
          <span style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.8rem", color: "#a06810" }}>
            向下探索更多
          </span>
          <span style={{ fontSize: "1.2rem", animation: "bounceDown 1.5s ease-in-out infinite" }}>↓</span>
        </div>
      )}
    </div>
  );
}

// ── 飘字粒子组件 ──────────────────────────────────────────────────
function FloatingChar({ particle: p }: { particle: FloatParticle }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${p.x}%`,
        top: `${p.startY}px`,
        fontSize: `${p.size}px`,
        color: p.color,
        fontFamily: "'Noto Serif SC', serif",
        fontWeight: 600,
        pointerEvents: "none",
        zIndex: 5,
        animation: `floatUp ${p.duration}ms ease-out ${p.delay}ms both`,
        transform: `rotate(${p.rotate}deg)`,
        opacity: 0,
        whiteSpace: "nowrap",
        textShadow: "0 2px 8px rgba(201,138,22,0.3)",
      }}
    >
      {p.text}
    </div>
  );
}

// ── 木鱼 SVG ─────────────────────────────────────────────────────
function MokyugyoSVG({ size = 220, golden = false }: { size?: number; golden?: boolean }) {
  const mainColor   = golden ? "#c98a16" : "#8B4513";
  const shadowColor = golden ? "#a06810" : "#5D2E0C";
  const shineColor  = golden ? "#f5d060" : "#D2691E";
  const eyeColor    = golden ? "#fff8e1" : "#FFF5E4";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      {/* 外发光（金光模式） */}
      {golden && (
        <ellipse cx="100" cy="108" rx="85" ry="75"
          fill="none"
          stroke="#e5ab28"
          strokeWidth="6"
          opacity="0.3"
        />
      )}

      {/* 木鱼主体阴影 */}
      <ellipse cx="103" cy="115" rx="70" ry="58" fill="rgba(0,0,0,0.12)" />

      {/* 木鱼主体 */}
      <ellipse cx="100" cy="108" rx="70" ry="58" fill={mainColor} />

      {/* 背部高光 */}
      <ellipse cx="85" cy="85" rx="35" ry="22" fill={shineColor} opacity="0.4" />

      {/* 中间竖缝（木鱼标志性开口） */}
      <path
        d="M100 55 C94 70, 92 85, 93 108 C94 128, 96 140, 100 152 C104 140, 106 128, 107 108 C108 85, 106 70, 100 55Z"
        fill={shadowColor}
        opacity="0.85"
      />
      {/* 缝内高光 */}
      <path
        d="M100 60 C98 73, 97 86, 97.5 108 C98 128, 99 139, 100 150"
        stroke={shineColor}
        strokeWidth="1.5"
        opacity="0.5"
        strokeLinecap="round"
      />

      {/* 左眼 */}
      <ellipse cx="72" cy="95" rx="9" ry="10" fill={shadowColor} />
      <ellipse cx="72" cy="95" rx="6" ry="7" fill={eyeColor} />
      <ellipse cx="73" cy="94" rx="2.5" ry="3" fill={shadowColor} />
      <ellipse cx="74" cy="93" rx="1" ry="1" fill="white" opacity="0.8" />

      {/* 右眼 */}
      <ellipse cx="128" cy="95" rx="9" ry="10" fill={shadowColor} />
      <ellipse cx="128" cy="95" rx="6" ry="7" fill={eyeColor} />
      <ellipse cx="129" cy="94" rx="2.5" ry="3" fill={shadowColor} />
      <ellipse cx="130" cy="93" rx="1" ry="1" fill="white" opacity="0.8" />

      {/* 嘴巴（微笑） */}
      <path
        d="M88 125 Q100 135 112 125"
        stroke={shadowColor}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 顶部榫头（木棒插入处） */}
      <rect x="88" y="38" width="24" height="22" rx="5" fill={shadowColor} />
      <rect x="91" y="35" width="18" height="10" rx="4" fill={mainColor} />
      <rect x="93" y="33" width="14" height="8" rx="3" fill={shineColor} opacity="0.6" />

      {/* 木棰 */}
      <g transform="translate(148, 28) rotate(35)">
        {/* 棰头 */}
        <ellipse cx="0" cy="0" rx="13" ry="11" fill={shadowColor} />
        <ellipse cx="-2" cy="-2" rx="8" ry="7" fill={shineColor} opacity="0.5" />
        {/* 棰柄 */}
        <rect x="-4" y="10" width="8" height="42" rx="4"
          fill={golden ? "#a06810" : "#6B3A1F"} />
        <rect x="-2" y="12" width="3" height="38" rx="2"
          fill={shineColor} opacity="0.3" />
      </g>
    </svg>
  );
}
