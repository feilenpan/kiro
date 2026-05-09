# 佛說 — AI 佛學智慧平台

> 以 AI 之力，弘揚佛法智慧。每日金句、AI 問佛、佛經朗誦，陪伴您的修行之路。

## ✨ 功能特色

- 🙏 **AI 問佛** — 輸入煩惱，AI 法師以佛法智慧為您開示（支持語音朗讀）
- 📖 **佛經閱覽** — 精選心經、金剛經等經典，大字顯示，可調字體大小
- ☀️ **每日修行** — 每日金句輪播、早晚課誦、靜心禪修計時器
- 🔊 **語音朗讀** — 全站支持 Web Speech API 語音朗讀，適合中老年用戶

## 🎨 設計理念

- **面向中老年用戶**：字體 18px+，按鈕大，顏色對比清晰
- **禪意美學**：暖金色 + 米白色 + 深棕色，寧靜莊嚴的視覺風格
- **漸進增強**：無需登錄即可使用，配置 API Key 後啟用完整 AI 功能

## 🚀 快速開始

### 1. 安裝依賴

\`\`\`bash
npm install
\`\`\`

### 2. 配置環境變量

\`\`\`bash
cp .env.example .env.local
# 編輯 .env.local，填入 OpenAI API Key
\`\`\`

### 3. 啟動開發服務器

\`\`\`bash
npm run dev
\`\`\`

訪問 [http://localhost:3000](http://localhost:3000)

## 📁 項目結構

\`\`\`
kiro/
├── app/
│   ├── page.tsx          # 首頁
│   ├── ask/page.tsx      # AI 問佛頁
│   ├── sutras/page.tsx   # 佛經閱覽頁
│   ├── daily/page.tsx    # 每日修行頁
│   ├── api/
│   │   ├── chat/route.ts # AI 問答 API
│   │   └── tts/route.ts  # 語音合成 API
│   └── globals.css       # 全局樣式（禪意主題）
├── components/
│   ├── Header.tsx         # 頂部導航
│   ├── AudioPlayer.tsx    # 語音播放組件
│   ├── ChatInterface.tsx  # 對話界面
│   └── DailySutraCard.tsx # 每日金句卡片
├── lib/
│   └── sutras.ts          # 佛經數據庫
└── .env.example           # 環境變量示例
\`\`\`

## 🛠 技術棧

| 技術 | 用途 |
|------|------|
| Next.js 16 | 前端框架 + API Routes |
| TypeScript | 類型安全 |
| Tailwind CSS | 樣式框架 |
| OpenAI GPT-4o-mini | AI 問答 |
| Web Speech API | 瀏覽器語音合成（免費） |
| Noto Serif SC | 中文字體 |

## 💰 成本估算

| 項目 | 方案 | 月費用 |
|------|------|--------|
| 託管 | Vercel 免費方案 | $0 |
| AI 對話 | GPT-4o-mini | $5~$30 |
| 語音合成 | Web Speech API | $0 |
| 佛經數據 | 開源 CBETA | $0 |
| 域名 | .com | ~$1/月 |
| **合計** | | **$6~$31/月** |

## 📝 部署到 Vercel

1. 推送代碼到 GitHub
2. 在 [Vercel](https://vercel.com) 導入項目
3. 添加環境變量 `OPENAI_API_KEY`
4. 自動部署完成

## ⚠️ 免責聲明

本站 AI 回答僅供佛法學習參考，非正式佛法開示。如需深入修學，請親近善知識。

---

🙏 願一切眾生離苦得樂 · 阿彌陀佛
