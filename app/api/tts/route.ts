import { NextRequest, NextResponse } from "next/server";

// Edge TTS 語音合成 API
// 使用 Microsoft Edge TTS 服務，免費且中文效果自然
export async function POST(request: NextRequest) {
  try {
    const { text, voice = "zh-CN-XiaoxiaoNeural" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "請提供文字" }, { status: 400 });
    }

    // 限制文字長度避免濫用
    const truncatedText = text.slice(0, 500);

    // 使用瀏覽器端 Web Speech API（fallback 方案）
    // 實際部署時可替換為 Edge TTS 或 OpenAI TTS
    return NextResponse.json({
      success: true,
      text: truncatedText,
      voice,
      message: "請使用瀏覽器內建語音合成",
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json({ error: "語音生成失敗" }, { status: 500 });
  }
}

// 可用的中文語音列表
export async function GET() {
  const voices = [
    { id: "zh-CN-XiaoxiaoNeural",  name: "曉曉（女聲，溫柔）", gender: "female" },
    { id: "zh-CN-YunxiNeural",     name: "雲希（男聲，沉穩）", gender: "male"   },
    { id: "zh-TW-HsiaoChenNeural", name: "曉臻（台灣女聲）",   gender: "female" },
    { id: "zh-TW-YunJheNeural",    name: "雲哲（台灣男聲）",   gender: "male"   },
  ];
  return NextResponse.json({ voices });
}
