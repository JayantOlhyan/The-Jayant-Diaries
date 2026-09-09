import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | The Jayant Diaries",
    default: "The Jayant Diaries — Cinematic Personal Travel Archive",
  },
  description:
    "A personal digital travel archive that transforms scattered photographs, videos, journals, places, memories and Instagram posts into structured cinematic journeys.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cinema-bg text-cinema-text antialiased selection:bg-cinema-accent/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
