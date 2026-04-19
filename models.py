from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class CandidateInput(BaseModel):
    social_profile: Dict[str, Any]
    interaction_profile: Dict[str, Any]


class DashboardView(BaseModel):
    full_name: str
    email: str
    phone: str
    match_percent: float
    status: str


class InterviewGraph(BaseModel):
    communication: float
    confidence: float
    reliability: float
    role_fit: float
    motivation: float
    availability: float
    stability: float
    customer_orientation: float
    clarity: float
    engagement: float


class InterviewDetails(BaseModel):
    graph: InterviewGraph
    strengths: List[str]
    weaker_points: List[str]
    score_reasons: List[str]


class AgentOutput(BaseModel):
    dashboard_view: DashboardView
    interview_details: InterviewDetails
