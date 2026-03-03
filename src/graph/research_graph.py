from langgraph.graph import StateGraph, END
from typing import TypedDict, List, Dict, Any, Optional

from agents.planner import PlannerAgent
from agents.searcher import SearcherAgent
from agents.writer import WriterAgent
from agents.filter import FilterAgent
from agents.compressor import CompressorAgent
from agents.orchestrator import OrchestratorAgent
from agents.evidence_judge import EvidenceJudgeAgent
from agents.self_critique import SelfCritiqueAgent
from agents.query_refiner import QueryRefinerAgent


# -----------------------------
# Enhanced State
# -----------------------------
class ResearchState(TypedDict, total=False):
    # Original fields
    topic: str
    sub_questions: List[str]
    search_results: List[Dict[str, Any]]
    summary: str
    
    # Quality tracking
    evidence_scores: Dict[str, float]
    iteration_count: int
    max_iterations: int
    
    # Refinement tracking
    refined_queries: List[str]
    critique_feedback: Optional[str]
    compressed_knowledge: Optional[str]
    
    # Decision state
    orchestrator_decision: str
    critique_decision: str
    
    # Results by question
    results_by_question: Dict[str, List[Dict[str, Any]]]


# -----------------------------
# Agent Instances
# -----------------------------
planner = PlannerAgent()
searcher = SearcherAgent()
filter_agent = FilterAgent()
evidence_judge = EvidenceJudgeAgent()
orchestrator = OrchestratorAgent(max_iterations=3, min_evidence_score=0.7)
compressor = CompressorAgent()
writer = WriterAgent()
self_critique = SelfCritiqueAgent()
query_refiner = QueryRefinerAgent()


# -----------------------------
# Node Functions
# -----------------------------
def planner_node(state: ResearchState):
    """Generate or refine sub-questions."""
    # Initialize iteration tracking on first run
    if "iteration_count" not in state or state["iteration_count"] == 0:
        state["iteration_count"] = 0
        state["max_iterations"] = 3
        state["evidence_scores"] = {}
        state["results_by_question"] = {}
        state["orchestrator_decision"] = ""
        state["critique_decision"] = ""
        state["refined_queries"] = []
        state["critique_feedback"] = None
        state["compressed_knowledge"] = None
    
    # Generate initial sub-questions
    state["sub_questions"] = planner.run(state["topic"])
    return state


def searcher_node(state: ResearchState):
    """Search for each sub-question and organize results."""
    results_by_question = {}
    all_results = []
    
    # Run searches in parallel to speed up execution
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_question = {
            executor.submit(searcher.run, q): q 
            for q in state["sub_questions"]
        }
        
        for future in as_completed(future_to_question):
            question = future_to_question[future]
            try:
                q_results = future.result()
                results_by_question[question] = q_results
                all_results.extend(q_results)
            except Exception as e:
                print(f"Error searching for '{question}': {e}")
                results_by_question[question] = []
    
    state["search_results"] = all_results
    state["results_by_question"] = results_by_question
    return state


def filter_node(state: ResearchState):
    """Filter out duplicates and low-quality sources."""
    if state["search_results"]:
        filtered = filter_agent.run(state["search_results"])
        
        # Handle case where filter returns JSON array
        if isinstance(filtered, list):
            state["search_results"] = filtered
        else:
            # Fallback: keep original if filter fails
            pass
    
    return state


def evidence_judge_node(state: ResearchState):
    """Evaluate evidence quality for each sub-question."""
    scores = evidence_judge.evaluate_all(
        state["sub_questions"],
        state["results_by_question"]
    )
    
    state["evidence_scores"] = scores
    return state


def orchestrator_node(state: ResearchState):
    """Make strategic decision: refine queries or proceed to writing."""
    decision = orchestrator.run(state)
    
    state["orchestrator_decision"] = decision["decision"]
    
    # Store weak questions for potential refinement
    if decision["decision"] == "refine_queries":
        state["refined_queries"] = decision.get("weak_questions", [])
    
    return state


def query_refiner_node(state: ResearchState):
    """Refine weak sub-questions based on evidence scores."""
    state["iteration_count"] += 1
    
    # Refine all questions, keeping good ones and improving weak ones
    refined = query_refiner.refine_all(
        topic=state["topic"],
        sub_questions=state["sub_questions"],
        evidence_scores=state["evidence_scores"],
        min_score=0.7,
        iteration=state["iteration_count"],
        max_iterations=state["max_iterations"]
    )
    
    state["sub_questions"] = refined
    
    # Clear previous results to trigger new search
    state["search_results"] = []
    state["results_by_question"] = {}
    
    return state


def compressor_node(state: ResearchState):
    """Compress search results into dense research notes."""
    if state["search_results"]:
        compressed = compressor.run(state["search_results"])
        state["compressed_knowledge"] = compressed
    
    return state


def writer_node(state: ResearchState):
    """Generate comprehensive research report."""
    # Use compressed knowledge if available, otherwise raw results
    if state.get("compressed_knowledge"):
        # For now, still use search_results as writer expects that format
        # In future, could modify writer to accept compressed knowledge
        state["summary"] = writer.run(state["search_results"])
    else:
        state["summary"] = writer.run(state["search_results"])
    
    return state


def self_critique_node(state: ResearchState):
    """Evaluate report quality and decide next action."""
    critique = self_critique.run(
        topic=state["topic"],
        sub_questions=state["sub_questions"],
        report=state["summary"]
    )
    
    state["critique_decision"] = critique["decision"]
    state["critique_feedback"] = critique.get("feedback", "")
    
    return state


# -----------------------------
# Conditional Routing Functions
# -----------------------------
def route_orchestrator(state: ResearchState) -> str:
    """Route based on orchestrator decision."""
    decision = state.get("orchestrator_decision", "proceed")
    
    if decision == "refine_queries":
        return "refine"
    else:
        return "proceed"


def route_critique(state: ResearchState) -> str:
    """Route based on self-critique decision."""
    decision = state.get("critique_decision", "accept")
    
    if decision == "accept":
        return "accept"
    elif decision == "improve":
        return "improve"
    else:  # re_run
        return "rerun"


# -----------------------------
# Build Graph
# -----------------------------
def build_graph():
    """Build the improved iterative research graph."""
    graph = StateGraph(ResearchState)
    
    # Add all nodes
    graph.add_node("planner", planner_node)
    graph.add_node("searcher", searcher_node)
    graph.add_node("filter", filter_node)
    graph.add_node("evidence_judge", evidence_judge_node)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("query_refiner", query_refiner_node)
    graph.add_node("compressor", compressor_node)
    graph.add_node("writer", writer_node)
    graph.add_node("self_critique", self_critique_node)
    
    # Set entry point
    graph.set_entry_point("planner")
    
    # Main flow: Planner → Searcher → Filter → Evidence Judge → Orchestrator
    graph.add_edge("planner", "searcher")
    graph.add_edge("searcher", "filter")
    graph.add_edge("filter", "evidence_judge")
    graph.add_edge("evidence_judge", "orchestrator")
    
    # Orchestrator decision: refine queries OR proceed to writing
    graph.add_conditional_edges(
        "orchestrator",
        route_orchestrator,
        {
            "refine": "query_refiner",
            "proceed": "compressor"
        }
    )
    
    # Query refiner loops back to searcher
    graph.add_edge("query_refiner", "searcher")
    
    # Compressor → Writer → Self-Critique
    graph.add_edge("compressor", "writer")
    graph.add_edge("writer", "self_critique")
    
    # Self-critique decision: accept OR improve OR re-run
    graph.add_conditional_edges(
        "self_critique",
        route_critique,
        {
            "accept": END,
            "improve": "writer",  # Re-write with feedback
            "rerun": "planner"    # Re-research specific questions
        }
    )
    
    return graph.compile()


# -----------------------------
# Simple Graph (Backward Compatibility)
# -----------------------------
def build_simple_graph():
    """
    Build the original simple linear graph for backward compatibility.
    Use this if you want the old behavior without iterations.
    """
    graph = StateGraph(ResearchState)
    
    graph.add_node("planner", planner_node)
    graph.add_node("searcher", searcher_node)
    graph.add_node("writer", writer_node)
    
    graph.set_entry_point("planner")
    
    graph.add_edge("planner", "searcher")
    graph.add_edge("searcher", "writer")
    graph.add_edge("writer", END)
    
    return graph.compile()
