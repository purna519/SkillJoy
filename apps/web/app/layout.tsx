import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./components/providers";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SkillJoy | Turn Scrolling Into Skill Building",
  description:
    "AI-powered premium learning platform for short-video education.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${syne.variable} ${dmSans.variable} font-dm-sans antialiased`}
      >
        {/* Providers is a "use client" wrapper — safe to use in Server Component root layout */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
