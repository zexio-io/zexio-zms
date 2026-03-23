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

import { RootProvider } from "@/ui/providers/root-provider";

export const metadata: Metadata = {
  title: {
    default: "Zexio ZMS Dashboard",
    template: "%s | ZMS Console",
  },
  description: "Enterprise-grade Secret Management and Key Rotation Console.",
};

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background font-sans text-foreground">
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
