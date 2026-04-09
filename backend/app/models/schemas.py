from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


# ── Auth ──────────────────────────────────────────────────────
class SignupRequest(BaseModel):
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    email: str
    name: str


class UserProfile(BaseModel):
    user_id: str
    email: str
    name: str
    created_at: str
    scans_count: int = 0
    disputes_count: int = 0
    total_saved: float = 0.0


# ── Document Scan ─────────────────────────────────────────────
class DocumentType(str, Enum):
    medical_bill = "medical_bill"
    lease = "lease"
    contract = "contract"
    insurance = "insurance"
    phone_bill = "phone_bill"
    utility_bill = "utility_bill"
    credit_card = "credit_card"
    fine_ticket = "fine_ticket"
    tax_document = "tax_document"
    subscription = "subscription"
    other = "other"


class ScanResult(BaseModel):
    scan_id: str
    document_type: DocumentType
    summary: str
    issues_found: List[Dict]  # [{issue, severity, potential_savings, explanation}]
    total_potential_savings: float
    risk_level: str  # low, medium, high, critical
    plain_english: str  # Full doc explained simply
    your_rights: List[str]
    recommended_actions: List[str]
    created_at: str


# ── Dispute Letter ────────────────────────────────────────────
class DisputeRequest(BaseModel):
    scan_id: str
    issues_to_dispute: List[int] = Field(default_factory=list)  # indices
    tone: str = "firm_but_polite"  # firm_but_polite, aggressive, friendly
    custom_context: str = ""
    country: str = "US"  # US or NG


class DisputeLetter(BaseModel):
    dispute_id: str
    scan_id: str
    subject_line: str
    letter_body: str
    send_to: str  # suggested recipient
    estimated_savings: float
    created_at: str


# ── Ghost Call ────────────────────────────────────────────────
class CallStatus(str, Enum):
    queued = "queued"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"


class CallRequest(BaseModel):
    scan_id: str
    dispute_id: Optional[str] = None
    company_name: str
    phone_number: str = ""
    objective: str  # what you want the AI to achieve
    max_wait_minutes: int = 30
    country: str = "US"  # US or NG


class CallResult(BaseModel):
    call_id: str
    status: CallStatus
    duration_seconds: int = 0
    transcript: str = ""
    outcome: str = ""
    savings_achieved: float = 0.0
    next_steps: List[str] = []
    created_at: str


# ── Dashboard ─────────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_scans: int
    total_disputes: int
    total_calls: int
    total_saved: float
    active_disputes: int
    recent_activity: List[Dict]
