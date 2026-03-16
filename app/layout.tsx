import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { type ReactNode } from "react";
import "./globals.css";
import ClientLayout from "./ClientProvider";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Lexford - Zamonaviy Maktab Boshqaruv Tizimi",
  description: "Lexford - o'quv jarayonini avtomatlashtirish, tangalar tizimi va maktab boshqaruvi uchun mukammal yechim.",
  keywords: ["maktab boshqaruvi", "school management", "online maktab", "tanga tizimi", "education software"],
  authors: [{ name: "Lexford Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  openGraph: {
    title: "Lexford - Zamonaviy Maktab Boshqaruv Tizimi",
    description: "O'quv jarayonini oson va qiziqarli boshqaring.",
    url: "https://lexford.solara.uz",
    siteName: "Lexford",
    locale: "uz_UZ",
    type: "website",
  },
  icons: {
    icon: "/Container-1.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
