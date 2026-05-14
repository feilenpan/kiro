import Header from "@/components/Header";

export const metadata = {
  title: "隱私政策 — 佛說",
  description: "佛說平台隱私政策與數據使用說明",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main style={{ maxWidth: "760px", margin: "0 auto", padding: "2rem 1.25rem 4rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "1.8rem",
            fontWeight: 700,
            color: "#2c1810",
            marginBottom: "0.5rem",
          }}>
            隱私政策
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "#8a5a2f" }}>
            最後更新：2026 年 5 月
          </p>
        </div>

        <div className="zen-card" style={{ padding: "2rem", lineHeight: 2 }}>
          <article style={{ fontFamily: "var(--font-sans)", fontSize: "1rem", color: "#2c1810" }}>

            <Section title="一、總則">
              <p>
                「佛說」（以下稱「本站」）是一個免費的佛法學習工具，致力於以 AI 技術弘揚佛法智慧。
                本站尊重並保護您的隱私權。本政策旨在說明我們如何處理您使用本站時涉及的數據。
              </p>
            </Section>

            <Section title="二、我們不收集的資訊">
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li>姓名、電話、電郵地址等個人身份資訊</li>
                <li>信用卡、銀行帳戶等支付資訊</li>
                <li>地理位置精確座標</li>
                <li>您無需註冊帳號即可使用本站所有功能</li>
              </ul>
            </Section>

            <Section title="三、本地存儲（localStorage）">
              <p>本站在您的瀏覽器本地存儲以下數據，這些數據<strong>不會上傳至任何伺服器</strong>：</p>
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li><strong>匿名設備 ID</strong>：隨機生成的 UUID，用於區分不同瀏覽器，不含任何個人資訊</li>
                <li><strong>對話歷史</strong>：最近 20 條問答記錄，僅存於本地，方便您續讀上次對話</li>
                <li><strong>字體偏好</strong>：繁體/簡體字體選擇</li>
              </ul>
              <p>您可以隨時清除瀏覽器數據來刪除以上所有本地存儲。</p>
            </Section>

            <Section title="四、第三方服務">
              <p>本站使用以下第三方服務處理您的請求：</p>
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li>
                  <strong>MiniMax AI</strong>（minimax.io）：當您使用「問佛」功能時，您的對話內容會傳送至
                  MiniMax 的 AI 模型進行處理並生成回答。MiniMax 是中國的 AI 服務提供商。
                </li>
                <li>
                  <strong>Vercel Analytics</strong>：收集匿名的頁面訪問統計（如頁面瀏覽量、訪問來源國家），
                  不包含任何可識別個人身份的資訊。本站尊重瀏覽器的「Do Not Track」設定。
                </li>
                <li>
                  <strong>Cloudflare R2</strong>：存儲預生成的音頻文件（佛經朗誦、今日金句等），
                  不涉及任何用戶個人數據。
                </li>
              </ul>
            </Section>

            <Section title="五、Cookie">
              <p>本站不使用 Cookie。所有本地數據均存儲在 localStorage 中。</p>
            </Section>

            <Section title="六、兒童隱私">
              <p>本站不針對 13 歲以下兒童，亦不會主動收集任何兒童的個人資訊。</p>
            </Section>

            <Section title="七、數據安全">
              <p>
                本站通過 HTTPS 加密傳輸所有數據。由於本站不存儲用戶個人資訊，
                因此不存在伺服器端的數據洩露風險。
              </p>
            </Section>

            <Section title="八、您的權利">
              <p>根據香港《個人資料（私隱）條例》，您有權：</p>
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li>查閱本站是否持有您的個人資料（答案：我們不持有）</li>
                <li>清除本地瀏覽器數據以刪除所有 localStorage 內容</li>
                <li>啟用瀏覽器「Do Not Track」以停用匿名統計</li>
              </ul>
            </Section>

            <Section title="九、政策更新">
              <p>
                如本政策有重大變更，我們會在本頁面更新並標註日期。
                建議您定期查閱。
              </p>
            </Section>

            <Section title="十、聯繫方式">
              <p>
                如您對本隱私政策有任何疑問，歡迎通過本站「問佛」功能聯繫我們，
                或發送電郵至開發者。
              </p>
            </Section>

          </article>
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "0.9rem", color: "#a06810" }}>
            🙏 願一切眾生離苦得樂 · 阿彌陀佛
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
        fontFamily: "var(--font-serif)",
        fontSize: "1.15rem",
        fontWeight: 600,
        color: "#2c1810",
        marginBottom: "0.75rem",
        borderBottom: "1px solid rgba(201, 138, 22, 0.2)",
        paddingBottom: "0.5rem",
      }}>
        {title}
      </h2>
      <div style={{ color: "#3d2a1a" }}>
        {children}
      </div>
    </section>
  );
}
