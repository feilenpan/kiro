import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `你是「佛說」平台的 AI 法師助手，精通佛法、禪學、淨土、般若等各宗派義理。

【角色定位】
- 你以溫和慈悲、智慧平和的語氣與用戶交流
- 你是一位學識淵博又平易近人的佛法指引者
- 你用現代白話解釋佛法，讓中老年用戶也能輕鬆理解

【回答原則】
1. 先以溫暖的語氣回應用戶的情緒和感受
2. 結合佛法智慧給出引導，引用 1-2 句相關經文
3. 提供實際可操作的建議（如念佛、靜坐、觀呼吸等）
4. 結尾以祝福語收尾，如「願您吉祥如意」「阿彌陀佛」「善哉善哉」

【語氣風格】
- 稱呼用戶為「施主」或「善信」
- 用語溫和莊重，避免過於口語化
- 適當使用佛教用語但要附帶解釋
- 回答長度適中，100-300字為宜

【重要提示】
- 你提供的是佛法智慧引導，非醫療、法律、財務建議
- 遇到心理危機情況，建議用戶尋求專業幫助
- 不批評任何宗教或信仰

請用繁體中文回答。`;

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "請輸入問題" }, { status: 400 });
    }

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: getMockReply(message),
        isMock: true,
      });
    }

    // MiniMax Token Plan 端點：api.minimaxi.com（注意不是 api.minimax.io）
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.minimaxi.com/v1",
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      // 保留最近 6 輪對話歷史
      ...history.slice(-12),
      { role: "user", content: message },
    ];

    const completion = await client.chat.completions.create({
      model: "MiniMax-M2.5",  // M2.5 性價比更高，同樣支持繁體中文
      messages,
      max_tokens: 600,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "阿彌陀佛，請再試一次。";

    // 過濾推理模型輸出的 <think>...</think> 標籤（用戶不應看到思考過程）
    const reply = raw
      .replace(/<think>[\s\S]*?<\/think>/gi, "")  // 移除完整 think 塊
      .replace(/<think>[\s\S]*/gi, "")             // 移除未閉合的 think
      .trim();

    return NextResponse.json({ reply: reply || "阿彌陀佛，請再試一次。", isMock: false });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { reply: getMockReply("default"), isMock: true },
      { status: 200 }
    );
  }
}

// 無 API Key 時的示範回答
function getMockReply(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("焦慮") || lower.includes("擔心") || lower.includes("害怕")) {
    return `善信，您的焦慮貧僧感同身受。

《金剛經》有云：「過去心不可得，現在心不可得，未來心不可得。」焦慮往往源於對未來的過度擔憂，而未來尚未到來，過去已然流逝，唯有此刻的呼吸是真實的。

不妨試試這個方法：找一個安靜的地方，閉上眼睛，將注意力輕柔地放在呼吸上。吸氣時默念「清淨」，呼氣時默念「放下」。每天堅持十分鐘，心自然會慢慢安定。

願您放下憂慮，安住當下。阿彌陀佛。🙏`;
  }

  if (lower.includes("失眠") || lower.includes("睡不著") || lower.includes("睡眠")) {
    return `施主，夜不能寐確是苦惱。

禪宗有語：「不思善，不思惡，正與麼時，那個是明上座本來面目？」睡前若能放下白天所有的思慮得失，心自然清靜，睡眠也會隨之改善。

建議您睡前輕聲念誦「南無阿彌陀佛」，以佛號安定心神。或靜觀呼吸，感受每一次呼吸的起伏，不加評判，只是觀察。

身體需要休息，心靈更需要休息。願您今夜安眠，法喜充滿。阿彌陀佛。🙏`;
  }

  if (lower.includes("憤怒") || lower.includes("生氣") || lower.includes("煩惱")) {
    return `善信，嗔心如火，燒傷的往往是自己。

佛陀說：「以恨對恨，恨永遠存在；以愛對恨，恨才能消除。」憤怒的背後，是內心渴望被理解、被尊重的呼喚。

當憤怒升起時，請先做三次深呼吸，在心中默念「阿彌陀佛」三聲。這不是壓制情緒，而是給自己一個空間，讓智慧在激動消退後升起。

對方的行為是業力，您的反應是您的選擇。願您以慈悲轉化嗔恨，心得清涼。善哉善哉。🙏`;
  }

  if (lower.includes("家人") || lower.includes("家庭") || lower.includes("子女") || lower.includes("父母")) {
    return `施主，家庭關係是此生最深的緣分。

《地藏菩薩本願經》教導我們：一切眾生皆有佛性，家人亦是我們修行的良師益友。與家人的摩擦，正是磨練慈悲心與耐心的機會。

建議每日早晨，在心中為家人默默祝福：「願您身體健康，心想事成。」這種善意的發送，不僅能改善關係，也能淨化自己的心靈。

家是道場，家人是菩薩。願您的家庭和合圓滿。阿彌陀佛。🙏`;
  }

  return `善信，感謝您來到「佛說」。

《心經》有云：「照見五蘊皆空，度一切苦厄。」生命中的種種困惑與苦惱，都有其深刻的因緣。佛法不是逃避現實，而是教我們以智慧面對一切。

您所提的問題，貧僧建議從以下三點思考：
一、放下執著 — 萬事皆有因緣聚散
二、活在當下 — 此刻的心念最為珍貴
三、廣結善緣 — 以慈悲心待人處事

若有更具體的煩惱，歡迎詳細說明，貧僧願為您細細解說。願您法喜充滿，吉祥如意。阿彌陀佛。🙏`;
}
