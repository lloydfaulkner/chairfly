---
description: Orient to the Emergency tab. Use when the user asks about emergency scenarios, scoring, or option shuffling.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "initEmergency\|renderEmergency\|newEmergency\|answerEmergency\|renderEmergencyCards" js/app.js`
!`grep -n "emergencies" js/data.js`

Read 25 lines around each result above, then wait for the user's question.
