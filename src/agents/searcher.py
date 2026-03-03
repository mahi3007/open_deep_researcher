from tavily import TavilyClient
import os
import logging
from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

class SearcherAgent:
    def __init__(self):
        self.client = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

    def run(self, query):
        try:
            results = self.client.search(query=query, max_results=3)
            return results["results"]
        except Exception as e:
            logger.warning(f"Search failed for query '{query[:60]}...': {e}")
            return []
