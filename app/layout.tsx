import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "佛說 — AI 佛學智慧",
  description: "以 AI 之力，弘揚佛法智慧。每日金句、AI 問佛、佛經朗誦，陪伴您的修行之路。",
  keywords: ["佛說", "佛經", "佛法", "AI", "問佛", "金句", "修行", "禪"],
  authors: [{ name: "佛說" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "佛說",
  },
  icons: {
    icon:        [{ url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
    apple:       [{ url: "/icon-192.svg", sizes: "192x192" }],
    shortcut:    "/icon-192.svg",
  },
  openGraph: {
    title: "佛說 — AI 佛學智慧",
    description: "以 AI 之力，弘揚佛法智慧",
    locale: "zh_TW",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#c98a16",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;500;600;700&family=Noto+Sans+SC:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ minHeight: "100vh", backgroundColor: "#f5f0e8" }}>
        {children}
        <PWAInstallPrompt />
        <Analytics />
      </body>
    </html>
  );
}
