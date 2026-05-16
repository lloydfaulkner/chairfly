let CHECKLISTS = ALL_AIRCRAFT.c172.checklists;
let EMERGENCIES = ALL_AIRCRAFT.c172.emergencies;
let currentAircraft = 'c172';


let state = {
  checklist: { phase: 'preflight', completed: {} },
  radio: { scenarioIdx: 0, builtCall: [], usedWords: new Set() },
  emergency: { current: 0, answered: false, correct: 0, total: 0 }
};

function switchAircraft(key, btn) {
  if (key === currentAircraft) return;
  currentAircraft = key;
  const ac = ALL_AIRCRAFT[key];
  CHECKLISTS = ac.checklists;
  EMERGENCIES = ac.emergencies;

  // Update aircraft buttons
  document.querySelectorAll('.aircraft-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Update section label
  document.getElementById('cl-section-label').textContent = `// ${ac.name} Checklist Trainer`;

  // Reset and reinitialize all tabs
  state.checklist = { phase: Object.keys(CHECKLISTS)[0], completed: {} };
  state.emergency = { current: 0, answered: false, correct: 0, total: 0 };

  initChecklist();
  initEmergency();

  // Reset sequence recall if active
  if (document.getElementById('cl-recall-mode').style.display !== 'none') {
    initSeqRecall();
  }

  // Reset procedure airport to trigger rebuild with new aircraft
  procState.currentProc = null;
  showProcScreen('proc-screen-setup');
}

function switchView(name, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  btn.classList.add('active');
}

// ── CHECKLIST ──
function initChecklist() {
  const phases = Object.keys(CHECKLISTS);
  document.getElementById('phase-selector').innerHTML = phases.map(p =>
    `<button class="phase-btn ${p === state.checklist.phase ? 'active' : ''}" onclick="selectPhase('${p}')">${CHECKLISTS[p].label}</button>`
  ).join('');
  renderChecklist();
}

function selectPhase(phase) {
  state.checklist.phase = phase;
  document.querySelectorAll('.phase-btn').forEach((b, i) => {
    b.classList.toggle('active', Object.keys(CHECKLISTS)[i] === phase);
  });
  document.getElementById('complete-banner').classList.remove('show');
  renderChecklist();
}

function renderChecklist() {
  const phase = state.checklist.phase;
  const list = CHECKLISTS[phase];
  const completed = state.checklist.completed[phase] || new Set();
  const doneCount = completed.size;
  const total = list.items.length;
  document.getElementById('cl-title').textContent = list.label;
  document.getElementById('cl-progress').textContent = `${doneCount} / ${total}`;
  document.getElementById('cl-progress-fill').style.width = `${(doneCount / total) * 100}%`;
  const currentIdx = list.items.findIndex((_, i) => !completed.has(i));
  const ul = document.getElementById('checklist-items');
  ul.innerHTML = list.items.map((item, i) => {
    const done = completed.has(i);
    const current = i === currentIdx;
    return `<li class="checklist-item ${done ? 'done' : ''} ${current ? 'current' : ''}">
      <div class="item-check" onclick="toggleItem(${i})">
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="#00e887" stroke-width="2" stroke-linecap="round"/></svg>
      </div>
      <div class="item-content" onclick="toggleItem(${i})">
        <div class="item-action">${item.action}</div>
        <div class="item-value">${item.value}</div>
        ${item.note ? `<div class="item-note">${item.note}</div>` : ''}
      </div>
      <button class="item-info-btn" data-phase="${phase}" data-idx="${i}" title="Why & Show Me">ⓘ</button>
    </li>`;
  }).join('');

  // Wire info buttons
  ul.querySelectorAll('.item-info-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openInfo(btn.dataset.phase, parseInt(btn.dataset.idx));
    });
  });
}

function toggleItem(idx) {
  const phase = state.checklist.phase;
  if (!state.checklist.completed[phase]) state.checklist.completed[phase] = new Set();
  const completed = state.checklist.completed[phase];
  if (completed.has(idx)) completed.delete(idx); else completed.add(idx);
  const allDone = completed.size === CHECKLISTS[phase].items.length;
  const banner = document.getElementById('complete-banner');
  if (allDone) {
    banner.classList.add('show');
    document.getElementById('complete-time').textContent = `${CHECKLISTS[phase].label} complete — ${new Date().toLocaleTimeString()}`;
  } else {
    banner.classList.remove('show');
  }
  renderChecklist();
}

function resetChecklist() {
  state.checklist.completed[state.checklist.phase] = new Set();
  document.getElementById('complete-banner').classList.remove('show');
  renderChecklist();
}

function nextPhase() {
  const phases = Object.keys(CHECKLISTS);
  const idx = phases.indexOf(state.checklist.phase);
  selectPhase(phases[(idx + 1) % phases.length]);
}

function openInfo(phase, idx) {
  const item = CHECKLISTS[phase].items[idx];
  document.getElementById('info-action').textContent = item.action;
  document.getElementById('info-value-badge').textContent = item.value;
  document.getElementById('info-why').textContent = item.why || item.note || '';

  // Tip section
  const tipSection = document.getElementById('info-tip-section');
  const tipContent = document.getElementById('info-tip-content');
  if (item.tip) {
    tipSection.style.display = '';
    if (item.tipType === 'acronym' && item.acronym) {
      tipContent.innerHTML = `
        <div class="info-acronym">
          <div class="info-acronym-word">${item.acronym}</div>
          <div class="info-acronym-def">${item.acronymDef}</div>
        </div>
        <div class="info-tip" style="margin-top:10px">
          <span class="info-tip-icon">💡</span>
          <span>${item.tip}</span>
        </div>`;
    } else {
      tipContent.innerHTML = `<div class="info-tip"><span class="info-tip-icon">💡</span><span>${item.tip}</span></div>`;
    }
  } else {
    tipSection.style.display = 'none';
  }

  // Highlight panel zone
  document.querySelectorAll('.panel-zone').forEach(z => z.classList.remove('highlight'));
  if (item.zone) {
    const el = document.getElementById('zone-' + item.zone);
    if (el) el.classList.add('highlight');
  }

  document.getElementById('info-sheet').classList.add('open');
  document.getElementById('info-overlay').classList.add('open');
}

function closeInfo() {
  document.getElementById('info-sheet').classList.remove('open');
  document.getElementById('info-overlay').classList.remove('open');
}

// ── RADIO ──
function initRadio() {
  state.radio.scenarioIdx = Math.floor(Math.random() * RADIO_SCENARIOS.length);
  renderRadioScenario();
}

function renderRadioScenario() {
  const s = RADIO_SCENARIOS[state.radio.scenarioIdx];
  state.radio.builtCall = [];
  state.radio.usedWords = new Set();
  document.getElementById('scenario-type').textContent = s.type;
  document.getElementById('scenario-text').textContent = s.situation;

  // Rule badge — collapsed by default
  const ruleEl = document.getElementById('scenario-rule');
  if (s.rule) {
    ruleEl.innerHTML = `
      <button class="hint-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('show')">▸ Hint</button>
      <div class="hint-content">
        <span class="rule-badge ${s.rule.repeats ? 'repeats' : 'no-repeats'}">
          ${s.rule.repeats ? '↩ Ends with airport name' : '✕ Does not repeat airport name'}
        </span>
        <span class="rule-why">${s.rule.why}</span>
      </div>`;
  } else {
    ruleEl.innerHTML = '';
  }

  // Render data cards with optional gloss icons
  const dataDiv = document.getElementById('scenario-data');
  dataDiv.innerHTML = s.data.map(d => {
    const hasGloss = d.gloss && GLOSSARY[d.gloss];
    return `<div class="data-item ${hasGloss ? 'has-gloss' : ''}" ${hasGloss ? `data-gloss="${d.gloss}"` : ''}>
      <div class="data-label">
        ${d.label}
        ${hasGloss ? '<i class="gloss-icon">i</i>' : ''}
      </div>
      <div class="data-value">${d.value}</div>
    </div>`;
  }).join('');

  // Wire up gloss taps
  dataDiv.querySelectorAll('.has-gloss').forEach(el => {
    el.addEventListener('click', () => openGloss(el.dataset.gloss));
  });

  document.getElementById('radio-output').innerHTML = '<span class="placeholder">Tap words below to build your radio call...</span>';
  document.getElementById('radio-feedback').classList.remove('show');
  const allChips = [
    ...s.words.map(w => ({ text: w, distractor: false })),
    ...(s.distractors || []).map(d => ({ text: d.text, distractor: true, why: d.why }))
  ].sort(() => Math.random() - 0.5);

  const wb = document.getElementById('word-bank');
  wb.innerHTML = allChips.map((chip, i) =>
    `<span class="word-chip" data-key="${i}" data-distractor="${chip.distractor}" data-why="${(chip.why||'').replace(/"/g,'&quot;')}" data-word="${chip.text.replace(/"/g,'&quot;')}">${chip.text}</span>`
  ).join('');

  wb.onclick = (e) => {
    const el = e.target.closest('.word-chip');
    if (!el) return;
    const key = el.dataset.key;
    if (el.classList.contains('used')) {
      // Remove by key from builtCall
      const idx = state.radio.builtCall.findIndex((_, i) => state.radio.builtCallKeys[i] === key);
      if (idx !== -1) {
        state.radio.builtCall.splice(idx, 1);
        state.radio.builtCallKeys.splice(idx, 1);
      }
      el.classList.remove('used');
    } else {
      el.classList.add('used');
      state.radio.builtCall.push(el.dataset.word);
      if (!state.radio.builtCallKeys) state.radio.builtCallKeys = [];
      state.radio.builtCallKeys.push(key);
    }
    updateRadioOutput();
  };
}

function openGloss(key) {
  const g = GLOSSARY[key];
  if (!g) return;
  document.getElementById('gloss-term').textContent = g.term;
  document.getElementById('gloss-value').textContent = key;
  document.getElementById('gloss-def').textContent = g.def;
  document.getElementById('gloss-sheet').classList.add('open');
  document.getElementById('gloss-overlay').classList.add('open');
}

function closeGloss() {
  document.getElementById('gloss-sheet').classList.remove('open');
  document.getElementById('gloss-overlay').classList.remove('open');
}

function addWord(el, word) {
  // Legacy — Radio tab now uses delegated handler. Kept for safety.
  if (el.classList.contains('used')) {
    const key = el.dataset.key;
    const idx = state.radio.builtCallKeys
      ? state.radio.builtCallKeys.findIndex((k, i) => k === key)
      : state.radio.builtCall.indexOf(word);
    if (idx !== -1) {
      state.radio.builtCall.splice(idx, 1);
      if (state.radio.builtCallKeys) state.radio.builtCallKeys.splice(idx, 1);
    }
    el.classList.remove('used');
  } else {
    el.classList.add('used');
    state.radio.builtCall.push(word);
    if (!state.radio.builtCallKeys) state.radio.builtCallKeys = [];
    state.radio.builtCallKeys.push(el.dataset.key);
  }
  updateRadioOutput();
}

function updateRadioOutput() {
  const out = document.getElementById('radio-output');
  out.innerHTML = state.radio.builtCall.length === 0
    ? '<span class="placeholder">Tap words below to build your radio call...</span>'
    : state.radio.builtCall.join(', ') + '.';
}

function clearRadioCall() {
  state.radio.builtCall = [];
  state.radio.builtCallKeys = [];
  document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('used'));
  updateRadioOutput();
  document.getElementById('radio-feedback').classList.remove('show');
}

function radioCallMatches(builtCall, step) {
  const allAccepted = [step.words, ...(step.acceptedVariants || [])];
  return allAccepted.some(v => builtCall.join(',') === v.join(','));
}

function checkRadioCall() {
  const s = RADIO_SCENARIOS[state.radio.scenarioIdx];
  const isCorrect = radioCallMatches(state.radio.builtCall, s);

  const usedDistractors = state.radio.builtCall
    .map(w => (s.distractors || []).find(d => d.text === w))
    .filter(Boolean);

  const fb = document.getElementById('radio-feedback');
  fb.classList.add('show');
  document.getElementById('feedback-header').className = 'feedback-header ' + (isCorrect ? 'correct' : 'incorrect');

  if (isCorrect) {
    document.getElementById('feedback-header').textContent = '✓ Correct sequence';
    document.getElementById('feedback-ideal').textContent = s.ideal;
    let noteText = s.note;
    if (usedDistractors.length > 0) {
      noteText += '\n\n⚠️ Trap chips you avoided — good:\n' +
        usedDistractors.map(d => `• "${d.text}" — ${d.why}`).join('\n');
    }
    document.getElementById('feedback-note').textContent = noteText;
  } else {
    document.getElementById('feedback-header').textContent = '✗ Not quite';
    document.getElementById('feedback-ideal').textContent = '';

    let noteHtml = '';
    if (usedDistractors.length > 0) {
      noteHtml += '⚠️ Trap chips you included:<br>' +
        usedDistractors.map(d => `• "${d.text}" — ${d.why}`).join('<br>') + '<br><br>';
    }
    noteHtml += `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn btn-sm" onclick="retryRadioCall()">↩ Try Again</button>
      <button class="btn btn-sm" onclick="revealRadioCall()">Show Ideal Call</button>
    </div>`;
    document.getElementById('feedback-note').innerHTML = noteHtml;
  }
}

function retryRadioCall() {
  state.radio.builtCall = [];
  state.radio.builtCallKeys = [];
  document.querySelectorAll('.word-chip').forEach(c => {
    c.classList.remove('used');
  });
  updateRadioOutput();
  document.getElementById('radio-feedback').classList.remove('show');
}

function revealRadioCall() {
  const s = RADIO_SCENARIOS[state.radio.scenarioIdx];
  document.getElementById('feedback-header').textContent = '✗ Ideal call';
  document.getElementById('feedback-ideal').textContent = s.ideal;
  document.getElementById('feedback-note').textContent = s.note;
}

function newRadioScenario() {
  const prev = state.radio.scenarioIdx;
  let next;
  do { next = Math.floor(Math.random() * RADIO_SCENARIOS.length); } while (next === prev && RADIO_SCENARIOS.length > 1);
  state.radio.scenarioIdx = next;
  renderRadioScenario();
}

// ── EMERGENCY ──
function initEmergency() {
  state.emergency.current = Math.floor(Math.random() * EMERGENCIES.length);
  renderEmergency();
}

function renderEmergency() {
  const em = EMERGENCIES[state.emergency.current];
  state.emergency.answered = false;
  document.getElementById('em-icon').textContent = em.icon;
  document.getElementById('em-title').textContent = em.title;
  document.getElementById('em-situation').textContent = em.situation;
  document.getElementById('em-feedback').classList.remove('show');
  const shuffled = em.options.map((o, i) => ({ text: o, origIdx: i })).sort(() => Math.random() - 0.5);
  document.getElementById('recall-items').innerHTML = shuffled.map((o, i) =>
    `<li class="recall-item" onclick="answerEmergency(${o.origIdx}, this)">
      <span class="recall-num">${String.fromCharCode(65 + i)}</span>${o.text}
    </li>`
  ).join('');
  document.getElementById('em-correct').textContent = state.emergency.correct;
  document.getElementById('em-total').textContent = state.emergency.total;
}

function answerEmergency(optionIdx, el) {
  if (state.emergency.answered) return;
  state.emergency.answered = true;
  state.emergency.total++;
  const em = EMERGENCIES[state.emergency.current];
  const isCorrect = optionIdx === em.correct;
  if (isCorrect) state.emergency.correct++;
  el.classList.add(isCorrect ? 'selected-correct' : 'selected-wrong');
  if (!isCorrect) {
    document.querySelectorAll('.recall-item').forEach(item => {
      if (item.textContent.trim().slice(1).trim() === em.options[em.correct]) item.classList.add('reveal-correct');
    });
  }
  const fb = document.getElementById('em-feedback');
  fb.classList.add('show');
  const hdr = document.getElementById('em-feedback-header');
  hdr.className = 'feedback-header ' + (isCorrect ? 'correct' : 'incorrect');
  hdr.textContent = isCorrect ? '✓ Correct' : '✗ Incorrect';
  document.getElementById('em-feedback-ideal').textContent = em.explanation;
  document.getElementById('em-feedback-note').textContent = em.why;
  document.getElementById('em-correct').textContent = state.emergency.correct;
  document.getElementById('em-total').textContent = state.emergency.total;
}

function newEmergency() {
  const prev = state.emergency.current;
  let next;
  do { next = Math.floor(Math.random() * EMERGENCIES.length); } while (next === prev && EMERGENCIES.length > 1);
  state.emergency.current = next;
  renderEmergency();
}

// ── PROCEDURES ──

const procState = {
  airport: { icao: '', name: '', elev: 0, tpa: 1000 },
  currentProc: null,
  currentStep: 0,
  answered: false
};

// ── AIRPORT DATABASE (bundled — works offline & file://) ──
// Format: ICAO: [name, elevation_ft_msl, notes]
// Carolinas/Southeast heavily populated; national GA coverage included

function lookupAirport() {
  const icao = document.getElementById('proc-icao').value.trim().toUpperCase();
  if (icao.length < 3) return;
  const result = document.getElementById('proc-airport-result');
  const manual = document.getElementById('proc-manual-fields');

  const ap = AIRPORTS[icao];
  if (ap) {
    const [name, elev, notes] = ap;
    const tpa = Math.round((elev + 1000) / 100) * 100;
    procState.airport = { icao, name, elev, tpa };
    result.innerHTML = `
      <div class="proc-airport-result">
        <div class="proc-airport-name">${name}</div>
        <div class="proc-airport-meta">${icao} · Elev ${elev} ft MSL${notes ? ' · ' + notes : ''}</div>
      </div>`;
    manual.style.display = 'none';
  } else {
    result.innerHTML = `<div class="proc-airport-err">⚠️ "${icao}" not in database — enter values below.</div>`;
    manual.style.display = 'block';
    procState.airport = { icao, name: icao, elev: 0, tpa: 1000 };
    document.getElementById('proc-elev').focus();
  }
}

function updateManualValues() {
  const elev = parseInt(document.getElementById('proc-elev').value) || 0;
  const agl = parseInt(document.getElementById('proc-tpa').value) || 1000;
  procState.airport.elev = elev;
  procState.airport.tpa = Math.round((elev + agl) / 100) * 100;
  procState.airport.name = procState.airport.icao || 'Your Airport';
}

// ── PROCEDURE DEFINITIONS ──
// Step types:
//   config  — cockpit panel control sliders/chips
//   radio   — word-chip call builder
//   choice  — multiple choice (knowledge/judgment only)
//   order   — drag-to-order (coming soon)

function buildPatternLanding(ap) {
  const tpa = ap.tpa || (ap.elev + 1000) || 1000;
  const elev = ap.elev || 0;
  const tpaMSL = tpa;
  const icao = ap.icao || 'KXXX';
  const rwy = '27';

  // Pull speeds from current aircraft
  const spd = ALL_AIRCRAFT[currentAircraft].speeds;
  const vfe = spd.vfe;
  const approach = spd.approach;
  const shortFinal = spd.shortFinal;
  const vy = spd.vy;
  const bestGlide = spd.bestGlide;
  const acName = ALL_AIRCRAFT[currentAircraft].label;

  // Aircraft-specific config differences
  const isCherokee = currentAircraft === 'cherokee140';
  const fuelLabel = isCherokee ? 'Fuel Selector (Proper Tank)' : 'Fuel Selector (BOTH)';
  const fuelCorrect = isCherokee ? 'PROPER TANK' : 'BOTH';
  const fuelOptions = isCherokee ? ['LEFT', 'PROPER TANK', 'RIGHT', 'OFF'] : ['LEFT', 'BOTH', 'RIGHT', 'OFF'];
  const fuelCorrectLabel = isCherokee ? 'Proper (fuller) tank — Cherokee has no BOTH position' : 'BOTH — draws from both tanks simultaneously';
  const fuelWrongLabel = isCherokee ? 'Select the fuller tank. Cherokee has no BOTH — must choose L or R.' : 'Select BOTH for maximum fuel availability and go-around power.';
  const carbHeatLabel = isCherokee ? 'Carb Heat' : 'Carb Heat';
  const hasFuelPump = isCherokee;
  const baseFlaps = isCherokee ? '25°' : '20°';
  const finalFlaps = isCherokee ? '25°' : '30°';
  const finalFlapsOptions = isCherokee ? ['0°', '10°', '25°', '40°'] : ['0°', '10°', '20°', '30°'];
  const baseFlapsOptions = isCherokee ? ['0°', '10°', '25°', '40°'] : ['0°', '10°', '20°', '30°'];
  const downwindSpeed = isCherokee ? 100 : 90;
  const abeamPower = isCherokee ? 1500 : 1500;
  const abeamSpeed = isCherokee ? 90 : 80;
  const baseSpeed = isCherokee ? 80 : 75;

  return {
    title: `Pattern Entry & Landing — ${acName}`,
    steps: [

      // ── 1. ALTITUDE — config
      {
        type: 'config',
        phase: 'Inbound / Setup',
        prompt: 'Set your target altitude for entering the downwind leg.',
        context: `Field elevation at ${ap.name || icao} is ${elev} ft MSL.`,
        controls: [
          {
            id: 'alt', label: 'Altitude', type: 'slider',
            min: Math.round((elev + 300) / 100) * 100,
            max: Math.round((elev + 2000) / 100) * 100,
            step: 50,
            default: Math.round((elev + 600) / 100) * 100,
            unit: 'ft MSL',
            correct: tpaMSL,
            tolerance: 50,
            correctLabel: `${icao} pattern is ${tpaMSL} ft MSL — standard 1,000 ft AGL above the ${elev} ft field elevation`,
            wrongLabel: `${icao} pattern altitude is ${tpaMSL} ft MSL (field elev ${elev} + 1,000 AGL). Arrive established before turning downwind.`,
          }
        ],
        feedback: 'Standard traffic pattern altitude is 1,000 ft AGL — always add that to field elevation to get your MSL target. Arrive at pattern altitude before entering downwind; being high or low disrupts your timing and sight picture for the whole approach.',
        tip: { title: 'Pattern entry', text: 'Enter the pattern at 45° to the downwind leg, abeam midfield. This lets you see traffic already in the pattern — the FAA-recommended entry. Don\'t barrel straight in to the base or final legs.' }
      },

      // ── 2. DOWNWIND RADIO — radio
      {
        type: 'radio',
        phase: 'Downwind — Radio',
        prompt: 'Build your downwind position call.',
        context: `Uncontrolled field (CTAF). You're entering left downwind for runway ${rwy}. Announce so other traffic can sequence.`,
        words: [`${icao} traffic`, 'Skyhawk Four Five Two One Golf', `entering left downwind runway ${rwy}`, icao],
        ideal: `${icao} traffic, Skyhawk Four Five Two One Golf, entering left downwind runway ${rwy}, ${icao}.`,
        distractors: [
          { text: `${icao} tower`, why: 'Uncontrolled fields have no tower. Use "traffic" to address all aircraft on the CTAF frequency.' },
          { text: 'any traffic please advise', why: 'Non-standard phraseology — discouraged by the FAA. It clutters the frequency without adding useful information.' },
          { text: 'over', why: '"Over" is not used in aviation radio calls. It\'s a civilian/military misconception — just say what you need to say and release the mic.' },
        ],
        feedback: 'Five pieces every CTAF call: airport + "traffic" → who you are → where you are + runway → airport name again. The bookend airport name confirms other pilots are on the right frequency.',
        tip: { title: 'Every pattern leg', text: `Make a call on downwind, base, and final. At controlled fields, tower handles sequencing — but at ${icao} you\'re all each other has.` }
      },

      // ── 3. GUMPS — choice (knowledge, no cheating possible — all plausible)
      {
        type: 'choice',
        phase: 'Downwind — GUMPS',
        prompt: 'On downwind abeam the numbers, you run GUMPS. Which item is NOT part of the check?',
        context: 'GUMPS is a pre-landing flow for GA pilots. One of these does not belong.',
        options: [
          { text: 'Primer — in and locked', correct: true,  why: 'Primer is a START flow item, not GUMPS. GUMPS = Gas · Undercarriage · Mixture · Prop · Seatbelts.' },
          { text: 'Gas — fuel selector BOTH', correct: false, why: '' },
          { text: 'Mixture — rich', correct: false, why: '' },
          { text: 'Seatbelts — secure', correct: false, why: '' },
        ],
        feedback: 'GUMPS = Gas (BOTH) · Undercarriage (down/confirmed) · Mixture (rich) · Prop (full forward) · Seatbelts (secure). Primer is a start-up item, not a landing flow item.',
        tip: { title: 'C172 GUMPS in practice', text: 'On a fixed-gear fixed-pitch C172, Undercarriage and Prop are non-events — you still say them to build the habit for complex aircraft later. Run it every downwind, every time, out loud.' }
      },

      // ── 4. ABEAM NUMBERS CONFIG — config (the main event)
      {
        type: 'config',
        phase: 'Downwind — Abeam the Numbers',
        prompt: 'Set up the aircraft abeam the runway threshold to begin descent.',
        context: `You're at pattern altitude, numbers at your 4 o'clock. Configure for descent.`,
        controls: [
          {
            id: 'power', label: 'Power', type: 'slider',
            min: 600, max: 2300, step: 100,
            default: 2100,
            unit: 'RPM',
            correct: abeamPower,
            tolerance: 100,
            correctLabel: `~${abeamPower} RPM — reduces speed below Vfe so flaps can be extended`,
            wrongLabel: `Target ~${abeamPower} RPM abeam the numbers. Too high keeps you fast; idle descends too steep.`,
          },
          {
            id: 'flaps', label: 'Flaps', type: 'chips',
            options: baseFlapsOptions,
            default: '0°',
            correct: '10°',
            correctLabel: `10° — first notch once below ${vfe} KIAS (Vfe)`,
            wrongLabel: `Flaps 10° abeam the numbers, after speed is below ${vfe} KIAS. Not full flaps yet — that's for final.`,
          },
          {
            id: 'speed', label: 'Target Airspeed', type: 'slider',
            min: 55, max: 120, step: 5,
            default: downwindSpeed + 10,
            unit: 'KIAS',
            correct: abeamSpeed,
            tolerance: 5,
            correctLabel: `~${abeamSpeed} KIAS — stabilized after first flap extension, trimmed`,
            wrongLabel: `Target ~${abeamSpeed} KIAS after flaps 10°. Trim to hold it — don't hold back pressure all the way around.`,
          },
          {
            id: 'carbheat', label: 'Carb Heat', type: 'chips',
            options: ['OFF', 'ON'],
            default: 'OFF',
            correct: 'ON',
            correctLabel: 'ON — reduced power = susceptibility to carb ice',
            wrongLabel: 'Apply carb heat when reducing power on approach. Low power settings are when carb ice most commonly forms.',
          },
          ...(hasFuelPump ? [{
            id: 'fuelpump', label: 'Fuel Pump', type: 'chips',
            options: ['OFF', 'ON'],
            default: 'OFF',
            correct: 'ON',
            correctLabel: 'ON — electric pump provides backup fuel pressure for approach and go-around',
            wrongLabel: 'Fuel pump ON for approach. Provides backup pressure if the engine-driven pump falters at low power.',
          }] : []),
        ],
        feedback: `Abeam sequence: power to ~${abeamPower} → hold altitude, let speed bleed → below ${vfe} KIAS add flaps 10° → trim for ${abeamSpeed} KIAS → carb heat on${hasFuelPump ? ' → fuel pump ON' : ''} → begin descent.`,
        tip: { title: 'The order matters', text: `Power FIRST to bleed speed, THEN flaps. Adding flaps above Vfe (${vfe} KIAS on ${acName}) can damage the flap structure. Once configured, trim hands-off — don't muscle it around the pattern.` }
      },

      // ── 5. BASE TURN — choice (judgment, distractors are real mistakes)
      {
        type: 'choice',
        phase: 'Base Turn',
        prompt: 'When do you turn from downwind to base?',
        context: 'Calm wind day, standard pattern. The turn timing sets up your entire final approach.',
        options: [
          { text: 'When the runway threshold is ~45° behind your wingtip', correct: true, why: '' },
          { text: 'When you are directly abeam (90°) the runway threshold', correct: false, why: 'Turning at 90° puts you on a very short base — you\'ll be high and fast turning final.' },
          { text: 'When the runway numbers are no longer visible through your window', correct: false, why: 'This is too late — you\'ll overshoot final or need a steep turn to line up.' },
          { text: 'After exactly 45 seconds on downwind regardless of position', correct: false, why: 'Time-based patterns don\'t account for groundspeed changes due to wind. Always use visual references.' },
        ],
        feedback: '~45° behind the wing is the standard reference. Watch for the runway threshold drifting to your 5 o\'clock — that\'s your turn cue. Wind shifts this: headwind on final = turn sooner; tailwind on downwind = extend further.',
        tip: { title: 'High on final?', text: 'If you consistently arrive high on final, the fix is usually a longer downwind before turning base — not adding flaps early. Flaps fix configuration, not geometry.' }
      },

      // ── 6. BASE CONFIG — config
      {
        type: 'config',
        phase: 'Base Leg',
        prompt: 'Configure the aircraft on base leg.',
        context: 'You\'ve turned base. Descending, runway visible to your right. Set up for a stabilized final.',
        controls: [
          {
            id: 'flaps', label: 'Flaps', type: 'chips',
            options: baseFlapsOptions,
            default: '10°',
            correct: baseFlaps,
            correctLabel: `${baseFlaps} — steepens descent, slows further for final`,
            wrongLabel: `Flaps ${baseFlaps} on base. 10° was abeam the numbers; full flaps added on final once runway is made.`,
          },
          {
            id: 'speed', label: 'Target Airspeed', type: 'slider',
            min: 55, max: 110, step: 5,
            default: abeamSpeed + 5,
            unit: 'KIAS',
            correct: baseSpeed,
            tolerance: 5,
            correctLabel: `~${baseSpeed} KIAS — margin above stall, time to stabilize`,
            wrongLabel: `Target ~${baseSpeed} KIAS on base. Faster = hard to slow for final; slower = too little margin.`,
          },
        ],
        feedback: `Base: flaps ${baseFlaps}, ~${baseSpeed} KIAS. Descending to intercept final. Keep an eye on the runway — if it's moving toward your nose you're overshooting; if moving away you're undershooting.`,
        tip: { title: 'Base radio call', text: `"${icao} traffic, Skyhawk Four Five Two One Golf, left base runway ${rwy}, ${icao}." Make it before the turn or early in the turn — other pilots on long final need to hear it.` }
      },

      // ── 7. BASE RADIO — radio
      {
        type: 'radio',
        phase: 'Base — Radio',
        prompt: 'Build your base leg position call.',
        context: `You've turned base for runway ${rwy}. Announce before or early in the turn.`,
        words: [`${icao} traffic`, 'Skyhawk Four Five Two One Golf', `left base runway ${rwy}`, icao],
        ideal: `${icao} traffic, Skyhawk Four Five Two One Golf, left base runway ${rwy}, ${icao}.`,
        distractors: [
          { text: 'turning base', why: 'Announce the leg you\'re on, not the maneuver. Say "left base" once established — not "turning base" mid-turn.' },
          { text: `right base runway ${rwy}`, why: 'Left traffic means left base. Right base would be for right-hand traffic pattern, which is non-standard unless published.' },
          { text: 'souls on board two', why: 'Souls on board is emergency phraseology only — used during a Mayday call. Never in normal pattern calls.' },
        ],
        feedback: 'Same structure as downwind: airport → callsign → leg + runway → airport. Keep it punchy — other traffic needs to process it fast.',
        tip: { title: 'Don\'t skip base calls', text: 'Many pilots only call downwind and final. Base calls catch traffic on long final or crossing traffic. It\'s a few seconds that can prevent a collision.' }
      },

      // ── 8. FINAL CONFIG — config
      {
        type: 'config',
        phase: 'Final — Configuration',
        prompt: 'Established on final, set your configuration.',
        context: 'Runway straight ahead. You have the runway made. Complete your final configuration.',
        controls: [
          {
            id: 'flaps', label: 'Flaps', type: 'chips',
            options: finalFlapsOptions,
            default: baseFlaps,
            correct: finalFlaps,
            correctLabel: `${finalFlaps} — full flaps for landing`,
            wrongLabel: `Full flaps (${finalFlaps}) on final once the runway is made. Steepens approach, slows landing speed, shortens rollout.`,
          },
          {
            id: 'speed', label: 'Target Airspeed', type: 'slider',
            min: 50, max: 95, step: 5,
            default: baseSpeed + 5,
            unit: 'KIAS',
            correct: shortFinal,
            tolerance: 5,
            correctLabel: `${shortFinal}–${approach} KIAS — Vref for ${acName} with full flaps`,
            wrongLabel: `Target ${shortFinal}–${approach} KIAS on final. Add half the gust factor in gusty conditions.`,
          },
          {
            id: 'carbheat', label: 'Carb Heat', type: 'chips',
            options: ['OFF', 'ON'],
            default: 'ON',
            correct: 'ON',
            correctLabel: 'ON — keep it on throughout approach',
            wrongLabel: 'Keep carb heat ON throughout the approach. Only turn OFF if executing a go-around.',
          },
          ...(hasFuelPump ? [{
            id: 'fuelpump', label: 'Fuel Pump', type: 'chips',
            options: ['OFF', 'ON'],
            default: 'ON',
            correct: 'ON',
            correctLabel: 'ON — keep pump on for approach and go-around readiness',
            wrongLabel: 'Fuel pump stays ON throughout approach — backup pressure for go-around.',
          }] : []),
        ],
        feedback: `Final: flaps ${finalFlaps}, ${shortFinal}–${approach} KIAS, carb heat on${hasFuelPump ? ', fuel pump on' : ''}, stabilized. Same power, same pitch, same speed from here to the flare. If anything is wrong at 500 ft AGL — go around.`,
        tip: { title: 'Stabilized = safe', text: 'Stabilized approach criteria by 500 ft AGL: on centerline · on glidepath · within ±5 kts of target · landing config complete · sink rate under 1,000 fpm. One item off = go around. No negotiating.' }
      },

      // ── 9. GLIDEPATH — choice (no obvious wrong answers)
      {
        type: 'choice',
        phase: 'Final — Glidepath',
        prompt: 'The PAPI shows 3 red, 1 white. What\'s your situation and response?',
        context: 'PAPI is a row of 4 lights left of the runway. Each light is red or white depending on your glidepath.',
        options: [
          { text: 'Slightly low — add a small amount of power', correct: true, why: '' },
          { text: 'Slightly high — reduce power slightly and accept steeper descent', correct: false, why: '3R1W means LOW, not high. 1R3W = slightly high.' },
          { text: 'Dangerously low — go around immediately', correct: false, why: '3R1W is slightly low but recoverable with power. ALL red = dangerously low = go around.' },
          { text: 'On glidepath — 3 red is normal at this distance', correct: false, why: '2R2W is on glidepath. 3R1W is a one-light deviation low.' },
        ],
        feedback: '2R2W = on glidepath. 3R1W = slightly low (add power). 1R3W = slightly high (reduce power). All red = dangerously low, go around. All white = dangerously high.',
        tip: { title: '4 glidepath cross-checks', text: '① PAPI: 2R2W = on path  ② VSI: ~500–700 fpm descent at 65 KIAS is normal  ③ Runway shape: if the far threshold appears to RISE toward you, you\'re too low  ④ Altimeter: ~300 ft AGL at 1 nm, ~150 ft AGL at ½ nm' }
      },

      // ── 10. FLARE — choice (distractors are common student errors)
      {
        type: 'choice',
        phase: 'Flare & Touchdown',
        prompt: 'Over the threshold at 50 ft AGL, power at idle, runway ahead. Where do you look?',
        context: 'Visual reference during the flare is the single biggest factor in consistent landings.',
        options: [
          { text: 'The far end of the runway', correct: true, why: '' },
          { text: 'The runway numbers just ahead of the aircraft', correct: false, why: 'Looking close causes over-flaring — you flare too high and balloon, then drop.' },
          { text: 'The airspeed indicator to confirm you\'re near stall', correct: false, why: 'You should not be looking inside the cockpit during the flare. Outside visual reference only.' },
          { text: 'The nose of the aircraft to gauge pitch attitude', correct: false, why: 'Looking at the nose gives poor depth perception. The far end of the runway gives the right sight picture automatically.' },
        ],
        feedback: 'Look at the far end of the runway throughout the flare. Peripheral vision handles the near runway geometry. This naturally prevents over-flaring and gives you the right pitch picture.',
        tip: { title: 'Flare sequence', text: '50 ft AGL: stop descending — start the flare. Smoothly raise the nose while power goes to idle (if not already there). Hold the nose off as long as possible. The mains touch, then hold back pressure to keep nose off. Don\'t "fly it onto" the runway.' }
      },

      // ── 11. ROLLOUT CONFIG — config
      {
        type: 'config',
        phase: 'Rollout',
        prompt: 'You\'ve touched down, all three wheels on the runway. Set the rollout configuration.',
        context: 'Decelerating on the runway. Sequence your controls correctly.',
        controls: [
          {
            id: 'backpressure', label: 'Yoke / Back Pressure', type: 'chips',
            options: ['Release (forward)', 'Hold back pressure', 'Push forward (nose down)'],
            default: 'Release (forward)',
            correct: 'Hold back pressure',
            correctLabel: 'Hold back pressure — keeps weight off nosewheel, improves aerodynamic braking',
            wrongLabel: 'Hold back pressure throughout rollout to protect the nose gear and use aerodynamic drag to slow down.',
          },
          {
            id: 'flaps', label: 'Flaps', type: 'chips',
            options: [`Leave at ${finalFlaps}`, 'Retract to 0°', `Retract to ${baseFlaps}`],
            default: `Leave at ${finalFlaps}`,
            correct: 'Retract to 0°',
            correctLabel: 'Retract flaps — transfers lift to wheels, improves braking effectiveness',
            wrongLabel: 'Retract flaps on rollout to put weight on the wheels and improve brake effectiveness.',
          },
          {
            id: 'carbheat', label: 'Carb Heat', type: 'chips',
            options: ['Leave ON', 'OFF'],
            default: 'Leave ON',
            correct: 'OFF',
            correctLabel: 'OFF — you\'re on the ground, no longer needed',
            wrongLabel: 'Carb heat OFF after landing. It\'s no longer needed and returns the air filter to normal.',
          },
          ...(hasFuelPump ? [{
            id: 'fuelpump', label: 'Fuel Pump', type: 'chips',
            options: ['Leave ON', 'OFF'],
            default: 'Leave ON',
            correct: 'OFF',
            correctLabel: 'OFF — electric pump no longer needed once clear of runway',
            wrongLabel: 'Turn fuel pump OFF after landing and clear of the runway.',
          }] : []),
        ],
        feedback: `Rollout: hold back pressure → retract flaps → carb heat off${hasFuelPump ? ' → fuel pump off' : ''} → brake smoothly → clear the runway before running after-landing flow.`,
        tip: { title: 'After-landing flow (off the runway)', text: `Once clear: Flaps UP · Carb heat COLD${hasFuelPump ? ' · Fuel Pump OFF' : ''} · Transponder STBY · Note time · Taxi to parking. Do NOT run this flow while still rolling on the runway.` }
      },

    ]
  };
}

// ── PROC STATE ──
let procRadioState = { built: [], words: [] };

function startProcedure(procId) {
  const ap = procState.airport;
  if (!ap.tpa) { ap.elev = ap.elev || 0; ap.tpa = ap.elev + 1000; ap.name = ap.name || 'Your Field'; }

  const builders = {
    pattern_landing: buildPatternLanding,
    normal_takeoff:  buildNormalTakeoff,
    slow_flight:     buildSlowFlight,
    power_off_stall: buildPowerOffStall,
    power_on_stall:  buildPowerOnStall,
  };

  if (!builders[procId]) return;
  procState._lastProcId = procId;
  procState.currentProc = builders[procId](ap);
  procState.currentStep = 0;
  procState.answered = false;
  document.getElementById('proc-step-title').textContent = procState.currentProc.title;
  document.getElementById('proc-airport-tag').textContent = ap.icao || '';
  showProcScreen('proc-screen-steps');
  renderProcStep();
}

// ── NORMAL TAKEOFF ──
function buildNormalTakeoff(ap) {
  return {
    title: 'Normal Takeoff',
    steps: [
      {
        type: 'config',
        phase: 'Lineup',
        prompt: 'Configure for normal takeoff before rolling.',
        context: 'You\'ve received takeoff clearance or confirmed the runway is clear. Set your configuration before advancing throttle.',
        controls: [
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['0°', '10°', '20°', '30°'], default: '10°', correct: '0°', correctLabel: '0° — flaps up for normal takeoff', wrongLabel: 'Normal takeoff uses 0° flaps. Flaps are only used for short-field takeoffs.' },
          { id: 'carbheat', label: 'Carb Heat', type: 'chips', options: ['OFF', 'ON'], default: 'OFF', correct: 'OFF', correctLabel: 'OFF — carb heat reduces power, never use on takeoff', wrongLabel: 'Carb heat must be OFF for takeoff — it reduces power and bypasses the air filter.' },
          { id: 'mixture', label: 'Mixture', type: 'chips', options: ['RICH', 'LEAN'], default: 'RICH', correct: 'RICH', correctLabel: 'RICH — full rich at sea level for max power', wrongLabel: 'Full rich for sea level takeoffs. Lean only at high-elevation airports for smooth operation.' },
        ],
        feedback: 'Normal takeoff: 0° flaps, carb heat off, mixture rich. Controls free and correct, transponder ALT, strobes on.',
        tip: { title: 'Before rolling', text: 'Do a final scan: strobes ON, transponder ALT, time noted, runway clear both directions. Say "KUZA traffic, Skyhawk 4521G, departing runway 27" if uncontrolled.' }
      },
      {
        type: 'radio',
        phase: 'Takeoff — Radio',
        prompt: 'Build your takeoff announcement for an uncontrolled field.',
        context: 'KUZA is uncontrolled. Announce before rolling to alert traffic on downwind or base.',
        words: ['KUZA traffic', 'Skyhawk Four Five Two One Golf', 'departing runway two seven', 'KUZA'],
        ideal: 'KUZA traffic, Skyhawk Four Five Two One Golf, departing runway two seven, KUZA.',
        distractors: [
          { text: 'requesting takeoff clearance', why: 'No tower at KUZA — there\'s nobody to request clearance from. Just announce and go.' },
          { text: 'holding short runway two seven', why: 'Holding short is a different call made when waiting. If you\'re departing, say departing.' },
          { text: 'over', why: '"Over" is not used in aviation radio calls.' },
        ],
        feedback: 'Departure call: airport + traffic → callsign → action + runway → airport. Same bookend structure as pattern calls.',
        tip: { title: 'When to call', text: 'Make the call before rolling, not during the roll. You want both hands on the controls during the takeoff roll, not one on the mic.' }
      },
      {
        type: 'config',
        phase: 'Takeoff Roll',
        prompt: 'You advance the throttle. What power setting and what do you check first?',
        context: 'Aircraft is rolling. You have about 8–10 seconds before rotation speed.',
        controls: [
          { id: 'power', label: 'Throttle', type: 'chips', options: ['Full', '1800 RPM', '2100 RPM', '75%'], default: '1800 RPM', correct: 'Full', correctLabel: 'Full throttle — smoothly advanced to full power', wrongLabel: 'Normal takeoff uses full throttle, smoothly applied. Partial power is only for noise abatement procedures.' },
          { id: 'check', label: 'First instrument check', type: 'chips', options: ['Airspeed alive', 'Altimeter', 'VSI', 'Heading indicator'], default: 'Altimeter', correct: 'Airspeed alive', correctLabel: 'Airspeed alive — confirms pitot tube is working', wrongLabel: 'First thing to verify on the roll is airspeed coming alive — confirms your pitot tube is unobstructed.' },
        ],
        feedback: 'Full throttle smoothly applied. First scan: airspeed alive (pitot working), engine instruments in green, centerline tracking with rudder.',
        tip: { title: 'Rudder on the roll', text: 'The C172 will want to veer left due to propeller torque and P-factor — use right rudder to hold centerline. This is more pronounced at full power than you expect the first few times.' }
      },
      {
        type: 'choice',
        phase: 'Rotation',
        prompt: 'At what speed do you rotate, and what pitch attitude do you hold?',
        context: 'Airspeed is building. You\'re approaching rotation speed.',
        options: [
          { text: '55 KIAS — rotate to ~10° nose up, hold for Vx or Vy', correct: true, why: '' },
          { text: '65 KIAS — same as approach speed to keep it simple', correct: false, why: 'Vr is 55 KIAS for the C172, not 65. Waiting until 65 wastes runway and puts you airborne at a higher speed than needed.' },
          { text: '55 KIAS — rotate aggressively to climb quickly', correct: false, why: 'Rotate gently to ~10° pitch — aggressive rotation can cause a tail strike or induce an accelerated stall close to the ground.' },
          { text: '45 KIAS — rotate early for shortest ground roll', correct: false, why: 'Rotating below Vr risks becoming airborne before the wing is generating enough lift — dangerous if you encounter any turbulence.' },
        ],
        feedback: 'Rotate at 55 KIAS with gentle back pressure to ~10° pitch attitude. The aircraft will fly itself off. Hold Vy (74 KIAS) for best rate of climb.',
        tip: { title: 'Vx vs Vy', text: 'Vx = 59 KIAS (best angle) — use if obstacle ahead. Vy = 74 KIAS (best rate) — use for normal climb. At KUZA with no obstacles, Vy is your target after rotation.' }
      },
      {
        type: 'config',
        phase: 'Initial Climb',
        prompt: 'Airborne, positive rate of climb. Configure for normal climb.',
        context: 'You\'re climbing away from the runway. What\'s your target speed and when do you make flap/power changes?',
        controls: [
          { id: 'speed', label: 'Climb Speed', type: 'slider', min: 55, max: 100, step: 5, default: 65, unit: 'KIAS', correct: 74, tolerance: 5, correctLabel: '74 KIAS — Vy, best rate of climb', wrongLabel: 'Target Vy = 74 KIAS for normal climb. Vx (59) only if obstacles require steeper angle.' },
          { id: 'power', label: 'Power', type: 'chips', options: ['Full', '2300 RPM', '1800 RPM', 'Idle'], default: 'Full', correct: 'Full', correctLabel: 'Full power maintained to at least 500 ft AGL', wrongLabel: 'Keep full power until at least 500 ft AGL. Pulling power back early sacrifices safety margin.' },
          { id: 'carbheat', label: 'Carb Heat', type: 'chips', options: ['OFF', 'ON'], default: 'OFF', correct: 'OFF', correctLabel: 'OFF — full power climb, carb heat not needed', wrongLabel: 'Carb heat stays OFF during climb — you\'re at full power and it reduces performance.' },
        ],
        feedback: 'Positive rate — maintain Vy (74 KIAS), full power to 500+ ft AGL, carb heat off. Track runway centerline extended, begin crosswind turn at pattern altitude.',
        tip: { title: '500 ft AGL', text: 'Below 500 ft AGL, options for handling problems are severely limited. Keep full power and maintain Vy until you have altitude to work with. Resist the urge to reduce power early.' }
      },
    ]
  };
}

// ── SLOW FLIGHT ──
function buildSlowFlight(ap) {
  return {
    title: 'Slow Flight',
    steps: [
      {
        type: 'choice',
        phase: 'Setup',
        prompt: 'Before entering slow flight, what should you do first?',
        context: 'ACS requires slow flight to be performed at a safe altitude. What\'s the first step?',
        options: [
          { text: 'Clear the area with two 90° clearing turns, then establish entry altitude', correct: true, why: '' },
          { text: 'Reduce power immediately and add flaps', correct: false, why: 'You must clear the area first — slow flight puts you close to stall speed where recovery takes altitude. Check for traffic below you.' },
          { text: 'Announce on CTAF and begin entry', correct: false, why: 'Clearing turns are required to check for traffic, especially below — slow flight and stalls are often done without CTAF calls.' },
          { text: 'Set up directly from cruise with no clearing turns', correct: false, why: 'Clearing turns are mandatory before any slow flight, stall, or steep turn maneuver. ACS requirement.' },
        ],
        feedback: 'Always do two 90° clearing turns before slow flight, stalls, or steep turns. Check above, below, and all around. Minimum 1,500 ft AGL recommended.',
        tip: { title: 'Why clearing turns matter', text: 'You\'re about to fly slowly and close to the ground effect zone. Another aircraft below you at a normal cruise speed closes fast. The clearing turns also help you mentally transition from cruise to the slower scan pace of slow flight.' }
      },
      {
        type: 'config',
        phase: 'Entry',
        prompt: 'Configure for slow flight entry from cruise.',
        context: 'You\'re at altitude, area cleared. Enter slow flight — maintain altitude throughout.',
        controls: [
          { id: 'power', label: 'Power', type: 'slider', min: 600, max: 2400, step: 100, default: 2300, unit: 'RPM', correct: 1500, tolerance: 200, correctLabel: '~1500 RPM — reduces speed while holding altitude with back pressure', wrongLabel: 'Reduce to ~1500 RPM to begin slowing. You\'ll add more back pressure to hold altitude as speed bleeds.' },
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['0°', '10°', '20°', '30°'], default: '0°', correct: '10°', correctLabel: '10° — begin flap extension as speed allows (below 85 KIAS)', wrongLabel: 'Add flaps 10° once below Vfe (85 KIAS). Flaps allow slower flight while maintaining lift.' },
          { id: 'carbheat', label: 'Carb Heat', type: 'chips', options: ['OFF', 'ON'], default: 'OFF', correct: 'ON', correctLabel: 'ON — reduced power setting means carb ice risk', wrongLabel: 'Apply carb heat when reducing power for slow flight — low power settings are prime carb icing conditions.' },
        ],
        feedback: 'Slow flight entry: power to ~1500 RPM, carb heat ON, pitch up to hold altitude as speed bleeds, add flaps incrementally as speed allows.',
        tip: { title: 'The pitch-power relationship', text: 'In slow flight you\'re operating on the "back side of the power curve" — more drag than normal, so adding power raises nose AND speed, and reducing power drops both. It feels reversed from cruise.' }
      },
      {
        type: 'config',
        phase: 'Maneuvering Speed',
        prompt: 'Established in slow flight. What is your target configuration?',
        context: 'ACS requires maintaining controlled flight at minimum controllable airspeed — just above stall with full configuration.',
        controls: [
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['0°', '10°', '20°', '30°'], default: '10°', correct: '30°', correctLabel: '30° (full flaps) — maximum lift, minimum speed', wrongLabel: 'Full flaps for slow flight — gives you lowest possible airspeed while maintaining controlled flight.' },
          { id: 'speed', label: 'Target Airspeed', type: 'slider', min: 40, max: 80, step: 5, default: 65, unit: 'KIAS', correct: 50, tolerance: 5, correctLabel: '~50 KIAS — just above stall, stall horn may intermittently sound', wrongLabel: 'Target ~50 KIAS — just above stall speed with full flaps. Stall horn sounding intermittently is acceptable per ACS.' },
          { id: 'rudder', label: 'Rudder', type: 'chips', options: ['Neutral', 'Right rudder', 'Left rudder'], default: 'Neutral', correct: 'Right rudder', correctLabel: 'Right rudder — counters left-turning tendency from torque and P-factor at high angle of attack', wrongLabel: 'Right rudder is needed to counteract torque and P-factor at low speeds/high power. Without it the ball skids left.' },
        ],
        feedback: 'Slow flight established: full flaps, ~50 KIAS, right rudder to stay coordinated, power as needed to maintain altitude. Stall horn acceptable.',
        tip: { title: 'What your examiner watches', text: 'ACS standard: maintain ±10 kts of target airspeed, ±100 ft altitude, ±10° heading. The most common failure is ballooning altitude on flap extension or letting speed decay below stall without recovery.' }
      },
      {
        type: 'choice',
        phase: 'Turn in Slow Flight',
        prompt: 'While maneuvering in slow flight, you begin a turn. What is the bank angle limit?',
        context: 'ACS requires turns in slow flight. Steep banks at slow speeds are dangerous.',
        options: [
          { text: '30° maximum bank — steep banks increase stall speed significantly', correct: true, why: '' },
          { text: '45° — same as steep turns, to practice the full range', correct: false, why: '45° bank in slow flight dramatically increases stall speed. At 45° bank, stall speed increases by ~20%. Very dangerous near MCA.' },
          { text: 'Any bank angle as long as speed is maintained', correct: false, why: 'Bank angle directly increases stall speed. You can\'t "maintain speed" through a steep bank in slow flight — it\'s a stall trap.' },
          { text: '20° maximum — ACS specifies this', correct: false, why: 'ACS says turns should not exceed 30° bank in slow flight. 20° is conservative but the standard is 30°.' },
        ],
        feedback: 'Maximum 30° bank in slow flight. At 30° bank, stall speed increases by about 7%. At 45°, it increases ~20% — easily enough to stall at your current airspeed.',
        tip: { title: 'Bank angle and stall speed', text: 'Stall speed increases with bank angle: 0° = 47 KIAS (C172), 30° = ~50 KIAS, 45° = ~56 KIAS, 60° = ~66 KIAS. In slow flight near 50 KIAS, a 60° bank stalls immediately.' }
      },
      {
        type: 'config',
        phase: 'Recovery',
        prompt: 'ATC requests you return to cruise. Recover from slow flight.',
        context: 'You\'re at full flaps, ~50 KIAS, holding altitude. Return to normal cruise.',
        controls: [
          { id: 'power', label: 'Power', type: 'chips', options: ['Full then reduce', 'Idle then climb', '2300 RPM', 'Gradually increase'], default: 'Gradually increase', correct: 'Full then reduce', correctLabel: 'Full power first — builds speed before reducing to cruise power', wrongLabel: 'Add full power first to accelerate, then reduce to cruise power once at normal airspeed. Don\'t gradually increase — you need to accelerate positively.' },
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['All at once', 'Incrementally as speed builds', 'Leave until cruise', '10° only'], default: 'All at once', correct: 'Incrementally as speed builds', correctLabel: 'Incrementally — retract as airspeed increases to avoid sudden lift loss', wrongLabel: 'Retract flaps incrementally as speed builds. Retracting all at once causes a sudden lift loss and sink.' },
          { id: 'carbheat', label: 'Carb Heat', type: 'chips', options: ['Leave ON', 'OFF'], default: 'Leave ON', correct: 'OFF', correctLabel: 'OFF — returning to cruise power, carb heat no longer needed', wrongLabel: 'Carb heat OFF as you return to cruise power. Leaving it on reduces cruise performance.' },
        ],
        feedback: 'Recovery: full power → carb heat off → retract flaps incrementally as speed builds → cruise power when at normal airspeed. Hold altitude throughout.',
        tip: { title: 'Common mistake', text: 'Don\'t retract flaps before you have enough speed — especially going from 30° to 20° to 10°. Each retraction step removes lift. If you retract too fast you\'ll sink or stall. Speed first, then flaps.' }
      },
    ]
  };
}

// ── POWER OFF STALL ──
function buildPowerOffStall(ap) {
  return {
    title: 'Power Off Stall',
    steps: [
      {
        type: 'choice',
        phase: 'Setup',
        prompt: 'What does a power off stall simulate, and what altitude is required?',
        context: 'Understanding the purpose of each stall type is part of the oral exam.',
        options: [
          { text: 'Approach to landing stall — minimum 1,500 ft AGL after clearing turns', correct: true, why: '' },
          { text: 'Takeoff stall — 3,000 ft AGL required by ACS', correct: false, why: 'Power off stall simulates an approach/landing configuration stall, not takeoff. Power on stall simulates takeoff.' },
          { text: 'Approach stall — no minimum altitude, just clear of clouds', correct: false, why: 'ACS recommends at least 1,500 ft AGL for stall recovery to ensure you have altitude if recovery is delayed.' },
          { text: 'Cruise stall — simulates unexpected speed reduction in cruise', correct: false, why: 'Power off stall is a landing configuration stall. Flaps extended, power idle — just like a botched approach.' },
        ],
        feedback: 'Power off stall = approach/landing stall. Full or partial flaps, power idle. Simulates what happens if you get too slow on final. Minimum 1,500 ft AGL, after clearing turns.',
        tip: { title: 'Oral exam question', text: '"What does a power off stall simulate?" Answer: a stall in the landing configuration — on approach or during the flare. It\'s the most common real-world stall scenario.' }
      },
      {
        type: 'config',
        phase: 'Entry Configuration',
        prompt: 'Configure for power off stall entry.',
        context: 'Area cleared, at altitude. Set up as if on final approach.',
        controls: [
          { id: 'power', label: 'Power', type: 'slider', min: 600, max: 2400, step: 100, default: 2100, unit: 'RPM', correct: 1500, tolerance: 200, correctLabel: '~1500 RPM — simulate approach power, then reduce to idle', wrongLabel: 'Reduce to approach power (~1500 RPM) first to slow to approach speed, then reduce to idle for the stall.' },
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['0°', '10°', '20°', '30°'], default: '0°', correct: '30°', correctLabel: '30° — full flaps, landing configuration', wrongLabel: 'Full flaps simulates the landing configuration. This is where power off stalls are most likely in real life.' },
          { id: 'carbheat', label: 'Carb Heat', type: 'chips', options: ['OFF', 'ON'], default: 'OFF', correct: 'ON', correctLabel: 'ON — power is reduced, carb ice risk present', wrongLabel: 'Carb heat ON before reducing power to idle — standard procedure any time you pull power back significantly.' },
        ],
        feedback: 'Entry: carb heat on, reduce power to ~1500 RPM, slow to ~65 KIAS, add full flaps. Then reduce to idle and hold altitude with back pressure until the stall.',
        tip: { title: 'What to expect', text: 'As you hold altitude with increasing back pressure, you\'ll feel the controls get mushy, the stall horn will sound, and then the nose will drop or a wing will drop. This is the stall — note the speed and feel.' }
      },
      {
        type: 'choice',
        phase: 'Stall Recognition',
        prompt: 'You\'re holding back pressure, slowing down on approach. Which comes FIRST?',
        context: 'Sequence of stall cues matters — the examiner will ask what you felt and when.',
        options: [
          { text: 'Stall horn → buffet → control mushiness → nose drop', correct: false, why: 'The stall horn comes early, but buffet typically comes before or with the horn. Control mushiness happens throughout the deceleration.' },
          { text: 'Control mushiness → stall horn → buffet → nose drop', correct: true, why: '' },
          { text: 'Nose drop → stall horn → buffet', correct: false, why: 'The nose drop IS the stall — it comes last, not first. The horn and buffet are warnings before the stall occurs.' },
          { text: 'Buffet → nose drop → stall horn', correct: false, why: 'The stall horn activates before the stall (it\'s a warning). It doesn\'t sound after the nose drops.' },
        ],
        feedback: 'Stall cue sequence: controls get mushy → stall horn sounds → airframe buffet → stall (nose drops, possible wing drop). Recognizing early cues is the point of the exercise.',
        tip: { title: 'What your examiner wants', text: 'ACS requires you to recognize and announce the onset of the stall — not wait for the full break. Say "stall warning" when the horn sounds. The examiner is testing recognition, not just recovery.' }
      },
      {
        type: 'config',
        phase: 'Recovery',
        prompt: 'The stall has occurred — nose dropped. Recover with minimum altitude loss.',
        context: 'You\'re at the stall break. Every second of incorrect recovery costs altitude.',
        controls: [
          { id: 'pitch', label: 'Pitch', type: 'chips', options: ['Nose up aggressively', 'Lower nose to horizon', 'Hold current pitch', 'Lower nose slightly below horizon'], default: 'Hold current pitch', correct: 'Lower nose slightly below horizon', correctLabel: 'Lower nose slightly below horizon — breaks the stall angle of attack without diving', wrongLabel: 'Lower the nose slightly below the horizon to break the stall. Pushing hard nose-down dives and loses excessive altitude.' },
          { id: 'power', label: 'Power', type: 'chips', options: ['Full immediately', 'Idle — don\'t add power yet', '1800 RPM', 'Slowly increase'], default: 'Slowly increase', correct: 'Full immediately', correctLabel: 'Full power immediately — stops altitude loss and accelerates recovery', wrongLabel: 'Full power simultaneously with pitch — the combination minimizes altitude loss. Power alone can\'t break the stall; pitch alone wastes altitude.' },
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['Retract all immediately', 'Leave at 30° until flying', 'Retract to 20° immediately', 'Retract incrementally above 60 KIAS'], default: 'Leave at 30° until flying', correct: 'Retract incrementally above 60 KIAS', correctLabel: 'Retract incrementally once above 60 KIAS — removes drag as airspeed allows', wrongLabel: 'Don\'t retract flaps immediately — at the stall you have no airspeed to spare. Wait until above 60 KIAS, then retract incrementally.' },
        ],
        feedback: 'Recovery: simultaneously lower nose slightly + full power. Once flying (60+ KIAS), retract flaps incrementally. Hold heading. Climb to entry altitude.',
        tip: { title: 'ACS standard', text: 'ACS requires recovery at first indication (don\'t wait for full break if possible), with minimum altitude loss. Typical power-off stall recovery uses 50–150 ft if done promptly. Delay costs 300+ ft.' }
      },
    ]
  };
}

// ── POWER ON STALL ──
function buildPowerOnStall(ap) {
  return {
    title: 'Power On Stall',
    steps: [
      {
        type: 'choice',
        phase: 'Setup',
        prompt: 'What does a power on stall simulate, and why is it more aggressive?',
        context: 'Power on stalls have different characteristics than power off stalls.',
        options: [
          { text: 'Takeoff/departure stall — torque and P-factor make left yaw/roll more likely', correct: true, why: '' },
          { text: 'Approach stall with engine — same as power off but with power added', correct: false, why: 'Power on stall simulates takeoff and departure, not approach. Full power changes the aerodynamics and control forces significantly.' },
          { text: 'Cruise stall — simulates speed loss in level flight', correct: false, why: 'Power on stall is specifically a takeoff/departure configuration — high power, flaps up or minimal, climbing attitude.' },
          { text: 'Go-around stall — same procedure as power off but faster', correct: false, why: 'While a go-around stall is related, power on stall specifically simulates the takeoff departure scenario with full power applied.' },
        ],
        feedback: 'Power on stall = takeoff/departure stall. High power creates torque, P-factor, and slipstream effects that want to roll/yaw the aircraft left. Recovery requires right rudder coordination.',
        tip: { title: 'Why it\'s different', text: 'At full power and high angle of attack, P-factor and torque are at maximum. The left-turning tendency is very strong — expect the left wing to drop at the stall break if you\'re not holding right rudder.' }
      },
      {
        type: 'config',
        phase: 'Entry Configuration',
        prompt: 'Configure for power on stall entry.',
        context: 'Simulating departure from runway. Area cleared, altitude established.',
        controls: [
          { id: 'flaps', label: 'Flaps', type: 'chips', options: ['0°', '10°', '20°', '30°'], default: '10°', correct: '0°', correctLabel: '0° — takeoff configuration, flaps up', wrongLabel: 'Power on stall uses 0° flaps — takeoff configuration. Some instructors allow 10° for short-field, but 0° is standard.' },
          { id: 'power', label: 'Power', type: 'chips', options: ['Full', '1800 RPM', '2100 RPM', '1500 RPM'], default: '2100 RPM', correct: 'Full', correctLabel: 'Full power — simulates takeoff power setting', wrongLabel: 'Full power for power on stall — that\'s the defining characteristic. Simulates full takeoff power.' },
          { id: 'pitch', label: 'Pitch Attitude', type: 'chips', options: ['Level', '10° nose up', '15–20° nose up', '5° nose up'], default: '10° nose up', correct: '15–20° nose up', correctLabel: '15–20° nose up — aggressive climb attitude induces stall rapidly', wrongLabel: 'Pitch to 15–20° nose up at full power to bring on the stall. This simulates over-rotating on takeoff.' },
        ],
        feedback: 'Power on stall entry: full power, 0° flaps, pitch aggressively to 15–20° nose up. Hold heading with right rudder — the torque will want to yaw left hard.',
        tip: { title: 'Right rudder is critical', text: 'At full power and high AOA, you\'ll need significant right rudder to stay coordinated. If you let the ball go left, the left wing drops more aggressively at the stall. Hold right rudder throughout the entry.' }
      },
      {
        type: 'choice',
        phase: 'Stall Recognition',
        prompt: 'At the power on stall break, what is the most likely motion and why?',
        context: 'Full power, high pitch, approaching stall — what happens at the break?',
        options: [
          { text: 'Left yaw and left wing drop — from torque and P-factor', correct: true, why: '' },
          { text: 'Right wing drop — propeller slipstream pushes right side down', correct: false, why: 'Torque and P-factor both create left-turning tendencies. Slipstream spirals around the fuselage but the net effect at high power/AOA is left yaw.' },
          { text: 'Straight nose drop — same as power off stall', correct: false, why: 'Power on stalls rarely break straight ahead — the torque and P-factor at full power usually produce a left roll/yaw at the break.' },
          { text: 'Right yaw first, then nose drop', correct: false, why: 'Right yaw would require a force pushing the nose right. Torque, P-factor, and spiraling slipstream all create left yaw.' },
        ],
        feedback: 'Power on stalls typically break to the left — left wing drops, left yaw — due to torque and P-factor. Right rudder throughout the entry reduces the severity of this break.',
        tip: { title: 'What to say', text: 'Announce "stall" at the break. Your examiner wants to hear you recognize it. Recovery priority: wings level → nose down slightly → maintain full power → climb away.' }
      },
      {
        type: 'config',
        phase: 'Recovery',
        prompt: 'Left wing drops at the stall break. Recover.',
        context: 'Full power stall break with left roll tendency. Sequence matters — wrong order can aggravate the stall.',
        controls: [
          { id: 'rudder', label: 'First control input', type: 'chips', options: ['Right aileron to level', 'Right rudder to stop yaw', 'Left aileron', 'Elevator forward'], default: 'Right aileron to level', correct: 'Right rudder to stop yaw', correctLabel: 'Right rudder first — stops the yaw before it becomes a spin entry', wrongLabel: 'Right RUDDER first to stop the yaw. Using aileron first in a stall can aggravate the roll (aileron drag stalls the dropping wing further).' },
          { id: 'pitch', label: 'Pitch input', type: 'chips', options: ['Aggressive nose down', 'Slight nose down — break AOA', 'Hold pitch', 'Nose up to stop sink'], default: 'Hold pitch', correct: 'Slight nose down — break AOA', correctLabel: 'Slight nose down — breaks angle of attack without excessive altitude loss', wrongLabel: 'Lower nose just enough to break the stall AOA. Aggressive push wastes altitude unnecessarily.' },
          { id: 'power', label: 'Power', type: 'chips', options: ['Keep full power', 'Reduce to 1800 RPM', 'Idle', 'Reduce then add'], default: 'Keep full power', correct: 'Keep full power', correctLabel: 'Keep full power — you already have it in, use it to accelerate recovery', wrongLabel: 'Power on stall recovery keeps full power — it\'s already helping you. Reducing power wastes the energy you have.' },
        ],
        feedback: 'Recovery sequence: right rudder to stop yaw → slight nose down to break stall → wings level with coordinated aileron → climb at Vy. Full power maintained throughout.',
        tip: { title: 'Spin awareness', text: 'An uncoordinated stall break — ball to the left, left wing dropping — is a spin entry. Right rudder prevents this. If a wing drops at the break and you apply opposite aileron before rudder, you can worsen the roll. Rudder first, always.' }
      },
    ]
  };
}

function renderProcStep() {
  const proc = procState.currentProc;
  const steps = proc.steps;
  const idx = procState.currentStep;
  procState.answered = false;

  document.getElementById('proc-progress-fill').style.width = ((idx / steps.length) * 100) + '%';

  if (idx >= steps.length) {
    document.getElementById('proc-progress-fill').style.width = '100%';
    document.getElementById('proc-step-content').innerHTML = `
      <div class="proc-complete">
        <div class="proc-complete-icon">🛬</div>
        <div class="proc-complete-title">Procedure Complete</div>
        <div class="proc-complete-sub">Pattern Entry &amp; Landing · ${procState.airport.name || 'Your Field'}</div>
        <button class="btn btn-primary" onclick="startProcedure(procState._lastProcId)">Fly Again</button>
        <button class="btn" style="margin-top:8px" onclick="procBack()">Change Procedure</button>
      </div>`;
    return;
  }

  const step = steps[idx];
  const tipHtml = step.tip ? `<div class="proc-tip-box"><div class="proc-tip-label">💡 ${step.tip.title}</div>${step.tip.text}</div>` : '';

  let interactiveHtml = '';

  if (step.type === 'config') {
    interactiveHtml = renderConfigStep(step);
  } else if (step.type === 'radio') {
    interactiveHtml = renderRadioStep(step);
  } else {
    interactiveHtml = renderChoiceStep(step);
  }

  document.getElementById('proc-step-content').innerHTML = `
    <div class="proc-step-card">
      <div class="proc-step-header">
        <div class="proc-step-phase">${step.phase}</div>
        <div class="proc-step-num">${idx + 1} / ${steps.length}</div>
      </div>
      <div class="proc-step-body">
        <div class="proc-step-prompt">${step.prompt}</div>
        ${step.context ? `<div class="proc-step-context">${step.context}</div>` : ''}
        <div id="proc-interactive">${interactiveHtml}</div>
        <div class="proc-feedback" id="proc-feedback"></div>
        ${tipHtml}
      </div>
    </div>
    <button class="proc-next-btn" id="proc-next-btn" onclick="nextProcStep()">
      ${idx + 1 < steps.length ? 'Next Step →' : 'Finish ✓'}
    </button>`;

  wireInteractive(step);
}

// ── CONFIG STEP ──
function renderConfigStep(step) {
  return `<div class="cockpit-config" id="cockpit-config">` +
    step.controls.map(ctrl => renderControl(ctrl)).join('') +
    `</div>
    <button class="proc-next-btn show" id="proc-check-btn" onclick="checkConfigStep()" style="display:block;margin-top:4px">Check Configuration</button>`;
}

function renderControl(ctrl) {
  let input = '';
  if (ctrl.type === 'slider') {
    input = `
      <input class="config-slider" type="range" id="ctrl-${ctrl.id}"
        min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${ctrl.default}"
        oninput="updateSliderDisplay('${ctrl.id}', '${ctrl.unit}')"/>
      <div class="config-slider-labels"><span>${ctrl.min} ${ctrl.unit}</span><span>${ctrl.max} ${ctrl.unit}</span></div>`;
  } else if (ctrl.type === 'chips') {
    input = `<div class="config-chips">` +
      ctrl.options.map(o =>
        `<div class="config-chip ${o === ctrl.default ? 'selected' : ''}" data-ctrl="${ctrl.id}" data-val="${o}" onclick="selectChip(this)">${o}</div>`
      ).join('') +
      `</div>`;
  }
  const displayVal = ctrl.type === 'slider' ? `${ctrl.default} ${ctrl.unit}` : ctrl.default;
  return `
    <div class="config-row" id="row-${ctrl.id}">
      <div class="config-row-header">
        <div class="config-row-label">${ctrl.label}</div>
        <div class="config-row-value" id="val-${ctrl.id}">${displayVal}</div>
      </div>
      ${input}
      <div class="config-row-result" id="result-${ctrl.id}"></div>
    </div>`;
}

function wireInteractive(step) {
  if (step.type === 'radio') {
    procRadioState = { built: [], builtKeys: [], words: [...step.words] };
    const wb = document.getElementById('proc-word-bank');
    if (wb) {
      wb.onclick = (e) => {
        const el = e.target.closest('.proc-word-chip');
        if (!el) return;
        const key = el.dataset.key;
        if (el.classList.contains('used')) {
          const idx = procRadioState.builtKeys.indexOf(key);
          if (idx !== -1) {
            procRadioState.built.splice(idx, 1);
            procRadioState.builtKeys.splice(idx, 1);
          }
          el.classList.remove('used');
        } else {
          el.classList.add('used');
          procRadioState.built.push(el.dataset.word);
          procRadioState.builtKeys.push(key);
        }
        updateProcRadioOutput();
      };
    }
  }
  if (step.type === 'choice') {
    document.querySelectorAll('.proc-option').forEach(btn => {
      btn.addEventListener('click', () => answerProcStep(btn));
    });
  }
}

function updateSliderDisplay(id, unit) {
  const el = document.getElementById('ctrl-' + id);
  document.getElementById('val-' + id).textContent = el.value + ' ' + unit;
}

function selectChip(el) {
  const ctrl = el.dataset.ctrl;
  document.querySelectorAll(`.config-chip[data-ctrl="${ctrl}"]`).forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  document.getElementById('val-' + ctrl).textContent = el.dataset.val;
}

function checkConfigStep() {
  if (procState.answered) return;
  procState.answered = true;
  const step = procState.currentProc.steps[procState.currentStep];
  let allCorrect = true;

  step.controls.forEach(ctrl => {
    const row = document.getElementById('row-' + ctrl.id);
    const result = document.getElementById('result-' + ctrl.id);
    let userVal, isCorrect;

    if (ctrl.type === 'slider') {
      userVal = parseInt(document.getElementById('ctrl-' + ctrl.id).value);
      isCorrect = Math.abs(userVal - ctrl.correct) <= ctrl.tolerance;
      const lo = ctrl.correct - ctrl.tolerance;
      const hi = ctrl.correct + ctrl.tolerance;
      const rangeStr = `${lo}–${hi} ${ctrl.unit}`;
      row.classList.add(isCorrect ? 'correct' : 'wrong');
      result.textContent = isCorrect
        ? `✓ ${ctrl.correctLabel} (accepted range: ${rangeStr})`
        : `✗ ${ctrl.wrongLabel} (accepted range: ${rangeStr})`;
    } else {
      const sel = document.querySelector(`.config-chip[data-ctrl="${ctrl.id}"].selected`);
      userVal = sel ? sel.dataset.val : '';
      isCorrect = userVal === ctrl.correct;
      row.classList.add(isCorrect ? 'correct' : 'wrong');
      result.textContent = isCorrect ? `✓ ${ctrl.correctLabel}` : `✗ ${ctrl.wrongLabel}`;
    }

    if (!isCorrect) allCorrect = false;
  });

  // Disable controls
  document.querySelectorAll('.config-slider').forEach(s => s.disabled = true);
  document.querySelectorAll('.config-chip').forEach(c => { c.style.pointerEvents = 'none'; });
  document.getElementById('proc-check-btn').style.display = 'none';

  const fb = document.getElementById('proc-feedback');
  fb.className = 'proc-feedback show ' + (allCorrect ? 'correct' : 'wrong');

  if (allCorrect) {
    fb.textContent = '✓ ' + step.feedback;
    document.getElementById('proc-next-btn').classList.add('show');
  } else {
    // Hide wrong labels — don't reveal answers yet
    step.controls.forEach(ctrl => {
      const result = document.getElementById('result-' + ctrl.id);
      const row = document.getElementById('row-' + ctrl.id);
      if (row.classList.contains('wrong')) result.textContent = '✗ Not quite';
    });
    fb.innerHTML = `✗ One or more controls need adjustment.<br><br>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
        <button class="btn btn-sm" onclick="retryConfigStep()">↩ Try Again</button>
        <button class="btn btn-sm" onclick="revealConfigAnswers()">Show Answers</button>
      </div>`;
  }
}

function retryConfigStep() {
  const step = procState.currentProc.steps[procState.currentStep];
  procState.answered = false;

  step.controls.forEach(ctrl => {
    const row = document.getElementById('row-' + ctrl.id);
    row.classList.remove('correct', 'wrong');
    document.getElementById('result-' + ctrl.id).textContent = '';
  });

  document.querySelectorAll('.config-slider').forEach(s => s.disabled = false);
  document.querySelectorAll('.config-chip').forEach(c => { c.style.pointerEvents = ''; });

  const fb = document.getElementById('proc-feedback');
  fb.className = 'proc-feedback';
  fb.innerHTML = '';

  document.getElementById('proc-check-btn').style.display = 'block';
  document.getElementById('proc-next-btn').classList.remove('show');
}

function revealConfigAnswers() {
  const step = procState.currentProc.steps[procState.currentStep];

  step.controls.forEach(ctrl => {
    const result = document.getElementById('result-' + ctrl.id);
    const row = document.getElementById('row-' + ctrl.id);
    if (ctrl.type === 'slider') {
      const lo = ctrl.correct - ctrl.tolerance;
      const hi = ctrl.correct + ctrl.tolerance;
      result.textContent = row.classList.contains('correct')
        ? `✓ ${ctrl.correctLabel} (accepted: ${lo}–${hi} ${ctrl.unit})`
        : `✗ ${ctrl.wrongLabel} (accepted: ${lo}–${hi} ${ctrl.unit})`;
    } else {
      result.textContent = row.classList.contains('correct')
        ? `✓ ${ctrl.correctLabel}`
        : `✗ ${ctrl.wrongLabel}`;
    }
  });

  const fb = document.getElementById('proc-feedback');
  fb.className = 'proc-feedback show wrong';
  fb.textContent = '✗ ' + step.feedback;
  document.getElementById('proc-next-btn').classList.add('show');
}

// ── RADIO STEP ──
function renderRadioStep(step) {
  const allChips = [
    ...step.words.map(w => ({ text: w, distractor: false })),
    ...(step.distractors || []).map(d => ({ text: d.text, distractor: true, why: d.why }))
  ].sort(() => Math.random() - 0.5);

  const chips = allChips.map((chip, i) =>
    `<div class="proc-word-chip" data-key="${i}" data-distractor="${chip.distractor}" data-why="${(chip.why||'').replace(/"/g,'&quot;')}" data-word="${chip.text.replace(/"/g,'&quot;')}">${chip.text}</div>`
  ).join('');

  return `
    <div class="proc-radio-output" id="proc-radio-output">
      <span class="placeholder">Tap words below in the correct order...</span>
    </div>
    <div class="proc-word-bank" id="proc-word-bank">${chips}</div>
    <div class="word-bank-hint">tap a word to add · tap again to remove</div>
    <div class="proc-radio-actions">
      <button class="btn btn-primary btn-sm" onclick="checkProcRadio()">Check Call</button>
      <button class="btn btn-sm" onclick="clearProcRadio()">Clear</button>
    </div>`;
}

function procAddWord(el, word) {
  if (el.classList.contains('used')) {
    const idx = procRadioState.built.indexOf(word);
    if (idx !== -1) procRadioState.built.splice(idx, 1);
    el.classList.remove('used');
  } else {
    el.classList.add('used');
    procRadioState.built.push(word);
  }
  updateProcRadioOutput();
}

function updateProcRadioOutput() {
  const out = document.getElementById('proc-radio-output');
  out.innerHTML = procRadioState.built.length === 0
    ? '<span class="placeholder">Tap words below in the correct order...</span>'
    : procRadioState.built.join(', ') + '.';
}

function clearProcRadio() {
  procRadioState.built = [];
  procRadioState.builtKeys = [];
  document.querySelectorAll('.proc-word-chip').forEach(c => {
    c.classList.remove('used');
    c.style.pointerEvents = '';
  });
  updateProcRadioOutput();
  document.getElementById('proc-feedback').className = 'proc-feedback';
  document.getElementById('proc-feedback').innerHTML = '';
  document.getElementById('proc-next-btn').classList.remove('show');
  procState.answered = false;
}

function checkProcRadio() {
  if (procState.answered) return;
  procState.answered = true;
  const step = procState.currentProc.steps[procState.currentStep];
  const isCorrect = radioCallMatches(procRadioState.built, step);

  // Find any distractors the user included
  const usedDistractors = procRadioState.built
    .map(w => (step.distractors || []).find(d => d.text === w))
    .filter(Boolean);

  const fb = document.getElementById('proc-feedback');
  document.querySelectorAll('.proc-word-chip').forEach(c => { c.style.pointerEvents = 'none'; });

  if (isCorrect) {
    fb.className = 'proc-feedback show correct';
    fb.textContent = '✓ ' + step.feedback;
    document.getElementById('proc-next-btn').classList.add('show');
  } else {
    fb.className = 'proc-feedback show wrong';
    let msg = '✗ Not quite.';
    if (usedDistractors.length > 0) {
      msg += '\n\n⚠️ Trap chips you included:\n' +
        usedDistractors.map(d => `• "${d.text}" — ${d.why}`).join('\n');
    }
    fb.innerHTML = msg.replace(/\n/g, '<br>') +
      `<br><br><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
        <button class="btn btn-sm" onclick="clearProcRadio()">↩ Try Again</button>
        <button class="btn btn-sm" onclick="revealProcRadio()">Show Ideal Call</button>
      </div>`;
  }
}

function revealProcRadio() {
  const step = procState.currentProc.steps[procState.currentStep];
  const fb = document.getElementById('proc-feedback');
  fb.className = 'proc-feedback show wrong';
  fb.innerHTML = `✗ ${step.feedback}<br><br><strong>Ideal:</strong> ${step.ideal}`;
  document.getElementById('proc-next-btn').classList.add('show');
}

// ── CHOICE STEP ──
function renderChoiceStep(step) {
  const shuffled = [...step.options].sort(() => Math.random() - 0.5);
  return `<div class="proc-options">` +
    shuffled.map((opt, i) =>
      `<button class="proc-option" data-correct="${opt.correct}" data-why="${(opt.why||'').replace(/"/g,'&quot;')}">${opt.text}</button>`
    ).join('') +
    `</div>`;
}

function answerProcStep(btn) {
  // called from event listeners set up in wireChoiceListeners
  if (procState.answered) return;
  procState.answered = true;
  const isCorrect = btn.dataset.correct === 'true';
  const step = procState.currentProc.steps[procState.currentStep];
  document.querySelectorAll('.proc-option').forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') b.classList.add(isCorrect ? 'correct' : 'reveal');
  });
  if (!isCorrect) {
    btn.classList.add('wrong');
  }
  const fb = document.getElementById('proc-feedback');
  fb.className = 'proc-feedback show ' + (isCorrect ? 'correct' : 'wrong');
  fb.textContent = (isCorrect ? '✓ ' : '✗ ') + step.feedback;
  document.getElementById('proc-next-btn').classList.add('show');
}

function nextProcStep() {
  procState.currentStep++;
  renderProcStep();
  document.getElementById('view-procedures').scrollTo({ top: 0, behavior: 'smooth' });
}

function procBack() { showProcScreen('proc-screen-setup'); }

function showProcScreen(id) {
  document.querySelectorAll('.proc-screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── SEQUENCE RECALL ──
let seqState = {
  phase: 'preflight',
  shuffled: [],   // all items shuffled, each has origIdx
  order: [],      // current user ordering (array of origIdx, -1 = empty slot)
  checked: false,
  dragSrc: null,  // { type: 'pool'|'slot', idx }
};

function setClMode(mode, btn) {
  document.querySelectorAll('.cl-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cl-reference-mode').style.display = mode === 'reference' ? '' : 'none';
  document.getElementById('cl-recall-mode').style.display = mode === 'recall' ? '' : 'none';
  if (mode === 'recall') initSeqRecall();
}

function initSeqRecall() {
  const phase = state.checklist.phase || 'preflight';
  const list = CHECKLISTS[phase];
  seqState.phase = phase;
  seqState.shuffled = list.items
    .map((item, i) => ({ ...item, origIdx: i }))
    .sort(() => Math.random() - 0.5);
  seqState.order = new Array(list.items.length).fill(-1);
  seqState.checked = false;
  seqState.dragSrc = null;
  seqState._selectedPool = null;
  seqState._selectedSlot = null;
  renderSeqRecall();
}

function renderSeqRecall() {
  const phase = seqState.phase;
  const list = CHECKLISTS[phase];
  const total = list.items.length;
  const placed = seqState.order.filter(x => x !== -1).length;

  if (seqState.checked) {
    renderSeqResults(list, total);
    return;
  }

  // Which origIdxs are already in a slot
  const inSlots = new Set(seqState.order.filter(x => x !== -1));

  let html = `
    <div class="seq-header">
      <div class="seq-phase-label">${list.label}</div>
      <div class="seq-score">${placed} / ${total}</div>
    </div>
    <div class="seq-prompt">
      Tap an item to select it, then tap a slot to place it.<br>
      Or drag directly into position. Tap a placed item to remove it.
    </div>
    <div class="seq-slot-area">
      <div class="seq-slot-label">// Your sequence — drag to reorder</div>
      <div class="seq-slots" id="seq-slots">
        ${seqState.order.map((origIdx, i) => {
          const item = origIdx !== -1 ? seqState.shuffled.find(s => s.origIdx === origIdx) : null;
          return `<div class="seq-slot ${item ? 'filled' : 'empty'}"
                       data-slot="${i}"
                       ondragover="seqDragOver(event,${i})"
                       ondrop="seqDrop(event,${i})"
                       ondragleave="seqDragLeave(event)"
                       onclick="seqSlotClick(${i})">
            <div class="seq-slot-num">${i + 1}</div>
            <div class="seq-slot-content">
              ${item
                ? `<span class="seq-slot-item"
                         draggable="true"
                         data-slot="${i}"
                         ondragstart="seqDragStartSlot(event,${i})"
                         ondragend="seqDragEnd(event)"
                         ontouchstart="seqTouchStart(event,'slot',${i})"
                         ontouchmove="seqTouchMove(event)"
                         ontouchend="seqTouchEnd(event)"
                         onclick="event.stopPropagation();seqSlotClick(${i})"
                         ><span class="seq-slot-item-text">${item.action}</span><span class="seq-slot-value">${item.value}</span></span>`
                : `<span class="seq-empty-label">drop here</span>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div class="seq-pool-label seq-slot-label">// Item pool — drag or tap to place</div>
    <div class="seq-pool" id="seq-pool"
         ondragover="seqPoolDragOver(event)"
         ondrop="seqPoolDrop(event)"
         ondragleave="seqDragLeave(event)">
      ${seqState.shuffled.map((item, i) => {
        const placed = inSlots.has(item.origIdx);
        const selected = seqState._selectedPool === i;
        return `<div class="seq-item ${placed ? 'placed' : ''} ${selected ? 'sel' : ''}"
                     data-pool="${i}"
                     draggable="${!placed}"
                     ondragstart="seqDragStartPool(event,${i})"
                     ondragend="seqDragEnd(event)"
                     ontouchstart="seqTouchStart(event,'pool',${i})"
                     ontouchmove="seqTouchMove(event)"
                     ontouchend="seqTouchEnd(event)"
                     onclick="seqPoolClick(${i})">
          <div class="seq-item-action">${item.action}</div>
          <div class="seq-item-value">${item.value}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:4px">
      <button class="btn btn-primary" style="flex:1" onclick="seqCheck()" ${placed < total ? 'disabled style="opacity:0.4;cursor:default;flex:1"' : 'style="flex:1"'}>Check Sequence</button>
      <button class="btn" onclick="initSeqRecall()">Restart</button>
    </div>`;

  document.getElementById('seq-content').innerHTML = html;
}

function renderSeqResults(list, total) {
  const correct = seqState.order.filter((origIdx, i) => origIdx === i).length;
  const pct = Math.round((correct / total) * 100);
  const cls = pct === 100 ? 'perfect' : pct >= 70 ? 'good' : 'needs-work';
  const msg = pct === 100 ? 'PERFECT' : pct >= 70 ? 'GOOD RUN' : 'KEEP DRILLING';

  let html = `
    <div class="seq-header">
      <div class="seq-phase-label">${list.label}</div>
      <div class="seq-score">${correct} / ${total} correct</div>
    </div>
    <div class="seq-result-banner">
      <div class="seq-result-big ${cls}">${msg}</div>
      <div class="seq-result-sub">${correct} of ${total} items in correct position</div>
    </div>
    <div class="seq-slot-area">
      <div class="seq-slot-label">// Results</div>
      <div class="seq-slots">
        ${list.items.map((item, i) => {
          const userOrigIdx = seqState.order[i];
          const isCorrect = userOrigIdx === i;
          const userItem = seqState.shuffled.find(s => s.origIdx === userOrigIdx);
          return `<div class="seq-slot ${isCorrect ? 'filled-correct' : 'filled-wrong'}">
            <div class="seq-slot-num">${i + 1}</div>
            <div class="seq-slot-content">
              ${isCorrect
                ? `${item.action} <span style="color:var(--accent2);font-size:10px">${item.value}</span>`
                : `<span style="color:var(--red)">${userItem ? userItem.action : '?'}</span>
                   <span style="font-size:10px;color:var(--text-dim)"> → correct: ${item.action}</span>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="initSeqRecall()">Try Again</button>
      <button class="btn" onclick="seqNextPhase()">Next Phase</button>
    </div>`;

  document.getElementById('seq-content').innerHTML = html;
}

function seqCheck() {
  const total = CHECKLISTS[seqState.phase].items.length;
  if (seqState.order.filter(x => x !== -1).length < total) return;
  seqState.checked = true;
  renderSeqRecall();
}

// ── TAP INTERACTION ──
function seqPoolClick(i) {
  const item = seqState.shuffled[i];
  const inSlots = new Set(seqState.order.filter(x => x !== -1));
  if (inSlots.has(item.origIdx)) return; // already placed — ignore

  if (seqState._selectedPool === i) {
    // Deselect
    seqState._selectedPool = null;
    renderSeqRecall();
    return;
  }

  // If a slot is selected, place there; else just select pool item
  if (seqState._selectedSlot !== undefined && seqState._selectedSlot !== null) {
    seqState.order[seqState._selectedSlot] = item.origIdx;
    seqState._selectedSlot = null;
    seqState._selectedPool = null;
  } else {
    seqState._selectedPool = i;
    seqState._selectedSlot = null;
  }
  renderSeqRecall();
}

function seqSlotClick(slotIdx) {
  const origIdx = seqState.order[slotIdx];

  if (origIdx !== -1) {
    // Slot has an item — remove it back to pool
    seqState.order[slotIdx] = -1;
    seqState._selectedPool = null;
    seqState._selectedSlot = null;
    renderSeqRecall();
    return;
  }

  // Empty slot
  if (seqState._selectedPool !== null && seqState._selectedPool !== undefined) {
    // Place selected pool item here
    const item = seqState.shuffled[seqState._selectedPool];
    seqState.order[slotIdx] = item.origIdx;
    seqState._selectedPool = null;
    seqState._selectedSlot = null;
  } else {
    // Select this slot
    seqState._selectedSlot = slotIdx;
    seqState._selectedPool = null;
  }
  renderSeqRecall();
}

// ── DRAG INTERACTION ──
function seqDragStartPool(e, i) {
  const item = seqState.shuffled[i];
  const inSlots = new Set(seqState.order.filter(x => x !== -1));
  if (inSlots.has(item.origIdx)) { e.preventDefault(); return; }
  seqState.dragSrc = { type: 'pool', idx: i };
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.4';
}

function seqDragStartSlot(e, slotIdx) {
  seqState.dragSrc = { type: 'slot', idx: slotIdx };
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.style.opacity = '0.4';
}

function seqDragEnd(e) {
  e.target.style.opacity = '';
  e.currentTarget && (e.currentTarget.style.opacity = '');
  document.querySelectorAll('.seq-slot, .seq-pool').forEach(el => el.classList.remove('drag-over'));
}

function seqDragOver(e, slotIdx) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.seq-slot').forEach(el => el.classList.remove('drag-over'));
  const slot = document.querySelector(`.seq-slot[data-slot="${slotIdx}"]`);
  if (slot) slot.classList.add('drag-over');
}

function seqPoolDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.getElementById('seq-pool').classList.add('drag-over');
}

function seqDragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function seqDrop(e, targetSlot) {
  e.preventDefault();
  document.querySelectorAll('.seq-slot, .seq-pool').forEach(el => el.classList.remove('drag-over'));
  const src = seqState.dragSrc;
  if (!src) return;

  const currentAtTarget = seqState.order[targetSlot];

  if (src.type === 'pool') {
    const item = seqState.shuffled[src.idx];
    // If target slot already has something, swap back to pool (just clear it)
    if (currentAtTarget !== -1) {
      seqState.order[targetSlot] = item.origIdx;
    } else {
      seqState.order[targetSlot] = item.origIdx;
    }
  } else if (src.type === 'slot') {
    const srcOrigIdx = seqState.order[src.idx];
    // Swap src and target slots
    seqState.order[targetSlot] = srcOrigIdx;
    seqState.order[src.idx] = currentAtTarget;
  }

  seqState.dragSrc = null;
  renderSeqRecall();
}

function seqPoolDrop(e) {
  e.preventDefault();
  document.getElementById('seq-pool').classList.remove('drag-over');
  const src = seqState.dragSrc;
  if (!src || src.type !== 'slot') return;
  // Return slot item to pool
  seqState.order[src.idx] = -1;
  seqState.dragSrc = null;
  renderSeqRecall();
}

// ── TOUCH DRAG (mobile) ──
let _touch = { src: null, ghost: null };

function seqTouchStart(e, type, idx) {
  const inSlots = new Set(seqState.order.filter(x => x !== -1));
  if (type === 'pool') {
    const item = seqState.shuffled[idx];
    if (inSlots.has(item.origIdx)) return;
  }
  _touch.src = { type, idx };
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const ghost = el.cloneNode(true);
  ghost.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;opacity:0.7;pointer-events:none;z-index:9999;margin:0;`;
  document.body.appendChild(ghost);
  _touch.ghost = ghost;
  _touch.offX = e.touches[0].clientX - rect.left;
  _touch.offY = e.touches[0].clientY - rect.top;
}

function seqTouchMove(e) {
  if (!_touch.ghost) return;
  e.preventDefault();
  const t = e.touches[0];
  _touch.ghost.style.left = (t.clientX - _touch.offX) + 'px';
  _touch.ghost.style.top = (t.clientY - _touch.offY) + 'px';
}

function seqTouchEnd(e) {
  if (!_touch.ghost) return;
  const t = e.changedTouches[0];
  _touch.ghost.remove();
  _touch.ghost = null;

  const el = document.elementFromPoint(t.clientX, t.clientY);
  if (!el) { _touch.src = null; return; }

  const slot = el.closest('[data-slot]');
  const pool = el.closest('#seq-pool');
  const src = _touch.src;
  _touch.src = null;

  if (slot) {
    const targetSlot = parseInt(slot.dataset.slot);
    const currentAtTarget = seqState.order[targetSlot];
    if (src.type === 'pool') {
      seqState.order[targetSlot] = seqState.shuffled[src.idx].origIdx;
    } else {
      seqState.order[targetSlot] = seqState.order[src.idx];
      seqState.order[src.idx] = currentAtTarget;
    }
    renderSeqRecall();
  } else if (pool && src.type === 'slot') {
    seqState.order[src.idx] = -1;
    renderSeqRecall();
  }
}

function seqNextPhase() {
  const phases = Object.keys(CHECKLISTS);
  const idx = phases.indexOf(seqState.phase);
  const next = phases[(idx + 1) % phases.length];
  seqState.phase = next;
  state.checklist.phase = next;
  document.querySelectorAll('.phase-btn').forEach((b, i) => {
    b.classList.toggle('active', phases[i] === next);
  });
  initSeqRecall();
}

// ══════════════════════════════════════
// RADIO MODE SWITCHING
// ══════════════════════════════════════

let radioInputMode = 'chips'; // 'chips' | 'speak'
let speechState = { recognition: null, listening: false, transcript: '' };

function setRadioMode(mode, btn) {
  document.querySelectorAll('#view-radio .cl-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('radio-calls-mode').style.display = mode === 'chips' ? '' : 'none';
  document.getElementById('radio-atis-mode').style.display = mode === 'atis' ? '' : 'none';
  if (mode === 'atis' && !atisState.generated) newATIS();
}

function setRadioInputMode(mode) {
  radioInputMode = mode;
  document.getElementById('rbtn-chips').classList.toggle('active', mode === 'chips');
  document.getElementById('rbtn-speak').classList.toggle('active', mode === 'speak');
  document.getElementById('radio-chip-area').style.display = mode === 'chips' ? '' : 'none';
  document.getElementById('radio-speak-area').style.display = mode === 'speak' ? '' : 'none';
  document.getElementById('radio-feedback').classList.remove('show');

  const hdr = document.getElementById('radio-builder-header');
  hdr.textContent = mode === 'chips'
    ? 'Build your call — tap words in order'
    : 'Say your radio call out loud';

  if (mode === 'speak') {
    speechState.transcript = '';
    document.getElementById('radio-speak-output').innerHTML = '<span class="placeholder">Tap the mic and say your call...</span>';
    document.getElementById('mic-status').textContent = '';
  }
}

function checkRadioCallActive() {
  if (radioInputMode === 'chips') checkRadioCall();
  else checkSpeechCall();
}

function clearRadioCallActive() {
  if (radioInputMode === 'chips') retryRadioCall();
  else {
    speechState.transcript = '';
    document.getElementById('radio-speak-output').innerHTML = '<span class="placeholder">Tap the mic and say your call...</span>';
    document.getElementById('radio-feedback').classList.remove('show');
    document.getElementById('mic-status').textContent = '';
  }
}

// ══════════════════════════════════════
// SPEECH RECOGNITION
// ══════════════════════════════════════

function toggleSpeech() {
  if (speechState.listening) {
    stopSpeech();
  } else {
    startSpeech();
  }
}

function startSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    document.getElementById('mic-status').textContent = 'Speech not supported in this browser';
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 3;

  speechState.recognition = rec;
  speechState.listening = true;
  speechState.transcript = '';

  const btn = document.getElementById('mic-btn');
  const status = document.getElementById('mic-status');
  const output = document.getElementById('radio-speak-output');

  btn.classList.add('listening');
  document.getElementById('mic-label').textContent = 'Listening...';
  status.textContent = 'Speak now';
  document.getElementById('radio-feedback').classList.remove('show');

  rec.onresult = (e) => {
    let interim = '';
    let final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    const display = final || interim;
    output.textContent = display;
    if (final) speechState.transcript = final.trim();
  };

  rec.onerror = (e) => {
    status.textContent = e.error === 'not-allowed'
      ? 'Microphone access denied — check browser settings'
      : `Error: ${e.error}`;
    stopSpeech();
  };

  rec.onend = () => {
    stopSpeech();
    if (speechState.transcript) {
      status.textContent = 'Tap "Check Call" to evaluate';
    }
  };

  rec.start();
}

function stopSpeech() {
  speechState.listening = false;
  if (speechState.recognition) {
    try { speechState.recognition.stop(); } catch(e) {}
    speechState.recognition = null;
  }
  const btn = document.getElementById('mic-btn');
  btn.classList.remove('listening');
  document.getElementById('mic-label').textContent = 'Tap to speak';
}

function checkSpeechCall() {
  if (!speechState.transcript) {
    document.getElementById('mic-status').textContent = 'Say your call first';
    return;
  }

  const s = RADIO_SCENARIOS[state.radio.scenarioIdx];
  const result = scoreSpeechCall(speechState.transcript, s.ideal, s.words);

  const fb = document.getElementById('radio-feedback');
  fb.classList.add('show');

  const hdr = document.getElementById('feedback-header');
  const isGood = result.score >= 0.8;
  hdr.className = 'feedback-header ' + (isGood ? 'correct' : 'incorrect');
  hdr.textContent = isGood
    ? `✓ Good call — ${Math.round(result.score * 100)}% match`
    : `✗ ${Math.round(result.score * 100)}% match — review below`;

  // Word-by-word highlight
  const wordHtml = result.words.map(w =>
    `<span class="speech-word ${w.status}">${w.word}</span>`
  ).join(' ');

  document.getElementById('feedback-ideal').innerHTML =
    `<div style="margin-bottom:8px;font-size:11px;color:#9ab8d0">Ideal call — word match:</div>
     <div class="speech-score" style="padding:0;background:none;border:none;flex-wrap:wrap;gap:4px">${wordHtml}</div>`;

  let note = s.note;
  const usedDistractors = s.words
    ? [] // speech mode doesn't use chips so no distractor tracking
    : [];
  document.getElementById('feedback-note').innerHTML = note +
    (!isGood ? `<br><br><div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn btn-sm" onclick="clearRadioCallActive()">↩ Try Again</button>
      <button class="btn btn-sm" onclick="revealRadioCall()">Show Ideal</button>
    </div>` : '');
}

function scoreSpeechCall(spoken, ideal, words) {
  // Normalize both strings
  const normalize = s => s.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\b(one|two|three|four|five|six|seven|eight|nine|zero|niner)\b/g, m => ({
      one:'1',two:'2',three:'3',four:'4',five:'5',
      six:'6',seven:'7',eight:'8',nine:'9',niner:'9',zero:'0'
    }[m] || m))
    .trim();

  const spokenNorm = normalize(spoken);
  const idealNorm = normalize(ideal);

  const spokenWords = spokenNorm.split(/\s+/);
  const idealWords = idealNorm.split(/\s+/);

  // Score individual key words from the scenario words array
  const keyWords = words.flatMap(w => normalize(w).split(/\s+/));

  const wordResults = keyWords.map(kw => {
    const exact = spokenWords.includes(kw);
    const close = !exact && spokenWords.some(sw =>
      sw.length > 2 && (sw.startsWith(kw.slice(0,3)) || kw.startsWith(sw.slice(0,3)))
    );
    return { word: kw, status: exact ? 'match' : close ? 'close' : 'miss' };
  });

  const matched = wordResults.filter(w => w.status === 'match').length;
  const close = wordResults.filter(w => w.status === 'close').length;
  const score = (matched + close * 0.5) / keyWords.length;

  return { score, words: wordResults };
}

// ══════════════════════════════════════
// ATIS DECODER
// ══════════════════════════════════════


let atisState = {
  generated: false,
  data: null,
  synth: null,
  utterance: null,
  playing: false,
  checked: false,
};

function generateATIS() {
  const ap = ATIS_AIRPORTS[Math.floor(Math.random() * ATIS_AIRPORTS.length)];
  const info = ATIS_INFO_CODES[Math.floor(Math.random() * ATIS_INFO_CODES.length)];
  const hour = String(Math.floor(Math.random() * 24)).padStart(2,'0');
  const min = ['00','30','45','55'][Math.floor(Math.random() * 4)];
  const time = `${hour}${min}Z`;

  const windDir = [Math.floor(Math.random() * 36) * 10 || 360];
  const windSpd = Math.floor(Math.random() * 20) + 3;
  const gusty = Math.random() > 0.6;
  const gustSpd = gusty ? windSpd + Math.floor(Math.random() * 10) + 5 : null;

  const vis = [1, 1.5, 2, 3, 5, 6, 7, 8, 9, 10][Math.floor(Math.random() * 10)];
  const hasCeiling = Math.random() > 0.3;
  const ceilAlt = [500, 800, 1200, 1500, 2000, 2500, 3000, 3500][Math.floor(Math.random() * 8)];
  const ceilType = ['FEW','SCT','BKN','OVC'][Math.floor(Math.random() * 4)];

  const temp = Math.floor(Math.random() * 30) + 5;
  const dew = temp - Math.floor(Math.random() * 15);
  const altimeter = (29.50 + Math.random() * 1.0).toFixed(2);
  const rwy = RUNWAYS[Math.floor(Math.random() * RUNWAYS.length)];
  const app = APPROACHES[Math.floor(Math.random() * APPROACHES.length)];

  const windStr = gusty
    ? `wind ${windDir} at ${windSpd}, gusting ${gustSpd}`
    : `wind ${windDir} at ${windSpd}`;
  const ceilStr = hasCeiling
    ? `${ceilType} ${ceilAlt}`
    : 'sky clear';
  const visStr = vis >= 10 ? '10 or more' : vis.toString();

  const script = `${ap.name} information ${info}, ${time}. ${windStr}. Visibility ${visStr}. ${ceilStr}. Temperature ${temp}, dew point ${dew}. Altimeter ${altimeter}. ${app} approach in use, landing and departing runway ${rwy}. Advise on initial contact you have information ${info}.`;

  return {
    ap, info, time,
    windDir: windDir[0], windSpd, gusty, gustSpd,
    vis, hasCeiling, ceilAlt: hasCeiling ? ceilAlt : null, ceilType: hasCeiling ? ceilType : null,
    temp, dew,
    altimeter,
    rwy,
    script,
    fields: [
      { key: 'info',      label: 'Info Code',    answer: info,                    hint: 'Alpha, Bravo...' },
      { key: 'wind',      label: 'Wind',         answer: `${windDir[0]}@${windSpd}${gusty?`G${gustSpd}`:''}`, hint: 'e.g. 270@15 or 270@15G22' },
      { key: 'vis',       label: 'Visibility',   answer: vis >= 10 ? '10+' : String(vis), hint: 'SM' },
      { key: 'ceiling',   label: 'Ceiling',      answer: hasCeiling ? `${ceilType} ${ceilAlt}` : 'SKC', hint: 'e.g. BKN 2500 or SKC' },
      { key: 'temp',      label: 'Temp / Dew',   answer: `${temp}/${dew}`,        hint: 'e.g. 22/15' },
      { key: 'altimeter', label: 'Altimeter',    answer: altimeter,               hint: 'e.g. 29.92' },
      { key: 'runway',    label: 'Active Runway', answer: rwy,                    hint: 'e.g. 27' },
    ]
  };
}

function newATIS() {
  if (atisState.playing) stopATIS();
  atisState.data = generateATIS();
  atisState.generated = true;
  atisState.checked = false;

  const d = atisState.data;
  document.getElementById('atis-airport').textContent = `${d.ap.id} INFORMATION ${d.info.toUpperCase()}`;
  document.getElementById('atis-time').textContent = d.time;
  document.getElementById('atis-transcript').innerHTML = '<span class="atis-trans-label">Tap Play to hear the ATIS — then fill in what you heard</span>';
  document.getElementById('atis-play-btn').textContent = '▶ Play';
  document.getElementById('atis-results').style.display = 'none';
  document.getElementById('atis-form').style.display = '';

  // Render input fields
  document.getElementById('atis-fields').innerHTML = d.fields.map(f => `
    <div class="atis-field">
      <div class="atis-field-label">${f.label}</div>
      <input class="atis-input" id="atis-${f.key}" placeholder="${f.hint}" autocomplete="off" spellcheck="false"/>
    </div>
  `).join('');
}

function playATIS() {
  if (!atisState.data) return;

  if (atisState.playing) {
    stopATIS();
    return;
  }

  const synth = window.speechSynthesis;
  if (!synth) {
    document.getElementById('atis-transcript').textContent = 'Text-to-speech not available — read the transcript below.';
    document.getElementById('atis-transcript').classList.add('atis-playing');
    document.getElementById('atis-transcript').textContent = atisState.data.script;
    return;
  }

  const utt = new SpeechSynthesisUtterance(atisState.data.script);
  utt.rate = 0.9;
  utt.pitch = 1.0;
  utt.volume = 1.0;

  // Try to get a good voice
  const voices = synth.getVoices();
  const preferred = voices.find(v => v.name.includes('Daniel') || v.name.includes('Alex') || v.lang === 'en-US');
  if (preferred) utt.voice = preferred;

  atisState.synth = synth;
  atisState.utterance = utt;
  atisState.playing = true;

  document.getElementById('atis-play-btn').textContent = '⏹ Stop';
  document.getElementById('atis-transcript').innerHTML = `<span class="atis-playing">Playing ATIS... listen carefully</span>`;

  utt.onend = () => {
    atisState.playing = false;
    document.getElementById('atis-play-btn').textContent = '▶ Play Again';
    document.getElementById('atis-transcript').innerHTML =
      `<span style="color:#9ab8d0;font-size:11px">ATIS read — fill in what you heard. You can play again if needed.</span>`;
  };

  utt.onerror = () => {
    atisState.playing = false;
    document.getElementById('atis-play-btn').textContent = '▶ Play';
    // Fallback: show transcript
    document.getElementById('atis-transcript').textContent = atisState.data.script;
  };

  synth.speak(utt);
}

function stopATIS() {
  if (atisState.synth) atisState.synth.cancel();
  atisState.playing = false;
  document.getElementById('atis-play-btn').textContent = '▶ Play Again';
}

function normalizeATISInput(val, key) {
  return val.trim().toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/,/g, '/')
    .replace(/\bskc\b|\bsky clear\b|\bclear\b/, 'skc')
    .replace(/\bvfr\b/, 'skc');
}

function checkATIS() {
  if (!atisState.data) return;
  atisState.checked = true;
  const d = atisState.data;

  let correct = 0;
  const results = d.fields.map(f => {
    const input = document.getElementById(`atis-${f.key}`);
    const userVal = input ? input.value.trim().toUpperCase() : '';
    const answer = f.answer.toString().toUpperCase();

    // Fuzzy match for each field
    let isCorrect = false;
    const u = userVal.replace(/\s/g,'');
    const a = answer.replace(/\s/g,'');

    if (f.key === 'altimeter') {
      isCorrect = Math.abs(parseFloat(userVal) - parseFloat(answer)) < 0.02;
    } else if (f.key === 'wind') {
      // Accept direction±10 and speed±2
      const uMatch = userVal.match(/(\d+)@(\d+)(?:G(\d+))?/i);
      const aMatch = answer.match(/(\d+)@(\d+)(?:G(\d+))?/i);
      if (uMatch && aMatch) {
        const dirOk = Math.abs(parseInt(uMatch[1]) - parseInt(aMatch[1])) <= 10;
        const spdOk = Math.abs(parseInt(uMatch[2]) - parseInt(aMatch[2])) <= 2;
        isCorrect = dirOk && spdOk;
      } else {
        isCorrect = u === a;
      }
    } else if (f.key === 'vis') {
      const uv = parseFloat(userVal.replace('+',''));
      const av = parseFloat(answer.replace('+',''));
      isCorrect = !isNaN(uv) && !isNaN(av) && Math.abs(uv - av) < 0.6;
    } else if (f.key === 'ceiling') {
      isCorrect = u === a || u.includes(a) || a.includes(u);
    } else {
      isCorrect = u === a;
    }

    if (isCorrect) correct++;
    if (input) input.classList.add(isCorrect ? 'correct' : 'wrong');

    return { label: f.label, userVal, answer: f.answer, isCorrect };
  });

  const pct = Math.round((correct / d.fields.length) * 100);
  const cls = pct === 100 ? 'perfect' : pct >= 70 ? 'good' : 'needs-work';
  const msg = pct === 100 ? 'COPIED' : pct >= 70 ? 'MOSTLY GOOD' : 'KEEP DRILLING';

  document.getElementById('atis-form').style.display = 'none';

  const resultsEl = document.getElementById('atis-results');
  resultsEl.style.display = '';
  resultsEl.innerHTML = `
    <div class="atis-score-banner">
      <div class="atis-score-big ${cls}">${msg}</div>
      <div class="atis-score-sub">${correct} of ${d.fields.length} correct · ${pct}%</div>
    </div>
    <div style="background:#111f30;border:1px solid #2a4060;border-radius:4px;padding:14px;margin-bottom:14px">
      ${results.map(r => `
        <div class="atis-result-row">
          <div class="atis-result-label">${r.label}</div>
          <div class="atis-result-yours ${r.isCorrect ? 'correct' : 'wrong'}">${r.userVal || '—'}</div>
          ${!r.isCorrect ? `<div class="atis-result-correct">→ ${r.answer}</div>` : ''}
        </div>
      `).join('')}
    </div>
    <div style="background:#0a1828;border:1px solid #2a4060;border-radius:4px;padding:12px;margin-bottom:14px;font-family:var(--mono);font-size:12px;color:#c8d8e8;line-height:1.8">
      <div style="font-size:9px;letter-spacing:3px;color:#9ab8d0;margin-bottom:8px">// FULL ATIS TEXT</div>
      ${d.script}
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" onclick="newATIS()">New ATIS</button>
      <button class="btn" onclick="playATISAgain()">▶ Play Again</button>
    </div>`;
}

function playATISAgain() {
  // Regenerate speech from stored script
  document.getElementById('atis-results').style.display = 'none';
  document.getElementById('atis-form').style.display = '';
  // Re-render fields with correct answers shown
  const d = atisState.data;
  document.getElementById('atis-fields').innerHTML = d.fields.map(f => `
    <div class="atis-field">
      <div class="atis-field-label">${f.label}</div>
      <input class="atis-input correct" id="atis-${f.key}" value="${f.answer}" readonly/>
    </div>
  `).join('');
  playATIS();
}

document.addEventListener('DOMContentLoaded', () => {
  initChecklist();
  initRadio();
  initEmergency();
  lookupAirport();
});
