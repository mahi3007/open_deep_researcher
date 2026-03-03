# Open Deep Researcher — Agentic LLM Research Framework

A production-quality, ChatGPT-like web interface for an agentic AI research system powered by LangGraph. Supports both **local LLMs via LM Studio** and **cloud APIs (OpenAI)**.

---

## 🌟 Features

- **Modern ChatGPT-Style UI**: Premium dark-mode interface with glassmorphism effects and floating animated background
- **Multi-Agent Research Pipeline**: Pluggable agent graph (Planner → Searcher → Writer)
- **Local LLM Support**: Works with LM Studio (llama, qwen, mistral, etc.) — no cloud API required
- **Session Memory & Conversations**: Persistent multi-turn conversation history stored in SQLite
- **Research Side Panel**: Full-screen report viewer with markdown rendering
- **Metrics Dashboard**: Conversation analytics and research metrics
- **Error Resilience**: Graceful fallbacks for search timeouts and LLM failures

---

## 🏗️ Architecture

### Active Pipeline (Simple Linear Graph)

Optimised for local small models (3B–7B parameters):

```
User Query
    │
    ▼
[Planner Agent]  →  Breaks topic into 4–6 focused sub-questions
    │
    ▼
[Searcher Agent] →  Tavily web search per sub-question (parallel)
    │
    ▼
[Writer Agent]   →  Synthesises results into a structured markdown report
    │
    ▼
Research Report (returned to frontend)
```

### Extended Pipeline (Complex Iterative Graph — cloud models)

Available via `build_graph()` in `research_graph.py` for use with high-context cloud models:

```
Planner → Searcher → Filter → Evidence Judge → Orchestrator
                                                    │
                              ┌─────────────────────┤
                              ▼                     ▼
                        Query Refiner          Compressor
                              │                     │
                              └──→ Searcher     Writer → Self-Critique
                                                         │
                                              ┌──────────┤
                                              ▼          ▼
                                           Accept     Re-run/Improve
```

> ⚠️ **Note:** The iterative graph requires a large-context model (GPT-4, Claude, etc.). Local 3B–7B models will OOM on the repeated filter/evidence loops. Use `build_simple_graph()` (the default) for local models.

---

## 🤖 Agent Reference

| Agent | File | Role |
|---|---|---|
| **Planner** | `src/agents/planner.py` | Decomposes topic into sub-questions |
| **Searcher** | `src/agents/searcher.py` | Parallel Tavily web search with timeout resilience |
| **Filter** | `src/agents/filter.py` | Deduplicates and scores results (iterative graph only) |
| **Evidence Judge** | `src/agents/evidence_judge.py` | Scores source credibility (iterative graph only) |
| **Orchestrator** | `src/agents/orchestrator.py` | Decides proceed vs. refine (iterative graph only) |
| **Query Refiner** | `src/agents/query_refiner.py` | Improves weak sub-questions (iterative graph only) |
| **Compressor** | `src/agents/compressor.py` | Condenses knowledge (iterative graph only) |
| **Writer** | `src/agents/writer.py` | Generates structured markdown research report |
| **Self-Critique** | `src/agents/self_critique.py` | Evaluates report quality (iterative graph only) |

---

## 🚀 Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- LM Studio (for local LLM) **or** an OpenAI API key

### 1. Environment Variables

Create a `.env` file in the project root:

**Option A — Local LLM via LM Studio (recommended for offline use):**
```env
TAVILY_API_KEY="your_tavily_api_key"
LLM_API_URL="http://localhost:1234/v1"
LLM_API_KEY="lm-studio"
MODEL_NAME="llama-3.2-3b-instruct"
```

> In LM Studio: Local Server tab → load your model → **disable authentication** → Start Server on `http://localhost:1234`

**Option B — OpenAI Cloud API:**
```env
TAVILY_API_KEY="your_tavily_api_key"
LLM_API_URL="https://api.openai.com/v1"
LLM_API_KEY="sk-your-openai-key"
MODEL_NAME="gpt-4o-mini"
```

> Get a Tavily key at [tavily.com](https://tavily.com) (free tier available).

### 2. Backend

```bash
cd backend
pip install -r ../requirements.txt
python -m uvicorn main:app --reload
```

Backend runs on: `http://localhost:8000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/research` | Run full research pipeline |
| `GET` | `/health` | Health check |
| `GET` | `/conversations` | List all conversations |
| `POST` | `/conversations` | Create conversation |
| `GET` | `/conversations/{id}` | Get conversation with messages |
| `PUT` | `/conversations/{id}` | Update conversation title |
| `DELETE` | `/conversations/{id}` | Delete conversation |
| `POST` | `/conversations/{id}/messages` | Save message to conversation |
| `GET` | `/session/new` | Generate new session ID |
| `POST` | `/session/clear` | Clear session memory |

### Research Request/Response

```json
// POST /research
{
  "message": "Agentic AI in the gaming industry",
  "session_id": "uuid-v4-string"
}

// Response
{
  "response": "# Agentic AI in Gaming\n\n## Executive Summary...",
  "session_id": "uuid-v4-string",
  "timestamp": "2026-03-03T22:00:00.000Z"
}
```

---

## 🔧 Local Model Tuning

When running with a small local model (≤7B params), the following limits are already applied:

| Setting | Value | Reason |
|---|---|---|
| Tavily results per query | 3 | Reduces search payload |
| Filter input cap | 15 results, 500 chars each | Prevents OOM in filter agent |
| Writer input cap | 6 sources, 800 chars each | Keeps writer prompt within context window |
| Pipeline mode | Simple (linear) | Avoids iterative loops that exceed context |

To switch to the full iterative pipeline (for cloud models), change `main.py`:
```python
# From:
from graph.research_graph import build_simple_graph as build_graph
# To:
from graph.research_graph import build_graph
```

---

## 📦 Project Structure

```
OpenDeepResearcher_project/
├── backend/
│   ├── main.py              # FastAPI app — endpoints, CORS, pipeline invocation
│   ├── models.py            # Pydantic request/response models
│   ├── memory.py            # Thread-safe in-memory session store
│   └── database.py          # SQLite conversation persistence
├── frontend/
│   └── src/
│       ├── App.jsx                      # Main app — state, API calls, routing
│       ├── components/
│       │   ├── Sidebar.jsx              # Conversation list + navigation
│       │   ├── Header.jsx               # Top bar
│       │   ├── MessageBubble.jsx        # Chat message with markdown
│       │   ├── ChatInput.jsx            # Multi-line input with shortcuts
│       │   ├── ResearchCard.jsx         # Collapsed research result card
│       │   ├── ResearchSidePanel.jsx    # Full-screen report viewer
│       │   ├── MetricsDashboard.jsx     # Analytics dashboard
│       │   ├── ResearchPlan.jsx         # Plan display (extended pipeline)
│       │   ├── FloatingLines.jsx        # Animated background
│       │   └── TypingIndicator.jsx      # Loading animation
├── src/
│   ├── agents/
│   │   ├── planner.py           # Sub-question generation
│   │   ├── searcher.py          # Tavily search with error resilience
│   │   ├── writer.py            # Report generation
│   │   ├── filter.py            # Source deduplication (iterative only)
│   │   ├── compressor.py        # Knowledge compression (iterative only)
│   │   ├── evidence_judge.py    # Source credibility scoring (iterative only)
│   │   ├── orchestrator.py      # Pipeline routing decisions (iterative only)
│   │   ├── query_refiner.py     # Sub-question refinement (iterative only)
│   │   └── self_critique.py     # Report quality evaluation (iterative only)
│   └── graph/
│       └── research_graph.py    # LangGraph state machine (simple + iterative)
├── config/
│   └── research_config.py       # Centralised config constants
├── tests/                       # Test suite
├── requirements.txt
├── TROUBLESHOOTING.md
└── .env                         # API keys (not committed)
```

---

## 🎨 UI Overview

- **Sidebar**: Hover-to-expand conversation list with delete support
- **Chat Area**: Animated message bubbles, status indicators, research result cards
- **Research Cards**: Click to open full report in a split-panel side view
- **Floating Background**: Interactive parallax animated lines

### Keyboard Shortcuts
| Key | Action |
|---|---|
| `Enter` | Send message |
| `Shift + Enter` | New line |

---

## 🧪 Troubleshooting

See [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) for common issues.

| Error | Cause | Fix |
|---|---|---|
| `ConnectTimeout` to LM Studio IP | Wrong IP or LM Studio not accepting remote connections | Use `localhost:1234` or enable remote connections in LM Studio |
| `401 Unauthorized` | LM Studio authentication enabled | Disable auth in LM Studio → Local Server → Authentication |
| `Model has crashed (Exit code: 18446744...)` | OOM — model received too large a context | Using simple graph + content limits already applied |
| `Request timed out` | LLM inference too slow (large model) | Use a smaller/quantized model in LM Studio |
| `insufficient_quota` (OpenAI 429) | No billing credits on OpenAI account | Add credits at platform.openai.com/billing |

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

**Built with React, FastAPI, LangGraph, Tavily, and LM Studio**
