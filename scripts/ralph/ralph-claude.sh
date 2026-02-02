#!/bin/bash
# NOTE: We intentionally DO NOT use set -e or pipefail here
# because we want to handle ALL errors gracefully within the retry loop
set -u  # Only exit on undefined variables

# Ralph - Autonomous AI agent for implementing PRDs with Claude Code
# Usage: ./ralph-claude.sh [max-stories] [model]
# Example: ./ralph-claude.sh 10 claude-sonnet-4-5

MAX_STORIES="${1:-10}"
MODEL="${2:-claude-sonnet-4-5}"

# Tuned for ~60% context utilization before handoff
# 200K context / ~3K tokens per turn = ~65 turns safe max
TURNS_PER_STORY=50
MAX_RETRIES=3

# Cooldown settings for error recovery
ERROR_COOLDOWN=5        # Seconds to wait after an error
RATE_LIMIT_COOLDOWN=30  # Seconds to wait if rate limited

# Track Ctrl+C presses for clean exit
INTERRUPT_COUNT=0
cleanup_and_exit() {
    INTERRUPT_COUNT=$((INTERRUPT_COUNT + 1))
    if [ $INTERRUPT_COUNT -ge 2 ]; then
        echo ""
        echo -e "${RED}Force exiting...${NC}"
        # Kill any child processes
        pkill -P $$ 2>/dev/null || true
        exit 1
    fi
    echo ""
    echo -e "${YELLOW}Ctrl+C detected. Press again to exit, or wait to continue...${NC}"
    sleep 2
    if [ $INTERRUPT_COUNT -ge 1 ]; then
        # Reset after the grace period if they didn't press again
        INTERRUPT_COUNT=0
    fi
}
trap cleanup_and_exit INT

# Trap other errors but not interrupts
trap 'echo -e "${YELLOW}⚠️  Caught error, continuing...${NC}"' ERR

BRANCH_FILE="scripts/ralph/.last-branch"
ARCHIVE_DIR="archive"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Log file for debugging
DEBUG_LOG="scripts/ralph/debug.log"

log_debug() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$DEBUG_LOG"
}

echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🤖 Ralph - Autonomous PRD Implementation${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo "Max stories: $MAX_STORIES | Model: $MODEL"
echo "Turns/story: $TURNS_PER_STORY | Max retries: $MAX_RETRIES"
echo ""

# Initialize debug log
mkdir -p "$(dirname "$DEBUG_LOG")"
log_debug "=== Ralph session started ==="
log_debug "Max stories: $MAX_STORIES | Model: $MODEL"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v claude &> /dev/null; then
    echo -e "${RED}❌ Claude Code not found. Install from https://docs.anthropic.com/en/docs/claude-code${NC}"
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq not found. Install jq for JSON parsing${NC}"
    exit 1
fi

if [ ! -f "prd.json" ]; then
    echo -e "${RED}❌ prd.json not found${NC}"
    exit 1
fi

if [ ! -f "AGENTS.md" ]; then
    echo -e "${YELLOW}⚠️  Creating placeholder AGENTS.md...${NC}"
    echo "# Project Context for AI Agents" > AGENTS.md
fi

if [ ! -f "scripts/ralph/prompt.md" ]; then
    echo -e "${RED}❌ scripts/ralph/prompt.md not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Git setup
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not a git repository${NC}"
    exit 1
fi

BRANCH=$(jq -r '.branchName' prd.json)
CURRENT_BRANCH=$(git branch --show-current)

# Archive if branch changed
if [ -f "$BRANCH_FILE" ]; then
    LAST_BRANCH=$(cat "$BRANCH_FILE")
    if [ "$LAST_BRANCH" != "$BRANCH" ]; then
        echo -e "${YELLOW}📦 Archiving previous run...${NC}"
        mkdir -p "$ARCHIVE_DIR"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        ARCHIVE_NAME="${ARCHIVE_DIR}/${LAST_BRANCH##*/}_${TIMESTAMP}"
        mkdir -p "$ARCHIVE_NAME"
        [ -f "progress.txt" ] && mv progress.txt "$ARCHIVE_NAME/"
        [ -f "prd.json" ] && cp prd.json "$ARCHIVE_NAME/prd_final.json"
        echo -e "${GREEN}✅ Archived to $ARCHIVE_NAME${NC}"
    fi
fi
echo "$BRANCH" > "$BRANCH_FILE"

# Switch branch if needed
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        git checkout -b "$BRANCH"
    else
        git checkout "$BRANCH"
    fi
    echo -e "${GREEN}✅ On branch: $BRANCH${NC}"
fi

# Initialize progress.txt
if [ ! -f "progress.txt" ]; then
    cat > progress.txt << EOF
# Ralph Progress Log
Started: $(date)
Branch: $BRANCH
Model: $MODEL

---
EOF
fi

# Read prompt
PROMPT=$(<scripts/ralph/prompt.md)

# Function to classify errors and determine recovery action
classify_error() {
    local output="$1"
    local exit_code="$2"
    
    # Check for specific error patterns
    if echo "$output" | grep -qi "No messages returned"; then
        echo "NO_MESSAGES"
    elif echo "$output" | grep -qi "promise rejected\|rejected with the reason"; then
        echo "PROMISE_REJECTED"
    elif echo "$output" | grep -qi "context_window_exceeded\|context window"; then
        echo "CONTEXT_OVERFLOW"
    elif echo "$output" | grep -qi "Reached max turns"; then
        echo "MAX_TURNS"
    elif echo "$output" | grep -qi "rate.limit\|too many requests\|429"; then
        echo "RATE_LIMITED"
    elif echo "$output" | grep -qi "timeout\|ETIMEDOUT\|ECONNRESET"; then
        echo "TIMEOUT"
    elif echo "$output" | grep -qi "network\|connection\|ENOTFOUND"; then
        echo "NETWORK_ERROR"
    elif echo "$output" | grep -qi "authentication\|unauthorized\|401\|403"; then
        echo "AUTH_ERROR"
    elif [ "$exit_code" -ne 0 ]; then
        echo "UNKNOWN_ERROR"
    else
        echo "SUCCESS"
    fi
}

# Function to handle error recovery
handle_error() {
    local error_type="$1"
    local attempt="$2"
    local story_id="$3"
    
    case "$error_type" in
        NO_MESSAGES|PROMISE_REJECTED)
            echo -e "${YELLOW}⚠️  No messages returned / Promise rejected - API hiccup${NC}"
            echo "ERROR: $error_type at $(date)" >> progress.txt
            log_debug "$error_type error on $story_id attempt $attempt"
            sleep $ERROR_COOLDOWN
            return 0  # Recoverable, retry
            ;;
        CONTEXT_OVERFLOW)
            echo -e "${YELLOW}⚠️  Context window exceeded - will retry with fresh context${NC}"
            echo "HANDOFF: Context overflow at $(date)" >> progress.txt
            log_debug "CONTEXT_OVERFLOW on $story_id attempt $attempt"
            sleep $ERROR_COOLDOWN
            return 0  # Recoverable, retry
            ;;
        MAX_TURNS)
            echo -e "${YELLOW}⚠️  Reached max turns - will retry with fresh context${NC}"
            echo "HANDOFF: Max turns reached at $(date)" >> progress.txt
            log_debug "MAX_TURNS on $story_id attempt $attempt"
            sleep $ERROR_COOLDOWN
            return 0  # Recoverable, retry
            ;;
        RATE_LIMITED)
            echo -e "${YELLOW}⚠️  Rate limited - waiting ${RATE_LIMIT_COOLDOWN}s before retry${NC}"
            echo "ERROR: Rate limited, cooling down at $(date)" >> progress.txt
            log_debug "RATE_LIMITED on $story_id attempt $attempt - cooling down"
            sleep $RATE_LIMIT_COOLDOWN
            return 0  # Recoverable, retry
            ;;
        TIMEOUT|NETWORK_ERROR)
            echo -e "${YELLOW}⚠️  Network/timeout error - will retry${NC}"
            echo "ERROR: Network/timeout error at $(date)" >> progress.txt
            log_debug "$error_type on $story_id attempt $attempt"
            sleep $ERROR_COOLDOWN
            return 0  # Recoverable, retry
            ;;
        AUTH_ERROR)
            echo -e "${RED}❌ Authentication error - check Claude Code login${NC}"
            echo "FATAL: Authentication error at $(date)" >> progress.txt
            log_debug "AUTH_ERROR on $story_id - fatal"
            return 1  # Not recoverable
            ;;
        UNKNOWN_ERROR)
            echo -e "${YELLOW}⚠️  Unknown error - will retry${NC}"
            echo "ERROR: Unknown error at $(date)" >> progress.txt
            log_debug "UNKNOWN_ERROR on $story_id attempt $attempt"
            sleep $ERROR_COOLDOWN
            return 0  # Try to recover
            ;;
        *)
            return 0
            ;;
    esac
}

# Main loop
STORIES_COMPLETED=0
CONSECUTIVE_FAILURES=0
MAX_CONSECUTIVE_FAILURES=10  # Safety valve

while [ $STORIES_COMPLETED -lt $MAX_STORIES ]; do
    # Safety valve - if too many consecutive failures, pause and ask
    if [ $CONSECUTIVE_FAILURES -ge $MAX_CONSECUTIVE_FAILURES ]; then
        echo ""
        echo -e "${RED}⚠️  $MAX_CONSECUTIVE_FAILURES consecutive failures detected${NC}"
        echo "SAFETY: $MAX_CONSECUTIVE_FAILURES consecutive failures at $(date)" >> progress.txt
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Stopping. Check debug.log and progress.txt for details.${NC}"
            exit 1
        fi
        CONSECUTIVE_FAILURES=0
    fi

    TOTAL=$(jq '.userStories | length' prd.json)
    DONE=$(jq '[.userStories[] | select(.passes == true)] | length' prd.json)
    REMAINING=$((TOTAL - DONE))
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}📊 Progress: $DONE/$TOTAL stories complete ($REMAINING remaining)${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    
    # All done?
    if [ "$REMAINING" -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 ALL STORIES COMPLETE!${NC}"
        if ! grep -q "<promise>COMPLETE</promise>" progress.txt 2>/dev/null; then
            echo "<promise>COMPLETE</promise>" >> progress.txt
        fi
        echo ""
        echo "Next steps:"
        echo "  git log --stat"
        echo "  npm run lint"
        echo "  git checkout main && git merge $BRANCH"
        exit 0
    fi
    
    # Get next story
    NEXT_ID=$(jq -r '[.userStories[] | select(.passes == false)][0].id' prd.json)
    NEXT_TITLE=$(jq -r '[.userStories[] | select(.passes == false)][0].title' prd.json)
    
    echo ""
    echo -e "${GREEN}🎯 Next: ${NEXT_ID} - ${NEXT_TITLE}${NC}"
    log_debug "Starting story: $NEXT_ID - $NEXT_TITLE"
    
    # Retry loop for this story
    ATTEMPT=1
    STORY_DONE=false
    
    while [ $ATTEMPT -le $MAX_RETRIES ] && [ "$STORY_DONE" = false ]; do
        echo ""
        echo -e "${YELLOW}▶ Attempt $ATTEMPT/$MAX_RETRIES${NC}"
        
        # Log attempt
        cat >> progress.txt << EOF

---
## $(date '+%Y-%m-%d %H:%M:%S') | Story: $NEXT_ID | Attempt: $ATTEMPT/$MAX_RETRIES
Target: $NEXT_TITLE

EOF
        
        # Build single-story prompt
        SINGLE_STORY_PROMPT="$PROMPT

---

## ⚡ SINGLE STORY MODE - READ CAREFULLY

You are in SINGLE STORY MODE. Complete exactly ONE story, then STOP.

### Your task this iteration:

1. **Read state**: Check prd.json, progress.txt, AGENTS.md, and git log
2. **Find story**: First story where passes: false (should be: $NEXT_ID)
3. **Implement**: Complete ALL acceptance criteria for this ONE story
4. **Test**: Run story-specific tests defined in acceptance criteria
5. **Verify**: Run quality checks, browser verification if frontend
6. **Document**: Update progress.txt with detailed report, update AGENTS.md with learnings
7. **Mark complete**: Set passes: true in prd.json
8. **Commit**: git commit INCLUDING prd.json (passes: true must be in the commit - this triggers handoff)
9. **STOP**: Do NOT continue to next story

### Handoff Protocol:

Before finishing (or if running low on context):
- Document exactly where you are in progress.txt using the Progress Report Format
- Update AGENTS.md with any new patterns or learnings
- If complete: Set passes: true in prd.json, then commit ALL files including prd.json
- If WIP: Commit code with \"WIP: [story] - [status]\" (do NOT set passes: true)

### Context Management:

- You have ~$TURNS_PER_STORY turns for this story
- If task is too big, document progress and handoff cleanly
- Next iteration will continue from your documented state

Current target: **$NEXT_ID - $NEXT_TITLE**"

        # Run Claude with comprehensive error capture
        # Wrap EVERYTHING in a subshell so no error can escape
        TEMP_OUTPUT=$(mktemp)
        MONITOR_PID_FILE=$(mktemp)
        EXIT_CODE=0
        OUTPUT=""
        
        # PID files for process management
        CLAUDE_PID_FILE=$(mktemp)
        MONITOR_PID_FILE=$(mktemp)
        
        # Start background monitor that watches for story completion
        (
            sleep 10  # Give Claude time to start
            while true; do
                # Check if story is now marked as passing
                if jq -e --arg id "$NEXT_ID" '.userStories[] | select(.id == $id and .passes == true)' prd.json > /dev/null 2>&1; then
                    echo "" 
                    echo -e "${GREEN}📡 MONITOR: Story $NEXT_ID marked complete - stopping Claude${NC}"
                    echo "MONITOR: Story $NEXT_ID marked complete, signaling Claude to stop at $(date)" >> progress.txt
                    
                    # Kill by PID file if available
                    if [ -f "$CLAUDE_PID_FILE" ]; then
                        CLAUDE_PID=$(cat "$CLAUDE_PID_FILE" 2>/dev/null)
                        if [ -n "$CLAUDE_PID" ]; then
                            # Kill the process group to get all children
                            kill -TERM -$CLAUDE_PID 2>/dev/null || kill -TERM $CLAUDE_PID 2>/dev/null || true
                            sleep 2
                            kill -9 -$CLAUDE_PID 2>/dev/null || kill -9 $CLAUDE_PID 2>/dev/null || true
                        fi
                    fi
                    
                    # Also try to find by name as backup
                    pkill -f "claude.*--max-turns" 2>/dev/null || true
                    sleep 1
                    pkill -9 -f "claude.*--max-turns" 2>/dev/null || true
                    
                    exit 0
                fi
                sleep 5
            done
        ) &
        MONITOR_PID=$!
        echo $MONITOR_PID > "$MONITOR_PID_FILE"
        
        # Execute Claude and capture its PID
        (
            claude -p "$SINGLE_STORY_PROMPT" --model "$MODEL" --max-turns "$TURNS_PER_STORY" --dangerously-skip-permissions &
            INNER_PID=$!
            echo $INNER_PID > "$CLAUDE_PID_FILE"
            wait $INNER_PID
        ) > "$TEMP_OUTPUT" 2>&1 || EXIT_CODE=$?
        
        # Stop the monitor
        if [ -f "$MONITOR_PID_FILE" ]; then
            kill $(cat "$MONITOR_PID_FILE") 2>/dev/null || true
            rm -f "$MONITOR_PID_FILE"
        fi
        rm -f "$CLAUDE_PID_FILE"
        
        # FIRST: Check if story was completed (monitor may have killed Claude after success)
        if jq -e --arg id "$NEXT_ID" '.userStories[] | select(.id == $id and .passes == true)' prd.json > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✅ Story completed: $NEXT_TITLE${NC}"
            echo "COMPLETED: $NEXT_TITLE at $(date)" >> progress.txt
            log_debug "Story completed (detected post-exit): $NEXT_ID"
            STORY_DONE=true
            STORIES_COMPLETED=$((STORIES_COMPLETED + 1))
            CONSECUTIVE_FAILURES=0
            rm -f "$TEMP_OUTPUT" 2>/dev/null
            continue  # Skip to next iteration of the retry loop (which will exit since STORY_DONE=true)
        fi
        
        # Safely read output (even if file is empty or missing)
        if [ -f "$TEMP_OUTPUT" ]; then
            OUTPUT=$(cat "$TEMP_OUTPUT" 2>/dev/null || echo "ERROR: Could not read output")
            rm -f "$TEMP_OUTPUT"
        else
            OUTPUT="ERROR: No output file created"
            EXIT_CODE=1
        fi
        
        # Log raw output for debugging (truncated)
        log_debug "Exit code: $EXIT_CODE"
        log_debug "Output (first 500 chars): ${OUTPUT:0:500}"
        
        # Classify the error
        ERROR_TYPE=$(classify_error "$OUTPUT" "$EXIT_CODE")
        log_debug "Error classification: $ERROR_TYPE"
        
        if [ "$ERROR_TYPE" != "SUCCESS" ]; then
            # Handle the error
            if ! handle_error "$ERROR_TYPE" "$ATTEMPT" "$NEXT_ID"; then
                # Fatal error, exit
                echo -e "${RED}❌ Fatal error encountered. Exiting.${NC}"
                exit 1
            fi
            
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            ATTEMPT=$((ATTEMPT + 1))
            continue
        fi
        
        # Reset consecutive failures on any successful run
        CONSECUTIVE_FAILURES=0
        
        # Check if story was completed
        NEW_DONE=$(jq '[.userStories[] | select(.passes == true)] | length' prd.json)
        
        if [ "$NEW_DONE" -gt "$DONE" ]; then
            STORY_DONE=true
            STORIES_COMPLETED=$((STORIES_COMPLETED + 1))
            echo ""
            echo -e "${GREEN}✅ Story completed: $NEXT_TITLE${NC}"
            echo "COMPLETED: $NEXT_TITLE at $(date)" >> progress.txt
            log_debug "Story completed: $NEXT_ID"
        else
            echo -e "${YELLOW}⚠️  Story not marked complete - retrying...${NC}"
            echo "INCOMPLETE: Story not marked done, attempt $ATTEMPT at $(date)" >> progress.txt
            log_debug "Story not marked complete: $NEXT_ID attempt $ATTEMPT"
            ATTEMPT=$((ATTEMPT + 1))
            sleep 2
        fi
    done
    
    # Failed after all retries - AUTO-SKIP instead of prompting
    if [ "$STORY_DONE" = false ]; then
        echo ""
        echo -e "${RED}❌ Story failed after $MAX_RETRIES attempts: $NEXT_TITLE${NC}"
        echo "FAILED: $NEXT_TITLE after $MAX_RETRIES attempts at $(date)" >> progress.txt
        log_debug "Story failed after max retries: $NEXT_ID"
        
        # Update failedAttempts in prd.json
        CURRENT_FAILED=$(jq -r --arg id "$NEXT_ID" '.userStories[] | select(.id == $id) | .failedAttempts // 0' prd.json)
        NEW_FAILED=$((CURRENT_FAILED + MAX_RETRIES))
        jq --arg id "$NEXT_ID" --argjson failed "$NEW_FAILED" \
            '(.userStories[] | select(.id == $id) | .failedAttempts) = $failed' \
            prd.json > prd.json.tmp && mv prd.json.tmp prd.json
        
        # Check if story has exceeded skip threshold (e.g., 9 total attempts)
        SKIP_THRESHOLD=9
        if [ "$NEW_FAILED" -ge "$SKIP_THRESHOLD" ]; then
            echo -e "${YELLOW}⚠️  Story has failed $NEW_FAILED times total - auto-skipping${NC}"
            echo "AUTO-SKIP: Story $NEXT_ID exceeded $SKIP_THRESHOLD failed attempts" >> progress.txt
            # Mark as skipped by setting a very high failedAttempts
            jq --arg id "$NEXT_ID" \
                '(.userStories[] | select(.id == $id) | .skipped) = true' \
                prd.json > prd.json.tmp && mv prd.json.tmp prd.json
        else
            echo -e "${YELLOW}📝 Will retry story in next run (total attempts: $NEW_FAILED)${NC}"
        fi
    fi
    
    echo ""
    echo -e "${BLUE}--- Fresh context for next story ---${NC}"
    sleep 2
done

echo ""
echo -e "${YELLOW}Reached max stories ($MAX_STORIES). Run again to continue.${NC}"
log_debug "=== Ralph session ended (max stories reached) ==="
