import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Reversal Nigeria — Get Your Failed Transfer Money Back | GhostLaw",
  description:
    "GTBank, Access Bank, or First Bank debited you but money didn't arrive? GhostLaw generates your CBN chargeback letter and FCCPC complaint in 60 seconds. Free.",
  keywords: [
    "bank reversal Nigeria",
    "GTBank reversal",
    "Access Bank reversal",
    "failed transfer Nigeria",
    "CBN chargeback",
    "CBN complaint",
    "FCCPC complaint",
    "money not received Nigeria",
    "bank debit reversal",
    "ATM debit not dispensed",
    "Nigeria bank refund",
    "UBA reversal",
    "First Bank reversal",
    "Zenith Bank reversal",
    "transfer failed but debited",
  ],
  openGraph: {
    title: "Bank Reversal Nigeria — Get Your Money Back in 60 Seconds",
    description:
      "Your bank debited you but money didn't arrive? GhostLaw writes the CBN complaint letter and files it. Free. No lawyer.",
    url: "https://app-zeta-henna-93.vercel.app/bank-reversal",
    siteName: "GhostLaw",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bank Reversal Nigeria — GhostLaw",
    description: "Failed transfer? ATM didn't dispense? Get your bank reversal letter and CBN complaint in 60 seconds.",
  },
  alternates: {
    canonical: "/bank-reversal",
  },
};

export default function BankReversalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
