---
description: Audit code changes since last docs update. Lists recent commits touching app.js or styles.css, shows changed symbols, flags what needs documenting.
disable-model-invocation: true
allowed-tools: Read Grep Bash
---

## Sync checklist

Run this when you want to ensure CLAUDE.md and skills stay current with code changes.

### Step 1: identify changed commits
!`git log --oneline -30 -- js/app.js css/styles.css`

### Step 2: for each commit that touched app.js, show what changed
For the commits above, pick the 3-5 most recent. For each, run:
!`git show --stat <COMMIT_SHA>`

Then check the diff:
!`git diff <COMMIT_SHA>~1..<COMMIT_SHA> -- js/app.js | head -100`

### Step 3: check for new symbols in CLAUDE.md
If a commit added a new function or major state object, grep for it in CLAUDE.md:
!`grep -n "initSeqRecall\|_renderQuizItem\|clQuizState\|seqState" CLAUDE.md || echo "Not found in docs"`

### Step 4: scan for undocumented CSS changes
Check if new CSS vars, disabled states, or theme changes appeared:
!`git diff <COMMIT_SHA>~1..<COMMIT_SHA> -- css/styles.css | grep "opacity\|--\|:disabled\|background"`

### Result
After running the above, report:
- **Commits to review:** [list of recent shas]
- **Changed symbols in app.js:** [list of new/modified functions or state]
- **What's documented in CLAUDE.md:** [what you found in step 3]
- **CSS gaps:** [theme, opacity, or disabled states not in Design System section]
- **Recommended updates:** [1-3 bullet points on what CLAUDE.md or skills need]

Then wait for the user to confirm updates.
