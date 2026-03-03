from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os
from typing import List, Dict, Any

class QueryRefinerAgent:
    """
    Query Refiner - Improves sub-questions based on evidence quality feedback.
    
    Responsibilities:
    - Analyzes which sub-questions yielded poor results
    - Reformulates queries to be more specific or use different angles
    - Learns from previous search failures
    - Generates alternative search strategies
    """
    
    def __init__(self):
        self.llm = ChatOpenAI(
            base_url=os.getenv("LLM_API_URL"),
            api_key=os.getenv("LLM_API_KEY"),
            model=os.getenv("MODEL_NAME"),
            temperature=0.3  # Slightly higher for creative reformulation
        )
        
        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a Query Refinement Specialist for a research system.\n\n"
                "Your task is to improve research sub-questions that yielded poor-quality search results.\n\n"
                "REFINEMENT STRATEGIES:\n"
                "1. **Be More Specific**: Add context, timeframes, or constraints\n"
                "   - Before: 'What is AI?'\n"
                "   - After: 'What are the key breakthroughs in AI from 2023-2026?'\n\n"
                "2. **Change Angle**: Approach the topic from a different perspective\n"
                "   - Before: 'How does quantum computing work?'\n"
                "   - After: 'What are the practical applications of quantum computing in 2026?'\n\n"
                "3. **Add Keywords**: Include domain-specific terms that improve search\n"
                "   - Before: 'Future of energy'\n"
                "   - After: 'Renewable energy adoption trends and grid modernization 2026'\n\n"
                "4. **Break Down Complex Questions**: Split into more focused sub-parts\n"
                "   - Before: 'How will AI impact society?'\n"
                "   - After: 'What are the economic impacts of AI automation on employment?'\n\n"
                "5. **Use Comparative Framing**: Compare/contrast for better results\n"
                "   - Before: 'What is blockchain?'\n"
                "   - After: 'How does blockchain differ from traditional databases in security?'\n\n"
                "GUIDELINES:\n"
                "- Keep questions concise but information-rich\n"
                "- Avoid yes/no questions\n"
                "- Focus on factual, researchable topics\n"
                "- Consider what search engines respond well to\n\n"
                "OUTPUT FORMAT:\n"
                "Return only the refined questions, one per line, no numbering or bullets."
            ),
            (
                "user",
                "Research Topic: {topic}\n\n"
                "Original Sub-Questions That Need Refinement:\n{weak_questions}\n\n"
                "Reason for Refinement:\n{feedback}\n\n"
                "Iteration: {iteration} / {max_iterations}\n\n"
                "Generate improved versions of these questions that will yield better search results."
            )
        ])
    
    def run(self, topic: str, weak_questions: List[str], feedback: str, iteration: int, max_iterations: int) -> List[str]:
        """
        Refine weak sub-questions to improve search results.
        
        Args:
            topic: The main research topic
            weak_questions: List of sub-questions that need improvement
            feedback: Explanation of why questions need refinement
            iteration: Current iteration number
            max_iterations: Maximum allowed iterations
        
        Returns:
            List of refined sub-questions
        """
        if not weak_questions:
            return []
        
        # Format weak questions
        questions_text = "\n".join([f"  - {q}" for q in weak_questions])
        
        chain = self.prompt | self.llm | StrOutputParser()
        
        try:
            result = chain.invoke({
                "topic": topic,
                "weak_questions": questions_text,
                "feedback": feedback,
                "iteration": iteration,
                "max_iterations": max_iterations
            })
            
            # Parse refined questions
            refined = [line.strip("- •").strip() for line in result.split("\n") if line.strip()]
            
            # Ensure we have the same number of refined questions
            if len(refined) < len(weak_questions):
                # Fallback: add simple refinements
                for i in range(len(refined), len(weak_questions)):
                    refined.append(f"{weak_questions[i]} (detailed analysis)")
            
            return refined[:len(weak_questions)]  # Return same count as input
            
        except Exception as e:
            # Fallback: simple refinement strategy
            refined = []
            for q in weak_questions:
                # Add specificity and timeframe
                if "?" in q:
                    refined_q = q.replace("?", " in 2026?")
                else:
                    refined_q = f"{q} - detailed analysis and current trends"
                refined.append(refined_q)
            
            return refined
    
    def refine_all(self, topic: str, sub_questions: List[str], evidence_scores: Dict[str, float], 
                   min_score: float, iteration: int, max_iterations: int) -> List[str]:
        """
        Refine all sub-questions, keeping good ones and improving weak ones.
        
        Args:
            topic: Main research topic
            sub_questions: All current sub-questions
            evidence_scores: Quality scores for each sub-question
            min_score: Minimum acceptable score
            iteration: Current iteration
            max_iterations: Max iterations allowed
        
        Returns:
            List of sub-questions with weak ones refined
        """
        weak_questions = [q for q in sub_questions if evidence_scores.get(q, 0) < min_score]
        good_questions = [q for q in sub_questions if evidence_scores.get(q, 0) >= min_score]
        
        if not weak_questions:
            return sub_questions  # All questions are good
        
        # Generate feedback summary
        avg_weak_score = sum(evidence_scores.get(q, 0) for q in weak_questions) / len(weak_questions)
        feedback = f"These questions yielded low-quality results (avg score: {avg_weak_score:.2f}). Need more specific or differently-angled questions."
        
        # Refine weak questions
        refined_weak = self.run(topic, weak_questions, feedback, iteration, max_iterations)
        
        # Combine good questions with refined weak questions
        return good_questions + refined_weak
