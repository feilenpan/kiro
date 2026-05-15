import Header from "@/components/Header";

export const metadata = {
  title: "隐私政策 — 佛说",
  description: "佛说平台隐私政策与数据使用说明",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.8rem", fontWeight: 700, color: "#2c1810", marginBottom: "0.5rem" }}>
            隐私政策
          </h1>
          <p style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "0.9rem", color: "#8a5a2f" }}>
            最后更新：2026 年 5 月
          </p>
        </div>

        <div className="zen-card" style={{ padding: "2rem", lineHeight: 2 }}>
          <article style={{ fontFamily: "'Noto Sans SC', sans-serif", fontSize: "1rem", color: "#2c1810" }}>

            <Section title="一、总则">
              <p>「佛说」是一个免费的佛法学习工具，致力于以 AI 技术弘扬佛法智慧。本站尊重并保护您的隐私权。</p>
            </Section>

            <Section title="二、我们不收集的资讯">
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li>姓名、电话、电邮地址等个人身份资讯</li>
                <li>信用卡、银行账户等支付资讯</li>
                <li>您无需注册账号即可使用本站所有功能</li>
              </ul>
            </Section>

            <Section title="三、本地存储（localStorage）">
              <p>本站在您的浏览器本地存储以下数据，这些数据<strong>不会上传至任何服务器</strong>：</p>
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li><strong>匿名用户 ID</strong>：随机生成，不含任何个人资讯</li>
                <li><strong>对话历史</strong>：最近若干条问答记录，仅存于本地</li>
                <li><strong>字体偏好</strong>：繁体/简体字体选择</li>
              </ul>
              <p>您可以随时清除浏览器数据来删除所有本地存储。</p>
            </Section>

            <Section title="四、第三方服务">
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li><strong>MiniMax AI</strong>：当您使用「问佛」功能时，对话内容会传送至 MiniMax 的 AI 模型进行处理。</li>
                <li><strong>Vercel Analytics</strong>：收集匿名的页面访问统计，不包含可识别个人身份的资讯。本站尊重浏览器的「Do Not Track」设定。</li>
                <li><strong>Cloudflare R2</strong>：存储预生成的音频文件，不涉及任何用户个人数据。</li>
              </ul>
            </Section>

            <Section title="五、Cookie">
              <p>本站不使用 Cookie。所有本地数据均存储在 localStorage 中。</p>
            </Section>

            <Section title="六、您的权利">
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li>清除浏览器数据以删除所有本地存储内容</li>
                <li>启用浏览器「Do Not Track」以停用匿名统计</li>
              </ul>
            </Section>

            <Section title="七、联系方式">
              <p>如您对本隐私政策有任何疑问，欢迎通过本站「问佛」功能联系我们。</p>
            </Section>

          </article>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.9rem", color: "#a06810" }}>
            🙏 愿一切众生离苦得乐 · 阿弥陀佛
          </p>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "1.75rem" }}>
      <h2 style={{
        fontFamily: "'Noto Serif SC', serif", fontSize: "1.15rem", fontWeight: 600,
        color: "#2c1810", marginBottom: "0.75rem",
        borderBottom: "1px solid rgba(201, 138, 22, 0.2)", paddingBottom: "0.5rem",
      }}>
        {title}
      </h2>
      <div style={{ color: "#3d2a1a" }}>{children}</div>
    </section>
  );
}
