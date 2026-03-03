from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import os
from typing import Dict, Any, List

class OrchestratorAgent:
    """
    The Research Orchestrator (Brain) - Makes strategic decisions about the research process.
    
    Responsibilities:
    - Analyzes evidence quality scores
    - Decides whether to refine queries or proceed to writing
    - Manages iteration limits
    - Optimizes research strategy
    """
    
    def __init__(self, max_iterations: int = 3, min_evidence_score: float = 0.7):
        self.llm = ChatOpenAI(
            base_url=os.getenv("LLM_API_URL"),
            api_key=os.getenv("LLM_API_KEY"),
            model=os.getenv("MODEL_NAME"),
            temperature=0.1  # Low temperature for consistent decision-making
        )
        
        self.max_iterations = max_iterations
        self.min_evidence_score = min_evidence_score
        
        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are the Research Orchestrator - the strategic brain of an AI research system.\n\n"
                "Your role is to analyze the current research state and make intelligent decisions about next steps.\n\n"
                "DECISION CRITERIA:\n"
                "1. If iteration_count >= max_iterations: MUST proceed to writing (prevent infinite loops)\n"
                "2. If average evidence score >= {min_score}: Proceed to writing (quality is sufficient)\n"
                "3. If average evidence score < {min_score} AND iteration_count < max_iterations: Refine queries\n"
                "4. If total results < 5: Refine queries (insufficient data)\n\n"
                "OUTPUT FORMAT (JSON):\n"
                "{{\n"
                "  \"decision\": \"proceed\" or \"refine_queries\",\n"
                "  \"reasoning\": \"Brief explanation of decision\",\n"
                "  \"weak_questions\": [\"list of sub-questions that need refinement\"],\n"
                "  \"confidence\": 0.0-1.0\n"
                "}}\n\n"
                "Be strategic and cost-conscious. Don't refine unnecessarily."
            ),
            (
                "user",
                "Research State Analysis:\n\n"
                "Topic: {topic}\n"
                "Iteration Count: {iteration_count} / {max_iterations}\n"
                "Total Search Results: {total_results}\n\n"
                "Evidence Scores by Sub-Question:\n{evidence_scores}\n\n"
                "Average Evidence Score: {avg_score:.2f}\n"
                "Minimum Required Score: {min_score}\n\n"
                "What should the system do next?"
            )
        ])
    
    def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze research state and decide next action.
        
        Args:
            state: Current research state containing:
                - topic: Research topic
                - iteration_count: Current iteration number
                - evidence_scores: Dict mapping sub-questions to quality scores
                - search_results: List of search results
        
        Returns:
            Decision dict with:
                - decision: "proceed" or "refine_queries"
                - reasoning: Explanation
                - weak_questions: Questions needing refinement
                - confidence: Decision confidence score
        """
        # Extract state information
        topic = state.get("topic", "Unknown")
        iteration_count = state.get("iteration_count", 0)
        evidence_scores = state.get("evidence_scores", {})
        search_results = state.get("search_results", [])
        
        # Calculate metrics
        total_results = len(search_results)
        avg_score = sum(evidence_scores.values()) / len(evidence_scores) if evidence_scores else 0.0
        
        # Format evidence scores for prompt
        scores_text = "\n".join([
            f"  - \"{q}\": {score:.2f}" 
            for q, score in evidence_scores.items()
        ]) if evidence_scores else "  (No scores available)"
        
        # Hard rules (bypass LLM for efficiency)
        if iteration_count >= self.max_iterations:
            return {
                "decision": "proceed",
                "reasoning": f"Maximum iterations ({self.max_iterations}) reached. Proceeding to prevent infinite loop.",
                "weak_questions": [],
                "confidence": 1.0
            }
        
        if total_results == 0:
            return {
                "decision": "refine_queries",
                "reasoning": "No search results found. Queries need refinement.",
                "weak_questions": list(evidence_scores.keys()),
                "confidence": 1.0
            }
        
        # Use LLM for nuanced decisions
        chain = self.prompt | self.llm | JsonOutputParser()
        
        try:
            decision = chain.invoke({
                "topic": topic,
                "iteration_count": iteration_count,
                "max_iterations": self.max_iterations,
                "total_results": total_results,
                "evidence_scores": scores_text,
                "avg_score": avg_score,
                "min_score": self.min_evidence_score
            })
            
            return decision
            
        except Exception as e:
            # Fallback to rule-based decision
            if avg_score >= self.min_evidence_score:
                return {
                    "decision": "proceed",
                    "reasoning": f"Average score ({avg_score:.2f}) meets threshold ({self.min_evidence_score})",
                    "weak_questions": [],
                    "confidence": 0.8
                }
            else:
                weak_questions = [
                    q for q, score in evidence_scores.items() 
                    if score < self.min_evidence_score
                ]
                return {
                    "decision": "refine_queries",
                    "reasoning": f"Average score ({avg_score:.2f}) below threshold ({self.min_evidence_score})",
                    "weak_questions": weak_questions,
                    "confidence": 0.8
                }
