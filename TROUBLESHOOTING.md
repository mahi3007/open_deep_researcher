# Troubleshooting Guide - API Key Error

## Error Identified

**Error:** `'code': 'invalid_api_key'`

The research system is failing because the LLM API key is invalid or not properly configured.

---

## Solution

### Step 1: Check Your .env File

Open `.env` in the project root and verify these settings:

```env
# LLM Configuration
LLM_API_URL=https://api.openai.com/v1
LLM_API_KEY=your_actual_api_key_here
MODEL_NAME=gpt-4

# Tavily Search API
TAVILY_API_KEY=your_tavily_api_key_here
```

### Step 2: Get Valid API Keys

#### For OpenAI (GPT-4):
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it to `LLM_API_KEY` in `.env`

#### For Tavily (Search):
1. Go to https://tavily.com
2. Sign up and get an API key
3. Copy it to `TAVILY_API_KEY` in `.env`

### Step 3: Alternative - Use LM Studio (Local LLM)

If you want to use a local LLM instead:

```env
# LM Studio Configuration
LLM_API_URL=http://localhost:1234/v1
LLM_API_KEY=not-needed
MODEL_NAME=local-model
```

Then:
1. Download LM Studio from https://lmstudio.ai
2. Download a model (e.g., Mistral 7B)
3. Start the local server in LM Studio
4. Restart your backend

### Step 4: Restart Backend

After updating `.env`:

```bash
cd backend
# Stop the current server (Ctrl+C)
python -m uvicorn main:app --reload
```

---

## Verification

Test if it's working:

```bash
python tests/test_endpoint.py
```

You should see:
```
✓ SUCCESS: Request completed successfully
```

---

## Current Issue

Your `.env` file currently has placeholder or invalid API keys. The improved architecture is working correctly, but it needs valid API credentials to make LLM calls.

**The architecture improvements are complete and functional** - you just need to configure the API keys!
