import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ágil Editor - AI Video Editing",
  description: "Automatic video editing with AI-powered scene generation and transcription",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <meta name="theme-color" content="#050508" />
      </head>
      <body className="bg-app font-sora antialiased">
        {children}
      </body>
    </html>
  );
}
