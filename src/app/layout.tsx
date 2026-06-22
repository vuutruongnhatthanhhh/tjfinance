import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TJ Finance - Quản lý tài chính cá nhân",
  description: "Ứng dụng quản lý tài chính cá nhân thông minh",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}

function ThemeInitializer() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('theme') || 'dark';
              document.documentElement.classList.add(theme);
            } catch(e) {
              document.documentElement.classList.add('dark');
            }
          })();
        `,
      }}
    />
  );
}
