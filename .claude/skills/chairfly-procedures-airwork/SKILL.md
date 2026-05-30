---
description: Orient to airwork procedures and step execution. Use when the user asks about slow flight, stalls, step types (config/radio/choice), wireInteractive, or step rendering.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols — airwork builders
!`grep -n "buildSlowFlight\|buildPowerOffStall\|buildPowerOnStall" js/app.js`

## Key symbols — step execution
!`grep -n "wireInteractive\|renderConfigStep\|renderRadioStep\|renderChoiceStep\|checkConfigStep\|checkProcRadio\|checkProcSpeech\|setProcRadioMode" js/app.js`

Read 25 lines around the symbols most relevant to the user's question, then wait for it.
