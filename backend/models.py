from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ResearchRequest(BaseModel):
    """Request model for research endpoint"""
    message: str = Field(..., min_length=1, description="User's research query")
    session_id: str = Field(..., description="Unique session identifier")


class ResearchResponse(BaseModel):
    """Response model for research endpoint"""
    response: str = Field(..., description="AI-generated research report")
    session_id: str = Field(..., description="Session identifier")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    
    # Advanced metrics
    iteration_count: Optional[int] = None
    evidence_scores: Optional[dict] = None
    orchestrator_decision: Optional[str] = None
    critique_decision: Optional[str] = None
    critique_feedback: Optional[str] = None
    sub_questions: Optional[List[str]] = None
    refined_queries: Optional[List[str]] = None


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    detail: Optional[str] = Field(None, description="Additional error details")


class Message(BaseModel):
    """Message model"""
    role: str
    content: str
    timestamp: str


class Conversation(BaseModel):
    """Conversation model"""
    id: str
    session_id: str
    title: str
    created_at: str
    updated_at: str
    messages: List[Message] = []


class ConversationCreate(BaseModel):
    """Request model for creating a conversation"""
    id: str
    session_id: str
    title: str = "New Research"


class ConversationUpdate(BaseModel):
    """Request model for updating a conversation"""
    title: Optional[str] = None


class ResearchPlanRequest(BaseModel):
    """Request model for generating a research plan"""
    message: str = Field(..., min_length=1, description="User's research query")
    session_id: str = Field(..., description="Unique session identifier")


class ResearchPlanResponse(BaseModel):
    """Response model for research plan"""
    plan_title: str = Field(..., description="Title of the research plan")
    sub_questions: List[str] = Field(..., description="List of research sub-questions")
    session_id: str = Field(..., description="Session identifier")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class ResearchExecuteRequest(BaseModel):
    """Request model for executing a research plan"""
    message: str = Field(..., description="Original research query")
    sub_questions: List[str] = Field(..., description="Approved research sub-questions")
    session_id: str = Field(..., description="Unique session identifier")

