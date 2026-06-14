---
description: Orient to the Phonetic Alphabet drill. Use when the user asks about the alpha drill, NATO phonetic flashcards, speech grading for phonetics, alphaState, gradeAlphaResponse, or PHONETIC_ALPHABET data.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "const alphaState\|initAlphaDrill\|startAlphaDrill\|stopAlphaDrill\|renderAlphaDrill\|gradeAlphaResponse\|_buildAlphaPool\|_finishAlphaDrill\|_nextAlphaQuestion" js/app.js`
!`grep -n "PHONETIC_ALPHABET\|PHONETIC_NUMBERS" js/data.js`
!`grep -n "gradeAlphaSequence\|_alphaMatchWord\|countPhoneticAttemptWords" js/alpha-grader.js`

Read 25 lines around alphaState and gradeAlphaSequence, then wait for the user's question.
