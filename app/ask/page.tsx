import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";

export const metadata = {
  title: "问佛 — 佛说",
  description: "向 AI 法师请教佛法智慧，解答您的烦恼与困惑",
};

export default function AskPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "1rem 1rem 2rem" }}>

        {/* 页头 */}
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <div style={{ fontSize: "2.2rem", marginBottom: "0.4rem" }}>🙏</div>
          <h1
            style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#2c1810",
              marginBottom: "0.3rem",
            }}
          >
            问佛
          </h1>
          <p
            style={{
              fontFamily: "'Noto Sans SC', sans-serif",
              fontSize: "0.9rem",
              color: "#8a5a2f",
              lineHeight: 1.6,
            }}
          >
            说出您的烦恼或问题，AI 法师将以佛法智慧为您开示
          </p>
        </div>

        {/* 对话主体 */}
        <div className="zen-card" style={{ padding: "1rem" }}>
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
            💡 <strong>使用提示：</strong>您可以询问任何生活烦恼、佛法疑问，
            例如：情绪困扰、家庭关系、如何修行、经文含义等。
            每条回答均可点击「聆听」按钮收听语音朗读。
          </p>
        </div>
      </main>
    </>
  );
}
