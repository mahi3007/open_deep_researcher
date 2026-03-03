from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
import os
import json
import re
import logging

logger = logging.getLogger(__name__)

def parse_json_with_fences(text: str):
    """Strip markdown code fences and parse JSON — handles local model output quirks."""
    # Remove ```json ... ``` or ``` ... ``` wrappers
    cleaned = re.sub(r"```(?:json)?\s*", "", text).replace("```", "").strip()
    return json.loads(cleaned)

class FilterAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            base_url=os.getenv("LLM_API_URL"),
            api_key=os.getenv("LLM_API_KEY"),
            model=os.getenv("MODEL_NAME"),
            temperature=0.1
        )

        self.prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a research quality evaluator.\n"
                "You will receive a list of web search results.\n"
                "Your task is to keep ONLY high-quality, relevant, non-duplicate sources.\n\n"
                "Rules:\n"
                "- Remove duplicates\n"
                "- Remove irrelevant or low-information sources\n"
                "- Keep the best 4–6 sources max\n\n"
                "Return the filtered list as JSON array."
            ),
            ("user", "{data}")
        ])

    def run(self, results):
        try:
            # Truncate content to prevent context overflow on small models
            MAX_RESULTS = 15
            MAX_CONTENT_CHARS = 500

            trimmed = []
            for r in results[:MAX_RESULTS]:
                trimmed.append({
                    "title": r.get("title", "")[:200],
                    "url": r.get("url", ""),
                    "content": r.get("content", "")[:MAX_CONTENT_CHARS],
                })

            # Use StrOutputParser + manual fence-stripping to handle
            # local models that wrap JSON in ```json ... ``` blocks
            chain = self.prompt | self.llm | StrOutputParser()
            raw = chain.invoke({"data": trimmed})
            return parse_json_with_fences(raw)
        except Exception as e:
            logger.warning(f"Filter agent failed: {e}. Returning raw results (capped).")
            return results[:6]  # Fallback: just return first 6 unfiltered
