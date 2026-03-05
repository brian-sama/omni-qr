import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk"
});

export const metadata: Metadata = {
  title: {
    default: "Scan Suite | Enterprise QR Document Distribution",
    template: "%s | Scan Suite"
  },
  description: "Secure meeting distribution infrastructure for enterprise and public institutions. Distribute documents instantly with versioned files and full audit visibility.",
  keywords: ["QR code document distribution", "secure meeting materials", "enterprise document delivery", "audit trail", "meeting management"],
  authors: [{ name: "Scan Suite Team" }],
  creator: "Scan Suite",
  publisher: "Scan Suite",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://scansuite.co.zw"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Scan Suite | Enterprise QR Document Distribution",
    description: "Secure meeting distribution infrastructure for enterprise and public institutions.",
    url: "https://scansuite.co.zw",
    siteName: "Scan Suite",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scan Suite - Secure Meeting Distribution",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scan Suite | Enterprise QR Document Distribution",
    description: "Secure meeting distribution infrastructure for enterprise and public institutions.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-[var(--font-manrope)]`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
