---
description: Orient to the V-Speeds drill. Use when the user asks about V-speeds flashcards, drill modes (Symbol/Speed/Both), pool logic, timer nudge, or vspeedState.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "const vspeedState\|_buildVspeedPool\|_buildVspeedReversePool\|initVspeedDrill\|renderVspeedDrill\|answerVspeed\|_nextVspeedQuestion" js/app.js`
!`grep -n "VSPEEDS_META" js/data.js`
!`grep -n "shouldNudgeVspeedTimer" js/utils.js`

Read 25 lines around vspeedState and VSPEEDS_META, then wait for the user's question.
