/**
 * 佛经数据库 — 精选金句与经典段落
 */

import {
  quoteAudioKey,
  sutraAudioKey,
  dailyAudioKey,
  MORNING_KEY,
  EVENING_KEY,
} from "./audio-keys";

export interface DailySutra {
  id: number;
  text: string;
  source: string;
  explanation: string;
}

export interface SutraCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  sutras: Sutra[];
}

export interface Sutra {
  id: string;
  title: string;
  dynasty: string;
  translator: string;
  excerpt: string;
  fullText?: string;
}

// ── 每日金句库（共 10 条，按日期轮播）────────────────────────────
export const dailySutras: DailySutra[] = [
  {
    id: 1,
    text: "一切有为法，如梦幻泡影，如露亦如电，应作如是观。",
    source: "《金刚般若波罗蜜经》",
    explanation: "世间一切事物都是无常的，如梦境、如幻象、如泡沫、如影子、如晨露、如闪电，应当以这样的智慧来看待一切。",
  },
  {
    id: 2,
    text: "过去心不可得，现在心不可得，未来心不可得。",
    source: "《金刚经》",
    explanation: "心念如流水，刹那生灭。过去的已逝，未来的未至，唯有当下这一刻是真实的。放下对过去的执着和对未来的忧虑，活在当下。",
  },
  {
    id: 3,
    text: "菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。",
    source: "《六祖坛经》— 惠能",
    explanation: "智慧的本性本来清净，不受任何染污。烦恼和尘埃本来就不存在，执着才是烦恼的根源。",
  },
  {
    id: 4,
    text: "若人欲了知，三世一切佛，应观法界性，一切唯心造。",
    source: "《华严经》",
    explanation: "所有的境界都是由心所创造的。改变内心，便能改变所见的世界。",
  },
  {
    id: 5,
    text: "诸行无常，诸法无我，涅槃寂静。",
    source: "《法句经》",
    explanation: "一切事物都在不断变化中，没有永恒不变的自我，只有放下执着才能得到真正的平静。",
  },
  {
    id: 6,
    text: "不以物喜，不以己悲，是谓平常心。",
    source: "禅宗语录",
    explanation: "不因外物的好坏而喜悲，不因自身的得失而起伏，这就是禅宗所说的平常心，也是修行的境界。",
  },
  {
    id: 7,
    text: "布施者，能令一切众生欢喜，令一切众生清凉。",
    source: "《地藏菩萨本愿经》",
    explanation: "给予和分享是最大的修行，无论是财物、时间还是善意，真诚的布施能带给众生快乐与清凉。",
  },
  {
    id: 8,
    text: "心若冰清，天塌不惊。万变犹定，千古不移。",
    source: "禅宗偈语",
    explanation: "当内心如冰雪般清澈平静，即使天地崩塌也不会惊慌。这种定力是修行的最高境界。",
  },
  {
    id: 9,
    text: "自性迷即众生，自性觉即是佛。",
    source: "《六祖坛经》",
    explanation: "迷惑自己本性时是普通众生，觉悟自己本性时就是佛。佛不在遥远的他处，而在自己心中。",
  },
  {
    id: 10,
    text: "放下屠刀，立地成佛。",
    source: "禅宗语录",
    explanation: "只要一念觉悟，放下恶念和执着，任何人在任何时刻都可以开始修行，走向解脱之路。",
  },
];

// ── 佛经分类 ──────────────────────────────────────────────────────
export const sutraCategories: SutraCategory[] = [
  {
    id: "heart",
    name: "般若类",
    icon: "🪷",
    description: "智慧与空性的教义",
    sutras: [
      {
        id: "heart-sutra",
        title: "心经",
        dynasty: "唐",
        translator: "玄奘法师",
        excerpt: "观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。舍利子，色不异空，空不异色，色即是空，空即是色，受想行识，亦复如是。",
      },
      {
        id: "diamond-sutra",
        title: "金刚经",
        dynasty: "后秦",
        translator: "鸠摩罗什法师",
        excerpt: "如来说：一切诸相，即是非相。又说：一切众生，即非众生。须菩提！如来是真语者、实语者、如语者、不诳语者、不异语者。",
      },
    ],
  },
  {
    id: "pureland",
    name: "净土类",
    icon: "☸️",
    description: "阿弥陀佛与净土法门",
    sutras: [
      {
        id: "amitabha",
        title: "阿弥陀经",
        dynasty: "后秦",
        translator: "鸠摩罗什法师",
        excerpt: "从是西方，过十万亿佛土，有世界名曰极乐。其土有佛，号阿弥陀，今现在说法。舍利弗，彼土何故名为极乐？其国众生，无有众苦，但受诸乐，故名极乐。",
      },
    ],
  },
  {
    id: "chan",
    name: "禅宗类",
    icon: "🧘",
    description: "禅宗顿悟与修心法门",
    sutras: [
      {
        id: "platform",
        title: "六祖坛经",
        dynasty: "唐",
        translator: "惠能大师",
        excerpt: "善知识！菩提自性，本来清净，但用此心，直了成佛。善知识！且听惠能行由得法事意。惠能严父，本贯范阳，左降流于岭南，作新州百姓。",
      },
    ],
  },
  {
    id: "earth-store",
    name: "菩萨类",
    icon: "🌸",
    description: "菩萨本愿与度众精神",
    sutras: [
      {
        id: "dizang",
        title: "地藏菩萨本愿经",
        dynasty: "唐",
        translator: "实叉难陀法师",
        excerpt: "地狱不空，誓不成佛；众生度尽，方证菩提。是地藏菩萨摩诃萨，于久远劫前，早成佛道，为度苦众生，以方便力，现声闻身。",
      },
    ],
  },
];

// ── 根据日期获取今日金句 ──────────────────────────────────────────
export function getTodaySutra(): DailySutra {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dailySutras[dayOfYear % dailySutras.length];
}

// ── 音频 URL 工具函数 ─────────────────────────────────────────────
export function getAudioUrl(key: string): string | null {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) return null;
  return `${base}/${key}`;
}

export function getDailyAudioUrl(date?: Date): string | null {
  return getAudioUrl(dailyAudioKey(date));
}

export function getQuoteAudioUrl(id: number): string | null {
  return getAudioUrl(quoteAudioKey(id));
}

export function getSutraAudioUrl(sutraId: string): string | null {
  return getAudioUrl(sutraAudioKey(sutraId));
}

export function getMorningAudioUrl(): string | null {
  return getAudioUrl(MORNING_KEY);
}

export function getEveningAudioUrl(): string | null {
  return getAudioUrl(EVENING_KEY);
}

// ── 常见烦恼关键词 ────────────────────────────────────────────────
export const troubleKeywords: Record<string, string> = {
  焦虑: "放下对未来的担忧，活在当下",
  失眠: "心若清净，自然安眠",
  愤怒: "嗔恨如火，烧伤自己",
  悲伤: "无常是宇宙的规律，学会放手",
  孤独: "与自己同在，便是最好的陪伴",
  压力: "万事皆有因缘，随缘不强求",
  家庭: "缘聚缘散皆是修行，以慈悲待家人",
  金钱: "财富如云烟，善用才是真富有",
  病痛: "身苦心不苦，是修行的智慧",
  死亡: "生死轮回，了解无常才能解脱",
};


/**
 * 從 R2 讀取今日 AI 生成的金句（Server Component 專用）
 * 返回 null 時 fallback 到 getTodaySutra()
 */
export async function getTodayAISutra(): Promise<DailySutra | null> {
  try {
    const { fetchJSON } = await import("./r2");
    const today = new Date();
    const ymd = today.toISOString().slice(0, 10);
    const key = `data/daily/${ymd}.json`;
    return fetchJSON<DailySutra>(key);
  } catch {
    return null;
  }
}
