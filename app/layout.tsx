import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SUKOO POS",
  description: "SUKOO Coffee Point of Sale System",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Disable zoom for cashier tablet */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />

        {/* PWA style theme */}
        <meta name="theme-color" content="#000000" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-100 text-black`}
      >
        {children}
      </body>
    </html>
  );
}