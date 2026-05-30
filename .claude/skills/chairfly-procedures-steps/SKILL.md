---
description: Orient to Procedures step wiring and execution. Use when the user asks about step types (config/radio/choice), wireInteractive, procState, speech in procedures, or step rendering.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "const procState\|wireInteractive\|renderConfigStep\|renderRadioStep\|renderChoiceStep\|checkConfigStep\|checkProcRadio\|checkProcSpeech\|setProcRadioMode" js/app.js`

Read 25 lines around procState and wireInteractive. Then wait for the user's question.
