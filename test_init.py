
import sys
import os
from pathlib import Path

# Add src directory to Python path
src_path = Path(__file__).parent / "src"
sys.path.insert(0, str(src_path))

from dotenv import load_dotenv
load_dotenv()

print("Attempting to import build_graph...")
try:
    from graph.research_graph import build_graph
    print("Import successful. Building graph...")
    graph = build_graph()
    print("Graph built successfully.")
except Exception as e:
    print(f"Error: {e}")
