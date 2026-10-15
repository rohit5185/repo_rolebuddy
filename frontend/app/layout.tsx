import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import "./globals.css";
import { PWAInstallProvider } from "@/components/InstallPrompt";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // viewport-fit=cover is critical for safe-area-inset support (notch/home-bar)
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3b2ae1" },
    { media: "(prefers-color-scheme: dark)", color: "#3b2ae1" },
  ],
};

export const metadata: Metadata = {
  title: "RoleBuddy — Peer Accountability for Job Prep",
  description:
    "Get matched with someone preparing for the same role. Daily check-ins, streak tracking, and partner visibility keep you consistent.",
  applicationName: "RoleBuddy",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RoleBuddy",
    startupImage: [
      { url: "/icons/icon-512.png", media: "(device-width: 320px)" },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icons/icon-32.png",
  },
  openGraph: {
    title: "RoleBuddy — Peer Accountability for Job Prep",
    description:
      "Match with someone preparing for the same role and stay consistent together through daily check-ins and streak tracking.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "RoleBuddy",
    description: "Role-based peer accountability for job preparation.",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#3b2ae1",
    "msapplication-TileImage": "/icons/icon-144.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${manrope.variable} font-body`}
      >
        <PWAInstallProvider>
          {children}
        </PWAInstallProvider>
      </body>
    </html>
  );
}
