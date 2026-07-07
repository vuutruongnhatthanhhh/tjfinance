import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TJFinance - Quản lý tài chính cá nhân",
  description: "Ứng dụng quản lý tài chính cá nhân thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="dark" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
