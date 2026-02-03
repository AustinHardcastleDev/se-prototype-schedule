#!/bin/bash
# ralph-watchdog.sh - Prevents Ralph from stalling on any story
# Uses Claude to verify code completion before force-marking as done
# Run alongside ralph-claude.sh: ./ralph-watchdog.sh &

INTERVAL="${1:-300}"  # Default: 5 minutes (300 seconds)
MODEL="${2:-claude-sonnet-4-5}"
PRD_FILE="prd.json"
LOG_FILE="watchdog.log"
HEARTBEAT_FILE=".ralph-heartbeat"

# Colors
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "${GREEN}🐕 Watchdog started (interval: ${INTERVAL}s, model: $MODEL)${NC}"

# Verification prompt template
read -r -d '' VERIFY_PROMPT << 'EOF'
You are a code reviewer verifying if a story is complete.

## Task
Verify that the following story from prd.json is complete:

**Story ID:** {STORY_ID}
**Story Title:** {STORY_TITLE}

## Instructions

1. Read the story's acceptance criteria from prd.json
2. Check if the code implementing this story exists and appears complete
3. Run `npm run lint` (or the project's lint command) and check it passes
4. Do a quick sanity check - does the implementation match the requirements?

## Response

After verification, you MUST do ONE of the following:

**If the story is COMPLETE** (code exists, lint passes, requirements met):
1. Set `passes: true` for this story in prd.json
2. Add a note to progress.txt:
```
   ## [timestamp] | WATCHDOG VERIFICATION | Story: {STORY_ID}
   Status: VERIFIED COMPLETE
   Checks: [x] Code exists [x] Lint passes [x] Requirements met
```
3. Commit with message: "watchdog: verified complete {STORY_ID}"

**If the story is NOT COMPLETE** (missing code, lint fails, requirements not met):
1. Do NOT modify prd.json
2. Add a note to progress.txt:
```
   ## [timestamp] | WATCHDOG VERIFICATION | Story: {STORY_ID}
   Status: NOT COMPLETE
   Issues: [describe what's missing or failing]
```
3. Do NOT commit anything

Be quick and decisive. This is a verification check, not implementation work.
Do NOT attempt to fix any issues - just verify and report.
EOF

verify_story() {
    local story_id="$1"
    local story_title="$2"
    
    log "${CYAN}🔍 Running Claude verification for: $story_id${NC}"
    
    # Build the prompt with story details
    local prompt="${VERIFY_PROMPT//\{STORY_ID\}/$story_id}"
    prompt="${prompt//\{STORY_TITLE\}/$story_title}"
    
    # Run Claude with limited turns (this should be quick)
    local output
    local exit_code
    
    output=$(claude -p "$prompt" --model "$MODEL" --max-turns 10 --dangerously-skip-permissions 2>&1)
    exit_code=$?
    
    # Log output summary
    log "Verification exit code: $exit_code"
    echo "$output" >> "$LOG_FILE"
    
    # Check if story was marked complete
    local now_complete
    now_complete=$(jq -r --arg id "$story_id" '.userStories[] | select(.id == $id) | .passes' "$PRD_FILE" 2>/dev/null)
    
    if [ "$now_complete" == "true" ]; then
        log "${GREEN}✅ Story verified and marked complete: $story_id${NC}"
        return 0
    else
        log "${YELLOW}⚠️  Story not verified as complete: $story_id${NC}"
        return 1
    fi
}

get_heartbeat_age() {
    # Returns seconds since last heartbeat, or -1 if no heartbeat file
    if [ ! -f "$HEARTBEAT_FILE" ]; then
        echo "-1"
        return
    fi
    
    local heartbeat_time
    heartbeat_time=$(cut -d' ' -f1 "$HEARTBEAT_FILE" 2>/dev/null)
    
    if [ -z "$heartbeat_time" ]; then
        echo "-1"
        return
    fi
    
    local now
    now=$(date +%s)
    echo $((now - heartbeat_time))
}

get_heartbeat_story() {
    # Returns the story ID from heartbeat file
    if [ ! -f "$HEARTBEAT_FILE" ]; then
        echo ""
        return
    fi
    cut -d' ' -f2 "$HEARTBEAT_FILE" 2>/dev/null
}

VERIFY_FAILURES=0
LAST_VERIFIED_STORY=""

while true; do
    sleep "$INTERVAL"
    
    # Check if prd.json exists
    if [ ! -f "$PRD_FILE" ]; then
        log "⚠️  No prd.json found, waiting..."
        continue
    fi
    
    # Check if all stories complete
    REMAINING=$(jq '[.userStories[] | select(.passes == false and (.skipped // false) == false)] | length' "$PRD_FILE" 2>/dev/null)
    if [ "$REMAINING" == "0" ]; then
        log "${GREEN}✅ All stories complete. Watchdog exiting.${NC}"
        rm -f "$HEARTBEAT_FILE"
        exit 0
    fi
    
    # Get current story from PRD
    CURRENT_STORY_ID=$(jq -r '[.userStories[] | select(.passes == false and (.skipped // false) == false)][0].id // empty' "$PRD_FILE" 2>/dev/null)
    CURRENT_STORY_TITLE=$(jq -r '[.userStories[] | select(.passes == false and (.skipped // false) == false)][0].title // empty' "$PRD_FILE" 2>/dev/null)
    
    if [ -z "$CURRENT_STORY_ID" ]; then
        log "⚠️  No active story found"
        continue
    fi
    
    # Check heartbeat
    HEARTBEAT_AGE=$(get_heartbeat_age)
    HEARTBEAT_STORY=$(get_heartbeat_story)
    
    # Log status
    if [ "$HEARTBEAT_AGE" -ge 0 ]; then
        log "📊 Story: $CURRENT_STORY_ID | Heartbeat: ${HEARTBEAT_AGE}s ago | Heartbeat story: $HEARTBEAT_STORY"
    else
        log "📊 Story: $CURRENT_STORY_ID | No heartbeat file"
    fi
    
    # Reset verify failures if story changed
    if [ "$CURRENT_STORY_ID" != "$LAST_VERIFIED_STORY" ] && [ -n "$LAST_VERIFIED_STORY" ]; then
        log "📝 Story changed from $LAST_VERIFIED_STORY to $CURRENT_STORY_ID - resetting counters"
        VERIFY_FAILURES=0
    fi
    
    # Check if we should intervene
    # Conditions: heartbeat is old (2x interval) OR no heartbeat and story has been active a while
    STALL_THRESHOLD=$((INTERVAL * 2))
    
    if [ "$HEARTBEAT_AGE" -ge "$STALL_THRESHOLD" ]; then
        log "${YELLOW}🚨 Story appears stuck (heartbeat ${HEARTBEAT_AGE}s old > ${STALL_THRESHOLD}s threshold)${NC}"
        
        # Verify the heartbeat story matches current story (Ralph might have moved on)
        if [ "$HEARTBEAT_STORY" != "$CURRENT_STORY_ID" ]; then
            log "⚠️  Heartbeat story ($HEARTBEAT_STORY) != current story ($CURRENT_STORY_ID) - updating heartbeat"
            echo "$(date +%s) $CURRENT_STORY_ID" > "$HEARTBEAT_FILE"
            continue
        fi
        
        # Log intervention attempt
        echo "" >> progress.txt
        echo "---" >> progress.txt
        echo "## $(date '+%Y-%m-%d %H:%M:%S') | WATCHDOG DETECTED STALL" >> progress.txt
        echo "Story: $CURRENT_STORY_ID - $CURRENT_STORY_TITLE" >> progress.txt
        echo "Heartbeat age: ${HEARTBEAT_AGE}s (threshold: ${STALL_THRESHOLD}s)" >> progress.txt
        echo "Action: Running Claude verification..." >> progress.txt
        
        # Run verification
        if verify_story "$CURRENT_STORY_ID" "$CURRENT_STORY_TITLE"; then
            # Verification succeeded, story marked complete
            VERIFY_FAILURES=0
            LAST_VERIFIED_STORY=""
            # Reset heartbeat for next story
            rm -f "$HEARTBEAT_FILE"
        else
            # Verification failed - story is genuinely incomplete
            LAST_VERIFIED_STORY="$CURRENT_STORY_ID"
            VERIFY_FAILURES=$((VERIFY_FAILURES + 1))
            
            if [ "$VERIFY_FAILURES" -ge 3 ]; then
                log "${RED}❌ Story failed verification 3 times - force-skipping${NC}"
                
                # Mark as skipped so Ralph moves on
                jq --arg id "$CURRENT_STORY_ID" \
                    '(.userStories[] | select(.id == $id) | .skipped) = true' \
                    "$PRD_FILE" > "${PRD_FILE}.tmp" && mv "${PRD_FILE}.tmp" "$PRD_FILE"
                
                echo "" >> progress.txt
                echo "## $(date '+%Y-%m-%d %H:%M:%S') | WATCHDOG SKIP" >> progress.txt
                echo "Story: $CURRENT_STORY_ID - $CURRENT_STORY_TITLE" >> progress.txt
                echo "Reason: Failed verification 3 times" >> progress.txt
                echo "Action: Marked as skipped - REQUIRES MANUAL REVIEW" >> progress.txt
                
                git add "$PRD_FILE" progress.txt 2>/dev/null
                git commit -m "watchdog: skip stuck story $CURRENT_STORY_ID after failed verifications" 2>/dev/null || true
                
                VERIFY_FAILURES=0
                LAST_VERIFIED_STORY=""
                rm -f "$HEARTBEAT_FILE"
            else
                log "${YELLOW}⚠️  Verification failed ($VERIFY_FAILURES/3) - resetting heartbeat, will retry${NC}"
                # Reset heartbeat to give Ralph more time
                echo "$(date +%s) $CURRENT_STORY_ID" > "$HEARTBEAT_FILE"
            fi
        fi
    else
        if [ "$HEARTBEAT_AGE" -ge 0 ]; then
            log "✨ Story active (heartbeat ${HEARTBEAT_AGE}s < ${STALL_THRESHOLD}s threshold)"
        fi
    fi
done