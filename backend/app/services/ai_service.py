"""
GhostLaw AI Service — Powered by Google Gemini 2.0 Flash (FREE tier)
Free: 15 requests/min, 1,500 requests/day, 1M tokens/day
"""

import google.generativeai as genai
import json
import re
import logging
from typing import Optional, List
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()

# Configure Gemini
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)

# Use Gemini 2.0 Flash — free, fast, multimodal (reads images!)
MODEL_NAME = "gemini-2.0-flash"


def _get_model():
    return genai.GenerativeModel(MODEL_NAME)


def _parse_json_response(text: str) -> dict:
    """Extract JSON from Gemini response, handling markdown code blocks."""
    # Try to find JSON in code blocks first
    json_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?```", text, re.DOTALL)
    if json_match:
        text = json_match.group(1)
    # Clean up and parse
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find any JSON object in the text
        obj_match = re.search(r"\{.*\}", text, re.DOTALL)
        if obj_match:
            try:
                return json.loads(obj_match.group(0))
            except json.JSONDecodeError:
                pass
    return {"error": "Failed to parse AI response", "raw": text[:500]}


async def analyze_document(image_bytes: bytes, mime_type: str, user_context: str = "") -> dict:
    """
    Analyze a document image with Gemini Vision.
    Returns structured analysis with issues, savings, and rights.
    """
    try:
        return await _analyze_document_impl(image_bytes, mime_type, user_context)
    except Exception as e:
        logger.error(f"Gemini analyze_document failed: {e}")
        # Return a helpful error instead of crashing
        return {
            "document_type": "other",
            "summary": "AI analysis temporarily unavailable. Please try again in a moment.",
            "plain_english": f"We couldn't analyze your document right now. This usually means the AI service is temporarily busy. Try again in 30 seconds. (Error: {str(e)[:100]})",
            "issues_found": [],
            "total_potential_savings": 0,
            "risk_level": "medium",
            "your_rights": ["You can try scanning again — the AI service usually recovers quickly"],
            "recommended_actions": ["Wait 30 seconds and try again", "If the problem persists, try pasting the text instead of uploading an image"],
        }


async def _analyze_document_impl(image_bytes: bytes, mime_type: str, user_context: str = "") -> dict:
    model = _get_model()

    prompt = f"""You are GhostLaw, an expert AI legal and financial analyst. 
Analyze this document image thoroughly.

User's additional context: {user_context or "None provided"}

Return a JSON object with EXACTLY this structure:
{{
    "document_type": "medical_bill|lease|contract|insurance|phone_bill|utility_bill|credit_card|fine_ticket|tax_document|subscription|other",
    "summary": "Brief 1-2 sentence summary of what this document is",
    "plain_english": "Full explanation of the document in simple, plain English that anyone can understand. Explain every important part, every charge, every term. Be thorough.",
    "issues_found": [
        {{
            "issue": "Description of the problem/overcharge/unfair term",
            "severity": "low|medium|high|critical",
            "potential_savings": 0.00,
            "explanation": "Why this is a problem and what the person should know"
        }}
    ],
    "total_potential_savings": 0.00,
    "risk_level": "low|medium|high|critical",
    "your_rights": ["List of specific legal rights the person has in this situation"],
    "recommended_actions": ["Step-by-step actions the person should take"]
}}

IMPORTANT: 
- Be aggressive in finding issues. Look for overcharges, hidden fees, unfair terms, errors, things that violate consumer protection laws.
- Calculate realistic potential savings for each issue.
- List specific laws and regulations that protect the user (FDCPA, FCRA, state consumer protection acts, etc.)
- If it's a medical bill, look for upcoding, unbundling, balance billing, surprise billing violations.
- If it's a lease, look for illegal clauses, excessive fees, habitability issues.
- Always side with the consumer. Be their advocate.
"""

    response = model.generate_content(
        [
            prompt,
            {"mime_type": mime_type, "data": image_bytes},
        ]
    )

    return _parse_json_response(response.text)


async def analyze_document_text(document_text: str, user_context: str = "", country: str = "US") -> dict:
    try:
        return await _analyze_document_text_impl(document_text, user_context, country)
    except Exception as e:
        logger.error(f"Gemini analyze_document_text failed: {e}")
        return {
            "document_type": "other",
            "summary": "AI analysis temporarily unavailable. Please try again in a moment.",
            "plain_english": f"We couldn't analyze your document right now. This usually means the AI service is temporarily busy. Try again in 30 seconds. (Error: {str(e)[:100]})",
            "issues_found": [],
            "total_potential_savings": 0,
            "risk_level": "medium",
            "your_rights": ["You can try scanning again — the AI service usually recovers quickly"],
            "recommended_actions": ["Wait 30 seconds and try again", "Try pasting a shorter excerpt if the document is very long"],
        }


# ── Country-specific legal context ────────────────────────────
NIGERIA_LEGAL_CONTEXT = """IMPORTANT — This user is in NIGERIA. You MUST cite Nigerian laws and agencies:
- FCCPA 2018 (Federal Competition and Consumer Protection Act) — S.114-127 for consumer rights, S.131 for unfair practices
- CBN Consumer Protection Framework 2019 — banks must refund failed transfers within 24-72 hours
- NCC Consumer Code of Practice — telecom data transparency, billing accuracy
- NERC Customer Complaints Handling Standards — estimated billing disputes, meter provision
- Nigeria Data Protection Act 2023 (NDPA) — S.24-28 lawful processing, S.34-38 data subject rights
- Lagos Tenancy Law 2011 — S.13 (6-month notice for yearly tenants), S.18 (recovery of premises)
- Currency is Nigerian Naira (₦). Use ₦ not $.
- Nigerian companies: banks (GTBank, Access Bank, UBA, Zenith, First Bank, Kuda, OPay), telecoms (MTN, Airtel, Glo, 9mobile), DisCos (EKEDC, IKEDC, AEDC, BEDC), loan apps (FairMoney, Carbon, Branch, PalmCredit, OKash)
- Regulatory agencies: FCCPC, CBN, NCC, NERC, NDPC, EFCC
- Reference Nigerian case law and CBN circulars where relevant."""

US_LEGAL_CONTEXT = """This user is in the UNITED STATES. Cite US federal and state laws:
- FDCPA, FCRA, FCBA, Fair Credit Billing Act, No Surprises Act
- State consumer protection acts, FTC Act Section 5
- Regulatory agencies: CFPB, FCC, FTC, State AG
- Currency is USD ($)."""


def _get_country_context(country: str) -> str:
    """Return the legal context string for the given country code."""
    if country.upper() == "NG":
        return NIGERIA_LEGAL_CONTEXT
    return US_LEGAL_CONTEXT


async def _analyze_document_text_impl(document_text: str, user_context: str = "", country: str = "US") -> dict:
    """Analyze pasted document text (no image)."""
    model = _get_model()
    country_ctx = _get_country_context(country)

    prompt = f"""You are GhostLaw, an expert AI legal and financial analyst.
Analyze this document text thoroughly.

{country_ctx}

DOCUMENT TEXT:
{document_text}

User's additional context: {user_context or "None provided"}

Return a JSON object with EXACTLY this structure:
{{
    "document_type": "medical_bill|lease|contract|insurance|phone_bill|utility_bill|credit_card|fine_ticket|tax_document|subscription|bank_charge|electricity_bill|telecom_charge|loan_app|other",
    "summary": "Brief 1-2 sentence summary of what this document is",
    "plain_english": "Full explanation of the document in simple, plain English that anyone can understand.",
    "issues_found": [
        {{
            "issue": "Description of the problem/overcharge/unfair term",
            "severity": "low|medium|high|critical",
            "potential_savings": 0.00,
            "explanation": "Why this is a problem and what the person should know"
        }}
    ],
    "total_potential_savings": 0.00,
    "risk_level": "low|medium|high|critical",
    "your_rights": ["List of specific legal rights the person has — cite the EXACT law sections"],
    "recommended_actions": ["Step-by-step actions to take"]
}}

Be aggressive in finding issues. Always side with the consumer."""

    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


async def generate_dispute_letter(
    scan_result: dict,
    issues_to_dispute: List[int],
    tone: str = "firm_but_polite",
    custom_context: str = "",
    country: str = "US",
) -> dict:
    """Generate a professional dispute letter based on scan results."""
    model = _get_model()

    # Select specific issues or all
    all_issues = scan_result.get("issues_found", [])
    if issues_to_dispute:
        selected_issues = [all_issues[i] for i in issues_to_dispute if i < len(all_issues)]
    else:
        selected_issues = all_issues

    tone_instructions = {
        "firm_but_polite": "Professional, firm but respectful. Cite specific laws and rights.",
        "aggressive": "Assertive and demanding. Mention regulatory complaints and legal action as next steps.",
        "friendly": "Warm and cooperative, but clear about the issues and expected resolution.",
    }
    country_ctx = _get_country_context(country)

    prompt = f"""You are GhostLaw, an expert consumer advocate AI.
Generate a professional dispute letter based on this analysis.

{country_ctx}

DOCUMENT SUMMARY: {scan_result.get('summary', '')}
DOCUMENT TYPE: {scan_result.get('document_type', 'other')}

ISSUES TO DISPUTE:
{json.dumps(selected_issues, indent=2)}

USER'S RIGHTS:
{json.dumps(scan_result.get('your_rights', []), indent=2)}

TONE: {tone_instructions.get(tone, tone_instructions['firm_but_polite'])}

ADDITIONAL CONTEXT FROM USER: {custom_context or "None"}

Return a JSON object with EXACTLY this structure:
{{
    "subject_line": "Subject line for the letter/email",
    "letter_body": "The full dispute letter text. Include:\\n- Clear identification of the account/bill\\n- Specific issues being disputed\\n- Relevant laws and consumer rights\\n- Specific resolution demanded\\n- Deadline for response (30 days)\\n- Mention of regulatory complaints if unresolved\\n\\nFormat with proper letter structure. Use [YOUR NAME], [YOUR ADDRESS], [ACCOUNT NUMBER] as placeholders.",
    "send_to": "Suggested department/recipient (e.g., 'Billing Disputes Department')",
    "estimated_savings": 0.00
}}

Make the letter POWERFUL. This should make the company want to resolve it immediately."""

    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


async def generate_call_script(
    scan_result: Optional[dict],
    dispute_letter: Optional[dict],
    company_name: str,
    objective: str,
    country: str = "US",
) -> dict:
    """Generate an AI call script/strategy for the ghost call."""
    model = _get_model()
    country_ctx = _get_country_context(country)

    prompt = f"""You are GhostLaw's Call Strategy AI. Generate a complete phone call script and strategy.

{country_ctx}

COMPANY TO CALL: {company_name}
OBJECTIVE: {objective}

DOCUMENT ANALYSIS:
{json.dumps(scan_result, indent=2) if scan_result else "No document analysis available"}

DISPUTE LETTER (if any):
{json.dumps(dispute_letter, indent=2) if dispute_letter else "No dispute letter generated yet"}

Return a JSON object with this structure:
{{
    "opening_script": "Exact words to say when someone answers",
    "key_points": ["List of key arguments to make"],
    "negotiation_tactics": ["Specific tactics for this type of call"],
    "escalation_phrases": ["What to say if they refuse or push back"],
    "laws_to_cite": ["Specific laws/regulations to reference"],
    "target_outcome": "The ideal resolution",
    "fallback_outcome": "Acceptable minimum resolution",
    "red_flags": ["Things to watch out for during the call"],
    "closing_script": "How to wrap up and confirm the resolution",
    "estimated_call_duration": "15-30 minutes",
    "difficulty_rating": "easy|medium|hard"
}}

Make this script so good that anyone could follow it and win the dispute."""

    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


async def generate_regulatory_complaint(
    scan_result: Optional[dict],
    dispute_letter: Optional[dict],
    agency: str = "cfpb",
    state: str = "",
    company_name: str = "",
    custom_context: str = "",
    country: str = "US",
) -> dict:
    """Generate a regulatory complaint for US or Nigerian agencies."""
    try:
        return await _generate_regulatory_complaint_impl(
            scan_result, dispute_letter, agency, state, company_name, custom_context, country
        )
    except Exception as e:
        logger.error(f"Gemini generate_regulatory_complaint failed: {e}")
        return {"error": f"Failed to generate complaint: {str(e)[:100]}"}


async def _generate_regulatory_complaint_impl(
    scan_result: Optional[dict],
    dispute_letter: Optional[dict],
    agency: str,
    state: str,
    company_name: str,
    custom_context: str,
    country: str = "US",
) -> dict:
    model = _get_model()
    country_ctx = _get_country_context(country)

    # ── Nigerian agencies ─────────────────────────────────────
    ng_agency_info = {
        "fccpc": {
            "name": "Federal Competition and Consumer Protection Commission",
            "url": "https://fccpc.gov.ng/consumers/complaint-handling/",
            "scope": "all consumer complaints — product safety, unfair practices, vendor fraud, e-commerce, billing disputes. Cite FCCPA 2018 S.114-127, S.131",
        },
        "cbn": {
            "name": "Central Bank of Nigeria — Consumer Protection Department",
            "url": "https://www.cbn.gov.ng/",
            "scope": "banking complaints — failed transfers, unauthorized debits, excess charges, ATM issues, fintech disputes. Banks have 72 hours to resolve per CBN Consumer Protection Framework. Email: cpd@cbn.gov.ng",
        },
        "ncc": {
            "name": "Nigerian Communications Commission",
            "url": "https://consumer.ncc.gov.ng/",
            "scope": "telecom complaints — MTN, Airtel, Glo, 9mobile: data depletion, unauthorized subscriptions, network quality, billing errors. Toll-free: 622. Cite NCC Consumer Code of Practice",
        },
        "nerc": {
            "name": "Nigerian Electricity Regulatory Commission",
            "url": "https://nerc.gov.ng/contact-nerc/",
            "scope": "electricity complaints — estimated billing, meter issues, outages, DisCo disputes. 3-tier escalation: 1) DisCo CCU → 2) NERC Forum → 3) NERC HQ. Cite NERC Customer Complaints Handling Standards",
        },
        "ndpc": {
            "name": "Nigeria Data Protection Commission",
            "url": "https://services.ndpc.gov.ng/breach/",
            "scope": "data privacy — loan app contact harvesting, unauthorized data sharing, defamatory messages, privacy breaches. Cite NDPA 2023 S.24-28, S.34-38. Email: info@ndpc.gov.ng",
        },
        "efcc": {
            "name": "Economic and Financial Crimes Commission",
            "url": "https://www.efcc.gov.ng/",
            "scope": "fraud, scams, cybercrime, financial crimes. Email: efaborresearch@efccnigeria.org",
        },
    }

    # ── US agencies ───────────────────────────────────────────
    us_agency_info = {
        "cfpb": {
            "name": "Consumer Financial Protection Bureau",
            "url": "https://www.consumerfinance.gov/complaint/",
            "scope": "financial products, billing, debt collection, credit reporting",
        },
        "fcc": {
            "name": "Federal Communications Commission",
            "url": "https://consumercomplaints.fcc.gov/",
            "scope": "phone, internet, cable, wireless carrier billing",
        },
        "state_ag": {
            "name": f"{state + ' ' if state else ''}State Attorney General",
            "url": "https://www.naag.org/find-my-ag/",
            "scope": "consumer fraud, deceptive practices, price gouging, unfair business practices",
        },
        "ftc": {
            "name": "Federal Trade Commission",
            "url": "https://reportfraud.ftc.gov/",
            "scope": "fraud, scams, deceptive business practices",
        },
    }

    agency_info = ng_agency_info if country.upper() == "NG" else us_agency_info
    target = agency_info.get(agency, list(agency_info.values())[0])

    prompt = f"""You are GhostLaw's Regulatory Complaint AI.
Generate a formal complaint to file with a government agency.

{country_ctx}

AGENCY: {target['name']}
FILING URL: {target['url']}
SCOPE: {target['scope']}

COMPANY: {company_name or 'See document analysis'}
STATE: {state or 'Not specified'}

DOCUMENT ANALYSIS:
{json.dumps(scan_result, indent=2) if scan_result else "No scan available"}

DISPUTE LETTER ALREADY SENT:
{json.dumps(dispute_letter, indent=2) if dispute_letter else "No dispute letter yet"}

ADDITIONAL CONTEXT: {custom_context or "None"}

Return a JSON object:
{{
    "agency": "{agency}",
    "agency_full_name": "{target['name']}",
    "filing_url": "{target['url']}",
    "complaint_text": "The FULL formal complaint text, ready to paste into the filing form. Include: company name, specific issues, dollar amounts, dates, laws violated, prior attempts to resolve, desired outcome. Write it like a real legal complaint — specific, factual, compelling.",
    "filing_steps": ["Step-by-step instructions for filing this complaint on the agency's website"],
    "pro_tips": ["Insider tips that make the complaint more effective"]
}}

Make the complaint devastating. Government agencies prioritize well-documented, specific complaints."""

    response = model.generate_content(prompt)
    return _parse_json_response(response.text)


# ── Demo mode (no API key needed) ────────────────────────────
DEMO_SCAN_RESULT = {
    "document_type": "medical_bill",
    "summary": "Emergency room visit bill from Metro General Hospital for $4,847.00",
    "plain_english": "You went to the ER and they're charging you $4,847. This includes: $2,100 for the ER facility fee (just for walking in the door), $890 for a CT scan, $1,200 for 'observation' (you were there 3 hours), $420 for medications (likely just ibuprofen and saline), and $237 for 'miscellaneous supplies'. Several of these charges appear inflated compared to fair market rates.",
    "issues_found": [
        {
            "issue": "Facility fee of $2,100 is 340% above Medicare rate",
            "severity": "critical",
            "potential_savings": 1470.00,
            "explanation": "The Medicare rate for this type of ER visit is approximately $630. The hospital is charging 3.4x that amount. You can negotiate based on fair market rates.",
        },
        {
            "issue": "Observation charge of $1,200 for 3-hour stay appears to be upcoded",
            "severity": "high",
            "potential_savings": 800.00,
            "explanation": "A 3-hour observation should be billed as outpatient, not inpatient observation. This is a common billing error called 'upcoding' that inflates the charge significantly.",
        },
        {
            "issue": "Medication charge of $420 for basic medications",
            "severity": "medium",
            "potential_savings": 350.00,
            "explanation": "Ibuprofen and saline IV are being billed at extreme markups. Fair market price for these basic medications is approximately $70.",
        },
        {
            "issue": "Vague 'miscellaneous supplies' charge of $237",
            "severity": "medium",
            "potential_savings": 237.00,
            "explanation": "Hospitals must provide an itemized bill. 'Miscellaneous supplies' is not an acceptable line item. You have the right to demand a detailed breakdown.",
        },
    ],
    "total_potential_savings": 2857.00,
    "risk_level": "critical",
    "your_rights": [
        "Right to an itemized bill (request within 30 days)",
        "Right to dispute charges under the No Surprises Act (2022)",
        "Right to request financial hardship discount (most hospitals are required to offer this)",
        "Right to negotiate a payment plan with 0% interest",
        "Right to request the hospital's charity care policy",
        "Right to pay Medicare rates if uninsured (many states require this)",
    ],
    "recommended_actions": [
        "Request a fully itemized bill immediately",
        "Compare each charge to Medicare rates at healthcare.gov",
        "Send a formal dispute letter for the overcharges",
        "Request the hospital's financial assistance application",
        "If they refuse to negotiate, file a complaint with your state's Attorney General",
        "Consider contacting a medical billing advocate",
    ],
}

DEMO_DISPUTE_LETTER = {
    "subject_line": "Formal Dispute: Account #[ACCOUNT NUMBER] — Overcharges Totaling $2,857",
    "letter_body": """[YOUR NAME]
[YOUR ADDRESS]
[CITY, STATE ZIP]
[DATE]

Billing Disputes Department
Metro General Hospital
[HOSPITAL ADDRESS]

RE: Formal Dispute of Charges — Account #[ACCOUNT NUMBER]
Date of Service: [DATE OF SERVICE]
Amount Billed: $4,847.00

Dear Billing Department,

I am writing to formally dispute several charges on the above-referenced account. After careful review, I have identified significant billing errors and overcharges that require immediate correction.

DISPUTED CHARGES:

1. FACILITY FEE ($2,100): This charge is approximately 340% above the Medicare reimbursement rate of $630 for this type of ER visit. I request this be adjusted to fair market value.

2. OBSERVATION CHARGE ($1,200): I was present for approximately 3 hours, which does not meet the criteria for inpatient observation billing. This appears to be an upcoding error and should be rebilled as outpatient.

3. MEDICATION CHARGES ($420): The medications administered (ibuprofen, saline IV) have a fair market value of approximately $70. I request an itemized breakdown of all medications and adjustment to fair pricing.

4. MISCELLANEOUS SUPPLIES ($237): This vague line item does not comply with itemized billing requirements. I request a detailed breakdown of every item included in this charge.

LEGAL BASIS:
Under the No Surprises Act (2022) and [STATE] Consumer Protection Act, I am entitled to fair and transparent billing. Additionally, your facility's charity care obligations under 26 U.S.C. § 501(r) require you to offer financial assistance to qualifying patients.

REQUESTED RESOLUTION:
I request that all identified overcharges be corrected, reducing the total bill by $2,857.00 to a fair amount of $1,990.00. Alternatively, I am willing to pay $1,500.00 as a good-faith settlement if paid within 30 days.

DEADLINE:
Please respond to this dispute within 30 calendar days of receipt, as required by federal billing regulations. If I do not receive a satisfactory response, I will file formal complaints with the [STATE] Attorney General's Office, the Centers for Medicare & Medicaid Services (CMS), and the Consumer Financial Protection Bureau (CFPB).

Please direct all future communications regarding this account to the address above.

Sincerely,
[YOUR NAME]""",
    "send_to": "Billing Disputes Department — send via certified mail with return receipt",
    "estimated_savings": 2857.00,
}
