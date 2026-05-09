import DailyPageClient from "./DailyPageClient";
import {
  getTodaySutra,
  getDailyAudioUrl,
  getMorningAudioUrl,
  getEveningAudioUrl,
  getQuoteAudioUrl,
  dailySutras,
} from "@/lib/sutras";

/** Server Component：在服務端拼好所有 R2 URL，一次性傳給客戶端 */
export default function DailyPage() {
  const todaySutra   = getTodaySutra();
  const dailyAudio   = getDailyAudioUrl();
  const morningAudio = getMorningAudioUrl();
  const eveningAudio = getEveningAudioUrl();

  // 金句典藏 10 條的音頻 URL 列表
  const quoteAudios  = dailySutras.map((s) => getQuoteAudioUrl(s.id));

  return (
    <DailyPageClient
      todaySutra={todaySutra}
      dailyAudio={dailyAudio}
      morningAudio={morningAudio}
      eveningAudio={eveningAudio}
      quoteAudios={quoteAudios}
    />
  );
}
