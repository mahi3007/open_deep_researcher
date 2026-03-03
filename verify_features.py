import requests
import time
import json
import sys

BASE_URL = "http://localhost:8000"

def test_research_endpoint():
    print(f"Testing {BASE_URL}/research...")
    
    payload = {
        "message": "Quantum Computing trends 2025",
        "session_id": "test-verify-1"
    }
    
    # 1. First Request (Should trigger full pipeline)
    print("\n--- Request 1 (Fresh) ---")
    start_time = time.time()
    try:
        response = requests.post(f"{BASE_URL}/research", json=payload)
        response.raise_for_status()
        data = response.json()
        duration = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Duration: {duration:.2f}s")
        
        # Verify Advanced Metrics
        print("\nVerifying Metrics:")
        metrics = [
            "iteration_count", 
            "evidence_scores", 
            "orchestrator_decision", 
            "critique_decision",
            "sub_questions"
        ]
        
        missing = []
        for m in metrics:
            if m in data and data[m] is not None:
                print(f"✅ {m}: {data[m]}")
            else:
                print(f"❌ {m} MISSING")
                missing.append(m)
                
        if missing:
            print("FAILED: Missing advanced metrics!")
        else:
            print("SUCCESS: All advanced metrics present.")
            
    except Exception as e:
        print(f"Request 1 Failed: {e}")
        return

    # 2. Second Request (Should hit cache)
    print("\n--- Request 2 (Cached) ---")
    start_time = time.time()
    try:
        response = requests.post(f"{BASE_URL}/research", json=payload)
        response.raise_for_status()
        duration = time.time() - start_time
        
        print(f"Status: {response.status_code}")
        print(f"Duration: {duration:.2f}s")
        
        if duration < 1.0: # Arbitrary threshold for cache
            print("✅ Cache Verified (Response < 1s)")
        else:
            print(f"⚠️ Cache Warning: Took {duration:.2f}s, might not have hit cache.")
            
    except Exception as e:
        print(f"Request 2 Failed: {e}")

if __name__ == "__main__":
    print("Waiting for backend to start...")
    max_retries = 30
    for i in range(max_retries):
        try:
            r = requests.get(f"{BASE_URL}/health")
            if r.status_code == 200:
                print("Backend is healthy.")
                test_research_endpoint()
                break
        except requests.exceptions.ConnectionError:
            if i % 5 == 0:
                print(f"Waiting for backend... ({i}/{max_retries})")
            time.sleep(1)
    else:
        print("CRITICAL: Backend failed to start after 30 seconds.")
