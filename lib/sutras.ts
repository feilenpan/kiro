/**
 * 佛經數據庫 — 精選金句與經典段落
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

// ── 每日金句庫（共 10 條，按日期輪播）────────────────────────────
export const dailySutras: DailySutra[] = [
  {
    id: 1,
    text: "一切有為法，如夢幻泡影，如露亦如電，應作如是觀。",
    source: "《金剛般若波羅蜜經》",
    explanation: "世間一切事物都是無常的，如夢境、如幻象、如泡沫、如影子、如晨露、如閃電，應當以這樣的智慧來看待一切。",
  },
  {
    id: 2,
    text: "過去心不可得，現在心不可得，未來心不可得。",
    source: "《金剛經》",
    explanation: "心念如流水，剎那生滅。過去的已逝，未來的未至，唯有當下這一刻是真實的。放下對過去的執著和對未來的憂慮，活在當下。",
  },
  {
    id: 3,
    text: "菩提本無樹，明鏡亦非臺。本來無一物，何處惹塵埃。",
    source: "《六祖壇經》— 惠能",
    explanation: "智慧的本性本來清淨，不受任何染污。煩惱和塵埃本來就不存在，執著才是煩惱的根源。",
  },
  {
    id: 4,
    text: "若人欲了知，三世一切佛，應觀法界性，一切唯心造。",
    source: "《華嚴經》",
    explanation: "所有的境界都是由心所創造的。改變內心，便能改變所見的世界。",
  },
  {
    id: 5,
    text: "諸行無常，諸法無我，涅槃寂靜。",
    source: "《法句經》",
    explanation: "一切事物都在不斷變化中，沒有永恆不變的自我，只有放下執著才能得到真正的平靜。",
  },
  {
    id: 6,
    text: "不以物喜，不以己悲，是謂平常心。",
    source: "禪宗語錄",
    explanation: "不因外物的好壞而喜悲，不因自身的得失而起伏，這就是禪宗所說的平常心，也是修行的境界。",
  },
  {
    id: 7,
    text: "佈施者，能令一切眾生歡喜，令一切眾生清涼。",
    source: "《地藏菩薩本願經》",
    explanation: "給予和分享是最大的修行，無論是財物、時間還是善意，真誠的佈施能帶給眾生快樂與清涼。",
  },
  {
    id: 8,
    text: "心若冰清，天塌不驚。萬變猶定，千古不移。",
    source: "禪宗偈語",
    explanation: "當內心如冰雪般清澈平靜，即使天地崩塌也不會驚慌。這種定力是修行的最高境界。",
  },
  {
    id: 9,
    text: "自性迷即眾生，自性覺即是佛。",
    source: "《六祖壇經》",
    explanation: "迷惑自己本性時是普通眾生，覺悟自己本性時就是佛。佛不在遙遠的他處，而在自己心中。",
  },
  {
    id: 10,
    text: "放下屠刀，立地成佛。",
    source: "禪宗語錄",
    explanation: "只要一念覺悟，放下惡念和執著，任何人在任何時刻都可以開始修行，走向解脫之路。",
  },
];

// ── 佛經分類 ──────────────────────────────────────────────────────
export const sutraCategories: SutraCategory[] = [
  {
    id: "heart",
    name: "般若類",
    icon: "🪷",
    description: "智慧與空性的教義",
    sutras: [
      {
        id: "heart-sutra",
        title: "心經",
        dynasty: "唐",
        translator: "玄奘法師",
        excerpt: "觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。舍利子，色不異空，空不異色，色即是空，空即是色，受想行識，亦復如是。",
      },
      {
        id: "diamond-sutra",
        title: "金剛經",
        dynasty: "後秦",
        translator: "鳩摩羅什法師",
        excerpt: "如來說：一切諸相，即是非相。又說：一切眾生，即非眾生。須菩提！如來是真語者、實語者、如語者、不誑語者、不異語者。",
      },
    ],
  },
  {
    id: "pureland",
    name: "淨土類",
    icon: "☸️",
    description: "阿彌陀佛與淨土法門",
    sutras: [
      {
        id: "amitabha",
        title: "阿彌陀經",
        dynasty: "後秦",
        translator: "鳩摩羅什法師",
        excerpt: "從是西方，過十萬億佛土，有世界名曰極樂。其土有佛，號阿彌陀，今現在說法。舍利弗，彼土何故名為極樂？其國眾生，無有眾苦，但受諸樂，故名極樂。",
      },
    ],
  },
  {
    id: "chan",
    name: "禪宗類",
    icon: "🧘",
    description: "禪宗頓悟與修心法門",
    sutras: [
      {
        id: "platform",
        title: "六祖壇經",
        dynasty: "唐",
        translator: "惠能大師",
        excerpt: "善知識！菩提自性，本來清淨，但用此心，直了成佛。善知識！且聽惠能行由得法事意。惠能嚴父，本貫范陽，左降流於嶺南，作新州百姓。",
      },
    ],
  },
  {
    id: "earth-store",
    name: "菩薩類",
    icon: "🌸",
    description: "菩薩本願與度眾精神",
    sutras: [
      {
        id: "dizang",
        title: "地藏菩薩本願經",
        dynasty: "唐",
        translator: "實叉難陀法師",
        excerpt: "地獄不空，誓不成佛；眾生度盡，方證菩提。是地藏菩薩摩訶薩，於久遠劫前，早成佛道，為度苦眾生，以方便力，現聲聞身。",
      },
    ],
  },
];

// ── 根據日期獲取今日金句 ──────────────────────────────────────────
export function getTodaySutra(): DailySutra {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return dailySutras[dayOfYear % dailySutras.length];
}

// ── 音頻 URL 工具函數 ─────────────────────────────────────────────
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

// ── 常見煩惱關鍵詞 ────────────────────────────────────────────────
export const troubleKeywords: Record<string, string> = {
  焦慮: "放下對未來的擔憂，活在當下",
  失眠: "心若清淨，自然安眠",
  憤怒: "嗔恨如火，燒傷自己",
  悲傷: "無常是宇宙的規律，學會放手",
  孤獨: "與自己同在，便是最好的陪伴",
  壓力: "萬事皆有因緣，隨緣不強求",
  家庭: "緣聚緣散皆是修行，以慈悲待家人",
  金錢: "財富如雲煙，善用才是真富有",
  病痛: "身苦心不苦，是修行的智慧",
  死亡: "生死輪迴，了解無常才能解脫",
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
