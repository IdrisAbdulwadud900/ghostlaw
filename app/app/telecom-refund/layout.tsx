import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MTN Data Refund Nigeria — Get Your Stolen Airtime Back | GhostLaw",
  description:
    "MTN, Airtel, or Glo zapping your data? Auto-subscribing you to services you never asked for? GhostLaw writes your NCC complaint and gets your money back. Free.",
  keywords: [
    "MTN data refund Nigeria",
    "MTN data zapping",
    "Airtel data refund",
    "Glo data disappearing",
    "NCC complaint Nigeria",
    "telecom refund Nigeria",
    "MTN auto subscription",
    "airtime deducted without reason",
    "data disappearing Nigeria",
    "MTN CUG complaint",
    "NCC consumer code",
    "telecom overcharge Nigeria",
    "9mobile data complaint",
    "NERC light bill dispute",
    "Nigerian telecom consumer rights",
  ],
  openGraph: {
    title: "MTN/Airtel/Glo Data Refund — Get Your Money Back | GhostLaw",
    description:
      "Telecom stealing your data and airtime? GhostLaw files your NCC complaint and generates the demand letter. Free. 60 seconds.",
    url: "https://app-zeta-henna-93.vercel.app/telecom-refund",
    siteName: "GhostLaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MTN/Airtel/Glo Data Refund — GhostLaw",
    description: "Data zapping? Auto-subscriptions? Get your NCC complaint letter in 60 seconds. Free.",
  },
  alternates: {
    canonical: "/telecom-refund",
  },
};

export default function TelecomRefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
