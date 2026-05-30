---
description: Orient to Radio Calls. Use when the user asks about word chips, radio scenarios, speech grading, RADIO_SCENARIOS data shape, or optional words.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "renderRadioScenario\|checkRadioCall\|addRadioWord\|removeRadioWord\|buildSpeechResultHTML\|checkSpeechCall" js/app.js`
!`grep -n "^const RADIO_SCENARIOS" js/data.js`
!`grep -n "scoreSpeechCall\|normalizeSpoken" js/speech-grader.js`

Read 25 lines around RADIO_SCENARIOS and scoreSpeechCall, then wait for the user's question.
