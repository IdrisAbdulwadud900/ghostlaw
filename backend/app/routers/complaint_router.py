"""Complaint router — Generate regulatory complaints (CFPB, FCC, State AG)."""

import os
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.services.auth_service import get_current_user
from app.services.ai_service import generate_regulatory_complaint
from app.services.db_service import get_scan, get_dispute
from app.config import get_settings

router = APIRouter(prefix="/complaint", tags=["complaint"])
settings = get_settings()
_testing = os.environ.get("TESTING", "").lower() in ("1", "true", "yes")
limiter = Limiter(key_func=get_remote_address, enabled=not _testing)


class ComplaintRequest(BaseModel):
    scan_id: str
    dispute_id: Optional[str] = None
    agency: str = "cfpb"  # cfpb, fcc, state_ag, ftc | NG: fccpc, cbn, ncc, nerc, ndpc, efcc
    state: str = ""
    company_name: str = ""
    custom_context: str = ""
    country: str = "US"  # US or NG


DEMO_COMPLAINT = {
    "agency": "cfpb",
    "agency_full_name": "Consumer Financial Protection Bureau",
    "filing_url": "https://www.consumerfinance.gov/complaint/",
    "complaint_text": """COMPLAINT TO THE CONSUMER FINANCIAL PROTECTION BUREAU

COMPANY: Metro General Hospital
PRODUCT/SERVICE: Medical Debt / Billing

ISSUE: Unfair billing practices, overcharging, and failure to provide itemized billing as required by federal law.

DESCRIPTION:
I received emergency medical services at Metro General Hospital and was subsequently billed $4,847.00. Upon review, I identified the following billing irregularities:

1. FACILITY FEE ($2,100): This charge is approximately 340% above the Medicare reimbursement rate of $630 for comparable ER visits. This appears to constitute price gouging.

2. OBSERVATION CHARGE ($1,200): I was present for approximately 3 hours. This does not meet inpatient observation criteria and appears to be upcoded, violating the False Claims Act.

3. MEDICATION CHARGES ($420): Basic medications (ibuprofen, saline IV) billed at approximately 600% markup over fair market value (~$70).

4. VAGUE LINE ITEM ($237): "Miscellaneous supplies" is not an acceptable itemized charge. The hospital has failed to provide specific itemization as required.

PRIOR ATTEMPTS TO RESOLVE:
I have sent a formal dispute letter to the hospital's billing department requesting correction of these charges. [Include response or note non-response here.]

DESIRED RESOLUTION:
Correction of all identified overcharges, reducing the total bill to fair market rates. Investigation of the hospital's billing practices for systematic overcharging.

SUPPORTING DOCUMENTATION:
- Original bill showing all disputed charges
- Dispute letter sent on [DATE]
- [Any hospital response]""",
    "filing_steps": [
        "Go to consumerfinance.gov/complaint",
        "Select 'Medical debt' or 'Credit reporting' as the product",
        "Copy the complaint text above into the description field",
        "Attach your original bill and dispute letter as supporting documents",
        "Submit — the CFPB will forward your complaint to the company",
        "The company has 15 days to respond to the CFPB",
        "Check your CFPB portal for updates and company response",
    ],
    "pro_tips": [
        "CFPB complaints have a 97% response rate — companies take these seriously",
        "File even if you've already disputed directly — it creates a paper trail",
        "If the company doesn't resolve it through CFPB, mention this in any future legal action",
        "You can also file with your State Attorney General for additional pressure",
    ],
}


@router.post("/generate")
@limiter.limit("60/hour")
async def generate_complaint(
    request: Request,
    req: ComplaintRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a regulatory complaint for CFPB, FCC, or State AG."""
    scan = None
    if req.scan_id:
        scan = get_scan(req.scan_id, current_user["user_id"])
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")

    dispute = None
    if req.dispute_id:
        dispute = get_dispute(req.dispute_id, current_user["user_id"])

    if settings.gemini_api_key:
        result = await generate_regulatory_complaint(
            scan_result=scan,
            dispute_letter=dispute,
            agency=req.agency,
            state=req.state,
            company_name=req.company_name,
            custom_context=req.custom_context,
            country=req.country,
        )
    else:
        result = DEMO_COMPLAINT.copy()

    return result
