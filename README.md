# ChairFly

**Active procedure practice for student pilots — between flights, on your phone, offline.**

ChairFly is an open-source progressive web app (PWA) that drills the cognitive skills you use in the cockpit: radio calls, checklists from memory, standard procedures step-by-step, and emergency recall. It works offline and installs on your phone like a native app — on iOS, use **Share → Add to Home Screen**; on Android, tap **Install app** in the browser menu.

---

## What you do in ChairFly

This is not a reading app. Every screen requires you to produce something.

- **Checklists** — reference mode shows every item with the *why* behind it and a cockpit diagram. Sequence Recall mode hides the answers and makes you reconstruct the checklist from memory using drag-and-drop or tap.
- **Radio Calls** — tap word chips in the correct order to build a complete CTAF or tower call. Distractors (wrong chips) are included with explanations of why they're wrong. Or switch to **Speak It** mode and say the call aloud — your mic is graded word-by-word.
- **ATIS Decoder** — listen to a generated ATIS broadcast and extract all seven fields (info code, wind, visibility, ceiling, temp/dew, altimeter, active runway). Fuzzy matching handles real-world variations.
- **Procedures** — fly a procedure (pattern entry, normal takeoff, slow flight, stall) step by step. Config steps have cockpit sliders you set. Radio steps use the same chip builder. Choice steps are multiple-choice with plausible student-mistake distractors.
- **Emergencies** — randomized C172 emergency scenarios. Identify the correct *first* action from memory. Scored over your session.

---

## Why ChairFly?

Use Sporty's or King Schools to build knowledge. Use Infinite Flight or a desktop sim to practice hand-flying. ChairFly is for the gaps in between — the five minutes in a waiting room, the grocery store line, the night before a lesson when you want to run the checklist sequence one more time without booting up a full sim.

The specific gap it fills: *producing* the right output under a little pressure, not just recognizing it. You have to build the radio call from scratch, recall the checklist sequence from memory, and identify the emergency first action before the answer appears. That kind of active recall is hard to squeeze into a sim session and not really the point of a ground school app — but it's exactly what erodes between lessons.

---

## Aircraft supported

- **Cessna 172 Skyhawk** (steam gauge) — full checklists, procedures, emergencies
- **Piper Cherokee 140** — checklists (procedures coming)

Speeds, flap positions, and checklist items are specific to each aircraft. The C172 data is sourced from CheckMate quick-reference cards.

---

## Tech stack

Vanilla HTML/CSS/JS — no framework, no build step, no npm. The entire app is three files plus a service worker.

```
index.html   — app shell and markup
css/styles.css — all styles (dark avionics theme)
js/data.js   — all static data (checklists, scenarios, airports, procedures)
js/app.js    — all application logic
sw.js        — service worker (offline, network-first for app files)
manifest.json — PWA manifest (installable on home screen)
```

Deployable anywhere that serves static files over HTTPS — Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3, etc. Includes a GitHub Actions workflow for automated deploys on push to `main`.

---

## Self-hosting / local use

No build step required. The easiest way is a local server extension in VS Code — search **"Live Server"** in the Extensions marketplace. The one I use is **[Live Server (Five Server)](https://marketplace.visualstudio.com/items?itemName=yandeu.five-server)**, the actively maintained fork. Right-click `index.html` and choose "Open with Live Server." Python and Node one-liners work too:

```bash
# Python
python -m http.server 8080

# Node
npx serve .
```

### Speech recognition (Speak It mode)

Speech requires HTTPS — it won't work on a plain `http://localhost` server. Beyond that, it depends on the device:

| Scenario | Works? |
|---|---|
| iOS Safari, hosted (HTTPS) | ✅ online and offline |
| iOS home screen (Add to Home Screen) | ✅ online and offline |
| Android Chrome, hosted (HTTPS) | ✅ online only |
| Android home screen | ✅ online only |
| Any browser, `http://localhost` | ❌ HTTPS required |

iOS processes speech on-device, so it works offline. Android sends audio to Google's servers, so it needs a connection — the app will show a clear error message if speech is unavailable.

---

## Contributing

Issues and PRs welcome. A few things to know before editing:

- **No rgba() backgrounds.** The body has a scan-line overlay that makes transparent backgrounds unreadable. Use solid hex colors only (e.g. `#0a2030`, not `rgba(0,200,255,0.06)`).
- **All data lives in `js/data.js`** — checklists, radio scenarios, airports, procedure builders.
- **All logic lives in `js/app.js`** — no component split, intentionally.
- See [CLAUDE.md](CLAUDE.md) for full architecture notes, design rules, and known constraints.

---

## License

MIT — free to use, fork, and adapt.

---

## About

Built by a returning pilot, for student pilots.

Flying was my original career path. I earned my PPL about 30 years ago, then life took a turn and yadda yadda I got into software. Now I'm student piloting again, starting from scratch, learning in an age without ADF and paper on kneeboards.

I'm a software architect by day. This started as a vibe-coding experiment — I couldn't find anything for drilling radio calls and procedures in isolation, outside of an actual flight or full sim session. I really needed the practice; somewhere past the gauges, the checklists, the radio calls, and the procedures is a really nice view that I hope to enjoy someday.

ChairFly was built almost entirely with Claude Code and Claude Design and hosted as cheaply as possible. It helps my training and is genuinely fun to work on.

I almost know how much I don't know, which makes me extremely qualified to build pilot training software.
