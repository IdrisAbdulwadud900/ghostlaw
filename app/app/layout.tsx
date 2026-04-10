import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["300", "400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["300", "400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app-zeta-henna-93.vercel.app"),
  title: "GhostLaw — Fight Back",
  description:
    "AI-powered consumer protection for Nigeria and the US. Scan bills, contracts, subscriptions and bank issues, then generate dispute letters, call scripts, and regulator-ready complaints.",
  keywords: [
    "AI",
    "dispute",
    "bills",
    "overcharges",
    "consumer rights",
    "legal AI",
    "hidden fees",
    "contract analysis",
    "bank reversal Nigeria",
    "medical bill dispute",
    "FCCPC complaint",
    "CFPB complaint",
    "loan app harassment",
  ],
  openGraph: {
    title: "GhostLaw — Get Your Money Back",
    description:
      "Scan a bill or complaint issue, find what they owe you, and generate the dispute letter or regulator complaint in minutes.",
    url: "https://app-zeta-henna-93.vercel.app",
    siteName: "GhostLaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GhostLaw — Get Your Money Back",
    description:
      "AI-powered consumer protection for bills, subscriptions, bank reversals, telecom disputes, and complaint filing.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} antialiased`}
    >
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
