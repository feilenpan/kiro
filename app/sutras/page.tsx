import SutrasPageClient from "./SutrasPageClient";
import { sutraCategories, getSutraAudioUrl } from "@/lib/sutras";

/** Server Component：服務端拼好佛經音頻 URL，傳給客戶端 */
export default function SutrasPage() {
  // 把所有佛經的 R2 URL 預先解析好，key = sutra.id
  const sutraAudios: Record<string, string | null> = {};
  for (const cat of sutraCategories) {
    for (const sutra of cat.sutras) {
      sutraAudios[sutra.id] = getSutraAudioUrl(sutra.id);
    }
  }

  return <SutrasPageClient sutraAudios={sutraAudios} />;
}
