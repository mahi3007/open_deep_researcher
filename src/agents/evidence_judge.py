from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import os
from typing import List, Dict, Any

class EvidenceJudgeAgent:
    """
    Evidence Judge - Validates the quality and relevance of search results.
    
    Responsibilities:
    - Scores how well results answer each sub-question
    - Assesses source credibility and authority
    - Identifies gaps in evidence coverage
    - Detects contradictory information
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
                "You are an Evidence Quality Judge for a research system.\n\n"
                "Your task is to evaluate how well search results answer a specific research sub-question.\n\n"
                "EVALUATION CRITERIA:\n"
                "1. **Relevance** (0-1): How directly do results address the question?\n"
                "2. **Credibility** (0-1): Are sources authoritative and reliable?\n"
                "3. **Completeness** (0-1): Is there sufficient information to answer the question?\n"
                "4. **Recency** (0-1): Is the information current and up-to-date?\n"
                "5. **Consistency** (0-1): Do sources agree, or are there contradictions?\n\n"
                "SCORING GUIDE:\n"
                "- 0.9-1.0: Excellent - Comprehensive, authoritative, directly relevant\n"
                "- 0.7-0.89: Good - Sufficient quality, minor gaps acceptable\n"
                "- 0.5-0.69: Fair - Some relevant info, but significant gaps or quality issues\n"
                "- 0.3-0.49: Poor - Tangentially relevant, low quality, or insufficient\n"
                "- 0.0-0.29: Very Poor - Irrelevant or unreliable\n\n"
                "OUTPUT FORMAT (JSON):\n"
                "{{\n"
                "  \"overall_score\": 0.0-1.0,\n"
                "  \"relevance\": 0.0-1.0,\n"
                "  \"credibility\": 0.0-1.0,\n"
                "  \"completeness\": 0.0-1.0,\n"
                "  \"recency\": 0.0-1.0,\n"
                "  \"consistency\": 0.0-1.0,\n"
                "  \"feedback\": \"Brief explanation of score and what's missing\",\n"
                "  \"gaps\": [\"list of information gaps\"],\n"
                "  \"contradictions\": [\"list of contradictory claims, if any\"]\n"
                "}}"
            ),
            (
                "user",
                "Sub-Question: {sub_question}\n\n"
                "Search Results ({num_results} sources):\n{results}\n\n"
                "Evaluate the quality of these results for answering the sub-question."
            )
        ])
    
    def run(self, sub_question: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Evaluate the quality of search results for a specific sub-question.
        
        Args:
            sub_question: The research sub-question being evaluated
            results: List of search result dicts with 'title', 'url', 'content'
        
        Returns:
            Evaluation dict with scores and feedback
        """
        if not results:
            return {
                "overall_score": 0.0,
                "relevance": 0.0,
                "credibility": 0.0,
                "completeness": 0.0,
                "recency": 0.0,
                "consistency": 0.0,
                "feedback": "No search results available to evaluate.",
                "gaps": ["No information found"],
                "contradictions": []
            }
        
        # Format results for evaluation
        formatted_results = ""
        for idx, result in enumerate(results[:5], 1):  # Limit to top 5 for token efficiency
            title = result.get("title", "Untitled")
            url = result.get("url", "")
            content = result.get("content", "")[:500]  # Truncate for efficiency
            
            formatted_results += (
                f"\n{idx}. {title}\n"
                f"   URL: {url}\n"
                f"   Content: {content}...\n"
            )
        
        chain = self.prompt | self.llm | JsonOutputParser()
        
        try:
            evaluation = chain.invoke({
                "sub_question": sub_question,
                "num_results": len(results),
                "results": formatted_results
            })
            
            # Ensure overall_score is calculated if missing
            if "overall_score" not in evaluation:
                evaluation["overall_score"] = sum([
                    evaluation.get("relevance", 0),
                    evaluation.get("credibility", 0),
                    evaluation.get("completeness", 0),
                    evaluation.get("recency", 0),
                    evaluation.get("consistency", 0)
                ]) / 5
            
            return evaluation
            
        except Exception as e:
            # Fallback to simple heuristic scoring
            avg_content_length = sum(len(r.get("content", "")) for r in results) / len(results)
            
            # Simple heuristic: longer content = better quality (rough approximation)
            heuristic_score = min(avg_content_length / 1000, 1.0) * 0.7  # Cap at 0.7 for heuristic
            
            return {
                "overall_score": heuristic_score,
                "relevance": heuristic_score,
                "credibility": 0.5,  # Unknown
                "completeness": heuristic_score,
                "recency": 0.5,  # Unknown
                "consistency": 0.5,  # Unknown
                "feedback": f"Heuristic evaluation (LLM error: {str(e)}). Based on content length.",
                "gaps": ["Unable to perform detailed analysis"],
                "contradictions": []
            }
    
    def evaluate_all(self, sub_questions: List[str], results_by_question: Dict[str, List[Dict[str, Any]]]) -> Dict[str, float]:
        """
        Evaluate evidence quality for all sub-questions.
        
        Args:
            sub_questions: List of research sub-questions
            results_by_question: Dict mapping each sub-question to its search results
        
        Returns:
            Dict mapping each sub-question to its overall quality score
        """
        scores = {}
        
        for question in sub_questions:
            question_results = results_by_question.get(question, [])
            evaluation = self.run(question, question_results)
            scores[question] = evaluation.get("overall_score", 0.0)
        
        return scores
