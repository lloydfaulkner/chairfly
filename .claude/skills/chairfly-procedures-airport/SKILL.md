---
description: Orient to Procedures airport lookup and builders. Use when the user asks about airport search, ICAO lookup, procedure builders, pattern altitude, or TPA calculation.
disable-model-invocation: true
allowed-tools: Read Grep
---

## Key symbols
!`grep -n "searchAirports\|lookupAirport\|buildPatternLanding\|buildNormalTakeoff\|buildSlowFlight\|buildPowerO" js/app.js`
!`grep -n "calcTPA" js/utils.js`
!`grep -n "^const AIRPORTS\|^const builders" js/app.js`

Read 25 lines around each result above, then wait for the user's question.
