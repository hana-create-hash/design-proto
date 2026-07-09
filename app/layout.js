import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata = {
  title: "WagaMee",
  description: "小悪魔のわがままを口実に、自分のための寄り道へ出るPWAプロトタイプ。"
};

export const viewport = {
  themeColor: "#ff5fbd"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
        <link rel="icon" href={`${basePath}/icons/icon.svg`} />
        <link rel="apple-touch-icon" href={`${basePath}/icons/icon.svg`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="WagaMee" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
