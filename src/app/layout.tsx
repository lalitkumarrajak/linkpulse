import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { appUrl } from "@/lib/app-url";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "LinkPulse — Short links with real-time analytics", template: "%s · LinkPulse" },
  description:
    "Create branded short links, QR codes and track every click in real time: referrers, countries, devices and more.",
  authors: [{ name: "Lalit Kumar Rajak", url: "https://github.com/lalitkumarrajak" }],
  openGraph: {
    title: "LinkPulse — Short links with real-time analytics",
    description: "Shorten links, generate QR codes, and understand every click.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
