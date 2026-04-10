"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { jsPDF } from "jspdf";
import {
  clearToken, getUser,
  scanDocument, scanText, generateDispute, requestCall,
  generateComplaint,
  addScanToHistory, addDisputeToHistory, addCallToHistory,
  getLocalHistory, getLocalStats, saveOutcome, getOutcome,
  exportUserData, deleteUserAccount
} from "@/lib/api";
import { useToast } from "./Toast";
import { highlightLegalTerms } from "./Tooltip";

// ── Types ────────────────────────────────────────────────────
type Tab = "home" | "scan" | "results" | "dispute" | "call" | "complaint" | "history";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiResult = Record<string, any>;

interface QuickIssue {
  id: string;
  icon: string;
  label: string;
  desc: string;
  prompt: string;
  context: string;
  placeholders: { field: string; label: string; placeholder: string }[];
}

// ── Quick Issue Flows (NG) ───────────────────────────────────
const NG_ISSUES: QuickIssue[] = [
  {
    id: "bank_charge",
    icon: "🏦",
    label: "Bank Charged Me",
    desc: "Hidden fees, failed transfer, unauthorized debit",
    prompt: "Bank: {bank}. {what}. Amount: {amount}.",
    context: "Nigerian banking dispute — CBN Consumer Protection Framework (Circular BPS/DIR/GEN/CIR/04/014): banks must acknowledge complaints within 24 hours, resolve simple cases within 72 hours, complex within 14 days. Failed NIP transfers must be reversed within 24h intra-bank or 72h inter-bank. Unauthorized debits — bank bears burden of proof. FCCPA S.131 criminal penalties for unfair practices. CBN Anti-Fraud Framework requires reimbursement unless customer negligence proved.",
    placeholders: [
      { field: "bank", label: "Which bank?", placeholder: "e.g. GTBank, Access, UBA, Zenith, Kuda, OPay, Moniepoint" },
      { field: "what", label: "What happened?", placeholder: "e.g. They debited ₦50,000 for a transfer that never arrived" },
      { field: "amount", label: "How much?", placeholder: "e.g. ₦85,000" },
    ],
  },
  {
    id: "data_stolen",
    icon: "📱",
    label: "Data / Airtime Gone",
    desc: "Data vanishing, unauthorized VAS charges, airtime theft",
    prompt: "Network: {network}. {what}. Amount lost: {amount}.",
    context: "Nigerian telecom dispute — NCC Consumer Code of Practice 2007: operators must obtain EXPRESS opt-in consent before activating Value Added Services (VAS). Data billing must be transparent — operators must provide usage records on request. Process: complain to operator first (7-day window) → if unresolved, escalate to NCC arbitration (toll-free 622). NCC Quality of Service Regulations. FCCPA S.114-127 consumer transaction rights.",
    placeholders: [
      { field: "network", label: "Which network?", placeholder: "e.g. MTN, Airtel, Glo, 9mobile" },
      { field: "what", label: "What happened?", placeholder: "e.g. ₦2,000 data bundle finished in 1 hour with no usage" },
      { field: "amount", label: "How much did you lose?", placeholder: "e.g. ₦5,000" },
    ],
  },
  {
    id: "light_bill",
    icon: "💡",
    label: "Crazy Light Bill",
    desc: "Estimated billing, no meter, outages, crazy charges",
    prompt: "DisCo: {disco}. {what}. Bill amount: {amount}.",
    context: "Nigerian electricity dispute — NERC Customer Complaints Handling Standards 2006 (revised 2023): 3-tier escalation: (1) DisCo CCU must resolve within 15 days, (2) NERC Forum Office — file written complaint with supporting affidavit if CCU fails, (3) NERC HQ formal hearing. Estimated billing: you have the RIGHT to a prepaid meter under NERC Meter Asset Provider (MAP) regulations. DisCos must credit for outage hours above threshold. Electricity Act 2023 customer rights. NERC MYTO tariff bands.",
    placeholders: [
      { field: "disco", label: "Which DisCo?", placeholder: "e.g. EKEDC, IKEDC, AEDC, BEDC, EEDC, PHEDC" },
      { field: "what", label: "What's the problem?", placeholder: "e.g. Bill is ₦47,000 but I live in a 1-bedroom" },
      { field: "amount", label: "How much is the bill?", placeholder: "e.g. ₦47,500" },
    ],
  },
  {
    id: "loan_app",
    icon: "🚨",
    label: "Loan App Harassing Me",
    desc: "Threats, contact spam, defamation",
    prompt: "Loan app: {app}. {what}. Original loan: {amount}.",
    context: "Nigerian loan app dispute — NDPA 2023 S.24-28 (lawful processing — contact list harvesting is ILLEGAL without explicit consent), S.34-38 (data subject rights — right to erasure), S.42 (cross-border transfer restrictions). FCCPA S.131: sending defamatory messages to contacts is a criminal offence carrying up to ₦10M fine or 5 years imprisonment. CBN Licensing Framework for Digital Lending 2022 — all lending apps must be CBN-licensed. FCCPC has shut down dozens of illegal loan apps in 2023-2024. NDPC penalty: up to 2% of annual gross revenue.",
    placeholders: [
      { field: "app", label: "Which app?", placeholder: "e.g. OKash, FairMoney, Carbon, Branch, PalmCredit" },
      { field: "what", label: "What are they doing?", placeholder: "e.g. Sending messages to my contacts calling me a thief" },
      { field: "amount", label: "How much was the loan?", placeholder: "e.g. ₦30,000" },
    ],
  },
  {
    id: "rent_landlord",
    icon: "🏠",
    label: "Landlord Trouble",
    desc: "Illegal eviction, deposit theft, lock-out",
    prompt: "Location: {location}. {what}. Rent paid: {amount}.",
    context: "Nigerian landlord-tenant dispute — Lagos Tenancy Law 2011: S.13 (6-month notice for yearly tenants), S.18 (recovery of premises procedure). Recovery of Premises Act (Federal): required notice periods. Self-help eviction (changing locks, removing tenant property) is ILLEGAL — landlord MUST get a court order. FCCPA S.114-127 applies to rental services. Free legal aid: Legal Aid Council of Nigeria, LEDAP.",
    placeholders: [
      { field: "location", label: "Where? (city/state)", placeholder: "e.g. Lagos, Abuja" },
      { field: "what", label: "What happened?", placeholder: "e.g. Landlord changed the lock and told me to leave" },
      { field: "amount", label: "How much rent did you pay?", placeholder: "e.g. ₦1,200,000 per year" },
    ],
  },
  {
    id: "online_order",
    icon: "🛒",
    label: "Bad Online Order",
    desc: "Fake product, no refund, wrong item",
    prompt: "Platform: {platform}. {what}. Amount: {amount}.",
    context: "E-commerce dispute — FCCPA S.114-127: right to refund for non-conforming goods, cooling-off period for online purchases. FCCPC actively monitors e-commerce platforms. NDPA 2023 for unauthorized data use. File at fccpc.gov.ng or call 0800-FREE-CALL.",
    placeholders: [
      { field: "platform", label: "Where did you buy?", placeholder: "e.g. Jumia, Konga, Instagram seller" },
      { field: "what", label: "What went wrong?", placeholder: "e.g. Ordered original phone, got a fake" },
      { field: "amount", label: "How much did you pay?", placeholder: "e.g. ₦189,000" },
    ],
  },
  {
    id: "airline_ng",
    icon: "✈️",
    label: "Airline Overcharge",
    desc: "Ticket hike, no refund, cancelled flight",
    prompt: "Airline: {airline}. {what}. Amount: {amount}.",
    context: "Nigerian airline dispute — NCAA Consumer Protection Regulations: passengers entitled to full refund for cancelled flights, compensation for delays over 2 hours, rebooking on next available flight. FCCPC has sanctioned airlines for festive fare gouging. NCAA Passenger Bill of Rights. File with NCAA or FCCPC.",
    placeholders: [
      { field: "airline", label: "Which airline?", placeholder: "e.g. Air Peace, Dana Air, Arik Air, Max Air" },
      { field: "what", label: "What happened?", placeholder: "e.g. Flight cancelled but no refund after 3 months" },
      { field: "amount", label: "How much?", placeholder: "e.g. ₦85,000" },
    ],
  },
  {
    id: "dstv_charge",
    icon: "📺",
    label: "DSTV / Cable Issue",
    desc: "Tariff hike, no signal, forced upgrade",
    prompt: "Provider: {provider}. {what}. Amount: {amount}.",
    context: "Cable TV dispute — FCCPC vs Multichoice tariff orders: FCCPC has ordered Multichoice to freeze tariffs. NBC Broadcasting Code. FCCPA S.114-127 consumer right to value for money. File with FCCPC for tariff disputes. Consumers can demand pro-rata refund for signal outages.",
    placeholders: [
      { field: "provider", label: "Which service?", placeholder: "e.g. DSTV, GOtv, StarTimes, Showmax" },
      { field: "what", label: "What happened?", placeholder: "e.g. Subscription increased by 40% with no notice" },
      { field: "amount", label: "How much?", placeholder: "e.g. ₦24,500/month" },
    ],
  },
  {
    id: "pos_agent",
    icon: "💸",
    label: "POS / Transfer Scam",
    desc: "POS agent fraud, double debit, failed POS",
    prompt: "What happened: {what}. Agent/Location: {agent}. Amount: {amount}.",
    context: "POS agent dispute — CBN Guidelines on Mobile Money & Agent Banking: agents must provide transaction receipts, unauthorized charges prohibited. Double debit: bank must reverse within 24-72 hours per CBN Consumer Protection Framework. CBN Anti-Fraud Framework applies. Report to bank first, then CBN Consumer Protection (cpd@cbn.gov.ng).",
    placeholders: [
      { field: "agent", label: "Which agent or location?", placeholder: "e.g. POS agent at Ikeja, OPay agent" },
      { field: "what", label: "What happened?", placeholder: "e.g. Money debited but POS agent says it didn't come" },
      { field: "amount", label: "How much?", placeholder: "e.g. ₦20,000" },
    ],
  },
  {
    id: "insurance_hmo",
    icon: "🏥",
    label: "HMO / Insurance Denied",
    desc: "Treatment denied, HMO not covering, delays",
    prompt: "HMO/Insurer: {hmo}. {what}. Amount: {amount}.",
    context: "Nigerian HMO/Insurance dispute — NHIA Act 2022, National Health Insurance Scheme operational guidelines: HMOs must cover all conditions in the benefits package. NAICOM Market Conduct Guidelines: insurers must respond to claims within 14 days. Insurance Act 2003 policyholder rights. FCCPA unfair practices. File with NAICOM for insurance, NHIA for HMO disputes.",
    placeholders: [
      { field: "hmo", label: "Which HMO / insurer?", placeholder: "e.g. Leadway, AXA Mansard, Hygeia, AIICO" },
      { field: "what", label: "What happened?", placeholder: "e.g. HMO refused to cover my surgery" },
      { field: "amount", label: "How much?", placeholder: "e.g. ₦350,000" },
    ],
  },
  {
    id: "hospital_bill",
    icon: "🚑",
    label: "Hospital Overcharge",
    desc: "Detained for bills, inflated charges, refused treatment",
    prompt: "Hospital: {hospital}. {what}. Amount: {amount}.",
    context: "Nigerian hospital billing dispute — CRITICAL: Detaining patients for inability to pay is ILLEGAL under Section 35 of the 1999 Constitution (right to personal liberty). Emergency treatment cannot be refused per medical ethics codes and Child Rights Act 2003. FCCPA S.114-127 applies to healthcare services. NHIA Act 2022 for HMO coverage disputes. Free legal aid: Legal Aid Council of Nigeria, LEDAP. Report to state Ministry of Health, FCCPC, or Nigerian Medical Association.",
    placeholders: [
      { field: "hospital", label: "Which hospital?", placeholder: "e.g. General Hospital Lagos, private clinic name" },
      { field: "what", label: "What happened?", placeholder: "e.g. Hospital won't let my relative leave until we pay ₦500,000" },
      { field: "amount", label: "How much?", placeholder: "e.g. ₦500,000" },
    ],
  },
];

// ── Quick Issue Flows (US) ───────────────────────────────────
const US_ISSUES: QuickIssue[] = [
  {
    id: "medical_bill",
    icon: "🏥",
    label: "Medical Bill",
    desc: "Overcharges, surprise billing, errors",
    prompt: "Hospital/Provider: {provider}. {what}. Amount: {amount}.",
    context: "Medical bill — look for upcoding, surprise billing, balance billing, No Surprises Act violations, charges above Medicare rates",
    placeholders: [
      { field: "provider", label: "Hospital or provider?", placeholder: "e.g. Metro General Hospital" },
      { field: "what", label: "What's wrong with the bill?", placeholder: "e.g. Charged $450 for a blood test that should be $80" },
      { field: "amount", label: "Total amount?", placeholder: "e.g. $4,847" },
    ],
  },
  {
    id: "subscription",
    icon: "💳",
    label: "Won't Let Me Cancel",
    desc: "Subscription trap, hidden auto-renew",
    prompt: "Company: {company}. {what}. Monthly charge: {amount}.",
    context: "Subscription trap — FTC dark pattern rules, ROSCA violations, state consumer protection acts",
    placeholders: [
      { field: "company", label: "Which company?", placeholder: "e.g. Planet Fitness, Adobe, GymFlex" },
      { field: "what", label: "What happened?", placeholder: "e.g. I cancelled but they keep charging me" },
      { field: "amount", label: "How much per month?", placeholder: "e.g. $29.99/month" },
    ],
  },
  {
    id: "insurance",
    icon: "🛡",
    label: "Insurance Denied Me",
    desc: "Claim denied, bad faith, delays",
    prompt: "Insurance company: {company}. {what}. Claim amount: {amount}.",
    context: "Insurance denial — bad faith practices, wrongful denial, appeal rights, state insurance commissioner complaints",
    placeholders: [
      { field: "company", label: "Which insurer?", placeholder: "e.g. Blue Cross, Aetna, State Farm" },
      { field: "what", label: "What was denied?", placeholder: "e.g. MRI denied as 'not medically necessary'" },
      { field: "amount", label: "How much is the claim?", placeholder: "e.g. $2,400" },
    ],
  },
  {
    id: "phone_bill",
    icon: "📞",
    label: "Phone/Internet Bill",
    desc: "Hidden fees, cramming, throttling",
    prompt: "Provider: {provider}. {what}. Monthly total: {amount}.",
    context: "Telecom bill — FCC violations, cramming, unauthorized charges, Telecommunications Act",
    placeholders: [
      { field: "provider", label: "Which provider?", placeholder: "e.g. AT&T, Comcast, T-Mobile, Verizon" },
      { field: "what", label: "What's wrong?", placeholder: "e.g. New $9.99 'network access' fee I never agreed to" },
      { field: "amount", label: "How much is the bill?", placeholder: "e.g. $142/month" },
    ],
  },
  {
    id: "lease",
    icon: "🏠",
    label: "Landlord / Lease",
    desc: "Illegal clauses, deposit theft, eviction",
    prompt: "Location: {location}. {what}. Amount involved: {amount}.",
    context: "Lease/landlord dispute — tenant rights, illegal clauses, security deposit laws, habitability requirements",
    placeholders: [
      { field: "location", label: "City & state?", placeholder: "e.g. Austin, TX" },
      { field: "what", label: "What happened?", placeholder: "e.g. Won't return my $2,000 security deposit" },
      { field: "amount", label: "Amount involved?", placeholder: "e.g. $2,000" },
    ],
  },
  {
    id: "debt_collector",
    icon: "📬",
    label: "Debt Collector",
    desc: "Harassment, wrong debt, threats",
    prompt: "Collector: {collector}. {what}. Amount they claim: {amount}.",
    context: "Debt collection — FDCPA violations, right to validate debt, harassment protections, cease communication rights",
    placeholders: [
      { field: "collector", label: "Who's calling?", placeholder: "e.g. Midland Credit, Portfolio Recovery" },
      { field: "what", label: "What are they doing?", placeholder: "e.g. Calling 5 times a day about a debt I already paid" },
      { field: "amount", label: "How much do they claim?", placeholder: "e.g. $3,200" },
    ],
  },
  {
    id: "car_repair",
    icon: "🚗",
    label: "Car Repair Scam",
    desc: "Overcharged, unauthorized work, bait & switch",
    prompt: "Shop: {shop}. {what}. Amount: {amount}.",
    context: "Auto repair dispute — state consumer protection acts, Magnuson-Moss Warranty Act, right to written estimate, unauthorized repair statutes",
    placeholders: [
      { field: "shop", label: "Which shop?", placeholder: "e.g. Meineke, local shop, dealership" },
      { field: "what", label: "What happened?", placeholder: "e.g. Quoted $300 for brakes but charged $1,200 for extra work I didn't approve" },
      { field: "amount", label: "How much?", placeholder: "e.g. $1,200" },
    ],
  },
  {
    id: "gym_membership",
    icon: "🏋️",
    label: "Gym / Membership Trap",
    desc: "Can't cancel, hidden fees, keeps billing",
    prompt: "Gym/Company: {gym}. {what}. Monthly charge: {amount}.",
    context: "Gym membership cancellation — state health club act, FTC click-to-cancel rules, ROSCA violations, auto-renewal protections",
    placeholders: [
      { field: "gym", label: "Which gym / service?", placeholder: "e.g. Planet Fitness, LA Fitness, CrossFit" },
      { field: "what", label: "What happened?", placeholder: "e.g. I cancelled 3 months ago but they keep charging me" },
      { field: "amount", label: "How much per month?", placeholder: "e.g. $49.99/month" },
    ],
  },
  {
    id: "airline_us",
    icon: "✈️",
    label: "Airline Issue",
    desc: "Cancelled flight, lost luggage, no refund",
    prompt: "Airline: {airline}. {what}. Amount: {amount}.",
    context: "Airline dispute — DOT airline passenger rights, automatic refund rule (2024), compensation for delays/cancellations, lost luggage liability limits",
    placeholders: [
      { field: "airline", label: "Which airline?", placeholder: "e.g. United, Delta, American, Spirit, Southwest" },
      { field: "what", label: "What happened?", placeholder: "e.g. Flight cancelled, refused refund, only offered credit" },
      { field: "amount", label: "How much?", placeholder: "e.g. $450" },
    ],
  },
  {
    id: "student_loan",
    icon: "🎓",
    label: "Student Loan Issue",
    desc: "Wrong balance, servicer error, forgiveness denied",
    prompt: "Servicer: {servicer}. {what}. Amount: {amount}.",
    context: "Student loan dispute — CFPB oversight, income-driven repayment rights, PSLF program rules, servicer error correction obligations, Higher Education Act",
    placeholders: [
      { field: "servicer", label: "Which servicer?", placeholder: "e.g. Mohela, Nelnet, Great Lakes, Navient" },
      { field: "what", label: "What happened?", placeholder: "e.g. Payments not counted toward forgiveness" },
      { field: "amount", label: "How much is at stake?", placeholder: "e.g. $45,000" },
    ],
  },
];

// ── Legal Tips (shown during loading + home) ────────────────
const NG_LEGAL_TIPS = [
  "Banks must refund failed transfers within 24-72 hours — CBN Consumer Protection Framework Circular BPS/DIR/GEN/CIR/04/014",
  "You have the RIGHT to a prepaid meter — estimated billing is challengeable under NERC Meter Asset Provider (MAP) regulations",
  "Loan apps that message your contacts are committing a CRIMINAL OFFENCE — NDPA 2023 S.24-28 and FCCPA S.131 (up to ₦10M fine)",
  "If a bank charges you without consent, that's a criminal offence under FCCPA Section 131 — up to 5 years imprisonment",
  "DisCos must credit you for every hour of outage above the allowed threshold — NERC Customer Complaints Handling Standards",
  "Your landlord MUST give 6 months' notice before eviction for yearly tenants — Lagos Tenancy Law S.13. Self-help eviction is ILLEGAL",
  "Banks have only 72 hours to resolve simple complaints — after that, escalate to CBN Consumer Protection (cpd@cbn.gov.ng)",
  "Online sellers must refund you for counterfeit goods — FCCPA S.114-127, cooling-off period applies to online purchases",
  "MTN/Airtel/Glo must get your EXPRESS consent before deducting for VAS — NCC Consumer Code of Practice 2007",
  "Detaining a patient in hospital for inability to pay is ILLEGAL — Section 35 of the 1999 Constitution (right to liberty)",
  "NCC toll-free number 622 — call from any network to file a telecom complaint for FREE",
  "NERC has a 3-tier escalation: DisCo CCU (15 days) → NERC Forum Office (affidavit) → NERC HQ hearing",
];
const US_LEGAL_TIPS = [
  "Medical bills can be disputed for 60 days under the Fair Credit Billing Act",
  "The No Surprises Act bans surprise out-of-network bills for emergency services",
  "Debt collectors can't call you before 8am or after 9pm — FDCPA Section 805",
  "Your landlord must return your security deposit within 14-45 days depending on state law",
  "CFPB complaints have a 97% company response rate — they actually work",
  "You can demand debt validation within 30 days — if they can't prove it, they must stop collecting",
  "Subscription companies must provide a simple cancellation method — FTC Click-to-Cancel Rule",
  "Insurance companies must explain claim denials in writing — state Bad Faith laws protect you",
  "Phone carriers can't add charges you didn't agree to — that's 'cramming' and it's illegal under FCC rules",
  "You have the right to a free copy of your credit report — errors must be corrected within 30 days",
];

// ── Component ────────────────────────────────────────────────
interface AppDashboardProps {
  onLogout: () => void;
}

export default function AppDashboard({ onLogout }: AppDashboardProps) {
  const user = getUser();
  const { toast, ToastContainer } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Analyzing...");
  const [mobileNav, setMobileNav] = useState(false);

  // Country state (persisted)
  const [country, setCountry] = useState<"US" | "NG">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("ghostlaw_country") as "US" | "NG") || "US";
    }
    return "US";
  });
  const switchCountry = (c: "US" | "NG") => {
    setCountry(c);
    if (typeof window !== "undefined") localStorage.setItem("ghostlaw_country", c);
    setComplaintAgency(c === "NG" ? "fccpc" : "cfpb");
    setSelectedIssue(null);
    setQuickFields({});
  };
  const currencySymbol = country === "NG" ? "₦" : "$";

  // Quick-issue flow state
  const [selectedIssue, setSelectedIssue] = useState<QuickIssue | null>(null);
  const [quickFields, setQuickFields] = useState<Record<string, string>>({});

  // Scan state
  const [scanResult, setScanResult] = useState<ApiResult | null>(null);
  const [scanContext, setScanContext] = useState("");
  const [textInput, setTextInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [draftRecovered, setDraftRecovered] = useState(false);

  // ── Auto-save drafts to localStorage ─────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("ghostlaw_draft");
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.textInput && draft.textInput.length > 10) { setTextInput(draft.textInput); setDraftRecovered(true); }
        if (draft.scanContext) setScanContext(draft.scanContext);
        if (draft.quickFields && Object.keys(draft.quickFields).length > 0) {
          setQuickFields(draft.quickFields);
          // Restore the selected issue if possible
          const issues = country === "NG" ? NG_ISSUES : US_ISSUES;
          const match = issues.find(i => i.id === draft.selectedIssueId);
          if (match) { setSelectedIssue(match); setDraftRecovered(true); }
        }
      } catch { /* ignore corrupt drafts */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save drafts on change (debounced via effect)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const timer = setTimeout(() => {
      const draft = {
        textInput,
        scanContext,
        quickFields,
        selectedIssueId: selectedIssue?.id || null,
      };
      // Only save if there's actual content
      if (textInput.length > 5 || Object.values(quickFields).some(v => v.length > 0)) {
        localStorage.setItem("ghostlaw_draft", JSON.stringify(draft));
      }
    }, 1000); // 1-second debounce
    return () => clearTimeout(timer);
  }, [textInput, scanContext, quickFields, selectedIssue]);

  // Clear draft when scan succeeds
  useEffect(() => {
    if (scanResult && typeof window !== "undefined") {
      localStorage.removeItem("ghostlaw_draft");
      setDraftRecovered(false);
    }
  }, [scanResult]);

  // Show toast when draft is recovered
  useEffect(() => {
    if (draftRecovered) toast("Draft recovered — your previous input was saved automatically.", "success");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftRecovered]);

  // Dispute state
  const [disputeResult, setDisputeResult] = useState<ApiResult | null>(null);
  const [disputeTone, setDisputeTone] = useState("firm_but_polite");
  const [copied, setCopied] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // Call state
  const [callResult, setCallResult] = useState<ApiResult | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [callObjective, setCallObjective] = useState("");

  // Complaint state
  const [complaintResult, setComplaintResult] = useState<ApiResult | null>(null);
  const [complaintAgency, setComplaintAgency] = useState("cfpb");

  // Auto-suggest agency when scan result has recommendation
  useEffect(() => {
    if (scanResult?.recommended_agency && typeof scanResult.recommended_agency === "string") {
      setComplaintAgency(scanResult.recommended_agency as string);
    }
  }, [scanResult]);

  // History state
  const [localStats, setLocalStats] = useState(getLocalStats());
  const [localHistory, setLocalHistory] = useState(getLocalHistory());

  // Outcome tracking
  const [outcomeOpen, setOutcomeOpen] = useState(false);

  // Issue card expand/collapse
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const toggleIssue = (idx: number) => setExpandedIssues(prev => {
    const next = new Set(prev);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    return next;
  });

  // History search/filter
  const [historySearch, setHistorySearch] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "won" | "pending" | "untracked">("all");

  // Legal tip rotation
  const [tipIndex, setTipIndex] = useState(0);
  const tips = country === "NG" ? NG_LEGAL_TIPS : US_LEGAL_TIPS;

  // Dispute sent date tracking (for deadline countdown)
  const [disputeSentDate, setDisputeSentDate] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("ghostlaw_dispute_sent");
    return null;
  });

  const markDisputeSent = () => {
    const d = new Date().toISOString();
    setDisputeSentDate(d);
    if (typeof window !== "undefined") localStorage.setItem("ghostlaw_dispute_sent", d);
  };

  const refreshLocal = useCallback(() => {
    setLocalStats(getLocalStats());
    setLocalHistory(getLocalHistory());
  }, []);

  useEffect(() => { refreshLocal(); }, [refreshLocal]);

  // Rotate legal tips while loading OR on home
  useEffect(() => {
    if (!loading && activeTab !== "home") return;
    const iv = setInterval(() => setTipIndex(i => (i + 1) % tips.length), loading ? 4000 : 8000);
    return () => clearInterval(iv);
  }, [loading, activeTab, tips.length]);

  // ── Navigation helpers ─────────────────────────────────
  const FLOW: Tab[] = ["home", "results", "dispute", "call", "complaint"];
  const flowIndex = FLOW.indexOf(activeTab);
  const canGoBack = flowIndex > 0 || activeTab === "scan" || activeTab === "history";
  const canGoNext = flowIndex >= 0 && flowIndex < FLOW.length - 1 && scanResult;

  const goBack = () => {
    if (activeTab === "scan" || activeTab === "history") { setActiveTab("home"); return; }
    if (flowIndex > 0) setActiveTab(FLOW[flowIndex - 1]);
  };
  const goNext = () => {
    if (flowIndex >= 0 && flowIndex < FLOW.length - 1) setActiveTab(FLOW[flowIndex + 1]);
  };

  // ── Handlers ─────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file: File) => {
    // Validate file size before uploading (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast("File too large — max 10MB. Try a smaller file or paste the text instead.", "error");
      return;
    }
    setLoading(true);
    setLoadingMsg("Uploading and analyzing your document — this may take up to 30 seconds...");
    try {
      const result = await scanDocument(file, scanContext, country);
      setScanResult(result);
      addScanToHistory(result);
      refreshLocal();
      setActiveTab("results");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scan failed";
      if (msg.includes("Connection failed")) {
        toast("Upload failed — slow connection. Try a smaller file or paste the text instead.", "error");
      } else {
        toast(msg, "error");
      }
    } finally { setLoading(false); }
  }, [scanContext, country, refreshLocal, toast]);

  const handleTextScan = useCallback(async (text?: string, ctx?: string) => {
    const t = text || textInput;
    if (t.length < 20) {
      toast("Please provide more details — we need at least a few lines to analyze.", "warning");
      return;
    }
    setLoading(true);
    setLoadingMsg("Analyzing your document — checking if there's a real issue...");
    try {
      const result = await scanText(t, ctx || scanContext, country);
      setScanResult(result);
      addScanToHistory(result);
      refreshLocal();
      setActiveTab("results");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Scan failed", "error");
    } finally { setLoading(false); }
  }, [textInput, scanContext, refreshLocal, country, toast]);

  const handleQuickScan = useCallback(async () => {
    if (!selectedIssue) return;
    let prompt = selectedIssue.prompt;
    for (const [key, val] of Object.entries(quickFields)) {
      prompt = prompt.replace(`{${key}}`, val || "[not provided]");
    }
    await handleTextScan(prompt, selectedIssue.context);
  }, [selectedIssue, quickFields, handleTextScan]);

  const handleGenerateDispute = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    setLoadingMsg("Writing your dispute letter...");
    try {
      const result = await generateDispute(scanResult.scan_id as string, [], disputeTone, "", country);
      setDisputeResult(result);
      addDisputeToHistory(result);
      refreshLocal();
      setActiveTab("dispute");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to generate dispute", "error");
    } finally { setLoading(false); }
  }, [scanResult, disputeTone, refreshLocal, country, toast]);

  const handleRequestCall = useCallback(async () => {
    if (!scanResult?.scan_id || !companyName) return;
    setLoading(true);
    setLoadingMsg("Building your call script...");
    try {
      const result = await requestCall(
        scanResult.scan_id as string, companyName,
        callObjective || "Dispute overcharges and negotiate a reduction",
        (disputeResult?.dispute_id as string) || "", "", country
      );
      setCallResult(result);
      addCallToHistory(result);
      refreshLocal();
      setActiveTab("call");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to generate call script", "error");
    } finally { setLoading(false); }
  }, [scanResult, companyName, callObjective, disputeResult, refreshLocal, country, toast]);

  const handleGenerateComplaint = useCallback(async () => {
    if (!scanResult?.scan_id) return;
    setLoading(true);
    setLoadingMsg("Drafting your regulatory complaint...");
    try {
      const result = await generateComplaint(
        scanResult.scan_id as string, complaintAgency,
        (disputeResult?.dispute_id as string) || "", companyName, "", "", country
      );
      setComplaintResult(result);
      setActiveTab("complaint");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to generate complaint", "error");
    } finally { setLoading(false); }
  }, [scanResult, complaintAgency, disputeResult, companyName, country, toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (title: string, body: string, filename: string) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text("Generated by GhostLaw — ghostlaw.app", pageW / 2, 12, { align: "center" });
    doc.setDrawColor(200); doc.line(15, 16, pageW - 15, 16);
    doc.setFontSize(18); doc.setTextColor(30); doc.text(title, 15, 28);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text(`Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 15, 35);
    doc.setFontSize(11); doc.setTextColor(40);
    const lines = doc.splitTextToSize(body, pageW - 30);
    let y = 44;
    for (const line of lines) {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 15, y); y += 6;
    }
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(170);
      doc.text(`Page ${i} of ${pages}`, pageW / 2, 290, { align: "center" });
    }
    doc.save(filename);
  };

  const sendViaEmail = (to: string, subject: string, body: string) => {
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  const handleLogout = () => { clearToken(); onLogout(); };

  const handleExportData = async () => {
    setPrivacyLoading(true);
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ghostlaw_data_export_${new Date().getTime()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Data exported successfully", "success");
    } catch {
      toast("Failed to export data", "error");
    }
    setPrivacyLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This will PERMANENTLY delete your account and all data. There is no undo.")) return;
    setPrivacyLoading(true);
    try {
      await deleteUserAccount();
      toast("Account deleted permanently", "success");
      setTimeout(() => handleLogout(), 1500);
    } catch {
      toast("Failed to delete account", "error");
      setPrivacyLoading(false);
    }
  };

  const navigate = (tab: Tab) => { if (tab === "history") refreshLocal(); setActiveTab(tab); setMobileNav(false); };

  const loadHistoryScan = (scan: Record<string, unknown>) => {
    setScanResult(scan);
    setActiveTab("results");
  };

  const handleSaveOutcome = (status: string, savings?: number) => {
    if (!scanResult?.scan_id) return;
    saveOutcome(scanResult.scan_id as string, status, savings);
    refreshLocal();
    setOutcomeOpen(false);
  };

  // suppress unused-var lint for downloadText
  void downloadText;

  // ── Font helpers ───────────────────────────────────────────
  const mono = "var(--font-ibm-plex-mono), monospace";
  const sans = "var(--font-ibm-plex-sans), sans-serif";
  const display = "var(--font-bebas-neue), sans-serif";

  // ── Flow step labels ───────────────────────────────────────
  const flowSteps = [
    { id: "home" as Tab, label: "Report", icon: "⌕", desc: "Tell us what happened" },
    { id: "results" as Tab, label: "What You're Owed", icon: "◉", desc: "See what they owe you" },
    { id: "dispute" as Tab, label: "Demand Letter", icon: "✉", desc: "Send a demand letter" },
    { id: "call" as Tab, label: "Call Script", icon: "☎", desc: "Call and demand refund" },
    { id: "complaint" as Tab, label: "Report Them", icon: "⚖", desc: "File with government" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--black)" }}>
      <ToastContainer />
      <header
        className="flex items-center justify-between px-4 md:px-6 py-3 flex-shrink-0"
        style={{ background: "var(--obsidian)", borderBottom: "1px solid var(--border)", zIndex: 40 }}
      >
        <div className="flex items-center gap-4">
          <button onClick={() => { setActiveTab("home"); setSelectedIssue(null); setQuickFields({}); setScanResult(null); setDisputeResult(null); setCallResult(null); setComplaintResult(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity" style={{ cursor: "pointer" }}>
            <span style={{ fontFamily: display, fontSize: 22, letterSpacing: "0.05em" }}>
              Ghost<span style={{ color: "var(--red)" }}>Law</span>
            </span>
            <span className="logo-dot" />
          </button>

          {/* Country toggle */}
          <div className="flex gap-0.5 ml-2" style={{ border: "1px solid var(--border)" }}>
            {([["US", "🇺🇸"], ["NG", "🇳🇬"]] as const).map(([code, flag]) => (
              <button
                key={code}
                onClick={() => switchCountry(code)}
                className="px-2.5 py-1.5 transition-all"
                style={{
                  fontFamily: mono, fontSize: 11,
                  color: country === code ? "var(--white)" : "var(--muted)",
                  background: country === code ? "var(--red-dim)" : "transparent",
                }}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {localStats.total_scans > 0 && (
            <button onClick={() => navigate("history")} className="hidden md:flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-[var(--surface)]" style={{ border: "1px solid var(--border)" }}>
              <span style={{ fontFamily: display, fontSize: 16, color: "#41e866" }}>{currencySymbol}{(localStats.confirmed_savings || localStats.estimated_savings).toLocaleString()}</span>
              <span style={{ fontFamily: mono, fontSize: 9, color: "var(--muted)", textTransform: "uppercase" }}>saved</span>
            </button>
          )}
          <button
            onClick={() => navigate("history")}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 transition-colors hover:bg-[var(--surface)]"
            style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            ▤ My Money
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center relative cursor-pointer" 
                 onClick={() => setPrivacyOpen(true)}
                 title="Privacy & Data Settings"
                 style={{ background: "var(--red-dim)", border: "1px solid rgba(232,25,44,0.3)", fontFamily: mono, fontSize: 11, color: "var(--red)", fontWeight: 600 }}>
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="hidden md:block" style={{ fontFamily: mono, fontSize: 11 }}>{user?.name || "User"}</span>
          </div>
          <button onClick={handleLogout} style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", cursor: "pointer" }}>↗ out</button>
          {/* Mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileNav(!mobileNav)} style={{ fontFamily: mono, fontSize: 18, color: "var(--muted2)" }}>
            {mobileNav ? "✕" : "☰"}
          </button>
        </div>
      </header>

      {/* Mobile nav dropdown */}
      {mobileNav && (
        <div className="md:hidden px-4 py-3 space-y-1" style={{ background: "var(--obsidian)", borderBottom: "1px solid var(--border)", zIndex: 39 }}>
          {[
            { id: "home" as Tab, icon: "⌕", label: "Report Issue" },
            { id: "scan" as Tab, icon: "📋", label: "Paste Document" },
            { id: "results" as Tab, icon: "◉", label: "Results" },
            { id: "history" as Tab, icon: "▤", label: "My Money" },
          ].map(item => (
            <button key={item.id} onClick={() => navigate(item.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5" style={{ fontFamily: mono, fontSize: 12, color: activeTab === item.id ? "var(--red)" : "var(--muted)", background: activeTab === item.id ? "var(--red-dim)" : "transparent" }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ═══ FLOW PROGRESS BAR ════════════════════════════ */}
      {scanResult && activeTab !== "home" && activeTab !== "history" && activeTab !== "scan" && (
        <div className="px-4 md:px-8 py-3 flex-shrink-0" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-0 max-w-4xl mx-auto" style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {flowSteps.map((step, i) => {
              const done = step.id === "home" ? !!scanResult
                : step.id === "results" ? !!scanResult?.issues_found
                : step.id === "dispute" ? !!disputeResult
                : step.id === "call" ? !!callResult
                : !!complaintResult;
              const active = activeTab === step.id;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => navigate(step.id)}
                    className="flex items-center gap-1.5 transition-colors group"
                    style={{ color: done ? "#41e866" : active ? "var(--red)" : "var(--muted)", cursor: "pointer" }}
                    title={step.desc}
                  >
                    <span style={{
                      display: "inline-flex", width: 20, height: 20, alignItems: "center", justifyContent: "center",
                      border: `1.5px solid ${done ? "#41e866" : active ? "var(--red)" : "var(--border)"}`,
                      background: done ? "rgba(65,232,102,0.1)" : active ? "var(--red-dim)" : "transparent",
                      fontSize: 10, fontWeight: 600,
                    }}>
                      {done ? "✓" : i + 1}
                    </span>
                    <span className="hidden md:inline">{step.label}</span>
                  </button>
                  {i < flowSteps.length - 1 && (
                    <div className="flex-1 mx-2" style={{ height: 1, background: done ? "rgba(65,232,102,0.3)" : "var(--border)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MAIN CONTENT ══════════════════════════════════ */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        {/* Loading overlay with legal tips */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="text-center p-8 max-w-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="spinner-sm mx-auto mb-4" style={{ width: 28, height: 28, borderWidth: 2 }} />
              <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 500 }}>{loadingMsg}</p>
              <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Usually takes 5-15 seconds</p>
              <div className="mt-5 p-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)", minHeight: 48 }}>
                <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>💡 Did you know?</p>
                <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted2)", lineHeight: 1.6, transition: "opacity 0.5s" }}>{tips[tipIndex]}</p>
              </div>
            </div>
          </div>
        )}

        {/* ═══ HOME TAB — QUICK ISSUE PICKER ═══════════════ */}
        {activeTab === "home" && (
          <div className="max-w-4xl mx-auto">
            {/* Hero */}
            <div className="text-center mb-8 pt-4">
              <h1 style={{ fontFamily: display, fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 0.95, marginBottom: 12 }}>
                GET YOUR <span style={{ color: "var(--red)" }}>MONEY BACK</span>
              </h1>
              <p style={{ fontFamily: sans, fontSize: 14, color: "var(--muted2)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
                {country === "NG"
                  ? "Tap your issue. Answer 2 quick questions. We'll find what they owe you and help you get it back — demand letter, call script, and government complaint. All in 60 seconds."
                  : "Tap your issue. Answer 2 quick questions. We'll find what they owe you and help you recover it — demand letter, call script, and regulator complaint. All in 60 seconds."
                }
              </p>
            </div>

            {/* Issue Grid */}
            {!selectedIssue ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                  {(country === "NG" ? NG_ISSUES : US_ISSUES).map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => { setSelectedIssue(issue); setQuickFields({}); }}
                      className="text-left p-5 transition-all hover:scale-[1.02] group"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{issue.icon}</div>
                      <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 600, marginBottom: 4, color: "var(--white)" }}>{issue.label}</div>
                      <div style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>{issue.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Alternative actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setActiveTab("scan")}
                    className="flex-1 p-4 flex items-center gap-3 transition-all hover:bg-[var(--surface2)]"
                    style={{ border: "1px dashed var(--border)" }}
                  >
                    <span style={{ fontSize: 20 }}>📋</span>
                    <div className="text-left">
                      <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600 }}>Paste a document instead</div>
                      <div style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)" }}>Bills, contracts, receipts — paste the full text</div>
                    </div>
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex-1 p-4 flex items-center gap-3 transition-all hover:bg-[var(--surface2)]"
                    style={{ border: "1px dashed var(--border)" }}
                  >
                    <span style={{ fontSize: 20 }}>📷</span>
                    <div className="text-left">
                      <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 600 }}>Upload a photo or PDF</div>
                      <div style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)" }}>Screenshot a bill, snap a receipt — AI reads it</div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  </button>
                </div>

                {/* Stats card at bottom */}
                {localStats.total_scans > 0 && (
                  <button onClick={() => navigate("history")} className="w-full mt-6 p-4 flex items-center justify-between transition-colors hover:bg-[var(--surface2)]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center gap-3">
                      <span style={{ fontFamily: display, fontSize: 32, color: "#41e866" }}>{currencySymbol}{(localStats.confirmed_savings || localStats.estimated_savings).toLocaleString()}</span>
                      <div className="text-left">
                        <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 600 }}>{localStats.confirmed_savings > 0 ? "Confirmed saved" : "Potential savings found"}</div>
                        <div style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }}>{localStats.total_scans} scans · {localStats.total_disputes} disputes</div>
                      </div>
                    </div>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)" }}>View history →</span>
                  </button>
                )}

                {/* ── Did You Know? ─────────────────────── */}
                <div className="mt-4 p-4 flex items-start gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                  <div>
                    <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Did you know?</div>
                    <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>{tips[tipIndex % tips.length]}</p>
                  </div>
                </div>

                {/* ── Recent Activity Feed ────────────────── */}
                {localHistory.scans.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>Recent Activity</div>
                      <button onClick={() => navigate("history")} style={{ fontFamily: mono, fontSize: 10, color: "var(--red)" }}>View all →</button>
                    </div>
                    <div className="space-y-2">
                      {localHistory.scans.slice(0, 4).map((scan, i) => {
                        const outcome = getOutcome(scan.scan_id);
                        return (
                          <button
                            key={scan.scan_id || i}
                            onClick={() => loadHistoryScan(scan)}
                            className="w-full flex items-center gap-3 p-3 transition-all hover:bg-[var(--surface2)]"
                            style={{ background: "var(--surface)", border: "1px solid var(--border)", textAlign: "left" }}
                          >
                            <span style={{
                              fontSize: 14, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                              background: outcome?.status === "won" ? "rgba(65,232,102,0.1)" : "var(--surface2)",
                              border: `1px solid ${outcome?.status === "won" ? "rgba(65,232,102,0.2)" : "var(--border)"}`,
                            }}>
                              {outcome?.status === "won" ? "🏆" : "📄"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 500 }} className="truncate">{(scan.document_type as string)?.replace(/_/g, " ") || "Document"}</span>
                                {(scan.case_strength as number) > 0 && (
                                  <span style={{
                                    fontFamily: mono, fontSize: 8, padding: "1px 5px",
                                    background: (scan.case_strength as number) >= 70 ? "rgba(65,232,102,0.1)" : "rgba(232,197,65,0.1)",
                                    color: (scan.case_strength as number) >= 70 ? "#41e866" : "#e8c541",
                                    border: `1px solid ${(scan.case_strength as number) >= 70 ? "rgba(65,232,102,0.2)" : "rgba(232,197,65,0.2)"}`,
                                  }}>
                                    {scan.case_strength as number}%
                                  </span>
                                )}
                              </div>
                              <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }} className="truncate block">{scan.summary as string}</span>
                            </div>
                            {(scan.total_potential_savings as number) > 0 && (
                              <span style={{ fontFamily: display, fontSize: 16, color: "var(--red)", whiteSpace: "nowrap" }}>
                                {currencySymbol}{(scan.total_potential_savings as number).toLocaleString()}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ── Quick Issue Form ─────────────────────── */
              <div className="max-w-lg mx-auto">
                <button
                  onClick={() => { setSelectedIssue(null); setQuickFields({}); }}
                  className="flex items-center gap-2 mb-6 transition-colors hover:text-[var(--red)]"
                  style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", cursor: "pointer" }}
                >
                  ← Back to issues
                </button>

                <div className="card-surface p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <span style={{ fontSize: 32 }}>{selectedIssue.icon}</span>
                    <div>
                      <h2 style={{ fontFamily: display, fontSize: 28, lineHeight: 1 }}>{selectedIssue.label}</h2>
                      <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)" }}>{selectedIssue.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedIssue.placeholders.map((p, i) => (
                      <div key={p.field}>
                        <label style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--muted2)", display: "block", marginBottom: 6 }}>
                          <span style={{ color: "var(--red)", marginRight: 4 }}>{i + 1}.</span>
                          {p.label}
                        </label>
                        <input
                          type="text"
                          value={quickFields[p.field] || ""}
                          onChange={(e) => setQuickFields({ ...quickFields, [p.field]: e.target.value })}
                          placeholder={p.placeholder}
                          className="input-ghost"
                          style={{ padding: "0.75rem 1rem" }}
                          autoFocus={i === 0}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleQuickScan}
                    disabled={Object.values(quickFields).filter(Boolean).length < 2}
                    className="btn-primary w-full py-4 mt-6 flex items-center justify-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                    Find What I&apos;m Owed
                  </button>
                  <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)", textAlign: "center", marginTop: 8 }}>
                    Takes ~10 seconds · AI analyzes against {country === "NG" ? "Nigerian" : "US"} law
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SCAN TAB (Full paste) ═══════════════════════ */}
        {activeTab === "scan" && (
          <div className="max-w-4xl mx-auto">
            <button onClick={() => setActiveTab("home")} className="flex items-center gap-2 mb-4 transition-colors hover:text-[var(--red)]" style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
              ← Back
            </button>

            <div className="scanner-chrome">
              <div className="scanner-header-bar">
                <div className="dot-group"><div className="dot-r" /><div className="dot-y" /><div className="dot-g" /></div>
                <div style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", letterSpacing: "0.05em" }}>ghostlaw_scanner — paste or type</div>
                <div className="status-indicator"><div className="status-dot" /> AI Active</div>
              </div>

              <div className="p-6 space-y-5">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={country === "NG"
                    ? `Paste your document, bill, or message here...\n\nExamples:\n• Bank alert: "GTBank debited me ₦85,000 for a transfer that never reached the recipient"\n• Light bill: paste the full bill text\n• Loan app message: copy their threatening SMS\n• Landlord notice: paste the letter`
                    : `Paste your document, bill, or contract here...\n\nExamples:\n• Medical bill: paste the itemized charges\n• Lease: paste the clause you think is unfair\n• Insurance denial: paste the denial letter\n• Phone bill: paste the charges breakdown`}
                  className="input-ghost resize-none w-full"
                  style={{ minHeight: 240 }}
                />

                <div>
                  <label style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
                    Extra context (optional)
                  </label>
                  <input
                    type="text" value={scanContext}
                    onChange={(e) => setScanContext(e.target.value)}
                    placeholder={country === "NG" ? "e.g., 'Already complained to the bank' or 'No meter installed'" : "e.g., 'I only stayed 2 hours' or 'I already paid $500'"}
                    className="input-ghost" style={{ padding: "0.75rem 1rem" }}
                  />
                </div>

                {/* Upload option */}
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                  className="p-5 text-center cursor-pointer transition-colors hover:bg-[var(--surface2)]"
                  style={{ border: "1px dashed var(--border)" }}
                >
                  <p style={{ fontFamily: mono, fontSize: 12, color: "var(--muted2)" }}>Or drop a photo / PDF here</p>
                  <p style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", marginTop: 4 }}>JPG, PNG, WebP, or PDF · Max 10MB</p>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                </div>

                <button onClick={() => handleTextScan()} disabled={textInput.length < 20} className="btn-primary w-full flex items-center justify-center gap-2.5 py-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  Find What They Owe Me
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ RESULTS TAB ═════════════════════════════════ */}
        {activeTab === "results" && scanResult && (
          <div className="max-w-4xl mx-auto space-y-4">

            {/* ── VERDICT BANNER ─────────────────────────── */}
            {scanResult.verdict === "legitimate" ? (
              <div className="text-center py-6 px-4" style={{ background: "linear-gradient(135deg, rgba(65,232,102,0.08), rgba(65,232,102,0.02))", border: "1px solid rgba(65,232,102,0.2)" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
                <div style={{ fontFamily: display, fontSize: "clamp(32px, 5vw, 48px)", color: "#41e866", lineHeight: 1 }}>
                  ALL GOOD
                </div>
                <p style={{ fontFamily: sans, fontSize: 13, color: "#41e866", marginTop: 8, opacity: 0.85 }}>
                  {(scanResult.verdict_note as string) || "This looks like a standard, legitimate charge. No action needed."}
                </p>
                <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginTop: 12 }}>
                  {(scanResult.document_type as string)?.replace(/_/g, " ")} · No issues detected
                </p>
              </div>
            ) : scanResult.verdict === "questionable" ? (
              <div className="text-center py-6 px-4" style={{ background: "linear-gradient(135deg, rgba(232,197,65,0.08), rgba(232,197,65,0.02))", border: "1px solid rgba(232,197,65,0.2)" }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🤔</div>
                <div style={{ fontFamily: display, fontSize: "clamp(32px, 5vw, 48px)", color: "#e8c541", lineHeight: 1 }}>
                  WORTH INVESTIGATING
                </div>
                <p style={{ fontFamily: sans, fontSize: 13, color: "#e8c541", marginTop: 8, opacity: 0.85 }}>
                  {(scanResult.verdict_note as string) || "Some things look off, but we need more information to be sure."}
                </p>
                {(scanResult.total_potential_savings as number) > 0 && (
                  <div style={{ fontFamily: display, fontSize: "clamp(28px, 5vw, 44px)", color: "#e8c541", marginTop: 8 }}>
                    {currencySymbol}{(scanResult.total_potential_savings as number).toLocaleString()}
                    <span style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", display: "block", marginTop: 4 }}>potential savings if confirmed</span>
                  </div>
                )}
              </div>
            ) : /* violation or legacy (no verdict field) */ (scanResult.total_potential_savings as number) > 0 ? (
              <div className="text-center py-6 px-4" style={{ background: "linear-gradient(135deg, rgba(232,25,44,0.06), rgba(232,25,44,0.02))", border: "1px solid rgba(232,25,44,0.15)" }}>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 4 }}>
                  ⚠️ {country === "NG" ? "You may be owed" : "You could save"}
                </div>
                <div style={{ fontFamily: display, fontSize: "clamp(48px, 8vw, 80px)", color: "var(--red)", lineHeight: 1 }}>
                  {currencySymbol}{(scanResult.total_potential_savings as number).toLocaleString()}
                </div>
                <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  Based on {(scanResult.issues_found as Array<ApiResult>)?.length || 0} issues found in your {(scanResult.document_type as string)?.replace(/_/g, " ")}
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                  <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                  Analysis Complete
                </div>
                <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                  FINDINGS
                </h1>
                <p style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                  {(scanResult.document_type as string)?.replace(/_/g, " ")} · {(scanResult.issues_found as Array<ApiResult>)?.length || 0} issues detected
                </p>
              </div>
            )}

            {/* Clarifying questions (for questionable verdicts) */}
            {scanResult.verdict === "questionable" && (scanResult.clarifying_questions as string[])?.length > 0 && (
              <div className="card-surface p-5" style={{ borderLeft: "3px solid #e8c541" }}>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8c541", marginBottom: 10 }}>Help us understand better</div>
                <ul className="space-y-2">
                  {(scanResult.clarifying_questions as string[]).map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                      <span style={{ color: "#e8c541" }}>?</span> {q}
                    </li>
                  ))}
                </ul>
                <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
                  💡 Tip: Re-scan with more details in the &quot;Extra context&quot; field to get a more accurate analysis
                </p>
              </div>
            )}

            {/* Risk badge */}
            {scanResult.verdict !== "legitimate" && scanResult.risk_level && (
              <div className="flex items-center gap-3">
                <span className={`badge ${
                  scanResult.risk_level === "critical" ? "badge-critical"
                  : scanResult.risk_level === "high" ? "badge-warn"
                  : scanResult.risk_level === "medium" ? "badge-info"
                  : "badge-success"
                }`}>
                  {scanResult.risk_level as string} risk
                </span>
                <span style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)" }}>
                  {scanResult.risk_level === "critical" ? "This needs immediate action" : scanResult.risk_level === "high" ? "Strong case — take action soon" : scanResult.risk_level === "medium" ? "Worth disputing" : "Minor issues found"}
                </span>
              </div>
            )}

            {/* ── Case Strength Meter ───────────────────── */}
            {scanResult.verdict !== "legitimate" && (scanResult.case_strength as number) > 0 && (
              <div className="card-surface p-5">
                <div className="flex items-center justify-between mb-3">
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>Case Strength</div>
                  <div style={{ fontFamily: display, fontSize: 32, color: (scanResult.case_strength as number) >= 70 ? "#41e866" : (scanResult.case_strength as number) >= 40 ? "#e8c541" : "var(--red)" }}>
                    {scanResult.case_strength as number}<span style={{ fontSize: 16, color: "var(--muted)" }}>/100</span>
                  </div>
                </div>
                <div style={{ background: "var(--surface2)", height: 8, width: "100%", position: "relative", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${scanResult.case_strength as number}%`,
                    background: (scanResult.case_strength as number) >= 70 ? "linear-gradient(90deg, #41e866, #2dd657)" : (scanResult.case_strength as number) >= 40 ? "linear-gradient(90deg, #e8c541, #d4a526)" : "linear-gradient(90deg, var(--red), #ff4d5e)",
                    transition: "width 1.5s ease-out",
                  }} />
                </div>
                <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted2)", marginTop: 8 }}>
                  {(scanResult.case_strength as number) >= 80 ? "🔥 Extremely strong case — you should absolutely fight this"
                    : (scanResult.case_strength as number) >= 60 ? "💪 Strong case — good chance of winning if you take action"
                    : (scanResult.case_strength as number) >= 40 ? "📋 Moderate case — worth pursuing, especially with a dispute letter"
                    : (scanResult.case_strength as number) >= 20 ? "🤔 Needs more investigation — add context and re-scan for a better assessment"
                    : "📝 Weak case, but a formal inquiry can still get answers"}
                </p>
              </div>
            )}

            {/* ── Urgency / Deadline Badge ──────────────── */}
            {scanResult.verdict !== "legitimate" && (scanResult.deadline_days || scanResult.urgency) && (
              <div className="flex flex-wrap gap-2">
                {scanResult.urgency === "immediate" && (
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.2)" }}>
                    <span style={{ fontSize: 14 }}>🚨</span>
                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--red)" }}>ACT NOW — Time-sensitive deadline</span>
                  </div>
                )}
                {scanResult.urgency === "soon" && (
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(232,197,65,0.08)", border: "1px solid rgba(232,197,65,0.2)" }}>
                    <span style={{ fontSize: 14 }}>⏰</span>
                    <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "#e8c541" }}>Take action within 1-2 weeks</span>
                  </div>
                )}
                {(scanResult.deadline_days as number) > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: "rgba(65,120,232,0.08)", border: "1px solid rgba(65,120,232,0.2)" }}>
                    <span style={{ fontSize: 14 }}>📅</span>
                    <span style={{ fontFamily: mono, fontSize: 11, color: "#4178e8" }}>
                      {country === "NG"
                        ? `Company must respond within ${scanResult.deadline_days} day${(scanResult.deadline_days as number) > 1 ? "s" : ""}`
                        : `${scanResult.deadline_days}-day legal response deadline`}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Plain English */}
            {scanResult.plain_english && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>What&apos;s going on (plain english)</div>
                <p style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.7 }}>{scanResult.plain_english as string}</p>
              </div>
            )}

            {/* Issues */}
            {(scanResult.issues_found as Array<ApiResult>)?.length > 0 && (
              <div>
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Problems we found</div>
                <div className="space-y-3">
                  {(scanResult.issues_found as Array<ApiResult>).map((issue, i: number) => {
                    const isExpanded = expandedIssues.has(i);
                    return (
                    <div key={i} className={`finding-card ${issue.severity === "critical" ? "critical" : issue.severity === "high" ? "warning" : issue.severity === "medium" ? "info" : "low"}`} style={{ cursor: "pointer", transition: "transform 0.15s" }} onClick={() => toggleIssue(i)}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: issue.severity === "critical" ? "var(--red)" : issue.severity === "high" ? "#e8c541" : issue.severity === "medium" ? "#4178e8" : "#41e866" }}>
                            {issue.severity as string}
                          </span>
                          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{issue.issue as string}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {(issue.potential_savings as number) > 0 && (
                            <span style={{ fontFamily: display, fontSize: 20, color: "var(--red)", whiteSpace: "nowrap" }}>
                              −{currencySymbol}{(issue.potential_savings as number).toLocaleString()}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: "var(--muted)", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                          <div style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>{highlightLegalTerms(issue.explanation as string)}</div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rights */}
            {(scanResult.your_rights as string[])?.length > 0 && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
                  {scanResult.verdict === "legitimate" ? "Good to know — your rights" : "Laws that protect you"}
                </div>
                <ul className="space-y-2">
                  {(scanResult.your_rights as string[]).map((right: string, i: number) => (
                    <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                      <span style={{ color: "#41e866" }}>✓</span> {highlightLegalTerms(right)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            {(scanResult.recommended_actions as string[])?.length > 0 && (
              <div className="card-surface p-5">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>What to do next</div>
                <ol className="space-y-2">
                  {(scanResult.recommended_actions as string[]).map((action: string, i: number) => (
                    <li key={i} className="flex items-start gap-3" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                      <span style={{ fontFamily: display, fontSize: 18, color: "rgba(255,255,255,0.1)", minWidth: 20 }}>0{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* ── Export / Share Results ─────────────────── */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  const issues = (scanResult.issues_found as Array<ApiResult>) || [];
                  const body = [
                    `ANALYSIS REPORT`,
                    `Document type: ${(scanResult.document_type as string)?.replace(/_/g, " ") || "Document"}`,
                    `Verdict: ${scanResult.verdict || "violation"}`,
                    `Case strength: ${scanResult.case_strength || "N/A"}/100`,
                    scanResult.plain_english ? `\nSummary:\n${scanResult.plain_english}` : "",
                    issues.length > 0 ? `\nIssues Found (${issues.length}):` : "",
                    ...issues.map((issue, i) => `\n${i + 1}. [${(issue.severity as string || "").toUpperCase()}] ${issue.issue}\n   ${issue.explanation}${(issue.potential_savings as number) > 0 ? `\n   Potential savings: ${currencySymbol}${(issue.potential_savings as number).toLocaleString()}` : ""}`),
                    (scanResult.your_rights as string[])?.length ? `\n\nYour Rights:\n${(scanResult.your_rights as string[]).map(r => `• ${r}`).join("\n")}` : "",
                    (scanResult.recommended_actions as string[])?.length ? `\n\nRecommended Actions:\n${(scanResult.recommended_actions as string[]).map((a, i) => `${i + 1}. ${a}`).join("\n")}` : "",
                  ].filter(Boolean).join("\n");
                  downloadPDF("GhostLaw Analysis Report", body, `GhostLaw_Analysis_${new Date().toISOString().slice(0, 10)}.pdf`);
                  toast("PDF downloaded", "success");
                }}
                className="btn-sm flex items-center gap-1.5"
                style={{ color: "var(--red)", borderColor: "rgba(232,25,44,0.3)", background: "var(--red-dim)" }}
              >
                ↓ Download PDF
              </button>
              <button
                onClick={() => {
                  const text = `${scanResult.plain_english || scanResult.summary || "Analysis complete"}\n\n${(scanResult.issues_found as Array<ApiResult>)?.map((iss, i) => `${i + 1}. ${iss.issue}`).join("\n") || ""}`;
                  copyToClipboard(text);
                  toast("Analysis copied", "success");
                }}
                className="btn-sm flex items-center gap-1.5"
              >
                {copied ? "✓ Copied" : "📋 Copy Summary"}
              </button>
            </div>

            {/* Outcome tracking */}
            {scanResult.scan_id && (
              <div className="card-surface p-4">
                {(() => {
                  const existing = getOutcome(scanResult.scan_id as string);
                  if (existing) {
                    return (
                      <div>
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 18 }}>🏆</span>
                          <div>
                            <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 500 }}>
                              Outcome:{" "}
                              <span style={{ color: existing.status === "won" ? "#41e866" : existing.status === "partial" ? "#4178e8" : existing.status === "lost" ? "var(--red)" : "#e8c541" }}>
                                {existing.status === "won" ? "Won! 🎉" : existing.status === "partial" ? "Partial win" : existing.status === "lost" ? "Denied" : "Pending..."}
                              </span>
                            </p>
                            {existing.actual_savings ? <p style={{ fontFamily: mono, fontSize: 11, color: "#41e866" }}>Saved {currencySymbol}{existing.actual_savings.toLocaleString()}</p> : null}
                          </div>
                        </div>

                        {/* ── Victory Share Card ───────── */}
                        {existing.status === "won" && (
                          <div className="mt-4 p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(65,232,102,0.08), rgba(65,232,102,0.02))", border: "1px solid rgba(65,232,102,0.2)" }}>
                            <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "#41e866", marginBottom: 6 }}>🎉 Share your win</p>
                            <p style={{ fontFamily: display, fontSize: 28, color: "#41e866", lineHeight: 1 }}>
                              I saved {currencySymbol}{(existing.actual_savings || scanResult.total_potential_savings as number || 0).toLocaleString()}
                            </p>
                            <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)", marginTop: 4 }}>using GhostLaw 👻</p>
                            <div className="flex justify-center gap-2 mt-4">
                              <button
                                onClick={() => {
                                  const msg = `I just saved ${currencySymbol}${(existing.actual_savings || (scanResult.total_potential_savings as number) || 0).toLocaleString()} on my ${(scanResult.document_type as string)?.replace(/_/g, " ")} using GhostLaw! 👻🔥\n\nThis AI found violations the company hoped I'd never notice.\n\nTry it free: ${typeof window !== "undefined" ? window.location.origin : "https://ghostlaw.app"}`;
                                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(msg)}`, "_blank");
                                }}
                                className="btn-sm" style={{ color: "#1DA1F2", borderColor: "rgba(29,161,242,0.3)", background: "rgba(29,161,242,0.08)" }}
                              >
                                𝕏 Tweet
                              </button>
                              <button
                                onClick={() => {
                                  const msg = `I just saved ${currencySymbol}${(existing.actual_savings || (scanResult.total_potential_savings as number) || 0).toLocaleString()} on my ${(scanResult.document_type as string)?.replace(/_/g, " ")} using GhostLaw! 👻🔥\n\nThis AI found violations the company hoped I'd never notice.\n\nTry it free: ${typeof window !== "undefined" ? window.location.origin : "https://ghostlaw.app"}`;
                                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                                }}
                                className="btn-sm" style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.3)", background: "rgba(37,211,102,0.08)" }}
                              >
                                📱 WhatsApp
                              </button>
                              <button
                                onClick={() => {
                                  const msg = `I just saved ${currencySymbol}${(existing.actual_savings || (scanResult.total_potential_savings as number) || 0).toLocaleString()} on my ${(scanResult.document_type as string)?.replace(/_/g, " ")} using GhostLaw! 👻🔥 Try it free: ${typeof window !== "undefined" ? window.location.origin : "https://ghostlaw.app"}`;
                                  copyToClipboard(msg);
                                }}
                                className="btn-sm"
                              >
                                {copied ? "✓ Copied" : "📋 Copy"}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div>
                      <button onClick={() => setOutcomeOpen(!outcomeOpen)} className="flex items-center gap-2 transition-colors" style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
                        🏆 Did you win? Track the outcome
                        <span style={{ transition: "transform 0.2s", transform: outcomeOpen ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
                      </button>
                      {outcomeOpen && (
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {[
                            { s: "won", l: "Won! 🎉", c: "rgba(65,232,102,0.1)", tc: "#41e866" },
                            { s: "partial", l: "Partial win", c: "rgba(65,120,232,0.1)", tc: "#4178e8" },
                            { s: "pending", l: "Still pending", c: "rgba(232,197,65,0.1)", tc: "#e8c541" },
                            { s: "lost", l: "Denied", c: "rgba(232,25,44,0.1)", tc: "var(--red)" },
                          ].map((o) => (
                            <button key={o.s} onClick={() => handleSaveOutcome(o.s, o.s === "won" ? scanResult.total_potential_savings as number : undefined)} className="py-2 transition-colors" style={{ fontFamily: mono, fontSize: 11, fontWeight: 500, background: o.c, color: o.tc, border: "1px solid transparent" }}>
                              {o.l}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Next steps — depends on verdict */}
            {scanResult.verdict === "legitimate" ? (
              <div className="pt-2">
                <div className="card-surface p-5 text-center">
                  <p style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.7, marginBottom: 16 }}>
                    💡 GhostLaw found no issues with this document. If you think something&apos;s still off, try scanning again with more details in the extra context field.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button onClick={() => { setScanResult(null); setTextInput(""); setActiveTab("home"); }} className="btn-primary py-3 px-6">
                      ← Scan Something Else
                    </button>
                    <button onClick={() => { setScanResult(null); setTextInput(""); setActiveTab("scan"); }} className="py-3 px-6 transition-all" style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4178e8", background: "rgba(65,120,232,0.08)", border: "1px solid rgba(65,120,232,0.2)" }}>
                      Re-scan with Context
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>
                  Get your money — pick your next move
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button onClick={handleGenerateDispute} className="btn-primary flex items-center justify-center gap-2 py-4">
                    <span style={{ fontSize: 16 }}>✉</span>
                    <div className="text-left">
                      <div>Send Demand Letter</div>
                      <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 400, letterSpacing: "0.02em", textTransform: "none" }}>AI writes a legal demand citing specific laws</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("call")}
                    className="py-4 flex items-center justify-center gap-2 transition-all"
                    style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#4178e8", background: "rgba(65,120,232,0.08)", border: "1px solid rgba(65,120,232,0.2)" }}
                  >
                    <span style={{ fontSize: 16 }}>☎</span>
                    <div className="text-left">
                      <div>Call & Demand Refund</div>
                      <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 400, letterSpacing: "0.02em", textTransform: "none" }}>Word-for-word script for the phone call</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("complaint")}
                    className="py-4 flex items-center justify-center gap-2 transition-all"
                    style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8c541", background: "rgba(232,197,65,0.08)", border: "1px solid rgba(232,197,65,0.2)" }}
                  >
                    <span style={{ fontSize: 16 }}>⚖</span>
                    <div className="text-left">
                      <div>Report to Government</div>
                      <div style={{ fontSize: 9, opacity: 0.7, fontWeight: 400, letterSpacing: "0.02em", textTransform: "none" }}>One-tap complaint to {country === "NG" ? "CBN/FCCPC/NCC" : "CFPB/FCC/FTC"}</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ DISPUTE TAB ═════════════════════════════════ */}
        {activeTab === "dispute" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Step 2 of 4
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                DEMAND<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>LETTER</span>
              </h1>
              <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                AI writes a professional demand letter citing the exact laws they violated. Send it and watch them scramble.
              </p>
            </div>

            {!disputeResult ? (
              <div className="card-surface p-6">
                <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Pick a tone</div>
                <div className="space-y-2 mb-5">
                  {[
                    { id: "firm_but_polite", label: "Firm but polite", desc: "Professional. Cites specific laws and regulations.", icon: "📝" },
                    { id: "aggressive", label: "Aggressive", desc: "Demanding. References legal action if unresolved.", icon: "⚡" },
                    { id: "friendly", label: "Friendly", desc: "Cooperative but clear about what's wrong.", icon: "🤝" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setDisputeTone(t.id)}
                      className="w-full text-left p-4 transition-all flex items-center gap-3"
                      style={{
                        background: disputeTone === t.id ? "var(--red-dim)" : "var(--surface2)",
                        border: `1px solid ${disputeTone === t.id ? "rgba(232,25,44,0.3)" : "var(--border)"}`,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{t.icon}</span>
                      <div>
                        <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{t.label}</p>
                        <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={handleGenerateDispute} disabled={!scanResult} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                  ⚡ Write My Demand Letter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="letter-preview">
                  <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-2" style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--red)" }}>
                      ⚡ {disputeResult.subject_line as string}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => copyToClipboard(disputeResult.letter_body as string)} className="btn-sm">{copied ? "✓ Copied" : "📋 Copy"}</button>
                      <button onClick={() => downloadPDF(`Dispute Letter — ${disputeResult.subject_line}`, `To: ${disputeResult.send_to}\n\n${disputeResult.letter_body}`, `GhostLaw_Dispute_${new Date().toISOString().slice(0, 10)}.pdf`)} className="btn-sm" style={{ color: "var(--red)", borderColor: "rgba(232,25,44,0.3)" }}>↓ PDF</button>
                      <button onClick={() => sendViaEmail((disputeResult.send_to as string) || "", `Formal Dispute: ${disputeResult.subject_line}`, disputeResult.letter_body as string)} className="btn-sm" style={{ color: "#4178e8", borderColor: "rgba(65,120,232,0.3)" }}>✉ Email</button>
                      <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`*Dispute Letter — ${disputeResult.subject_line}*\n\n${disputeResult.letter_body}`)}`, "_blank")} className="btn-sm" style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }}>📱 WhatsApp</button>
                    </div>
                  </div>
                  <div className="p-6">
                    {disputeResult.send_to && <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginBottom: 12 }}>Send to: {disputeResult.send_to as string}</p>}
                    <div style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{highlightLegalTerms(disputeResult.letter_body as string)}</div>
                    <span className="letter-cursor" />
                  </div>
                </div>

                <div className="card-surface p-5" style={{ background: "rgba(65,120,232,0.03)", borderColor: "rgba(65,120,232,0.15)" }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#4178e8", marginBottom: 10 }}>After you send this</div>
                  <ol className="space-y-1.5" style={{ fontFamily: mono, fontSize: 11, color: "var(--muted2)" }}>
                    {country === "NG" ? (
                      <>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>1.</span> Send by email AND keep a screenshot</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>2.</span> Banks must respond within 24-72 hours (CBN mandate)</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>3.</span> If no response → file a complaint with the regulator (next step)</li>
                      </>
                    ) : (
                      <>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>1.</span> Send by email AND certified mail if over $500</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>2.</span> They have 30 days to respond (federal requirement)</li>
                        <li><span style={{ color: "#4178e8", fontWeight: 600 }}>3.</span> If no response → file a complaint with CFPB (next step)</li>
                      </>
                    )}
                  </ol>
                </div>

                {/* ── Escalation Path (NG-specific) ─────── */}
                {country === "NG" && (
                  <div className="card-surface p-5" style={{ borderLeft: "3px solid #e8c541" }}>
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8c541", marginBottom: 12 }}>📋 Nigerian Escalation Path</div>
                    <div className="space-y-3">
                      {(() => {
                        const docType = (scanResult?.document_type as string) || "";
                        const agency = (scanResult?.recommended_agency as string) || "";
                        if (docType.includes("electric") || agency === "nerc") return [
                          { step: "1", title: "DisCo Customer Complaints Unit (CCU)", detail: "File written complaint with your DisCo. They have 15 days to resolve.", time: "15 days", color: "#4178e8" },
                          { step: "2", title: "NERC Forum Office", detail: "If CCU fails → file written complaint with supporting affidavit at your state's NERC Forum Office.", time: "30 days", color: "#e8c541" },
                          { step: "3", title: "NERC HQ Formal Hearing", detail: "If Forum fails → escalate to NERC headquarters for formal adjudication hearing.", time: "60+ days", color: "var(--red)" },
                        ];
                        if (docType.includes("telecom") || docType.includes("phone") || agency === "ncc") return [
                          { step: "1", title: "Complain to your operator", detail: "Call customer care or visit a service center. Operators have 7 days to resolve.", time: "7 days", color: "#4178e8" },
                          { step: "2", title: "Escalate to NCC", detail: "If unresolved → call NCC toll-free 622 or file at consumer.ncc.gov.ng. NCC mediates.", time: "14 days", color: "#e8c541" },
                          { step: "3", title: "NCC Formal Arbitration", detail: "If mediation fails → NCC conducts formal arbitration. Decision is binding on operator.", time: "30+ days", color: "var(--red)" },
                        ];
                        if (docType.includes("bank") || docType.includes("credit") || agency === "cbn") return [
                          { step: "1", title: "Bank Complaint", detail: "File formal complaint with your bank. Simple cases: 72 hours. Complex: 14 days.", time: "3-14 days", color: "#4178e8" },
                          { step: "2", title: "CBN Consumer Protection", detail: "If unresolved → email cpd@cbn.gov.ng with all evidence. CBN investigates.", time: "14 days", color: "#e8c541" },
                          { step: "3", title: "FCCPC / Consumer Tribunal", detail: "If CBN fails → escalate to FCCPC Consumer Protection Tribunal for formal adjudication.", time: "30+ days", color: "var(--red)" },
                        ];
                        return [
                          { step: "1", title: "Complain to the company", detail: "Send your demand letter. Keep screenshot proof.", time: "7-14 days", color: "#4178e8" },
                          { step: "2", title: "File with regulator", detail: "FCCPC (fccpc.gov.ng), CBN, NCC, NERC — depending on the sector.", time: "14-30 days", color: "#e8c541" },
                          { step: "3", title: "FCCPC Consumer Tribunal", detail: "For serious cases or if regulator mediation fails. Can award damages up to 3x.", time: "60+ days", color: "var(--red)" },
                        ];
                      })().map((s) => (
                        <div key={s.step} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${s.color}`, fontFamily: mono, fontSize: 11, fontWeight: 700, color: s.color, flexShrink: 0 }}>{s.step}</div>
                            {s.step !== "3" && <div style={{ width: 1.5, height: 20, background: "var(--border)" }} />}
                          </div>
                          <div style={{ paddingBottom: s.step !== "3" ? 4 : 0 }}>
                            <div className="flex items-center gap-2">
                              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "var(--white)" }}>{s.title}</span>
                              <span style={{ fontFamily: mono, fontSize: 9, color: s.color, background: `${s.color}15`, padding: "1px 6px", border: `1px solid ${s.color}30` }}>⏱ {s.time}</span>
                            </div>
                            <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)", lineHeight: 1.5, marginTop: 2 }}>{s.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Free Legal Aid (NG) ──────────────── */}
                {country === "NG" && (
                  <div className="card-surface p-5" style={{ background: "rgba(65,232,102,0.02)", borderColor: "rgba(65,232,102,0.15)" }}>
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#41e866", marginBottom: 10 }}>🆓 Free Legal Help (if you need a lawyer)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { name: "Legal Aid Council", desc: "Free legal aid for low-income citizens", contact: "legalaidcouncil.gov.ng" },
                        { name: "LEDAP", desc: "Legal Defence and Assistance Project", contact: "ledapnigeria.org" },
                        { name: "NCC Consumer Line", desc: "Toll-free telecom complaints", contact: "Call 622 (free)" },
                        { name: "CBN Consumer Protection", desc: "Banking disputes", contact: "cpd@cbn.gov.ng" },
                        { name: "FCCPC Hotline", desc: "All consumer complaints", contact: "0800-FREE-CALL" },
                        { name: "ReportGov.ng", desc: "Unified govt complaint portal", contact: "reportgov.ng" },
                      ].map((aid) => (
                        <div key={aid.name} className="flex items-start gap-2 p-2.5" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                          <span style={{ color: "#41e866", fontSize: 12, marginTop: 1 }}>✓</span>
                          <div>
                            <div style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--white)" }}>{aid.name}</div>
                            <div style={{ fontFamily: sans, fontSize: 10, color: "var(--muted)", lineHeight: 1.4 }}>{aid.desc}</div>
                            <div style={{ fontFamily: mono, fontSize: 10, color: "#41e866", marginTop: 2 }}>{aid.contact}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Fear Factor Escalation Warning ────── */}
                <div className="p-4" style={{ background: "rgba(232,25,44,0.04)", border: "1px solid rgba(232,25,44,0.15)" }}>
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: 20, flexShrink: 0 }}>🔥</span>
                    <div>
                      <p style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>
                        {country === "NG" ? "No response? Escalate to government." : "No response? Report to federal agency."}
                      </p>
                      <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6, marginBottom: 8 }}>
                        {country === "NG"
                          ? "Under Nigerian law, companies must respond to formal complaints within specific timeframes. If they ignore your demand letter, filing with FCCPC, CBN, or NCC forces an official investigation."
                          : "Companies are legally required to respond to disputes. If they ignore you, a CFPB complaint creates a federal record they can't ignore — 97% of companies respond."
                        }
                      </p>
                      <button
                        onClick={() => setActiveTab("complaint")}
                        className="flex items-center gap-2 px-4 py-2 transition-all hover:scale-[1.02]"
                        style={{ fontFamily: mono, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--red)", background: "var(--red-dim)", border: "1px solid rgba(232,25,44,0.2)", cursor: "pointer" }}
                      >
                        ⚖ Skip to Government Complaint →
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Fight Timeline / Progress Tracker ─── */}
                <div className="card-surface p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#41e866" }}>⚔ Your Fight Timeline</div>
                    {!disputeSentDate && (
                      <button onClick={markDisputeSent} className="btn-sm" style={{ color: "#41e866", borderColor: "rgba(65,232,102,0.3)", background: "rgba(65,232,102,0.08)" }}>
                        ✓ I sent it
                      </button>
                    )}
                  </div>
                  {(() => {
                    const deadlineDays = (scanResult?.deadline_days as number) || (country === "NG" ? 3 : 30);
                    const daysSinceSent = disputeSentDate
                      ? Math.floor((Date.now() - new Date(disputeSentDate).getTime()) / 86400000)
                      : null;
                    const steps = [
                      { label: "Scan & analyze", done: true, detail: "Issues found, rights identified" },
                      { label: "Dispute letter written", done: true, detail: disputeResult?.subject_line as string },
                      { label: "Letter sent", done: !!disputeSentDate, detail: disputeSentDate ? `Sent ${new Date(disputeSentDate).toLocaleDateString()}` : "Tap 'I sent it' after you send" },
                      { label: `Wait for response (${deadlineDays} days)`, done: daysSinceSent !== null && daysSinceSent >= deadlineDays, detail: daysSinceSent !== null ? (daysSinceSent >= deadlineDays ? "Deadline passed — time to escalate!" : `Day ${daysSinceSent} of ${deadlineDays} — ${deadlineDays - daysSinceSent} days left`) : "Starts when you send the letter" },
                      { label: "No response? File complaint", done: !!complaintResult, detail: "Escalate to government regulator" },
                    ];
                    return (
                      <div className="space-y-0">
                        {steps.map((step, i) => (
                          <div key={i} className="flex gap-3" style={{ paddingBottom: i < steps.length - 1 ? 0 : 0 }}>
                            <div className="flex flex-col items-center">
                              <div style={{
                                width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                background: step.done ? "rgba(65,232,102,0.15)" : "var(--surface2)",
                                border: `1.5px solid ${step.done ? "#41e866" : "var(--border)"}`,
                                fontFamily: mono, fontSize: 10, color: step.done ? "#41e866" : "var(--muted)",
                              }}>
                                {step.done ? "✓" : i + 1}
                              </div>
                              {i < steps.length - 1 && <div style={{ width: 1.5, height: 28, background: step.done ? "rgba(65,232,102,0.3)" : "var(--border)" }} />}
                            </div>
                            <div style={{ paddingBottom: i < steps.length - 1 ? 12 : 0 }}>
                              <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 500, color: step.done ? "#41e866" : "var(--white)" }}>{step.label}</p>
                              <p style={{ fontFamily: sans, fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ CALL SCRIPT TAB ═════════════════════════════ */}
        {activeTab === "call" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Step 3 of 4
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                CALL<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>SCRIPT</span>
              </h1>
              <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                Exactly what to say when you call them. Follow the script — most people get results on the first call.
              </p>
            </div>

            {!callResult ? (
              <div className="card-surface p-6 space-y-4">
                <div>
                  <label style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--muted2)", display: "block", marginBottom: 6 }}>
                    <span style={{ color: "var(--red)", marginRight: 4 }}>1.</span> Who are you calling?
                  </label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-ghost" style={{ padding: "0.75rem 1rem" }} placeholder={country === "NG" ? "e.g. GTBank, MTN, Ikeja Electric" : "e.g. Metro General Hospital, Comcast, AT&T"} />
                </div>
                <div>
                  <label style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--muted2)", display: "block", marginBottom: 6 }}>
                    <span style={{ color: "var(--red)", marginRight: 4 }}>2.</span> What do you want them to do?
                  </label>
                  <input type="text" value={callObjective} onChange={(e) => setCallObjective(e.target.value)} className="input-ghost" style={{ padding: "0.75rem 1rem" }} placeholder="e.g. Reverse the charge, waive the fee, refund my money" />
                </div>

                <div className="p-4" style={{ background: "rgba(232,197,65,0.05)", border: "1px solid rgba(232,197,65,0.1)" }}>
                  <p style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541", marginBottom: 8 }}>📞 Quick tips</p>
                  <ul style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", lineHeight: 1.8 }}>
                    <li>• Call early morning (Tue-Thu) — shorter hold times</li>
                    <li>• Get the rep&apos;s name and employee ID first</li>
                    <li>• {country === "NG" ? "Say 'I will report to CBN/FCCPC' — it works" : "Ask for the 'retention' department — they can cut deals"}</li>
                  </ul>
                </div>

                <button onClick={handleRequestCall} disabled={!companyName || !scanResult} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                  ⚡ Generate Call Script
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {callResult?.script && (() => {
                  const script = callResult.script as ApiResult;
                  const buildFullScript = () => [
                    `CALL SCRIPT — ${companyName}`,
                    script.opening_script ? `\nOPENING:\n"${script.opening_script}"` : "",
                    (script.key_points as string[])?.length ? `\nKEY POINTS:\n${(script.key_points as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                    (script.negotiation_tactics as string[])?.length ? `\nNEGOTIATION:\n${(script.negotiation_tactics as string[]).map((t: string) => `• ${t}`).join("\n")}` : "",
                    (script.escalation_phrases as string[])?.length ? `\nIF THEY PUSH BACK:\n${(script.escalation_phrases as string[]).map((p: string) => `• ${p}`).join("\n")}` : "",
                    script.closing_script ? `\nCLOSING:\n"${script.closing_script}"` : "",
                    script.target_outcome ? `\nTARGET: ${script.target_outcome}` : "",
                  ].filter(Boolean).join("\n");

                  return (
                    <>
                      {script.opening_script && (
                        <div className="card-surface p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#41e866", background: "rgba(65,232,102,0.1)", border: "1px solid rgba(65,232,102,0.2)", padding: "2px 8px" }}>YOU</span>
                            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Step 1 — Opening</span>
                          </div>
                          <p className="p-4" style={{ fontFamily: mono, fontSize: 13, color: "var(--white)", background: "var(--surface2)", border: "1px solid var(--border)", lineHeight: 1.7, fontStyle: "italic", borderLeft: "3px solid #41e866" }}>
                            &ldquo;{script.opening_script as string}&rdquo;
                          </p>
                        </div>
                      )}
                      {(script.key_points as string[])?.length > 0 && (
                        <div className="card-surface p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#4178e8", background: "rgba(65,120,232,0.1)", border: "1px solid rgba(65,120,232,0.2)", padding: "2px 8px" }}>YOU</span>
                            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Step 2 — Key Points</span>
                          </div>
                          <ul className="space-y-2">{(script.key_points as string[]).map((p: string, i: number) => <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}><span style={{ fontFamily: mono, fontWeight: 700, color: "#4178e8", minWidth: 20 }}>{i + 1}.</span> {highlightLegalTerms(p)}</li>)}</ul>
                        </div>
                      )}
                      {(script.escalation_phrases as string[])?.length > 0 && (
                        <div className="card-surface p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "var(--red)", background: "rgba(232,25,44,0.1)", border: "1px solid rgba(232,25,44,0.2)", padding: "2px 8px" }}>YOU</span>
                            <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#e8c541", background: "rgba(232,197,65,0.1)", border: "1px solid rgba(232,197,65,0.2)", padding: "2px 8px", marginLeft: -4 }}>IF PUSHBACK</span>
                            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Step 3 — Escalation</span>
                          </div>
                          <ul className="space-y-2">{(script.escalation_phrases as string[]).map((p: string, i: number) => <li key={i} className="flex items-start gap-2" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}><span style={{ color: "var(--red)" }}>⚠</span> {highlightLegalTerms(p)}</li>)}</ul>
                        </div>
                      )}
                      {script.closing_script && (
                        <div className="card-surface p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "#41e866", background: "rgba(65,232,102,0.1)", border: "1px solid rgba(65,232,102,0.2)", padding: "2px 8px" }}>YOU</span>
                            <span style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>Step 4 — Closing</span>
                          </div>
                          <p className="p-4" style={{ fontFamily: mono, fontSize: 13, color: "var(--white)", background: "var(--surface2)", border: "1px solid var(--border)", lineHeight: 1.7, fontStyle: "italic", borderLeft: "3px solid #41e866" }}>
                            &ldquo;{script.closing_script as string}&rdquo;
                          </p>
                        </div>
                      )}
                      <div className="flex gap-3 flex-wrap">
                        <button onClick={() => copyToClipboard(buildFullScript())} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">{copied ? "✓ Copied" : "📋 Copy Full Script"}</button>
                        <button onClick={() => downloadPDF(`Call Script — ${companyName}`, buildFullScript(), `GhostLaw_CallScript_${companyName.replace(/\s+/g, "_")}.pdf`)} className="py-3 px-5 transition-colors" style={{ fontFamily: mono, fontSize: 12, color: "var(--red)", background: "rgba(232,25,44,0.08)", border: "1px solid rgba(232,25,44,0.2)" }}>↓ PDF</button>
                        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildFullScript())}`, "_blank")} className="py-3 px-5 transition-colors" style={{ fontFamily: mono, fontSize: 12, color: "#25D366", background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.2)" }}>📱 WhatsApp</button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ═══ COMPLAINT TAB ═══════════════════════════════ */}
        {activeTab === "complaint" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Step 4 of 4 — Nuclear Option
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                REPORT<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>TO GOVERNMENT</span>
              </h1>
              <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                {country === "NG"
                  ? "Report them directly to the Nigerian government. One tap. Companies respond FAST when regulators come knocking."
                  : "File with a federal agency in one tap. Companies settle FAST when regulators get involved."
                }
              </p>
            </div>

            {!complaintResult ? (
              <div className="space-y-4">
                <div className="card-surface p-5">
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 12 }}>Which agency? {country === "NG" ? "🇳🇬" : "🇺🇸"}</div>
                  <div className="space-y-2">
                    {(country === "NG" ? [
                      { id: "fccpc", name: "FCCPC", full: "Consumer Protection Commission", desc: "General consumer complaints — products, services, unfair practices", stat: "Primary consumer body", url: "https://fccpc.gov.ng/make-a-complaint/" },
                      { id: "cbn", name: "CBN", full: "Central Bank of Nigeria", desc: "Bank charges, failed transfers, loan issues, unauthorized debits", stat: "24-72hr resolution mandate", url: "https://www.cbn.gov.ng/Complaints/" },
                      { id: "ncc", name: "NCC", full: "Communications Commission", desc: "MTN, Airtel, Glo, 9mobile — data, airtime, billing", stat: "Enforces Consumer Code", url: "https://www.ncc.gov.ng/consumer/complaints" },
                      { id: "nerc", name: "NERC", full: "Electricity Regulatory Commission", desc: "Estimated billing, metering, outages, DisCo disputes", stat: "Metering is your right", url: "https://nerc.gov.ng/index.php/home/consumers" },
                      { id: "ndpc", name: "NDPC", full: "Data Protection Commission", desc: "Data privacy violations, unauthorized contact access", stat: "NDPA 2023 enforcement", url: "https://ndpc.gov.ng/complaints" },
                      { id: "efcc", name: "EFCC", full: "Financial Crimes Commission", desc: "Fraud, scams, financial crimes", stat: "Criminal investigations", url: "https://efcc.gov.ng/report" },
                    ] : [
                      { id: "cfpb", name: "CFPB", full: "Consumer Financial Protection Bureau", desc: "Medical bills, debt collection, banking fees", stat: "97% response rate", url: "https://www.consumerfinance.gov/complaint/" },
                      { id: "fcc", name: "FCC", full: "Federal Communications Commission", desc: "Phone bills, internet, cable, wireless carrier", stat: "Companies respond within days", url: "https://consumercomplaints.fcc.gov/hc/en-us" },
                      { id: "state_ag", name: "State AG", full: "State Attorney General", desc: "Local businesses, fraud, deceptive practices", stat: "Can investigate and sue", url: "https://www.usa.gov/state-attorney-general" },
                      { id: "ftc", name: "FTC", full: "Federal Trade Commission", desc: "Scams, fraud, deceptive advertising", stat: "Builds cases from complaints", url: "https://reportfraud.ftc.gov/" },
                    ]).map((a) => (
                      <button key={a.id} onClick={() => setComplaintAgency(a.id)} className="w-full text-left p-4 transition-all" style={{ background: complaintAgency === a.id ? "rgba(232,197,65,0.05)" : "var(--surface2)", border: `1px solid ${complaintAgency === a.id ? "rgba(232,197,65,0.2)" : "var(--border)"}` }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: "#e8c541" }}>{a.name}</span>
                          <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }}>— {a.full}</span>
                          {scanResult?.recommended_agency === a.id && (
                            <span className="badge badge-success" style={{ fontSize: 8, padding: "1px 6px" }}>★ AI RECOMMENDED</span>
                          )}
                        </div>
                        <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)" }}>{a.desc}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p style={{ fontFamily: mono, fontSize: 10, color: "#41e866", opacity: 0.7 }}>{a.stat}</p>
                          {complaintAgency === a.id && (
                            <span
                              onClick={(e) => { e.stopPropagation(); window.open(a.url, "_blank"); }}
                              className="flex items-center gap-1 px-2.5 py-1 transition-colors hover:bg-[rgba(232,197,65,0.15)]"
                              style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#e8c541", background: "rgba(232,197,65,0.08)", border: "1px solid rgba(232,197,65,0.2)", cursor: "pointer" }}
                            >
                              ↗ File Directly on {a.name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {!companyName && (
                  <div className="card-surface p-4">
                    <label style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>Company you&apos;re complaining about</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-ghost" style={{ padding: "0.75rem 1rem" }} placeholder="e.g. GTBank, MTN, Metro Hospital" />
                  </div>
                )}

                <div className="card-surface p-5" style={{ borderLeft: "3px solid #4178e8" }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4178e8", marginBottom: 10 }}>Evidence checklist (improves approval odds)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      "Transaction receipt / bill screenshot",
                      "Company name + account/reference number",
                      "Dates and exact amounts",
                      "Screenshot of your demand letter",
                      "Any response (or proof of no response)",
                      country === "NG" ? "Complaint ID from bank/operator DisCo (if any)" : "Customer support ticket number (if any)",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 p-2" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <span style={{ color: "#4178e8", fontSize: 11, marginTop: 1 }}>□</span>
                        <span style={{ fontFamily: sans, fontSize: 11, color: "var(--muted2)", lineHeight: 1.4 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", marginTop: 8 }}>
                    Tip: specific dates + amounts + screenshots get faster regulator action.
                  </p>
                </div>

                <div className="card-surface p-4" style={{ background: "rgba(232,197,65,0.04)", borderColor: "rgba(232,197,65,0.2)" }}>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541", marginBottom: 8 }}>Timeline reminders</div>
                  <ul style={{ fontFamily: sans, fontSize: 11, color: "var(--muted2)", lineHeight: 1.7 }}>
                    {country === "NG" ? (
                      <>
                        <li>• Day 0: File complaint + keep submission confirmation screenshot</li>
                        <li>• Day 7: No response? send reminder referencing complaint ID</li>
                        <li>• Day 14: Escalate to higher regulator channel (e.g. NCC 622 / CBN CPD / NERC Forum)</li>
                      </>
                    ) : (
                      <>
                        <li>• Day 0: File complaint + save confirmation number</li>
                        <li>• Day 7: Follow up with company and regulator portal</li>
                        <li>• Day 15: Escalate with additional evidence if unresolved</li>
                      </>
                    )}
                  </ul>
                </div>

                <button onClick={handleGenerateComplaint} disabled={!scanResult} className="btn-primary w-full py-4 flex items-center justify-center gap-2">⚡ Generate & File Complaint</button>

                {/* Escalation warning */}
                <div className="p-4" style={{ background: "rgba(232,25,44,0.04)", border: "1px solid rgba(232,25,44,0.15)" }}>
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <div>
                      <p style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, color: "var(--red)", marginBottom: 4 }}>
                        Companies hate this step
                      </p>
                      <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}>
                        {country === "NG"
                          ? "When you file with FCCPC or CBN, the company is legally required to respond within 7-14 days. Most companies settle immediately to avoid regulatory action. This is the step that gets your money back."
                          : "CFPB complaints have a 97% response rate. Companies are legally required to respond within 15 days. Most settle before the deadline to keep their regulatory record clean."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* ── ONE-TAP FILE NOW BANNER ─────────────── */}
                {(() => {
                  const filingUrls: Record<string, string> = {
                    fccpc: "https://fccpc.gov.ng/make-a-complaint/",
                    cbn: "https://www.cbn.gov.ng/Complaints/",
                    ncc: "https://www.ncc.gov.ng/consumer/complaints",
                    nerc: "https://nerc.gov.ng/index.php/home/consumers",
                    ndpc: "https://ndpc.gov.ng/complaints",
                    efcc: "https://efcc.gov.ng/report",
                    cfpb: "https://www.consumerfinance.gov/complaint/",
                    fcc: "https://consumercomplaints.fcc.gov/hc/en-us",
                    state_ag: "https://www.usa.gov/state-attorney-general",
                    ftc: "https://reportfraud.ftc.gov/",
                  };
                  const url = (complaintResult.filing_url as string) || filingUrls[complaintAgency] || "";
                  return (
                    <div className="p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(232,197,65,0.08), rgba(232,25,44,0.04))", border: "2px solid rgba(232,197,65,0.25)" }}>
                      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#e8c541", marginBottom: 8 }}>
                        ✅ Complaint ready — now file it
                      </div>
                      <p style={{ fontFamily: display, fontSize: "clamp(24px, 4vw, 36px)", color: "var(--white)", lineHeight: 1, marginBottom: 8 }}>
                        {(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()}
                      </p>
                      <p style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", marginBottom: 16 }}>
                        Your complaint text has been generated. Copy it, then tap the button below to open the {complaintAgency.toUpperCase()} filing page.
                      </p>
                      <div className="flex flex-col sm:flex-row justify-center gap-3">
                        <button
                          onClick={() => { copyToClipboard(complaintResult.complaint_text as string); toast("Complaint copied — now paste it on the filing page!", "success"); }}
                          className="px-6 py-3.5 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                          style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--white)", background: "var(--surface2)", border: "1px solid var(--border)" }}
                        >
                          📋 {copied ? "✓ Copied!" : "Step 1: Copy Complaint"}
                        </button>
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-3.5 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                            style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--black)", background: "#e8c541", textDecoration: "none" }}
                          >
                            ↗ Step 2: File on {complaintAgency.toUpperCase()} Now
                          </a>
                        )}
                      </div>
                      <p style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", marginTop: 12 }}>
                        {country === "NG"
                          ? "⏰ Companies must respond within 7-14 days once you file"
                          : "⏰ Companies must respond within 15 days of CFPB filing"
                        }
                      </p>
                    </div>
                  );
                })()}

                <div className="card-surface p-4 flex items-center justify-between flex-wrap gap-3" style={{ background: "rgba(232,197,65,0.03)", borderColor: "rgba(232,197,65,0.15)" }}>
                  <div>
                    <p style={{ fontFamily: mono, fontSize: 13, fontWeight: 600 }}>{(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()}</p>
                    <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Complaint ready to file</p>
                  </div>
                  {complaintResult.filing_url && <a href={complaintResult.filing_url as string} target="_blank" rel="noopener noreferrer" className="btn-sm" style={{ color: "#e8c541", borderColor: "rgba(232,197,65,0.3)", background: "rgba(232,197,65,0.1)" }}>↗ Go to filing page</a>}
                </div>

                {complaintResult.complaint_text && (
                  <div className="letter-preview">
                    <div className="flex items-center justify-between px-5 py-3 flex-wrap gap-2" style={{ background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541" }}>⚖ Complaint</div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => copyToClipboard(complaintResult.complaint_text as string)} className="btn-sm">{copied ? "✓ Copied" : "📋 Copy"}</button>
                        <button onClick={() => downloadPDF(`${complaintAgency.toUpperCase()} Complaint`, complaintResult.complaint_text as string, `GhostLaw_Complaint_${complaintAgency.toUpperCase()}.pdf`)} className="btn-sm" style={{ color: "var(--red)", borderColor: "rgba(232,25,44,0.3)" }}>↓ PDF</button>
                        <button onClick={() => sendViaEmail("", `${(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()} Complaint`, complaintResult.complaint_text as string)} className="btn-sm" style={{ color: "#4178e8", borderColor: "rgba(65,120,232,0.3)" }}>✉ Email</button>
                        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`*${(complaintResult.agency_full_name as string) || complaintAgency.toUpperCase()} Complaint*\n\n${complaintResult.complaint_text}`)}`, "_blank")} className="btn-sm" style={{ color: "#25D366", borderColor: "rgba(37,211,102,0.3)" }}>📱 WhatsApp</button>
                      </div>
                    </div>
                    <pre className="p-6 max-h-96 overflow-auto" style={{ fontFamily: sans, fontSize: 13, color: "var(--muted2)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{complaintResult.complaint_text as string}</pre>
                  </div>
                )}

                {(complaintResult.filing_steps as string[])?.length > 0 && (
                  <div className="card-surface p-5">
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#e8c541", marginBottom: 10 }}>How to file — step by step</div>
                    <ol className="space-y-2">{(complaintResult.filing_steps as string[]).map((step: string, i: number) => <li key={i} className="flex items-start gap-3" style={{ fontFamily: sans, fontSize: 12, color: "var(--muted2)", lineHeight: 1.6 }}><span style={{ fontFamily: display, fontSize: 18, color: "rgba(232,197,65,0.3)", minWidth: 20 }}>0{i + 1}</span>{step}</li>)}</ol>
                  </div>
                )}

                <button onClick={() => setComplaintResult(null)} className="w-full py-3 text-center transition-colors" style={{ fontFamily: mono, fontSize: 12, color: "var(--muted)", border: "1px solid var(--border)" }}>↺ Try a different agency</button>
              </div>
            )}
          </div>
        )}

        {/* ═══ HISTORY TAB ═════════════════════════════════ */}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div>
              <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red)", marginBottom: 6 }}>
                <span className="inline-block w-4 h-[1px] bg-[var(--red)] mr-2 align-middle" />
                Your Record
              </div>
              <h1 style={{ fontFamily: display, fontSize: "clamp(36px, 5vw, 56px)", lineHeight: 1 }}>
                MONEY<br /><span style={{ WebkitTextStroke: "1px rgba(255,255,255,0.2)", color: "transparent" }}>RECOVERED</span>
              </h1>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search cases..."
                  className="input-ghost w-full"
                  style={{ padding: "0.6rem 1rem 0.6rem 2.5rem" }}
                />
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--muted)" }}>⌕</span>
              </div>
              <div className="flex gap-1">
                {([
                  { id: "all" as const, label: "All" },
                  { id: "won" as const, label: "Won" },
                  { id: "pending" as const, label: "Pending" },
                  { id: "untracked" as const, label: "Untracked" },
                ]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setHistoryFilter(f.id)}
                    className="px-3 py-2 transition-all"
                    style={{
                      fontFamily: mono, fontSize: 10, letterSpacing: "0.06em",
                      color: historyFilter === f.id ? "var(--white)" : "var(--muted)",
                      background: historyFilter === f.id ? "var(--red-dim)" : "transparent",
                      border: `1px solid ${historyFilter === f.id ? "rgba(232,25,44,0.3)" : "var(--border)"}`,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Scanned", value: localStats.total_scans, color: "var(--red)" },
                { label: "Disputes", value: localStats.total_disputes, color: "#4178e8" },
                { label: "Call Scripts", value: localStats.total_calls, color: "#e8c541" },
                { label: localStats.confirmed_savings > 0 ? "Confirmed Saved" : "Potential Savings", value: `${currencySymbol}${(localStats.confirmed_savings || localStats.estimated_savings).toLocaleString()}`, color: "#41e866" },
              ].map((s, i) => (
                <div key={i} className="card-surface p-4">
                  <div style={{ fontFamily: display, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {(() => {
              const filtered = localHistory.scans.filter((scan) => {
                // Search filter
                if (historySearch) {
                  const q = historySearch.toLowerCase();
                  const docType = ((scan.document_type as string) || "").toLowerCase();
                  const summary = ((scan.summary as string) || "").toLowerCase();
                  if (!docType.includes(q) && !summary.includes(q)) return false;
                }
                // Status filter
                if (historyFilter !== "all") {
                  const outcome = getOutcome(scan.scan_id);
                  if (historyFilter === "won" && outcome?.status !== "won") return false;
                  if (historyFilter === "pending" && outcome?.status !== "pending") return false;
                  if (historyFilter === "untracked" && outcome) return false;
                }
                return true;
              });
              return filtered.length > 0 ? (
              <div style={{ border: "1px solid var(--border)" }}>
                <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] bg-[var(--surface2)] border-b border-[var(--border)]">
                  {["Case", "Amount", "Status", ""].map((h) => (
                    <div key={h || "action"} className="px-5 py-3 border-r border-[var(--border)] last:border-r-0" style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)" }}>{h}</div>
                  ))}
                </div>
                {filtered.map((scan, i) => {
                  const outcome = getOutcome(scan.scan_id);
                  return (
                    <div key={scan.scan_id || i} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] border-b border-[var(--border)] hover:bg-[var(--surface)] transition-colors" style={{ animation: `row-in 0.5s ease ${i * 0.05}s both` }}>
                      <button onClick={() => loadHistoryScan(scan)} className="text-left px-5 py-3.5 md:border-r border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          <p style={{ fontFamily: mono, fontSize: 12, fontWeight: 500 }}>{(scan.document_type as string)?.replace(/_/g, " ") || "Document"}</p>
                          {(scan.case_strength as number) > 0 && (
                            <span className="badge" style={{
                              fontSize: 8, padding: "1px 6px",
                              background: (scan.case_strength as number) >= 70 ? "rgba(65,232,102,0.1)" : (scan.case_strength as number) >= 40 ? "rgba(232,197,65,0.1)" : "rgba(232,25,44,0.1)",
                              color: (scan.case_strength as number) >= 70 ? "#41e866" : (scan.case_strength as number) >= 40 ? "#e8c541" : "var(--red)",
                              border: `1px solid ${(scan.case_strength as number) >= 70 ? "rgba(65,232,102,0.3)" : (scan.case_strength as number) >= 40 ? "rgba(232,197,65,0.3)" : "rgba(232,25,44,0.3)"}`,
                            }}>
                              {scan.case_strength as number}%
                            </span>
                          )}
                        </div>
                        <p style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", marginTop: 2 }} className="truncate">{scan.summary as string}</p>
                      </button>
                      <button onClick={() => loadHistoryScan(scan)} className="text-left px-5 py-3.5 md:border-r border-[var(--border)] flex items-center" style={{ fontFamily: display, fontSize: 16, color: "var(--red)" }}>
                        {(scan.total_potential_savings as number) > 0 ? `${currencySymbol}${(scan.total_potential_savings as number).toLocaleString()}` : "—"}
                      </button>
                      <div className="px-5 py-3.5 md:border-r border-[var(--border)] flex items-center">
                        {outcome ? (
                          <span className={`pill ${outcome.status === "won" ? "pill-won" : outcome.status === "partial" ? "pill-partial" : outcome.status === "pending" ? "pill-pending" : "pill-denied"}`}>
                            {outcome.status === "won" ? "Won ✓" : outcome.status}
                          </span>
                        ) : <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)" }}>—</span>}
                      </div>
                      <div className="px-5 py-3.5 flex items-center">
                        {!outcome || outcome.status === "pending" ? (
                          <button
                            onClick={() => { setScanResult(scan); setActiveTab("dispute"); }}
                            className="btn-sm whitespace-nowrap"
                            style={{ color: "var(--red)", borderColor: "rgba(232,25,44,0.3)", background: "var(--red-dim)", fontSize: 9 }}
                          >
                            ⚔ Fight
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 40, opacity: 0.15, marginBottom: 16 }}>👻</div>
                <p style={{ fontFamily: mono, fontSize: 13, color: "var(--muted2)", marginBottom: 4 }}>
                  {historySearch || historyFilter !== "all" ? "No matching cases" : "No cases yet"}
                </p>
                <p style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
                  {historySearch || historyFilter !== "all" ? "Try a different search or filter" : "Report your first issue to get started"}
                </p>
                <button onClick={() => { setHistorySearch(""); setHistoryFilter("all"); setActiveTab("home"); }} className="btn-primary py-3 px-8">
                  {historySearch || historyFilter !== "all" ? "Clear Filters" : "Report an Issue"}
                </button>
              </div>
            );
            })()}
          </div>
        )}
      </main>

      {/* ═══ BOTTOM NAV BAR (Back/Next for flow pages) ═══ */}
      {activeTab !== "home" && activeTab !== "history" && (
        <div className="hidden md:flex flex-shrink-0 px-4 md:px-8 py-3 items-center justify-between" style={{ background: "var(--obsidian)", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="flex items-center gap-2 px-4 py-2.5 transition-colors"
            style={{ fontFamily: mono, fontSize: 12, color: canGoBack ? "var(--muted2)" : "var(--muted)", border: "1px solid var(--border)", opacity: canGoBack ? 1 : 0.3, cursor: canGoBack ? "pointer" : "not-allowed" }}
          >
            ← Back
          </button>

          <div style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {activeTab === "scan" ? "Paste document" : activeTab === "results" ? "Analysis" : activeTab === "dispute" ? "Dispute letter" : activeTab === "call" ? "Call script" : "Complaint"}
          </div>

          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="flex items-center gap-2 px-4 py-2.5 transition-colors"
            style={{ fontFamily: mono, fontSize: 12, color: canGoNext ? "var(--red)" : "var(--muted)", border: `1px solid ${canGoNext ? "rgba(232,25,44,0.3)" : "var(--border)"}`, background: canGoNext ? "var(--red-dim)" : "transparent", opacity: canGoNext ? 1 : 0.3, cursor: canGoNext ? "pointer" : "not-allowed" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* ═══ MOBILE BOTTOM TAB BAR ════════════════════════ */}
      <div className="md:hidden flex-shrink-0 flex items-center justify-around py-2 mobile-bottom-nav" style={{ background: "var(--obsidian)", borderTop: "1px solid var(--border)" }}>
        {[
          { id: "home" as Tab, icon: "⌕", label: "Report" },
          { id: "results" as Tab, icon: "◉", label: "Results" },
          { id: "history" as Tab, icon: "▤", label: "My Money" },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="flex flex-col items-center gap-0.5 px-6 py-2 min-w-[64px]"
            style={{ color: activeTab === item.id ? "var(--red)" : "var(--muted)", fontFamily: mono, fontSize: 9 }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
{privacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,12,0.85)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md p-6 relative flex flex-col gap-6" style={{ background: "var(--obsidian)", border: "1px solid var(--border)", boxShadow: "0 24px 48px rgba(0,0,0,0.5)", borderRadius: 12 }}>
            <button onClick={() => setPrivacyOpen(false)} className="absolute top-4 right-4 text-xl" style={{ color: "var(--muted)", width: 32, height: 32 }}>✕</button>
            <div>
              <h2 style={{ fontFamily: display, fontSize: 28, color: "var(--white)" }}>Privacy & Data</h2>
              <p style={{ fontFamily: sans, fontSize: 14, color: "var(--muted2)", marginTop: 8, lineHeight: 1.5 }}>
                You own your data. Download a complete archive of your interaction history, or permanently erase your account.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleExportData} 
                disabled={privacyLoading}
                className="btn-secondary w-full py-4 px-6 flex justify-between items-center transition-all bg-[var(--surface)] hover:bg-[var(--line-subtle)] border border-[var(--border)] group"
                style={{ fontFamily: mono, fontSize: 13, color: "var(--white)", opacity: privacyLoading ? 0.7 : 1 }}>
                <span className="flex items-center gap-3"><span className="text-lg">↓</span> Export My Data Archive</span>
                <span className="text-[var(--muted)] group-hover:text-[var(--white)]">.JSON</span>
              </button>
              
              <button 
                onClick={handleDeleteAccount} 
                disabled={privacyLoading}
                className="w-full py-4 px-6 flex justify-between items-center transition-all group"
                style={{ background: "var(--red-dim)", border: "1px solid rgba(232,25,44,0.3)", borderRadius: 8, fontFamily: mono, fontSize: 13, color: "var(--white)", opacity: privacyLoading ? 0.7 : 1 }}>
                <span className="flex items-center gap-3 text-[var(--red)] group-hover:text-white"><span className="text-lg">✕</span> Permanently Delete Account</span>
                <span className="text-[var(--red)] group-hover:text-[var(--white)]">IRREVERSIBLE</span>
              </button>
            </div>
            
            <div className="mt-2 text-center" style={{ fontFamily: mono, fontSize: 11, color: "var(--muted)" }}>
              Data exports are processed instantly according to CCPA/GDPR compliance.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
