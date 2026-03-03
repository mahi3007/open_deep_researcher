"""
Test script to check if the research endpoint works
"""
import requests
import json

def test_research_endpoint():
    """Test the /research endpoint"""
    url = "http://localhost:8000/research"
    payload = {
        "message": "What is machine learning?",
        "session_id": "test-session-123"
    }
    
    print("Testing /research endpoint...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("\nSending request...")
    
    try:
        response = requests.post(url, json=payload, timeout=120)
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✓ SUCCESS: Request completed successfully")
            data = response.json()
            print(f"\nResponse preview (first 500 chars):")
            print(data.get("response", "")[:500])
            print("...")
            return True
        else:
            print(f"✗ ERROR: Request failed")
            print(f"Response: {response.text}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("✗ ERROR: Could not connect to backend")
        print("Make sure the backend is running on http://localhost:8000")
        return False
    except requests.exceptions.Timeout:
        print("✗ ERROR: Request timed out (>120s)")
        return False
    except Exception as e:
        print(f"✗ ERROR: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    test_research_endpoint()
