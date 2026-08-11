import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkillOasis",
  description:
    "SkillOasis — бесплатная AI-платформа для обучения чему угодно. Интерактивные уроки, AI-наставник, адаптивные квизы и флешкарты. Полностью бесплатно, навсегда.",
  keywords: [
    "SkillOasis",
    "обучение",
    "AI",
    "бесплатно",
    "уроки",
    "квизы",
    "флешкарты",
    "наставник",
    "self-education",
  ],
  authors: [{ name: "SkillOasis" }],
  icons: {
    icon: [{ url: "/logo.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/logo.svg?v=2",
    apple: "/logo.svg?v=2",
  },
  openGraph: {
    title: "SkillOasis",
    description: "AI-наставник, интерактивные уроки, квизы и флешкарты. Бесплатно навсегда.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
