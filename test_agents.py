
import sys
import os
from pathlib import Path
import time

# Add src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from dotenv import load_dotenv
load_dotenv()

def test_agent(name, module_path, class_name):
    print(f"Testing {name}...", end="", flush=True)
    try:
        module = __import__(module_path, fromlist=[class_name])
        AgentClass = getattr(module, class_name)
        start = time.time()
        agent = AgentClass()
        print(f" Success ({time.time() - start:.2f}s)")
    except Exception as e:
        print(f" Failed: {e}")

print("Starting agent tests...")
test_agent("Planner", "agents.planner", "PlannerAgent")
test_agent("Searcher", "agents.searcher", "SearcherAgent")
test_agent("EvidenceJudge", "agents.evidence_judge", "EvidenceJudgeAgent")
test_agent("Orchestrator", "agents.orchestrator", "OrchestratorAgent")
# Add others if needed
print("All tests completed.")
