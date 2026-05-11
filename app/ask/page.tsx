import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";

export const metadata = {
  title: "問佛 — 佛說",
  description: "向 AI 法師請教佛法智慧，解答您的煩惱與困惑",
};

export default function AskPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>

        {/* 頁頭 */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>🙏</div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#2c1810",
              marginBottom: "0.5rem",
            }}
          >
            問佛
          </h1>
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "1rem",
              color: "#8a5a2f",
              lineHeight: 1.7,
            }}
          >
            說出您的煩惱或問題，AI 法師將以佛法智慧為您開示
          </p>
        </div>

        {/* 對話主體 */}
        <div className="zen-card" style={{ padding: "1.25rem", minHeight: "clamp(380px, 60vh, 520px)" }}>
          <ChatInterface />
        </div>

        {/* 使用提示 */}
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem 1.25rem",
            background: "rgba(249, 237, 204, 0.5)",
            borderRadius: "0.75rem",
            border: "1px solid rgba(201, 138, 22, 0.2)",
          }}
        >
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "0.9rem",
              color: "#7a4c10",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            💡 <strong>使用提示：</strong>您可以詢問任何生活煩惱、佛法疑問，
            例如：情緒困擾、家庭關係、如何修行、經文含義等。
            每條回答均可點擊「聆聽」按鈕收聽語音朗讀。
          </p>
        </div>
      </main>
    </>
  );
}
