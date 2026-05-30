---
description: Orient to the ATIS Decoder. Use when the user asks about ATIS generation, the 7-field quiz, fuzzy matching tolerances, or atisState.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "const atisState\|generateATIS\|checkATIS\|playATIS\|stopATIS" js/app.js`

Read 30 lines around atisState and checkATIS to capture the state shape and fuzzy matching tolerances. Then wait for the user's question.
