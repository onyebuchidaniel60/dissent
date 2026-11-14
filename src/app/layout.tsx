import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Orbitron, Russo_One } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";

import "@near-wallet-selector/modal-ui/styles.css";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-orbitron",
  display: "swap",
});

const display = Russo_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-russo",
  display: "swap",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  category: "technology",
  keywords: [
    "NEAR",
    "AI trading agents",
    "adversarial audit",
    "AI safety",
    "audit certificate",
    "DeFi risk",
  ],
  authors: [{ name: "Dissent" }],
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    type: "website",
    siteName: SITE.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#08070a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${orbitron.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
