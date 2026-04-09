import type { Metadata } from "next";
import { Bebas_Neue, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
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
  title: "GhostLaw — Fight Back",
  description:
    "AI-powered consumer protection. Scan bills, contracts and policies for illegal clauses and hidden fees, then generate dispute letters to fight back. No lawyer needed. No cost. Ever.",
  keywords: [
    "AI",
    "dispute",
    "bills",
    "overcharges",
    "consumer rights",
    "legal AI",
    "hidden fees",
    "contract analysis",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bebasNeue.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
