# Research System Configuration

# Orchestrator Settings
MAX_ITERATIONS = 3  # Maximum search refinement iterations
MIN_EVIDENCE_SCORE = 0.7  # Minimum acceptable evidence quality score (0.0-1.0)

# Feature Flags
ENABLE_ADVANCED_PIPELINE = True  # Use improved iterative pipeline
ENABLE_QUERY_REFINEMENT = True  # Allow query refinement loops
ENABLE_SELF_CRITIQUE = True  # Enable report quality critique
ENABLE_EVIDENCE_VALIDATION = True  # Enable evidence quality scoring

# Search Settings
MAX_SEARCH_RESULTS_PER_QUESTION = 3  # Results to fetch per sub-question
ENABLE_RESULT_FILTERING = True  # Filter duplicates and low-quality sources
ENABLE_RESULT_COMPRESSION = True  # Compress results before writing

# Quality Thresholds
MIN_CRITIQUE_SCORE_ACCEPT = 8.0  # Minimum score to accept report (0-10)
MIN_CRITIQUE_SCORE_IMPROVE = 6.0  # Minimum score to improve (below = re-run)

# Performance Settings
ENABLE_CACHING = False  # Cache search results (future feature)
ENABLE_PARALLEL_SEARCH = False  # Parallel search for sub-questions (future)

# Logging
ENABLE_DETAILED_LOGGING = True  # Log orchestrator decisions and scores
LOG_EVIDENCE_SCORES = True  # Log evidence quality scores
LOG_CRITIQUE_FEEDBACK = True  # Log self-critique feedback
