import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "DocFlow — Intelligent Document Processor",
  description: "Next-generation async document processing pipeline with AI-powered field extraction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen" style={{ background: 'var(--bg-void)' }}>
        {/* Background mesh gradient */}
        <div className="bg-mesh" />
        {/* Subtle noise texture */}
        <div className="noise-overlay" />

        <Sidebar />
        <main className="flex-1 min-h-screen overflow-x-hidden relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
