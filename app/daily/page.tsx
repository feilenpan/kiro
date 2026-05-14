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

export default async function DailyPage() {
  const aiSutra    = await getTodayAISutra();
  const todaySutra = aiSutra ?? getTodaySutra();

  const dailyAudio   = getDailyAudioUrl();
  const morningAudio = getMorningAudioUrl();
  const eveningAudio = getEveningAudioUrl();
  const quoteAudios  = dailySutras.map((s) => getQuoteAudioUrl(s.id));

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
