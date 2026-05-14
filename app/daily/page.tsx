import DailyPageClient from "./DailyPageClient";
import {
  getTodaySutra,
  getTodayAISutra,
  getDailyAudioUrl,
  getMorningAudioUrl,
  getEveningAudioUrl,
  getQuoteAudioUrl,
  dailySutras,
} from "@/lib/sutras";

/** Server Component：在服務端拼好所有 R2 URL，一次性傳給客戶端 */
export default async function DailyPage() {
  // 優先使用 AI 生成的今日金句，失敗則 fallback 到靜態數組
  const aiSutra    = await getTodayAISutra();
  const todaySutra = aiSutra ?? getTodaySutra();

  const dailyAudio   = getDailyAudioUrl();
  const morningAudio = getMorningAudioUrl();
  const eveningAudio = getEveningAudioUrl();

  // 金句典藏 10 條的音頻 URL 列表
  const quoteAudios = dailySutras.map((s) => getQuoteAudioUrl(s.id));

  return (
    <DailyPageClient
      todaySutra={todaySutra}
      aiGenerated={!!aiSutra}
      dailyAudio={dailyAudio}
      morningAudio={morningAudio}
      eveningAudio={eveningAudio}
      quoteAudios={quoteAudios}
    />
  );
}
