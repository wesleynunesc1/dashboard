import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Terminal — Dólar & Índice Futuro B3",
  description: "Terminal financeiro profissional de alta densidade informacional para monitoramento em tempo real do mercado futuro brasileiro.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#070D17] text-[#F0F4FA] antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
