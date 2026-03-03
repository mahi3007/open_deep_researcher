"""
Quick validation test for the improved research architecture
"""
import sys
from pathlib import Path

# Add src to path
src_path = Path(__file__).parent.parent / "src"
sys.path.insert(0, str(src_path))

def test_graph_compilation():
    """Test that the graph compiles without errors"""
    print("Testing graph compilation...")
    try:
        from graph.research_graph import build_graph
        graph = build_graph()
        print("✓ Graph compiled successfully")
        print(f"✓ Graph has {len(graph.nodes)} nodes")
        return True
    except Exception as e:
        print(f"✗ Graph compilation failed: {e}")
        return False

def test_agent_imports():
    """Test that all agents can be imported"""
    print("\nTesting agent imports...")
    agents = [
        ("Orchestrator", "agents.orchestrator", "OrchestratorAgent"),
        ("Evidence Judge", "agents.evidence_judge", "EvidenceJudgeAgent"),
        ("Self-Critique", "agents.self_critique", "SelfCritiqueAgent"),
        ("Query Refiner", "agents.query_refiner", "QueryRefinerAgent"),
        ("Filter", "agents.filter", "FilterAgent"),
        ("Compressor", "agents.compressor", "CompressorAgent"),
    ]
    
    all_passed = True
    for name, module, class_name in agents:
        try:
            mod = __import__(module, fromlist=[class_name])
            cls = getattr(mod, class_name)
            print(f"✓ {name} agent imported successfully")
        except Exception as e:
            print(f"✗ {name} agent import failed: {e}")
            all_passed = False
    
    return all_passed

def test_state_schema():
    """Test that ResearchState has all required fields"""
    print("\nTesting ResearchState schema...")
    try:
        from graph.research_graph import ResearchState
        
        required_fields = [
            "topic", "sub_questions", "search_results", "summary",
            "evidence_scores", "iteration_count", "max_iterations",
            "refined_queries", "critique_feedback", "compressed_knowledge",
            "orchestrator_decision", "critique_decision", "results_by_question"
        ]
        
        # TypedDict doesn't have __annotations__ in runtime, so we check the type hints
        import typing
        hints = typing.get_type_hints(ResearchState)
        
        all_present = all(field in hints for field in required_fields)
        
        if all_present:
            print(f"✓ ResearchState has all {len(required_fields)} required fields")
            return True
        else:
            missing = [f for f in required_fields if f not in hints]
            print(f"✗ ResearchState missing fields: {missing}")
            return False
    except Exception as e:
        print(f"✗ State schema test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("IMPROVED ARCHITECTURE VALIDATION TEST")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Graph Compilation", test_graph_compilation()))
    results.append(("Agent Imports", test_agent_imports()))
    results.append(("State Schema", test_state_schema()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Architecture is ready to use.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Review errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
