from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import os
from typing import Dict, Any, List

class SelfCritiqueAgent:
    """
    Self-Critique Agent - Evaluates research report quality and provides improvement feedback.
    
    Responsibilities:
    - Checks report completeness (all sub-questions addressed)
    - Validates coherence and logical flow
    - Verifies claims are backed by evidence
    - Identifies specific sections needing improvement
    - Makes accept/improve/re-run decisions
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            base_url=os.getenv("LLM_API_URL"),
            api_key=os.getenv("LLM_API_KEY"),
            model=os.getenv("MODEL_NAME"),
            temperature=0.2
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a Research Quality Critic - your job is to evaluate research reports and provide constructive feedback.\n\n"
                "EVALUATION CRITERIA:\n"
                "1. **Completeness**: Are all sub-questions thoroughly addressed?\n"
                "2. **Coherence**: Is the report well-structured with logical flow?\n"
                "3. **Evidence**: Are claims backed by citations and data?\n"
                "4. **Depth**: Is the analysis sufficiently detailed and insightful?\n"
                "5. **Clarity**: Is the writing clear and accessible?\n\n"
                "DECISION TYPES:\n"
                "- **accept**: Report meets quality standards, ready to finalize\n"
                "- **improve**: Report is good but specific sections need enhancement (provide detailed feedback)\n"
                "- **re_run**: Fundamental issues require re-researching specific sub-questions\n\n"
                "DECISION GUIDELINES:\n"
                "- Accept if score >= 8.0/10 and no critical issues\n"
                "- Improve if score 6.0-7.9/10 or minor issues fixable by rewriting\n"
                "- Re-run if score < 6.0/10 or missing critical information\n\n"
                "OUTPUT FORMAT (JSON):\n"
                "{{\n"
                "  \"decision\": \"accept\" or \"improve\" or \"re_run\",\n"
                "  \"overall_score\": 0.0-10.0,\n"
                "  \"completeness_score\": 0.0-10.0,\n"
                "  \"coherence_score\": 0.0-10.0,\n"
                "  \"evidence_score\": 0.0-10.0,\n"
                "  \"depth_score\": 0.0-10.0,\n"
                "  \"clarity_score\": 0.0-10.0,\n"
                "  \"strengths\": [\"list of report strengths\"],\n"
                "  \"weaknesses\": [\"list of issues found\"],\n"
                "  \"improvement_suggestions\": [\"specific actionable suggestions\"],\n"
                "  \"sections_to_improve\": [\"specific section names needing work\"],\n"
                "  \"questions_to_rerun\": [\"sub-questions needing more research\"],\n"
                "  \"feedback\": \"Detailed explanation of decision\"\n"
                "}}\n\n"
                "Be constructive but honest. High standards ensure quality output."
            ),
            (
                "user",
                "Research Topic: {topic}\n\n"
                "Sub-Questions That Should Be Addressed:\n{sub_questions}\n\n"
                "Generated Report:\n{report}\n\n"
                "Evaluate this report and decide: accept, improve, or re_run?"
            )
        ])
    
    def run(self, topic: str, sub_questions: List[str], report: str) -> Dict[str, Any]:
        """
        Critique a research report and provide feedback.
        
        Args:
            topic: The research topic
            sub_questions: List of sub-questions that should be addressed
            report: The generated research report text
        
        Returns:
            Critique dict with decision, scores, and feedback
        """
        # Format sub-questions
        questions_text = "\n".join([f"  {i+1}. {q}" for i, q in enumerate(sub_questions)])
        
        # Basic validation
        if not report or len(report) < 200:
            return {
                "decision": "re_run",
                "overall_score": 2.0,
                "completeness_score": 1.0,
                "coherence_score": 3.0,
                "evidence_score": 1.0,
                "depth_score": 1.0,
                "clarity_score": 3.0,
                "strengths": [],
                "weaknesses": ["Report is too short", "Insufficient content"],
                "improvement_suggestions": ["Generate a more comprehensive report"],
                "sections_to_improve": ["All sections"],
                "questions_to_rerun": sub_questions,
                "feedback": "Report is critically short and lacks substance. Re-running research required."
            }
        
        chain = self.prompt | self.llm | JsonOutputParser()
        
        try:
            critique = chain.invoke({
                "topic": topic,
                "sub_questions": questions_text,
                "report": report[:8000]  # Truncate very long reports for token efficiency
            })
            
            # Ensure decision is valid
            if critique.get("decision") not in ["accept", "improve", "re_run"]:
                # Default based on score
                score = critique.get("overall_score", 5.0)
                if score >= 8.0:
                    critique["decision"] = "accept"
                elif score >= 6.0:
                    critique["decision"] = "improve"
                else:
                    critique["decision"] = "re_run"
            
            return critique
            
        except Exception as e:
            # Fallback to heuristic evaluation
            word_count = len(report.split())
            has_headers = "##" in report or "#" in report
            has_citations = "http" in report or "source" in report.lower()
            
            # Simple heuristic scoring
            heuristic_score = 5.0
            if word_count > 500:
                heuristic_score += 1.5
            if word_count > 1000:
                heuristic_score += 1.0
            if has_headers:
                heuristic_score += 1.0
            if has_citations:
                heuristic_score += 1.0
            
            decision = "accept" if heuristic_score >= 8.0 else "improve" if heuristic_score >= 6.0 else "re_run"
            
            return {
                "decision": decision,
                "overall_score": heuristic_score,
                "completeness_score": heuristic_score,
                "coherence_score": heuristic_score,
                "evidence_score": heuristic_score - 1.0,
                "depth_score": heuristic_score,
                "clarity_score": heuristic_score,
                "strengths": ["Report generated successfully"],
                "weaknesses": [f"Unable to perform detailed critique (LLM error: {str(e)})"],
                "improvement_suggestions": ["Manual review recommended"],
                "sections_to_improve": [],
                "questions_to_rerun": [],
                "feedback": f"Heuristic evaluation based on word count ({word_count} words) and structure."
            }
