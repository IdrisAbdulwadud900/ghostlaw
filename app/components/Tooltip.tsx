"use client";

import React, { useState, useRef } from "react";

/* ═══════════════════════════════════════════════════════════
   LEGAL JARGON TOOLTIP — hover/tap to see plain-English
   Usage:
     <Tip term="UDAP">UDAP</Tip>
   ═══════════════════════════════════════════════════════════ */

const LEGAL_TERMS: Record<string, string> = {
  // US terms
  "UDAP": "Unfair or Deceptive Acts and Practices — state-level consumer protection laws.",
  "FDCPA": "Fair Debt Collection Practices Act — federal law protecting you from abusive debt collectors.",
  "FCRA": "Fair Credit Reporting Act — you can dispute errors on your credit report.",
  "CFPB": "Consumer Financial Protection Bureau — file complaints about banks, lenders, and debt collectors.",
  "FTC": "Federal Trade Commission — investigates fraud and deceptive business practices.",
  "FCC": "Federal Communications Commission — handles phone, internet, and cable complaints.",
  "ROSCA": "Restore Online Shoppers' Confidence Act — bans sneaky subscription charges.",
  "TCPA": "Telephone Consumer Protection Act — protects against unwanted robocalls and texts.",
  "HIPAA": "Health Insurance Portability and Accountability Act — protects your medical privacy.",
  "statute of limitations": "Legal deadline to file a lawsuit — varies by state, usually 2-6 years.",
  "bad faith": "When an insurance company unfairly denies or delays your legitimate claim.",
  "balance billing": "When a provider charges you the difference between their fee and what insurance paid.",
  "upcoding": "When a provider bills for a more expensive procedure than what was performed.",
  // NG terms
  "FCCPA": "Federal Competition and Consumer Protection Act 2018 — Nigeria's main consumer protection law.",
  "FCCPC": "Federal Competition and Consumer Protection Commission — Nigeria's consumer protection body.",
  "CBN": "Central Bank of Nigeria — regulates banks, must resolve complaints within 72 hours.",
  "NCC": "Nigerian Communications Commission — regulates telecom operators.",
  "NERC": "Nigerian Electricity Regulatory Commission — regulates power companies.",
  "NDPA": "Nigeria Data Protection Act 2023 — protects your personal data from misuse.",
  "NDPC": "Nigeria Data Protection Commission — enforces data privacy rights.",
  "EFCC": "Economic and Financial Crimes Commission — investigates fraud.",
  "DisCo": "Distribution Company — your local electricity provider (e.g., IKEDC, EKEDC).",
  "CPT code": "Current Procedural Terminology — standardized medical procedure codes used for billing.",
  "VAS": "Value Added Services — subscriptions that eat your airtime without clear consent.",
};

interface TipProps {
  term?: string;
  definition?: string;
  children: React.ReactNode;
}

export default function Tip({ term, definition, children }: TipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const text = definition || (term ? LEGAL_TERMS[term] : null);
  if (!text) return <>{children}</>;

  return (
    <span
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(o => !o)}
      style={{
        position: "relative",
        borderBottom: "1px dotted rgba(232,25,44,0.4)",
        cursor: "help",
      }}
    >
      {children}
      {open && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "#18181f",
            border: "1px solid rgba(232,25,44,0.2)",
            padding: "8px 12px",
            fontSize: 11,
            fontFamily: "var(--font-ibm-plex-sans), sans-serif",
            color: "#9090a0",
            lineHeight: 1.5,
            whiteSpace: "normal",
            width: "max-content",
            maxWidth: 280,
            zIndex: 100,
            pointerEvents: "none",
            animation: "fade-up 0.2s ease",
          }}
        >
          <span style={{
            position: "absolute",
            bottom: -5,
            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            width: 8,
            height: 8,
            background: "#18181f",
            borderRight: "1px solid rgba(232,25,44,0.2)",
            borderBottom: "1px solid rgba(232,25,44,0.2)",
          }} />
          {text}
        </span>
      )}
    </span>
  );
}

/** Utility: wrap known legal terms in a text string with Tip components */
export function highlightLegalTerms(text: string): (string | React.JSX.Element)[] {
  const terms = Object.keys(LEGAL_TERMS).sort((a, b) => b.length - a.length);
  const regex = new RegExp(`\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");

  const parts: (string | React.JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const matched = match[0];
    const canonical = terms.find(t => t.toLowerCase() === matched.toLowerCase()) || matched;
    parts.push(<Tip key={match.index} term={canonical}>{matched}</Tip>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}
