import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loan App Harassment Nigeria — Stop Them, Report Them | GhostLaw",
  description:
    "Loan app calling your contacts? Threatening you on WhatsApp? GhostLaw generates your FCCPC complaint and NDPA violation report. Stop the harassment in 60 seconds. Free.",
  keywords: [
    "loan app harassment Nigeria",
    "loan app calling contacts Nigeria",
    "OKash harassment",
    "FairMoney harassment",
    "Carbon harassment",
    "loan app threatening WhatsApp",
    "NDPA violation loan app",
    "FCCPC complaint loan app",
    "stop loan app harassment",
    "loan app illegal interest Nigeria",
    "predatory lending Nigeria",
    "loan app defamation Nigeria",
    "loan app data privacy",
    "Nigeria data protection act",
    "loan shark app Nigeria",
  ],
  openGraph: {
    title: "Loan App Harassment Nigeria — Stop Them Now | GhostLaw",
    description:
      "Loan app harassing your contacts and threatening you? GhostLaw files your FCCPC + NDPA complaint. Free. 60 seconds.",
    url: "https://app-zeta-henna-93.vercel.app/loan-app",
    siteName: "GhostLaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Loan App Harassment Nigeria — GhostLaw",
    description: "Stop loan apps from calling your contacts and threatening you. File FCCPC + NDPA complaints in 60 seconds.",
  },
  alternates: {
    canonical: "/loan-app",
  },
};

export default function LoanAppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
