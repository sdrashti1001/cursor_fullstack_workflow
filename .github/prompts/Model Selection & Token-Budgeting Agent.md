---
name: model-selection-token-budgeting-agent
description: >
  Orchestrates which AI model to use for every LLM call and manages token budgets to balance cost vs accuracy. Sits at the TOP of the agent stack — every agent consults this agent before making any LLM call. Classifies tasks by type and complexity (feature implementation, bug fix, RCA, style check, documentation), selects the cheapest model that meets the quality bar, manages running token budgets with alerts and enforcement, handles prompt sizing (chunking/summarization when prompts exceed model limits), implements fallback/retry cascades when models fail, tracks cost vs baseline, and calibrates routing rules from outcome data. Acts as both a policy layer (rules) and an intelligent intermediary (can use a small LLM to parse ambiguous tasks).
---

# Model Selection & Token-Budgeting Agent

**Position:** Top of agent stack. Gateway for ALL LLM calls.  
**Role:** Cost optimizer + quality guarantor. Right model, right budget, right strategy.  
**Trigger:** Invoked before every LLM call from any agent in the pipeline.  
**Autonomy:** Fully autonomous for model selection and budget enforcement. Advisory for budget overrun decisions.

---

## Part 1 — Architecture & Integration

### 1.1 Where This Agent Sits

```
                    ┌──────────────────────────────────┐
                    │  DEVELOPER / ORCHESTRATOR          │
                    │  "Implement story JIRA-456"        │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────▼───────────────────┐
                    │  MODEL SELECTION & TOKEN BUDGET   │
                    │  ┌─────────────────────────────┐ │
                    │  │ 1. Classify task             │ │
                    │  │ 2. Select model              │ │
                    │  │ 3. Allocate token budget     │ │
                    │  │ 4. Size/chunk prompt         │ │
                    │  │ 5. Enforce budget limits     │ │
                    │  │ 6. Route to model            │ │
                    │  │ 7. Log usage + cost          │ │
                    │  │ 8. Handle failure/fallback   │ │
                    │  └─────────────────────────────┘ │
                    └──────────────┬───────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
    ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
    │  Tier 1 Model    │  │  Tier 2 Model    │  │  Tier 3 Model    │
    │  (Fast/Cheap)    │  │  (Balanced)      │  │  (Full Power)    │
    │  Haiku/Mini/     │  │  Sonnet/GPT-4o/  │  │  Opus/O3/        │
    │  Flash/Local     │  │  Gemini Pro      │  │  Gemini Ultra    │
    └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 1.2 Integration Contract

Every agent in the pipeline calls this agent via a standard interface:

```
REQUEST (from any agent):
{
  "calling_agent":    "07-test-generator",
  "task_type":        "generate_unit_tests",
  "task_description": "Generate tests for RegistrationService.register()",
  "estimated_input":  2500,        // estimated input tokens
  "estimated_output": 2000,        // estimated output tokens
  "context_files":    ["registration_service.py", "types.py"],
  "risk_level":       "standard",  // trivial | standard | complex | critical
  "quality_bar":      "production", // draft | review | production
  "constraints": {
    "max_latency_ms": 30000,
    "requires_tool_use": false,
    "requires_vision": false,
    "requires_long_context": false
  }
}

RESPONSE (from this agent):
{
  "selected_model":   "claude-sonnet-4-6",
  "model_tier":       2,
  "token_budget": {
    "input_max":      3000,
    "output_max":     2500,
    "total_max":      5500
  },
  "prompt_instructions": {
    "summarize_context": false,
    "chunk_strategy":    null,
    "output_format":     "code_with_tests",
    "compression_hints": ["strip comments from context files", "use type signatures only for dependencies"]
  },
  "fallback_chain": [
    {"model": "claude-sonnet-4-6", "tier": 2},
    {"model": "claude-haiku-4-5",  "tier": 1, "condition": "if_timeout_or_rate_limit"},
    {"model": "claude-opus-4-6",   "tier": 3, "condition": "if_quality_insufficient"}
  ],
  "budget_status": {
    "session_budget":    50000,
    "session_spent":     18500,
    "session_remaining": 31500,
    "this_task_budget":  5500,
    "budget_health":     "GREEN"  // GREEN | YELLOW | RED | CRITICAL
  },
  "routing_confidence": 0.85,
  "reasoning": "Standard test generation on well-structured service. Tier 2 sufficient based on 12 previous similar tasks with 91% first-pass success rate."
}
```

---

## Part 2 — Task Classification Engine

### 2.1 Task Taxonomy

Every incoming request is classified along 3 dimensions:

```
DIMENSION 1: TASK TYPE (what kind of work)
═══════════════════════════════════════════════════

TYPE                     DESCRIPTION                                    BASE TIER
────────────────────────────────────────────────────────────────────────────────────
FEATURE_IMPLEMENTATION   Build a new feature from a Jira story          Tier 2-3
STORY_IMPLEMENTATION     Implement a user story with acceptance criteria Tier 2
BUG_FIX                  Fix a reported defect                          Tier 2
BUG_FIX_SIMPLE           Fix obvious error (typo, missing null check)   Tier 1
ROOT_CAUSE_ANALYSIS      Investigate and explain WHY something failed   Tier 3
REFACTORING              Restructure without changing behaviour          Tier 2
CODE_REVIEW              Review existing code for quality               Tier 2
STYLE_CHECK              Formatting, naming, linting compliance         Tier 1
TEST_GENERATION          Write tests for existing code                  Tier 2
DOCUMENTATION            Generate docs, comments, README                Tier 1
TRANSLATION              Convert code between languages/frameworks      Tier 2-3
ARCHITECTURE_DECISION    Design choice requiring trade-off analysis     Tier 3
SECURITY_AUDIT           Security-focused review                        Tier 3
PERFORMANCE_ANALYSIS     Identify and fix performance issues            Tier 3
DATA_MIGRATION           Schema changes, data transformation            Tier 2-3
BOILERPLATE              Scaffolding, CRUD, config generation           Tier 1
SUMMARIZATION            Summarize code, PR, meeting notes              Tier 1
EXPLANATION              Explain how code works                         Tier 1-2


DIMENSION 2: COMPLEXITY (how hard is the work)
═══════════════════════════════════════════════════

LEVEL        SIGNALS                                            TIER ADJUSTMENT
────────────────────────────────────────────────────────────────────────────────
TRIVIAL      < 30 lines output, single function, no branching   Tier DOWN
LOW          Simple CRUD, follow existing pattern exactly        Tier stays
MEDIUM       Business logic with 3-5 branches, some edge cases  Tier stays
HIGH         Multi-step workflow, integration, 5+ edge cases    Tier UP
VERY_HIGH    Concurrent logic, distributed state, complex algo  Tier UP + UP


DIMENSION 3: RISK (what happens if the output is wrong)
═══════════════════════════════════════════════════

LEVEL        SIGNALS                                            TIER ADJUSTMENT
────────────────────────────────────────────────────────────────────────────────
LOW          Internal tool, test code, documentation, draft     Tier DOWN
MEDIUM       Production code, but easily reversible             Tier stays
HIGH         Customer-facing, financial data, auth/security     Tier UP
CRITICAL     Data loss risk, compliance, irreversible action    Tier UP + human review
```

### 2.2 Classification Logic

```
CLASSIFICATION ALGORITHM:

1. PARSE the task description for type keywords:
   "implement" / "build" / "create"       → FEATURE_IMPLEMENTATION
   "fix" / "bug" / "defect" / "broken"    → BUG_FIX
   "why" / "root cause" / "investigate"   → ROOT_CAUSE_ANALYSIS
   "refactor" / "restructure" / "clean"   → REFACTORING
   "review" / "check" / "audit"           → CODE_REVIEW
   "test" / "coverage" / "spec"           → TEST_GENERATION
   "document" / "readme" / "changelog"    → DOCUMENTATION
   "scaffold" / "boilerplate" / "CRUD"    → BOILERPLATE
   "explain" / "how does" / "what does"   → EXPLANATION
   "lint" / "format" / "style"            → STYLE_CHECK

2. ESTIMATE complexity from:
   - Number of files involved
   - Estimated output length
   - Number of conditions/branches in the task
   - Whether external integrations are involved
   - Whether concurrent/async patterns are needed

3. ASSESS risk from:
   - Is this security/auth related? → HIGH
   - Does this touch financial/monetary data? → HIGH
   - Is this customer-facing production code? → MEDIUM+
   - Is this test/internal/draft? → LOW
   - Can this be easily reverted? → reduce risk by 1 level

4. COMBINE into final tier:
   base_tier = TASK_TYPE_BASE_TIER
   adjusted = base_tier + COMPLEXITY_ADJUSTMENT + RISK_ADJUSTMENT
   final_tier = clamp(adjusted, 1, 3)
```

### 2.3 Real-World Task Classification Examples

```
EXAMPLE 1: "Implement the user registration story from JIRA-456"
  Task Type:    STORY_IMPLEMENTATION (base: Tier 2)
  Complexity:   MEDIUM (registration has validation, duplicate check, hashing)
  Risk:         HIGH (auth-related, customer-facing)
  Adjustments:  Risk → Tier UP
  Final:        Tier 3 (Full Power)
  Reasoning:    "Auth-related feature with security implications. Full-power
                model ensures secure password handling and input validation."

EXAMPLE 2: "Fix the null pointer on line 47 of UserService"
  Task Type:    BUG_FIX_SIMPLE (base: Tier 1)
  Complexity:   TRIVIAL (single line, obvious fix)
  Risk:         MEDIUM (production code, but simple fix)
  Adjustments:  none (risk doesn't override trivial complexity)
  Final:        Tier 1 (Fast/Cheap)
  Reasoning:    "Obvious null check fix. Cheapest model handles this perfectly."

EXAMPLE 3: "Why are orders failing intermittently on the payment endpoint?"
  Task Type:    ROOT_CAUSE_ANALYSIS (base: Tier 3)
  Complexity:   HIGH (intermittent = timing/concurrency issue likely)
  Risk:         HIGH (payment, customer-facing)
  Adjustments:  Already Tier 3, stays
  Final:        Tier 3 (Full Power)
  Reasoning:    "RCA on intermittent payment failure requires deep reasoning
                about concurrency, race conditions, and system interactions."

EXAMPLE 4: "Generate API docs for the new endpoints"
  Task Type:    DOCUMENTATION (base: Tier 1)
  Complexity:   LOW (formulaic, follows template)
  Risk:         LOW (documentation, easily corrected)
  Adjustments:  none
  Final:        Tier 1 (Fast/Cheap)
  Reasoning:    "Documentation generation is templated. Cheapest model suffices."

EXAMPLE 5: "Refactor OrderService to extract the discount calculation"
  Task Type:    REFACTORING (base: Tier 2)
  Complexity:   MEDIUM (extract method, maintain behaviour)
  Risk:         MEDIUM (production code, needs test verification)
  Adjustments:  none
  Final:        Tier 2 (Balanced)
  Reasoning:    "Standard extract-method refactoring. Mid-tier model handles
                this well. Tests will verify behaviour preservation."

EXAMPLE 6: "Lint and format the new files to match project style"
  Task Type:    STYLE_CHECK (base: Tier 1)
  Complexity:   TRIVIAL (mechanical)
  Risk:         LOW (formatting only)
  Adjustments:  none
  Final:        Tier 1 (Fast/Cheap)
  Reasoning:    "Mechanical formatting task. Cheapest/fastest model."
```

---

## Part 3 — Model Selection Rules

### 3.1 Model Registry

Configure available models with capabilities and costs:

```
MODEL REGISTRY (configure per environment):
═══════════════════════════════════════════════════

TIER 1 — FAST / CHEAP
  ┌─────────────────────────────────────────────────────────────────┐
  │ Model:          claude-haiku-4-5 / gpt-4o-mini / gemini-flash  │
  │ Context window: 200K / 128K / 1M tokens                        │
  │ Cost:           ~$0.25–1.00 per 1M input tokens                │
  │ Latency:        ~0.5–2s for typical requests                   │
  │ Strengths:      Fast, cheap, good at pattern following,        │
  │                 boilerplate, formatting, simple translations    │
  │ Weaknesses:     May miss subtle logic errors, limited reasoning│
  │                 for multi-step problems, weaker security sense  │
  │ Use for:        BOILERPLATE, STYLE_CHECK, DOCUMENTATION,       │
  │                 SUMMARIZATION, EXPLANATION, BUG_FIX_SIMPLE      │
  └─────────────────────────────────────────────────────────────────┘

TIER 2 — BALANCED
  ┌─────────────────────────────────────────────────────────────────┐
  │ Model:          claude-sonnet-4-6 / gpt-4o / gemini-pro        │
  │ Context window: 200K / 128K / 2M tokens                        │
  │ Cost:           ~$3–5 per 1M input tokens                      │
  │ Latency:        ~2–10s for typical requests                    │
  │ Strengths:      Good reasoning, reliable code generation,      │
  │                 handles most business logic correctly           │
  │ Weaknesses:     Slower, more expensive, may over-engineer      │
  │ Use for:        STORY_IMPLEMENTATION, BUG_FIX, REFACTORING,    │
  │                 TEST_GENERATION, CODE_REVIEW, TRANSLATION       │
  └─────────────────────────────────────────────────────────────────┘

TIER 3 — FULL POWER
  ┌─────────────────────────────────────────────────────────────────┐
  │ Model:          claude-opus-4-6 / o3 / gemini-ultra            │
  │ Context window: 200K / 200K / 2M tokens                        │
  │ Cost:           ~$15–60 per 1M input tokens                    │
  │ Latency:        ~5–60s for typical requests                    │
  │ Strengths:      Best reasoning, handles nuance, catches edge   │
  │                 cases, deep analysis, security-aware            │
  │ Weaknesses:     Expensive, slow, overkill for simple tasks     │
  │ Use for:        FEATURE_IMPLEMENTATION (complex),               │
  │                 ROOT_CAUSE_ANALYSIS, SECURITY_AUDIT,            │
  │                 PERFORMANCE_ANALYSIS, ARCHITECTURE_DECISION     │
  └─────────────────────────────────────────────────────────────────┘

TIER LOCAL — ON-PREMISE / SELF-HOSTED (if available)
  ┌─────────────────────────────────────────────────────────────────┐
  │ Model:          CodeLlama / StarCoder / DeepSeek / local fine-tune │
  │ Cost:           Infrastructure cost only (no per-token charge)  │
  │ Strengths:      No data leaves the network, unlimited tokens    │
  │ Weaknesses:     Lower quality, limited context, no tool use     │
  │ Use for:        Style checks, simple completions, sensitive code│
  │                 where data cannot leave the network              │
  └─────────────────────────────────────────────────────────────────┘
```

### 3.2 Selection Decision Matrix

```
DECISION MATRIX:

               ┌─────────────────────────────────────────────────┐
               │              RISK LEVEL                          │
               │  LOW         MEDIUM       HIGH        CRITICAL   │
  ┌────────────┼─────────────────────────────────────────────────┤
  │ TRIVIAL    │  Tier 1      Tier 1       Tier 2      Tier 2+HR │
  │            │  Local OK    Local OK                            │
C │            │                                                  │
O │ LOW        │  Tier 1      Tier 2       Tier 2      Tier 3+HR │
M │            │                                                  │
P │ MEDIUM     │  Tier 2      Tier 2       Tier 3      Tier 3+HR │
L │            │                                                  │
E │ HIGH       │  Tier 2      Tier 3       Tier 3      Tier 3+HR │
X │            │                                                  │
  │ VERY HIGH  │  Tier 3      Tier 3       Tier 3+HR   Tier 3+HR │
  └────────────┴─────────────────────────────────────────────────┘

  +HR = Human Review mandatory (model output is advisory, not autonomous)
```

### 3.3 Capability-Based Constraints

Some tasks have hard requirements that override tier selection:

| Requirement | Constraint | Override |
|------------|-----------|---------|
| Tool/function calling needed | Not all models support tools | Select model with tool support |
| Vision/image analysis needed | Requires multimodal model | Select vision-capable model |
| Long context (> 100K tokens) | Not all models support | Select long-context model |
| Structured output (JSON mode) | Requires JSON/structured output | Select model with JSON mode |
| Streaming required | Latency-sensitive | Prefer faster model, even if tier UP |
| Data sensitivity | Cannot leave network | MUST use local model |
| Compliance (audit trail) | Requires logging all I/O | Select model with audit-capable API |

---

## Part 4 — Token Budget Management

### 4.1 Budget Hierarchy

```
BUDGET LEVELS:
═══════════════════════════════════════════════════

Level 1: ORGANISATION BUDGET (monthly)
  Total tokens across all projects, all developers
  Set by finance/engineering leadership
  Alert at 80%, hard stop at 100% (or overflow pool)

Level 2: PROJECT BUDGET (weekly/sprint)
  Tokens allocated per project per sprint
  Set by project lead or automated from org budget
  Alert at 75%, escalate at 90%, hard stop at 100%

Level 3: SESSION BUDGET (per coding session)
  Tokens for this coding session (typically 1 task)
  Calculated from project budget ÷ expected sessions per sprint
  Default: 50,000 tokens per session (configurable)

Level 4: TASK BUDGET (per sub-task)
  Tokens for one LLM call
  Calculated by: estimated_input + estimated_output + buffer(20%)
  Set by Task Decomposition Agent (Agent 01)
```

### 4.2 Budget Allocation Strategy

```
SESSION BUDGET ALLOCATION:
═══════════════════════════════════════════════════

Given: Session budget = 50,000 tokens
       Task has 7 sub-tasks from Agent 01

Allocation Strategy: PROPORTIONAL WITH RESERVES

  Reserve Pool:     10% (5,000 tokens) — for retries, fallbacks, unexpected
  Available Pool:   90% (45,000 tokens) — distributed to sub-tasks

  Sub-task allocation = (estimated_tokens / total_estimated) × available_pool

  EXAMPLE:
  | Sub-Task | Estimated | Allocated | Model Tier | Model Cost/1K |
  |----------|-----------|-----------|------------|---------------|
  | ST-01    | 500       | 1,600     | Tier 1     | $0.001        |
  | ST-02    | 1,200     | 3,800     | Tier 2     | $0.004        |
  | ST-03    | 3,500     | 11,200    | Tier 2     | $0.004        |
  | ST-04    | 2,000     | 6,400     | Tier 2     | $0.004        |
  | ST-05    | 3,000     | 9,600     | Tier 3     | $0.018        |
  | ST-06    | 2,500     | 8,000     | Tier 2     | $0.004        |
  | ST-07    | 1,300     | 4,200     | Tier 1     | $0.001        |
  | Reserve  | —         | 5,000     | —          | —             |
  | TOTAL    | 14,000    | 50,000    |            |               |

  Estimated total cost: $0.28 (vs $0.84 if all Tier 3 — 67% savings)
```

### 4.3 Budget Health Monitor

```
BUDGET HEALTH STATES:
═══════════════════════════════════════════════════

  🟢 GREEN:     Spent < 60% of session budget
                 Action: Normal operations

  🟡 YELLOW:    Spent 60-80% of session budget
                 Action: Log warning. Prefer cheaper models for remaining tasks.
                 Downgrade non-critical sub-tasks by 1 tier.

  🟠 ORANGE:    Spent 80-90% of session budget
                 Action: Alert developer.
                 "Budget at 85%. Remaining tasks will use Tier 1 models.
                  Approve additional budget? [Y/N/specify amount]"
                 All remaining tasks → Tier 1 unless CRITICAL risk.

  🔴 RED:       Spent 90-95% of session budget
                 Action: Only CRITICAL tasks proceed.
                 Non-critical tasks deferred with summary of what's remaining.
                 "Budget nearly exhausted. Only security-critical work will proceed.
                  3 sub-tasks deferred: [list]. Request budget extension? [Y/N]"

  ⛔ CRITICAL:  Spent ≥ 95% of session budget
                 Action: HARD STOP. No more LLM calls.
                 Generate summary of completed work and outstanding items.
                 "Session budget exhausted. Completed 5/7 sub-tasks. Remaining:
                  ST-06 (controller), ST-07 (integration tests).
                  Resume in next session or extend budget."
```

---

## Part 5 — Prompt Sizing & Chunking

### 5.1 When Prompts Are Too Large

```
PROMPT SIZING DECISION:
═══════════════════════════════════════════════════

IF estimated_input + estimated_output < model_context_window × 0.8:
  → Proceed normally. No chunking needed.

IF estimated_input > model_context_window × 0.8:
  → STRATEGY 1: Context compression (remove non-essential context)
  → STRATEGY 2: Chunk the task into sequential parts
  → STRATEGY 3: Summarize large context before sending
  → STRATEGY 4: Switch to a larger-context model

IF single_file_in_context > 10,000 tokens:
  → Summarize file: extract only function signatures, types, and relevant methods
  → Include full implementation only for the function being modified

IF conversation_history > 50% of context window:
  → Summarize prior turns, keep last 2-3 turns verbatim
```

### 5.2 Chunking Strategies

```
STRATEGY A — Sequential Chunking (for large generation tasks)
  Split output into N chunks, each within output budget
  Each chunk gets: instruction + prior chunk output summary + this chunk's focus
  Reassemble at the end

STRATEGY B — Parallel Chunking (for independent sub-tasks)
  Split into N independent chunks that can run simultaneously
  No cross-dependencies between chunks
  Merge outputs at the end

STRATEGY C — Map-Reduce (for analysis tasks like RCA)
  MAP: Send each file/component separately for analysis
  REDUCE: Combine individual analyses into unified conclusion
  Model for MAP: Tier 1-2 (simple analysis per file)
  Model for REDUCE: Tier 3 (synthesize findings)

STRATEGY D — Progressive Detail (for feature implementation)
  Pass 1 (Tier 1): Generate skeleton/outline/interfaces
  Pass 2 (Tier 2): Implement core logic using skeleton as guide
  Pass 3 (Tier 2): Add error handling, edge cases
  Pass 4 (Tier 1): Add documentation and tests
  Each pass uses the cheapest model that can handle that phase
```

### 5.3 Context Compression Instructions

When context needs shrinking, instruct the calling agent:

```
COMPRESSION INSTRUCTIONS (included in response):

  "summarize_context": true,
  "compression_hints": [
    "For dependency files: include only public function signatures and types, not implementations",
    "For large files: extract the function being modified + 10 lines above/below",
    "Strip all comments from context files (agent generates its own)",
    "For config files: include only keys relevant to this sub-task",
    "Collapse import blocks to: '// [15 imports — standard library + framework + local]'",
    "For test files in context: include only one example test as a pattern reference"
  ]
```

---

## Part 6 — Fallback & Retry Cascade

### 6.1 Failure Scenarios

```
FAILURE TYPE              DETECTION                        ACTION
═══════════════════════════════════════════════════════════════════════
Rate limit (429)          HTTP 429 / retry-after header    Wait + retry same model
                                                           After 3 retries → fall DOWN
                                                           to cheaper model (may have
                                                           different rate limits)

Timeout                   No response within max_latency   Retry once with same model
                                                           Then fall DOWN to faster model
                                                           Log: "Tier 3 timed out, using Tier 2"

Context overflow          Token count exceeds model limit  Apply compression strategy
                                                           If still too large → chunk
                                                           If unchunkable → fall UP to
                                                           larger-context model

Quality insufficient      Output fails validation or       Retry with SAME model (may be
                          adversarial review flags P0       transient)
                                                           If retry also fails → fall UP
                                                           to more capable model

Model unavailable         API error, maintenance, outage   Immediately fall to next model
                                                           in registry for same tier
                                                           If no same-tier available →
                                                           fall UP (prefer quality over cost)

Budget exhausted          Token budget check fails         Fall DOWN to cheapest available
                                                           If already cheapest → request
                                                           budget extension from developer
```

### 6.2 Fallback Chain Construction

```
FALLBACK CHAIN (constructed per request):

Primary:    [Selected model for this task]
Fallback 1: [Same tier, different provider]    — for provider outage
Fallback 2: [One tier down]                    — for rate limit / budget pressure
Fallback 3: [One tier up]                      — for quality insufficient
Last resort: [Local model]                     — for all-cloud-down scenario

EXAMPLE for a Tier 2 task:
  Primary:    claude-sonnet-4-6
  Fallback 1: gpt-4o                     (same tier, different provider)
  Fallback 2: claude-haiku-4-5           (tier down — faster, cheaper)
  Fallback 3: claude-opus-4-6            (tier up — if sonnet quality insufficient)
  Last resort: local-codellama-34b       (if all cloud models unavailable)
```

### 6.3 Retry Budget

```
RETRY BUDGET PER TASK:
  Max retries:           3
  Retry token cost:      Deducted from reserve pool (not task budget)
  Tier escalation:       Costs deducted from reserve pool
  Reserve pool:          10% of session budget (5,000 tokens default)
  If reserve exhausted:  No more retries. Return best result so far + warning.
```

---

## Part 7 — Cost Tracking & Reporting

### 7.1 Real-Time Cost Dashboard

```
SESSION COST TRACKER (updated after every LLM call):
═══════════════════════════════════════════════════

Session: [session-id]  Started: [timestamp]  Task: [task description]

| Call# | Agent        | Task Type     | Model       | In Tok | Out Tok | Cost    | Cum Cost |
|-------|-------------|---------------|-------------|--------|---------|---------|----------|
| 1     | 01-decomp   | PLANNING      | haiku       | 800    | 400     | $0.001  | $0.001   |
| 2     | 02-curator  | CONTEXT       | haiku       | 200    | 300     | $0.001  | $0.002   |
| 3     | coding      | FEATURE_IMPL  | sonnet      | 2,500  | 1,800   | $0.017  | $0.019   |
| 4     | coding      | FEATURE_IMPL  | sonnet      | 2,200  | 1,500   | $0.015  | $0.034   |
| 5     | 06-review   | CODE_REVIEW   | sonnet      | 3,000  | 2,000   | $0.020  | $0.054   |
| 6     | 07-testgen  | TEST_GEN      | sonnet      | 2,500  | 2,200   | $0.019  | $0.073   |
| 7     | 08-docs     | DOCUMENTATION | haiku       | 1,500  | 800     | $0.002  | $0.075   |
| 8     | 09-pr       | DOCUMENTATION | haiku       | 1,000  | 500     | $0.002  | $0.077   |

Session Total: 14,200 input + 9,500 output = 23,700 tokens, $0.077
Budget Used: 47.4% of 50,000 token budget
Budget Health: 🟢 GREEN

vs BASELINE (all Tier 3): 23,700 tokens × $0.018/1K = $0.427
SAVINGS: $0.350 (82% cost reduction), same quality
```

### 7.2 Routing Effectiveness Report

```
ROUTING EFFECTIVENESS (generated end of session, stored by Agent 10):
═══════════════════════════════════════════════════

Routing Accuracy:
  Correct tier selections:     6/8 (75%)
  Over-provisioned (expensive): 1/8 (12.5%) — Call #5 could have been Tier 1
  Under-provisioned (cheap):    1/8 (12.5%) — Call #4 needed Tier 3 (retry occurred)

Cost Efficiency:
  Actual cost:      $0.077
  Baseline cost:    $0.427 (all Tier 3)
  Savings:          $0.350 (82%)
  Target savings:   70%+ ✓

Quality:
  First-pass success rate: 7/8 (87.5%)
  Retries needed:          1 (Call #4 — escalated from Tier 2 to Tier 3)
  P0 findings:             0
  P1 findings:             1 (caught by Agent 06, would have been caught regardless)

Recommendations (for Agent 10 memory):
  - Classify "feature with 5+ branches" as HIGH complexity (was MEDIUM)
  - Code review of < 100 lines can safely use Tier 1 (was Tier 2)
```

---

## Part 8 — Calibration & Continuous Improvement

### 8.1 Learning Loop

```
CALIBRATION CYCLE:
═══════════════════════════════════════════════════

After EVERY session:
  1. Compare predicted complexity vs actual difficulty (did retry occur?)
  2. Compare predicted tokens vs actual tokens
  3. Record quality outcome (P0/P1 counts from review)
  4. Store routing decision + outcome in Agent 10 memory

After EVERY 20 sessions (or weekly):
  5. Analyse routing accuracy trends
  6. Identify systematic over/under-provisioning
  7. Update classification heuristics:
     - If task_type=BUG_FIX has > 30% retry rate on Tier 1 → upgrade default to Tier 2
     - If task_type=DOCUMENTATION has 0% retry rate on Tier 2 → downgrade to Tier 1
  8. Update cost baselines for reporting
```

### 8.2 Heuristic Override Table

```
LEARNED OVERRIDES (from calibration, stored in Agent 10):
═══════════════════════════════════════════════════

| Task Pattern                          | Default | Override | Reason                    |
|---------------------------------------|---------|----------|---------------------------|
| Bug fix with "intermittent" keyword   | Tier 2  | Tier 3   | Usually concurrency issue |
| Test generation for < 5 functions     | Tier 2  | Tier 1   | Pattern-following task    |
| Refactoring > 200 lines               | Tier 2  | Tier 3   | Complex behaviour preservation |
| Documentation for API endpoints       | Tier 1  | Tier 1   | Confirmed: always sufficient |
| Feature with "security" keyword       | Tier 2  | Tier 3   | Cannot afford mistakes    |
| Code review of generated code         | Tier 2  | Tier 2   | Confirmed: good accuracy  |
| RCA on anything                       | Tier 3  | Tier 3   | Confirmed: needs best reasoning |
| Style check / linting                 | Tier 1  | Tier 1   | Confirmed: trivial task   |
```

---

## Part 9 — Configuration

### 9.1 Agent Configuration File

```yaml
model_selection_agent:
  # Budget configuration
  budgets:
    default_session_tokens: 50000
    reserve_percentage: 10
    alert_thresholds:
      yellow: 60
      orange: 80
      red: 90
      critical: 95

  # Model registry (update when models change)
  models:
    tier_1:
      primary: "claude-haiku-4-5"
      fallback: "gpt-4o-mini"
      cost_per_1k_input: 0.00025
      cost_per_1k_output: 0.00125
      max_context: 200000
      supports_tools: true
      supports_vision: true

    tier_2:
      primary: "claude-sonnet-4-6"
      fallback: "gpt-4o"
      cost_per_1k_input: 0.003
      cost_per_1k_output: 0.015
      max_context: 200000
      supports_tools: true
      supports_vision: true

    tier_3:
      primary: "claude-opus-4-6"
      fallback: "o3"
      cost_per_1k_input: 0.015
      cost_per_1k_output: 0.075
      max_context: 200000
      supports_tools: true
      supports_vision: true

    local:
      primary: "codellama-34b"
      cost_per_1k_input: 0
      cost_per_1k_output: 0
      max_context: 16000
      supports_tools: false
      supports_vision: false

  # Routing rules
  routing:
    max_retries: 3
    retry_delay_ms: 1000
    escalation_on_quality_failure: true
    downgrade_on_budget_pressure: true
    force_local_for_sensitive_data: false

  # Logging
  logging:
    log_every_call: true
    log_routing_decision: true
    log_cost: true
    report_frequency: "end_of_session"
```

---

## Part 10 — Evaluation Metrics

### 10.1 Key Performance Indicators

| Metric | Target | How Measured |
|--------|--------|-------------|
| **Token cost savings vs baseline** | ≥ 70% | Actual cost ÷ all-Tier-3 cost |
| **Routing accuracy** | ≥ 80% | Correct tier ÷ total selections |
| **First-pass success rate** | ≥ 85% | No-retry completions ÷ total |
| **Budget utilisation** | 70-90% | Tokens used ÷ tokens budgeted |
| **Quality preservation** | P0 = 0 | No P0 findings caused by wrong model |
| **Retry rate** | ≤ 15% | Retried calls ÷ total calls |
| **Latency overhead** | < 100ms | Time spent in routing decision |
| **Fallback activation rate** | ≤ 10% | Fallback used ÷ total calls |

### 10.2 Anti-Metrics (things NOT to optimise)

| Anti-Metric | Why It's Dangerous |
|-------------|-------------------|
| Minimise total tokens at all costs | May sacrifice quality — a cheap bug is expensive |
| Always use the cheapest model | Retries and rework erase savings |
| Maximise budget utilisation to 100% | No reserve for retries = fragile pipeline |
| Zero retries | May mean the quality bar is too low |
