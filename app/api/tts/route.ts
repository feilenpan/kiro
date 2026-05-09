import { NextRequest, NextResponse } from "next/server";

// MiniMax T2A (Text-to-Audio) 語音合成 API
// 文檔：https://platform.minimax.io/docs/api-reference
const MINIMAX_TTS_URL = "https://api.minimax.io/v1/t2a_v2";

// 適合佛經朗誦的聲音列表
const VOICES = [
  { id: "Wise_Woman",    name: "智慧女聲（溫柔莊重）", gender: "female", default: true  },
  { id: "Calm_Woman",    name: "沉穩女聲（寧靜平和）", gender: "female", default: false },
  { id: "Gentle_Man",    name: "溫潤男聲（低沉穩健）", gender: "male",   default: false },
  { id: "Calm_Man",      name: "沉靜男聲（莊重深遠）", gender: "male",   default: false },
];

export async function POST(request: NextRequest) {
  try {
    const { text, voice_id = "Wise_Woman" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "請提供文字" }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      // 無 Key 時告知前端降級使用瀏覽器語音
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    // 限制長度（MiniMax 單次最多 10000 字，我們限 500）
    const truncatedText = text.slice(0, 500);

    const body = {
      model: "speech-02-hd",
      text: truncatedText,
      voice_setting: {
        voice_id,
        speed:  0.85,   // 語速稍慢，適合中老年
        vol:    1.0,
        pitch:  0,
      },
      audio_setting: {
        sample_rate: 32000,
        bitrate:     128000,
        format:      "mp3",
      },
    };

    const res = await fetch(MINIMAX_TTS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("MiniMax TTS error:", res.status, errText);
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    const data = await res.json();

    // MiniMax 返回 hex 編碼的音頻數據
    const audioHex: string = data?.data?.audio ?? "";
    if (!audioHex) {
      console.error("MiniMax TTS: empty audio", data);
      return NextResponse.json({ fallback: true }, { status: 200 });
    }

    // 將 hex 轉為 Buffer，再回傳 mp3 音頻流
    const audioBuffer = Buffer.from(audioHex, "hex");

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type":  "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });

  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}

// 可用語音列表
export async function GET() {
  return NextResponse.json({ voices: VOICES });
}
