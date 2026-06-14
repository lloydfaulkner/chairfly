# ChairFly — Pilot Training PWA

## Project overview
A progressive web app for student and private pilots to practice
procedures, checklists, radio calls, ATIS decoding, and emergency
drills between flights. Built for mobile, works offline as a PWA.
Open source under MIT license.

## Owner context
- Student pilot, ~4-5 hours flight time
- Training at KUZA (Rock Hill / York County, SC — elev 666 ft MSL)
- Primary training aircraft: Cessna 172 (steam gauge)
- Also flies: Piper Cherokee 140
- Using CheckMate quick-reference cards as checklist source of truth

## Tech stack
- Vanilla HTML/CSS/JS — no framework, no build step required
- PWA with service worker for offline support
- Hosted on AWS S3 + CloudFront (HTTPS required for speech recognition)
- Deployed via GitHub Actions on every push to main
- No npm dependencies in the app itself

## File structure
```
chairfly/
├── index.html               # App shell, nav, view containers
├── chairfly-preview.html    # Static HTML preview (no JS) for sharing screenshots
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (offline caching)
├── package.json             # npm scripts — "test" runs all tests via node --test
├── generate-airports.js     # One-off script: fetches OurAirports CSV → js/airports.js
├── css/
│   └── styles.css           # All styles
├── js/
│   ├── data.js              # All static data (checklists, procedures,
│   │                        # radio scenarios, emergencies, phonetic alphabet, VSPEEDS_META)
│   ├── airports.js          # Generated airport database (~3800 US public-use airports)
│   ├── speech-grader.js     # normalizeSpoken, scoreSpeechCall (exported, unit tested)
│   ├── alpha-grader.js      # gradeAlphaSequence, countPhoneticAttemptWords (exported, unit tested)
│   ├── utils.js             # calcTPA, radioCallMatches, _firstSentence, shouldNudgeVspeedTimer (exported, unit tested)
│   └── app.js               # All application logic
├── tests/
│   ├── utils.test.js        # calcTPA, radioCallMatches, _firstSentence, airportCallName, shouldNudgeVspeedTimer
│   ├── speech-grader.test.js # scoreSpeechCall, normalizeSpoken
│   ├── alpha-grader.test.js  # gradeAlphaSequence, _alphaMatchWord
│   └── data-integrity.test.js # Structural checks on ALL_AIRCRAFT, RADIO_SCENARIOS, AIRPORTS, VSPEEDS_META
├── infra/                   # Terraform/Terragrunt — S3 + CloudFront + OIDC deploy role
│   ├── root.hcl
│   ├── modules/
│   │   ├── static-site/     # S3 bucket + CloudFront distribution
│   │   └── deploy-role/     # OIDC IAM role for GitHub Actions
│   └── live/prod/
│       ├── static-site/
│       └── deploy-role/
├── .github/
│   └── workflows/
│       └── deploy.yml       # GitHub Actions → S3 + CloudFront
└── CLAUDE.md                # This file
```

## Code style

Follows the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html) and
[Google HTML/CSS Style Guide](https://google.github.io/styleguide/htmlcssguide.html) for syntax and
formatting. The Design System section below covers visual and UI constraints (color, contrast,
scan-line behavior) that general style guides don't address — those rules take precedence over
any Google guide guidance where they conflict.

Key conventions in practice:
- `//` for explanatory comments, `/** */` for JSDoc only
- Single quotes for strings in JS; double quotes for HTML attributes
- `const` / `let` only — no `var`
- `===` not `==`
- Comments explain *why*, not *what* — if the name needs explanation, rename it

## Design system

### Theme
- Dark avionics aesthetic with scan-line overlay effect
- Cyan accent (#00c8ff), orange accent (#ff7a3d)
- Green (#00e887), Red (#ff4d4d), Warning (#ffcc00)
- Background: #0a0f1a, Panel: #0f1825, Panel2: #141f30
- Border: #243447

### CRITICAL CSS RULE — NEVER VIOLATE
**All backgrounds must use solid hex colors, never rgba() transparency.**
The body has a scan-line overlay (body::after) that makes transparent
backgrounds unreadable. This has caused repeated contrast issues.

✅ Correct: `background: #0a2030`
❌ Wrong:   `background: rgba(0,200,255,0.06)`

### Text contrast minimums
- Primary text: #eef6ff or #d4e8ff on dark backgrounds
- Secondary text: #9ab8d0 minimum — never lower
- Labels and metadata: #b8d4ea minimum
- DO NOT use #4a6278 for text — too dark, fails contrast

### Interactive elements
- All buttons, chips, nav items must have solid backgrounds (#111f30 or darker)
- `-webkit-tap-highlight-color: transparent` on ALL interactive elements (set globally on *)
- No `background: none` on elements that float over the scan-line background
- Buttons use #111f30 background with #2a4060 border as default state
- Disabled buttons (`:disabled`): `opacity: 0.35` — mutes the button visually without changing colors

## App structure

### Navigation
- Aircraft switcher (top bar): C172 Skyhawk | Cherokee 140
- Tab bar: Checklist | Radio | Procedures | Emergency
- URL hash scheme: `#[aircraft/]view[/sub1[/sub2]]`
  - Examples: `#radio/atis`, `#checklist/recall/runup`, `#cherokee140/emergency`
  - Procedures: `#procedures/ICAO/procId` (e.g. `#procedures/KUZA/pattern_landing`)
  - `updateHash()` writes the hash on every state change
  - `restoreNav()` parses hash on load and on `hashchange` event
  - `_restoringNav` flag suppresses hash writes during restore to prevent URL flicker

### Checklist tab
Two modes toggled by segmented control: **Reference** | **Sequence Recall**
- Segmented control uses solid #0d1520 background — NOT phase button style
- Phases: Preflight, Before Start, Engine Start, Runup, Before Landing
- Each item: action, value, note, why, tip, tipType, acronym, acronymDef, zone
- Info sheet (ⓘ button per item): Why this step | Memory tip | C172 panel SVG diagram
- Panel SVG highlights the relevant cockpit zone for each item

#### Reference mode (checklist quiz)
- Multiple choice: tap an item to open the question
- Questions are pre-generated per phase for consistency
- On answer: show correct/wrong status with explanation
- **Next › button** (if unanswered items remain): collapses current result, scrolls answered item to top, opens next item
- Skipped items are skipped and can be revisited
- **Review All button** appears once at least one item is answered — expands all results at once

#### Sequence Recall mode (procedure/drill)
Three-section bucket system with tap-to-select (no drag required):
- **Section 1 (Gate):** Multiple choice — pick the first action from 6 options (5 distractors + correct)
- **Section 2 (Free items):** Multi-select pool — select all non-sequenced items (don't care about order)
- **Section 3 (Ordered):** Drag or tap sequence — place items in correct order; wrong taps shake red and increment miss count
- **Check button:** Always visible, disabled (opacity 0.35) until all sections complete
- **Selection count:** "X / N selected" shown next to disabled Check button in muted text
- Results show correct (green) / wrong (red) with correct answer revealed
- Timer runs during sequence, displayed in format MM:SS

### Radio tab
- Two modes: Radio Calls | ATIS Decoder
- Radio Calls sub-modes: Word Chips | Speak It (speech recognition)
- Each scenario has:
  - words[]: correct call broken into chip-sized pieces
  - distractors[]: wrong chips with { text, why } — educational, not random
  - rule: { repeats: bool, why } — explains CTAF vs controlled field bookend rule
  - ideal: full ideal call text
  - note: format explanation shown after check
- Tap used chip to remove it (shows × badge, turns red on hover)
- Hint text: "tap a word to add · tap again to remove"
- On wrong: show Try Again + Show Ideal Call buttons — never auto-reveal answer
- Distractor feedback: explain which trap chips were used and why they're wrong
- ATIS Decoder: randomly generated ATIS, text-to-speech, 7-field extraction quiz
  - Fields: Info Code, Wind, Visibility, Ceiling, Temp/Dew, Altimeter, Active Runway
  - Fuzzy matching: wind ±10°/±2kts, altimeter ±0.02, visibility ±0.5SM
  - Full ATIS text revealed after grading

### Procedures tab
The tab has two modes toggled by a `cl-mode-toggle` at the top: **Procedures** and **V-Speeds**.

#### Procedures mode
- Airport lookup by ICAO — bundled database (~200 airports), no network needed
- Default airport: KUZA
- Pattern altitude: field elev + 1000, rounded to nearest 100 ft MSL
- Do NOT show pattern altitude on the airport result card (gives away the answer)
- Available procedures:
  - Normal Takeoff
  - Pattern Entry & Landing (11 steps)
  - Slow Flight
  - Power Off Stall
  - Power On Stall
- Step types:
  - config: cockpit sliders + chip selectors, Check Configuration button
  - radio: word chip builder with distractors (same mechanic as Radio tab)
  - choice: multiple choice — distractors are plausible real student mistakes
- Config steps:
  - Show accepted range in feedback (e.g. "accepted: 1650–1750 ft MSL")
  - On wrong: Try Again (re-enables controls, clears results) | Show Answers
  - Never reveal correct answers without user requesting Show Answers
- Radio steps: Try Again | Show Ideal Call on wrong
- Choice steps: Try Again | Show Answers on wrong
- Procedure title card has solid panel background — not floating on scan-line bg
- Step header: dark green background (#1a2a1a), bright green text (#7fff9a)

#### V-Speeds drill mode
Multiple-choice flashcard drill drawn from `VSPEEDS_META` in `data.js`.
- Three drill modes: **Symbol** (Vx → tap speed), **Speed** (74 KIAS → tap symbol), **Both** (random mix)
- Settings: reps (5/10/15, default 5), optional countdown timer (3s/5s/10s)
- Consecutive repeat prevention via `_lastKey` bag-swap
- Reverse mode deduplicates by value (`_buildVspeedReversePool`) to avoid ambiguous questions
- Both mode hides the label on forward cards to prevent info leakage between alternating questions
- Response time tracked per question (`_questionStart = Date.now()`); shown in review history
- Finish screen shows "Your Answers" review with response time per row
- `shouldNudgeVspeedTimer(history, score, timerEnabled)` (in `utils.js`) fires a timer suggestion
  when untimed, 75%+ of answered questions under 4 s, and 60%+ accuracy
- Kneeboard (light) theme — all CSS uses `var(--paper)`, `var(--ink)`, `var(--sky)` etc., never hardcoded dark hex

### Emergency tab
- Randomized C172 emergency scenarios
- Multiple choice — identify correct FIRST action from memory
- Shuffled options on each render
- Score tracking: correct / total drilled
- Feedback: explanation + the "why" behind the correct answer

## Aircraft data

### C172 Skyhawk (steam gauge)
- Vr: 52 KIAS, Vx: 59 KIAS, Vy: 71 KIAS
- Vfe: 87 KIAS (max flaps extended speed)
- Approach: 70 KIAS, Short final: 65 KIAS, Best glide: 65 KIAS
- Flap positions: 0° / 10° / 20° / 30°
- Standard pattern: 1000 ft AGL
- Runup RPM: 1700 (CheckMate card source of truth — NOT 1800)
- Carbureted engine — carb heat is a real procedural item
- Carb heat ON when reducing power (low power = carb ice risk)
- Carb heat OFF for takeoff and go-around (reduces power)

### Piper Cherokee 140
- Vr: 48 KIAS, Vx: 66 KIAS, Vy: 75 KIAS
- Approach: 70 KIAS, Short final: 59 KIAS
- Flap positions: 0° / 25° range
- Has electric fuel pump — must be ON for start/takeoff, OFF at cruise altitude
- Fuel injected variants — carb heat procedures differ from C172
- Key difference from C172: fuel pump steps in every checklist phase

## Data architecture

### ALL_AIRCRAFT object
Top-level keyed by aircraft ID ('c172', 'cherokee140').
Each aircraft: { name, label, speeds{}, checklists{}, emergencies[] }

### Checklists
Keyed by phase ID. Each item:
{ action, value, note, why, tip, tipType, acronym, acronymDef, zone }
zone maps to SVG element IDs in the C172 panel diagram for highlighting.
Available zones: sixpack, avionics, master, beacon, ignition, primer,
cb, throttle, mixture, carbheat, flaps, trim, fuel, pitot, oil,
static, controls, seats, tires

### Procedures
Built by functions that accept airport object { icao, name, elev, tpa }:
- buildPatternLanding(ap)
- buildNormalTakeoff(ap)
- buildSlowFlight(ap)
- buildPowerOffStall(ap)
- buildPowerOnStall(ap)

Routed via startProcedure(procId) with builders lookup object.
procState._lastProcId stores last procedure for "Fly Again" button.

### Airport database (AIRPORTS)
Format: { ICAO: [name, elevation_ft_msl, notes] }
~200 airports. Heavy coverage: Carolinas, Southeast, major US GA fields.
Key local airports: KUZA (666), KJQF (705), KSVH (968), KCLT (748),
KRDU (435), KGSO (925), KGMU (1048), KSPA (801)

### Radio scenarios (RADIO_SCENARIOS)
Array of scenario objects:
{ type, situation, data[], ideal, words[], distractors[], rule{}, note }
data[]: array of { label, value, gloss } for the info cards
distractors[]: array of { text, why } — 2-3 per scenario
rule: { repeats: bool, why: string }
words[]: chip strings; individual entries may carry `optional: true` — these
  show as yellow in speech grading and are excluded from the score denominator

CTAF calls bookend with airport name (repeats: true)
Controlled field calls do NOT repeat airport name (repeats: false)

## Known issues and rules to preserve

### Must preserve
- Scan-line overlay (body::after) is intentional — do not remove
- Aircraft switcher lives above the tab bar, not inside any tab
- KUZA is the default airport — auto-looked-up on page load
- DOMContentLoaded wraps all init calls at bottom of script
- wireInteractive() handles BOTH radio and choice step wiring in one function
  — do NOT split or override with _origWire pattern (caused iOS crash)

### Speech recognition
- Uses webkitSpeechRecognition (iOS Safari compatible)
- Requires HTTPS — works on CloudFront URL, NOT on file:// local
- Degrades gracefully with clear error message if unavailable
- Works in BOTH the Radio tab and Procedures tab radio steps
- `speechContext` ('radio' | 'proc') controls which DOM elements speech functions target
- `SPEECH_DOM` maps each context to its element IDs (mic-btn, label, status, output)
- `startSpeech()` / `stopSpeech()` are shared — set `speechContext` before calling
- `buildSpeechResultHTML(result, retryFn, revealFn)` — single source of truth for
  rendering speech results (score line, word highlights, Try Again / Show Ideal buttons).
  Both `checkSpeechCall()` (Radio tab) and `checkProcSpeech()` (Procedures tab) use it.
  Change the visual format here and it applies everywhere.
- Procedures: `setProcRadioMode('chips'|'speak')` toggles the mode; `wireInteractive()`
  resets to chips mode and restores speechContext='radio' on each new step

### Speech grading — scoreSpeechCall()
Grades spoken transcript against scenario `words[]` chips. Each chip is
split into individual keyWords and checked against normalized spoken words.

**normalize() pipeline** (applied to both spoken and keyWords):
1. Digit words: one→1, two→2, ..., nine→9, zero→0, niner→9
2. Teens: eleven→11, twelve→12, ..., nineteen→19
3. Tens: ten→10, twenty→20, ..., ninety→90
4. Tens+ones combine: "thirty 5" → "35"
5. "N thousand M hundred" → N*1000+M*100 ("three thousand five hundred" → 3500)
6. "N thousand" → N*1000
7. "N hundred" → N*100 ("thirty-five hundred" → 3500)

**Matching order** (first match wins):
1. Exact word match
2. Multi-digit keyWord (e.g. "3500"): digit sequence in spoken digit stream
3. Single-digit keyWord (e.g. "4" from tail number): digit inside a spoken
   multi-digit token — handles recognizer returning "4521" vs "four five two one"
4. Aircraft type alias: Cessna ↔ Skyhawk (both valid per AIM 4-2-4)
5. Prefix close match (first 3 chars)

**AIM 4-2-4 callsign variations — all should score 100%:**
- "Cessna Four Five Two One Golf" — standard
- "Skyhawk Four Five Two One Golf" — model name, equally valid
- "Cessna November Four Five Two One Golf" — N-prefix spoken; "November"
  is extra and ignored by the grader (not a keyWord)
- Abbreviated form ("Two One Golf") only valid after ATC establishes —
  not used in initial-contact scenarios, would score low intentionally

**Optional words:**
- Words with `optional: true` in words[] render as dim yellow (`.speech-word.optional`)
- Excluded from score denominator — silence on an optional word cannot hurt the grade
- Currently optional: "to"/"the" in VFR departure call; "landing" in pattern entry call

**Intentionally grades low:**
- "N4521G" as a raw alphanumeric — not phonetic, distractor card explains why

### iOS specific
- -webkit-tap-highlight-color: transparent on * selector (global)
- No rgba() backgrounds (scan-line issue)
- Tap events on word chips use delegated onclick on container, not
  individual addEventListener per chip (prevents duplicate listener bug)

### Word chip interaction
- Uses data-key attribute for tracking, not word text (handles duplicates)
- Radio tab: delegated onclick on #word-bank container
- Procedures tab: delegated onclick on #proc-word-bank container
- Both track builtCall[] and builtCallKeys[] in parallel arrays

## Deployment

### AWS
- S3 bucket: chairfly (us-east-1), static website hosting enabled
- CloudFront distribution with HTTPS, S3 as origin
- IAM user: chairfly-deploy
  - Policy: S3 PutObject/DeleteObject on bucket only
  - Policy: CloudFront CreateInvalidation only
- GitHub secrets needed: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
  AWS_S3_BUCKET, AWS_CLOUDFRONT_DISTRIBUTION_ID

### Service worker caching strategy
- App files (index.html, app.js, styles.css, sw.js, manifest.json): **network-first**
  — always fetches fresh when online, falls back to cache when offline
  — prevents the two-reload stale-asset problem that cache-first caused
- External fonts: cache-first (they never change)
- `sw.js` contains a `COMMIT_SHA` placeholder for the cache version key
  — `deploy.yml` replaces it with the first 8 chars of `GITHUB_SHA` before S3 sync
  — every push produces a unique cache key; do NOT hardcode a version string there

### GitHub Actions (deploy.yml)
Trigger: push to main
Steps: checkout → configure AWS credentials → replace COMMIT_SHA in sw.js → sync to S3 → invalidate CloudFront

## Upcoming features (not yet built)
- Weather go/no-go decision tool
- Weight & balance calculator  
- Airspace quiz (sectional literacy)
- Phonetic alphabet speed drill
- Post-flight debrief journal
- Check ride prep / ACS standards reference
- Go-around procedure
- Cherokee 140 full procedures (currently only C172 procedures exist)
- Steep turns procedure
- Cross-wind landing procedure

## Session tips for Claude Code
- Always run /clear between unrelated work sessions
- Use Plan Mode before touching more than 2-3 files
- Run /usage to monitor token consumption
- Run /compact if context gets large
- The single biggest token waster is regenerating wrong diffs —
  always review the plan before executing

### Test Generation Rules
* Always write tests in a clean, isolated context.
* Report exactly what you observe when running the test suite; do not assume a test passes.
* Do not mark a scenario as passed unless all assertions have been explicitly verified.
* If testing an E2E or complex flow, ensure mock states reset completely between test cases.