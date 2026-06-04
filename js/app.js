// HTML is built in JS so rendering logic and markup stay together rather than split across template files.
// Chose vanilla over a framework (React etc.) to keep the app deployable as plain files with no build toolchain.
// Worth revisiting if rendering logic becomes harder to maintain, or the project gains collaborators
// (human or AI — React/JSX dominates training data, so AI-generated code fits existing React patterns
// more consistently; in vanilla JS, valid approaches vary enough that AI output often diverges from
// codebase conventions and needs more review).

let CHECKLISTS = ALL_AIRCRAFT.cessna172ikl.checklists;
let EMERGENCIES = ALL_AIRCRAFT.cessna172ikl.emergencies;
let currentAircraft = 'cessna172ikl';


let state = {
  checklist: { phase: 'preflight', completed: {} },
  radio: { scenarioIdx: 0, scenario: null, activeGroup: null, builtCall: [], builtCallKeys: [], usedWords: new Set() },
  emergency: { current: 0, answered: false, correct: 0, total: 0 }
};

let currentView = 'drills-hub';
let currentBottomTab = 'drills';
let currentDrill = null; // 'checklist'|'radio'|'procedures'|'emergency'
let currentClMode = 'reference';
let currentRadioMode = 'chips';
let currentProcScreen = 'proc-screen-setup';
let currentProcMode = 'airport';
// Prevents updateHash() from writing the URL while we're parsing it on load/hashchange,
// which would cause a feedback loop and corrupt the hash.
let _restoringNav = false;

function _stopBodyScroll(e) {
  if (!e.target.closest('#drill-sheet, #cf-aircraft-sheet')) e.preventDefault();
}
function _lockScroll() {
  document.addEventListener('touchmove', _stopBodyScroll, { passive: false });
}
function _unlockScroll() {
  document.removeEventListener('touchmove', _stopBodyScroll);
}

// ── DAY / NIGHT MODE ─────────────────────────────────────────────────────────
// data-mode is set on <html> by the inline boot script in <head>.
// Once the user manually toggles, matchMedia changes are ignored.

let _modeManual = !!localStorage.getItem('cf_mode');

(function _initModeListener() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', function (e) {
    if (_modeManual) return;
    _applyMode(e.matches ? 'night' : 'day', false);
  });
})();

function _applyMode(mode, persist) {
  document.documentElement.dataset.mode = mode;
  const btn = document.getElementById('cf-mode-toggle');
  if (btn) {
    btn.setAttribute('aria-label', mode === 'night' ? 'Switch to day mode' : 'Switch to night mode');
    btn.setAttribute('aria-pressed', mode === 'night' ? 'true' : 'false');
  }
  if (persist) {
    localStorage.setItem('cf_mode', mode);
    _modeManual = true;
  }
}

function toggleMode() {
  const current = document.documentElement.dataset.mode || 'day';
  _applyMode(current === 'day' ? 'night' : 'day', true);
}
// ─────────────────────────────────────────────────────────────────────────────

function updateHash() {
  if (_restoringNav) return;
  const parts = [];
  parts.push(currentAircraft);
  parts.push(currentView);
  if (currentView === 'checklist') {
    if (currentClMode !== 'reference' || state.checklist.phase !== 'preflight') {
      parts.push(currentClMode);
      parts.push(state.checklist.phase);
    }
  } else if (currentView === 'radio') {
    if (currentRadioMode === 'atis') parts.push('atis');
    else if (currentRadioMode === 'alpha') parts.push('alpha');
    else if (radioInputMode === 'speak') parts.push('speak');
  } else if (currentView === 'procedures') {
    if (currentProcMode === 'vspeeds') {
      parts.push('vspeeds');
    } else if (currentProcScreen === 'proc-screen-steps' && procState._lastProcId && procState.airport.icao) {
      parts.push(procState.airport.icao);
      parts.push(procState._lastProcId);
      parts.push(procState.inRecall ? 'recall' : procState.currentStep);
    } else {
      parts.push(currentProcMode); // 'airport' or 'airwork'
    }
  }
  const hash = '#' + parts.join('/');
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function switchAircraft(key, btn) {
  if (key === currentAircraft) return;
  currentAircraft = key;
  const ac = ALL_AIRCRAFT[key];
  CHECKLISTS = ac.checklists;
  EMERGENCIES = ac.emergencies;
  _quizAllPool = null; // invalidate cross-phase distractor cache

  // Update all aircraft buttons (sidebar)
  document.querySelectorAll('[data-aircraft]').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`[data-aircraft="${key}"]`).forEach(b => b.classList.add('active'));

  // Update header aircraft button and drills hub context line
  const acLabel = document.getElementById('cf-aircraft-label');
  if (acLabel) acLabel.textContent = ac.label || ac.name;
  closeAircraftSheet();

  // Update page eyebrow
  document.getElementById('cl-section-label').textContent = `↳ REFERENCE · ${ac.name.toUpperCase()} · POH-DERIVED`;

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
  updateHash();
}

function openAircraftSheet() {
  const ac = ALL_AIRCRAFT[currentAircraft];
  const s = ac.speeds;
  document.getElementById('cf-sheet-name').textContent = ac.name;
  document.getElementById('cf-sheet-sub').textContent = `${ac.variant} · ${ac.engine}`;

  const speeds = [
    ['Vr', s.vr], ['Vx', s.vx], ['Vy', s.vy],
    ['Vfe', s.vfe], ['Va', s.va], ['Vno', s.vno],
    ['Vne', s.vne], ['Vs', s.vs], ['Vs0', s.vs0],
    ['Vg', s.bestGlideGross ? `${s.bestGlide} / ${s.bestGlideGross} gross` : s.bestGlide],
    ['Approach', s.approach], ['Short Final', s.shortFinal],
  ];
  document.getElementById('cf-sheet-speeds').innerHTML = speeds.map(([label, val]) =>
    `<div class="cf-sheet-speed-row"><span class="cf-sheet-speed-label">${label}</span><span class="cf-sheet-speed-val">${val}</span></div>`
  ).join('');

  document.getElementById('cf-sheet-switch-btns').innerHTML = Object.entries(ALL_AIRCRAFT).map(([key, a]) =>
    `<button class="cf-hub-btn${key === currentAircraft ? ' active' : ''}" data-aircraft="${key}" onclick="switchAircraft('${key}', this)">${a.name}</button>`
  ).join('');

  _lockScroll();
  document.getElementById('cf-sheet-backdrop').classList.add('open');
  document.getElementById('cf-aircraft-sheet').classList.add('open');
}

function closeAircraftSheet() {
  _unlockScroll();
  document.getElementById('cf-sheet-backdrop').classList.remove('open');
  document.getElementById('cf-aircraft-sheet').classList.remove('open');
}

function openDrillSheet() {
  const sheet = document.getElementById('drill-sheet');
  const backdrop = document.getElementById('drill-sheet-backdrop');
  sheet.style.display = '';
  backdrop.style.display = '';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    backdrop.classList.add('open');
    sheet.classList.add('open');
  }));
}

function closeDrillSheet() {
  const backdrop = document.getElementById('drill-sheet-backdrop');
  const sheet = document.getElementById('drill-sheet');
  backdrop.style.transition = 'none';
  backdrop.classList.remove('open');
  backdrop.style.display = 'none';
  requestAnimationFrame(() => { backdrop.style.transition = ''; });
  sheet.classList.remove('open');
  sheet.addEventListener('transitionend', () => {
    sheet.style.display = 'none';
  }, { once: true });
}

function selectDrill(drill, mode) {
  closeDrillSheet();
  switchDrill(drill);
  if (drill === 'checklist' && mode === 'recall') {
    const btn = [...document.querySelectorAll('#view-checklist .cl-mode-btn')]
      .find(b => b.getAttribute('onclick').includes("'recall'"));
    if (btn) setClMode('recall', btn);
  } else if (drill === 'radio' && mode !== 'chips') {
    const btn = [...document.querySelectorAll('#view-radio .cl-mode-btn')]
      .find(b => b.getAttribute('onclick').includes(`'${mode}'`));
    if (btn) setRadioMode(mode, btn);
  } else if (drill === 'procedures' && mode === 'vspeeds') {
    _setProcModeUI('vspeeds');
    if (!vspeedState.started && !vspeedState.finished) initVspeedDrill();
    updateHash();
  } else if (drill === 'procedures' && (mode === 'airport' || mode === 'airwork')) {
    _setProcModeUI(mode);
    filterProcedures(mode);
    updateHash();
  }
}

function _switchViewOnly(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById('view-' + name);
  if (el) el.classList.add('active');
  currentView = name;
}

function _setActiveDrill(type) {
  document.querySelectorAll('[data-drill]').forEach(b => {
    b.classList.toggle('active', b.dataset.drill === type);
  });
  currentDrill = type;
}

function _setBottomTabActive(tabName) {
  document.querySelectorAll('.cf-bottom-tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabName);
  });
  currentBottomTab = tabName;
}

function switchDrill(type) {
  _setActiveDrill(type);
  _setBottomTabActive('drills');
  if (type === 'checklist')        _switchViewOnly('checklist');
  else if (type === 'radio')       _switchViewOnly('radio');
  else if (type === 'procedures')  { _switchViewOnly('procedures'); _setProcModeUI('airport'); showProcScreen('proc-screen-setup'); filterProcedures('airport'); }
  else if (type === 'emergency')   _switchViewOnly('emergency');
  updateHash();
}

function switchBottomTab(tabName) {
  _setBottomTabActive(tabName);
  if (tabName === 'drills') {
    if (!currentDrill) _switchViewOnly('drills-hub');
    openDrillSheet();
  } else if (tabName === 'more') {
    _switchViewOnly('more-hub');
  }
}

// ── CHECKLIST ──
function initChecklist() {
  const phases = Object.keys(CHECKLISTS);
  document.getElementById('phase-selector').innerHTML = phases.map(p =>
    `<button class="phase-btn ${p === state.checklist.phase ? 'active' : ''}" onclick="selectPhase('${p}')">${CHECKLISTS[p].label}</button>`
  ).join('');
  updatePreflightBtn();
  renderChecklist();
}

function selectPhase(phase) {
  state.checklist.phase = phase;
  document.querySelectorAll('.phase-btn').forEach((b, i) => {
    b.classList.toggle('active', Object.keys(CHECKLISTS)[i] === phase);
  });
  document.getElementById('complete-banner').classList.remove('show');
  renderChecklist();
  if (currentClMode === 'recall') initSeqRecall();
  updateHash();
}

// ── INLINE WHY? QUIZ (Before Start phase) ──────────────────────────────────
// clQuizState[phase][idx] = { status: 'idle'|'open'|'correct'|'wrong', choices: [] }
let clQuizState = {};


let _quizAllPool = null;
function _getQuizPool() {
  if (!_quizAllPool) {
    _quizAllPool = Object.values(CHECKLISTS).flatMap(cl => cl.items).filter(it => it.why && it.why.trim());
  }
  return _quizAllPool;
}

function _pickAnswerText(item) {
  if (item.answerVariants && item.answerVariants.length > 0) {
    return item.answerVariants[Math.floor(Math.random() * item.answerVariants.length)];
  }
  return _firstSentence(item.why);
}

function _pregenItem(phase, idx) {
  const item = CHECKLISTS[phase].items[idx];
  if (!item) return;
  if (item.checks) {
    clQuizState[phase]._pregen[idx] = {
      checks: item.checks.slice().sort(() => Math.random() - 0.5).map(c => ({ ...c, selected: false })),
    };
    return;
  }
  if (!item.why) return;
  const correctText = _pickAnswerText(item);
  let distractors;
  if (item.distractors && item.distractors.length >= 3) {
    distractors = item.distractors
      .slice().sort(() => Math.random() - 0.5).slice(0, 3)
      .map(text => ({ text, isCorrect: false }));
  } else {
    distractors = _getQuizPool()
      .slice().sort(() => Math.random() - 0.5)
      .filter(it => it !== item && _firstSentence(it.why) !== correctText)
      .slice(0, 3)
      .map(it => ({ text: _firstSentence(it.why), isCorrect: false }));
  }
  const question = item.seqQuestion && Math.random() < 0.5
    ? item.seqQuestion
    : 'Why is this on the checklist?';
  clQuizState[phase]._pregen[idx] = {
    question,
    choices: [{ text: correctText, isCorrect: true }, ...distractors].sort(() => Math.random() - 0.5),
  };
}

function _pregenPhaseChoices(phase) {
  clQuizState[phase]._pregen = {};
  CHECKLISTS[phase].items.forEach((item, idx) => {
    if (item.why && item.why.trim()) _pregenItem(phase, idx);
  });
}

function openItemQuiz(phase, idx) {
  if (!clQuizState[phase]) clQuizState[phase] = {};
  const cur = clQuizState[phase][idx] || { status: 'idle' };
  if (cur.status !== 'idle' && cur.status !== 'skipped') return;
  if (!clQuizState[phase]._pregen) _pregenPhaseChoices(phase);
  // Regenerate fresh choices when coming back to a skipped item
  if (!clQuizState[phase]._pregen[idx] || cur.status === 'skipped') _pregenItem(phase, idx);
  const pre = clQuizState[phase]._pregen[idx];
  if (!pre) return;
  const item = CHECKLISTS[phase].items[idx];
  if (item.checks) {
    clQuizState[phase][idx] = { status: 'open', checks: pre.checks };
  } else {
    clQuizState[phase][idx] = { status: 'open', question: pre.question, choices: pre.choices };
  }
  renderChecklist();
}

function closeItemQuiz(phase, idx) {
  if (!clQuizState[phase] || !clQuizState[phase][idx] || clQuizState[phase][idx].status !== 'open') return;
  clQuizState[phase][idx] = { status: 'idle' };
  // Regenerate this item's pregen so next open gets a fresh question and choices
  if (clQuizState[phase]._pregen) _pregenItem(phase, idx);
  renderChecklist();
}

function nextItemQuiz(phase, idx) {
  const items = CHECKLISTS[phase].items;
  const qs = clQuizState[phase] || {};
  const nextIdx = items.findIndex((_, i) => i > idx && (!qs[i] || qs[i].status === 'idle' || qs[i].status === 'skipped'));
  if (nextIdx === -1) return;
  if (clQuizState[phase] && clQuizState[phase][idx]) clQuizState[phase][idx].collapsed = true;
  openItemQuiz(phase, nextIdx);
  requestAnimationFrame(() => {
    document.querySelector(`#checklist-items li:nth-child(${idx + 1})`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function answerItemQuiz(phase, idx, isCorrect) {
  if (!clQuizState[phase] || !clQuizState[phase][idx]) return;
  clQuizState[phase][idx].status = isCorrect ? 'correct' : 'wrong';
  clQuizState[phase][idx].collapsed = false;
  renderChecklist();
}

function toggleQuizResult(phase, idx) {
  const qs = clQuizState[phase] && clQuizState[phase][idx];
  if (!qs || (qs.status !== 'correct' && qs.status !== 'wrong')) return;
  qs.collapsed = !qs.collapsed;
  renderChecklist();
}

function skipItemQuiz(phase, idx) {
  if (!clQuizState[phase]) clQuizState[phase] = {};
  clQuizState[phase][idx] = { status: 'skipped' };
  renderChecklist();
}

function togglePreflightCheck(phase, idx, ci) {
  const qs = clQuizState[phase] && clQuizState[phase][idx];
  if (!qs || qs.status !== 'open') return;
  qs.checks[ci].selected = !qs.checks[ci].selected;
  renderChecklist();
}

function submitPreflightQuiz(phase, idx) {
  const qs = clQuizState[phase] && clQuizState[phase][idx];
  if (!qs || qs.status !== 'open') return;
  const allCorrectSelected = qs.checks.filter(c => c.correct).every(c => c.selected);
  const noWrongSelected = qs.checks.filter(c => !c.correct).every(c => !c.selected);
  qs.status = (allCorrectSelected && noWrongSelected) ? 'correct' : 'wrong';
  qs.collapsed = false;
  renderChecklist();
}

function _renderPreflightQuizItem(phase, item, idx) {
  const qs = (clQuizState[phase] && clQuizState[phase][idx]) || { status: 'idle' };
  const { status } = qs;

  const phaseItems = CHECKLISTS[phase].items;
  const isDupe = item.value && phaseItems.filter(it => it.action === item.action).length > 1;
  const displayAction = isDupe ? `${item.action} — ${item.value.toLowerCase().replace(/\s+[—–-]\s+.*$/, '')}` : item.action;

  const dotSvg = '<svg width="11" height="9" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const dotHtml = status === 'correct'  ? `<div class="cl-qitem-dot cl-qitem-dot--correct">${dotSvg}</div>`
                : status === 'wrong'    ? `<div class="cl-qitem-dot cl-qitem-dot--wrong">✗</div>`
                : status === 'skipped'  ? `<div class="cl-qitem-dot cl-qitem-dot--skipped">—</div>`
                : status === 'open'     ? `<div class="cl-qitem-dot cl-qitem-dot--open"></div>`
                :                         `<div class="cl-qitem-dot cl-qitem-dot--idle">?</div>`;

  let bodyExtra = '';
  if (status === 'open') {
    const checks = qs.checks || [];
    const anySelected = checks.some(c => c.selected);
    bodyExtra = `
      <div class="cl-qitem-panel">
        <div class="cl-qitem-panel-top">
          <div class="cl-qitem-question">Select all that apply:</div>
          <button class="cl-qitem-collapse" onclick="event.stopPropagation();closeItemQuiz('${phase}',${idx})" title="Collapse">✕</button>
        </div>
        <div class="cl-qitem-checks">
          ${checks.map((c, ci) => `<button class="cl-qitem-check-btn${c.selected ? ' cl-qitem-check-btn--sel' : ''}" onclick="event.stopPropagation();togglePreflightCheck('${phase}',${idx},${ci})"><div class="cl-qitem-check-mark">${c.selected ? dotSvg : ''}</div><span>${c.text}</span></button>`).join('')}
        </div>
        <div class="cl-qitem-check-actions">
          <button class="cl-qitem-submit"${anySelected ? '' : ' disabled'} onclick="event.stopPropagation();submitPreflightQuiz('${phase}',${idx})">Check</button>
          <button class="cl-qitem-skip" onclick="event.stopPropagation();skipItemQuiz('${phase}',${idx})">Skip</button>
        </div>
      </div>`;
  } else if (status === 'correct' || status === 'wrong') {
    if (!qs.collapsed) {
      const checks = qs.checks || [];
      const correctCount = checks.filter(c => c.correct).length;
      const hitCount = checks.filter(c => c.correct && c.selected).length;
      const wrongCount = checks.filter(c => !c.correct && c.selected).length;
      const verdict = status === 'correct'
        ? `<div class="cl-qitem-verdict cl-qitem-verdict--correct">All ${correctCount} inspection points identified</div>`
        : `<div class="cl-qitem-verdict cl-qitem-verdict--wrong">${hitCount} of ${correctCount} found${wrongCount ? `, ${wrongCount} incorrect` : ''}</div>`;
      const rows = checks.map(c => {
        if (c.correct && c.selected)  return `<div class="cl-qitem-check-result cl-qitem-check-result--hit">✓ ${c.text}</div>`;
        if (c.correct && !c.selected) return `<div class="cl-qitem-check-result cl-qitem-check-result--miss">○ ${c.text}</div>`;
        if (!c.correct && c.selected) return `<div class="cl-qitem-check-result cl-qitem-check-result--wrong">✗ ${c.text}</div>`;
        return '';
      }).filter(Boolean).join('');
      const hasNext = CHECKLISTS[phase].items.some((_, i) => i > idx && (!qs[i] || qs[i].status === 'idle' || qs[i].status === 'skipped'));
      const nextBtn = hasNext ? `<button class="cl-qitem-next" onclick="event.stopPropagation();nextItemQuiz('${phase}',${idx})">Next ›</button>` : '';
      bodyExtra = `<div class="cl-qitem-result-panel">${verdict}${rows ? `<div class="cl-qitem-check-results">${rows}</div>` : ''}<div class="cl-qitem-why">${item.why}</div>${nextBtn}</div>`;
    }
  }

  const clickable = status === 'idle' || status === 'skipped';
  const answered = status === 'correct' || status === 'wrong';
  const onclickAttr = clickable ? ` onclick="openItemQuiz('${phase}',${idx})"` : status === 'open' ? ` onclick="closeItemQuiz('${phase}',${idx})"` : answered ? ` onclick="toggleQuizResult('${phase}',${idx})"` : '';
  return `<li class="cl-item cl-item--quiz cl-item--quiz-${status}"${onclickAttr}>
    <span class="cl-item-idx">${String(idx + 1).padStart(2, '0')}</span>
    ${dotHtml}
    <div class="cl-item-body">
      <div class="cl-item-name-row">
        <span class="cl-item-name">${displayAction}</span>
      </div>
      ${bodyExtra}
    </div>
    <button class="cl-item-info" onclick="event.stopPropagation();openInfo('${phase}',${idx})" title="Why &amp; Show Me">ⓘ</button>
  </li>`;
}

function _renderQuizItem(phase, item, idx) {
  if (item.checks) return _renderPreflightQuizItem(phase, item, idx);
  const qs = (clQuizState[phase] && clQuizState[phase][idx]) || { status: 'idle' };
  const { status } = qs;

  const phaseItems = CHECKLISTS[phase].items;
  const isDupe = item.value && phaseItems.filter(it => it.action === item.action).length > 1;
  const displayAction = isDupe ? `${item.action} — ${item.value.toLowerCase().replace(/\s+[—–-]\s+.*$/, '')}` : item.action;

  const dotSvg = '<svg width="11" height="9" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const dotHtml = status === 'correct'  ? `<div class="cl-qitem-dot cl-qitem-dot--correct">${dotSvg}</div>`
                : status === 'wrong'    ? `<div class="cl-qitem-dot cl-qitem-dot--wrong">✗</div>`
                : status === 'skipped'  ? `<div class="cl-qitem-dot cl-qitem-dot--skipped">—</div>`
                : status === 'open'     ? `<div class="cl-qitem-dot cl-qitem-dot--open"></div>`
                :                         `<div class="cl-qitem-dot cl-qitem-dot--idle">?</div>`;

  let bodyExtra = '';
  if (status === 'open') {
    const choices = qs.choices || [];
    bodyExtra = `
      <div class="cl-qitem-panel">
        <div class="cl-qitem-panel-top">
          <div class="cl-qitem-question">${qs.question || 'Why is this on the checklist?'}</div>
          <button class="cl-qitem-collapse" onclick="event.stopPropagation();closeItemQuiz('${phase}',${idx})" title="Collapse">✕</button>
        </div>
        <div class="cl-qitem-choices">
          ${choices.map((c, ci) => `<button class="cl-qitem-choice" onclick="event.stopPropagation();answerItemQuiz('${phase}',${idx},${c.isCorrect})">${c.text}</button>`).join('')}
        </div>
        <button class="cl-qitem-skip" onclick="event.stopPropagation();skipItemQuiz('${phase}',${idx})">Skip</button>
      </div>`;
  } else if (status === 'correct' || status === 'wrong') {
    if (!qs.collapsed) {
      const correctText = qs.choices ? qs.choices.find(c => c.isCorrect).text : '';
      const wrongNote = status === 'wrong' ? `<div class="cl-qitem-correct-note">Correct answer: ${correctText}</div>` : '';
      const qs2 = clQuizState[phase] || {};
      const hasNext2 = CHECKLISTS[phase].items.some((_, i) => i > idx && (!qs2[i] || qs2[i].status === 'idle' || qs2[i].status === 'skipped'));
      const nextBtn2 = hasNext2 ? `<button class="cl-qitem-next" onclick="event.stopPropagation();nextItemQuiz('${phase}',${idx})">Next ›</button>` : '';
      bodyExtra = `<div class="cl-qitem-result-panel">${wrongNote}<div class="cl-qitem-why">${item.why}</div>${nextBtn2}</div>`;
    }
  }

  const clickable = status === 'idle' || status === 'skipped';
  const answered = status === 'correct' || status === 'wrong';
  const onclickAttr = clickable ? ` onclick="openItemQuiz('${phase}',${idx})"` : status === 'open' ? ` onclick="closeItemQuiz('${phase}',${idx})"` : answered ? ` onclick="toggleQuizResult('${phase}',${idx})"` : '';
  return `<li class="cl-item cl-item--quiz cl-item--quiz-${status}"${onclickAttr}>
    <span class="cl-item-idx">${String(idx + 1).padStart(2, '0')}</span>
    ${dotHtml}
    <div class="cl-item-body">
      <div class="cl-item-name-row">
        <span class="cl-item-name">${displayAction}</span>
      </div>
      ${bodyExtra}
    </div>
    <button class="cl-item-info" onclick="event.stopPropagation();openInfo('${phase}',${idx})" title="Why &amp; Show Me">ⓘ</button>
  </li>`;
}

// ───────────────────────────────────────────────────────────────────────────

function renderChecklist() {
  const phase = state.checklist.phase;
  const list = CHECKLISTS[phase];

  const qs = clQuizState[phase] || {};
  const doneCount = Object.values(qs).filter(s => s.status === 'correct' || s.status === 'wrong' || s.status === 'skipped').length;
  const total = list.items.length;

  document.getElementById('cl-title').textContent = list.label;
  document.getElementById('cl-progress').textContent = `${doneCount} / ${total}`;
  document.getElementById('cl-progress-fill').style.width = `${(doneCount / total) * 100}%`;

  const ul = document.getElementById('checklist-items');
  const preflightNote = document.getElementById('cl-preflight-note');
  if (preflightNote) preflightNote.style.display = phase === 'preflight' ? '' : 'none';
  ul.innerHTML = list.items.map((item, i) => _renderQuizItem(phase, item, i)).join('');

  const anyAnswered = Object.values(qs).some(s => s && (s.status === 'correct' || s.status === 'wrong'));
  const reviewBtn = document.getElementById('cl-review-all-btn');
  if (reviewBtn) reviewBtn.style.display = anyAnswered ? '' : 'none';

  // Update sidebar memory hook from first item with a phrase acronym tip
  const hookCard = document.getElementById('cl-memory-hook');
  const hookBody = document.getElementById('cl-hook-body');
  if (hookCard && hookBody) {
    const acronymItem = list.items.find(it => it.tipType === 'acronym' && it.acronym);
    if (acronymItem) {
      hookBody.innerHTML = `<div class="cl-hook-acronym">${acronymItem.acronym}</div><div class="cl-hook-def">${acronymItem.acronymDef}</div>`;
      hookCard.style.display = '';
    } else {
      hookCard.style.display = 'none';
    }
  }
}

function reviewAllAnswers() {
  const phase = state.checklist.phase;
  const qs = clQuizState[phase] || {};
  Object.values(qs).forEach(s => {
    if (s && (s.status === 'correct' || s.status === 'wrong')) s.collapsed = false;
  });
  renderChecklist();
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
  const phase = state.checklist.phase;
  state.checklist.completed[phase] = new Set();
  delete clQuizState[phase];
  _quizAllPool = null;
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
  state.radio.activeGroup = RADIO_SCENARIO_GROUPS[0].id;
  const instrEl = document.getElementById('radio-instructions');
  if (instrEl) instrEl.classList.add('show');
  newRadioScenario();
}

function renderRadioScenario() {
  const template = RADIO_SCENARIOS[state.radio.scenarioIdx];
  const s = template.build ? template.build() : template;
  state.radio.scenario = s;
  state.radio.builtCall = [];
  state.radio.builtCallKeys = [];
  state.radio.usedWords = new Set();
  document.getElementById('scenario-type').textContent = s.type;
  document.getElementById('scenario-text').textContent = s.situation;


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
      // Enable button if no chips left
      if (state.radio.builtCall.length === 0) {
        const newScenarioBtn = document.getElementById('radio-new-scenario-btn');
        if (newScenarioBtn) newScenarioBtn.disabled = false;
      }
    } else {
      el.classList.add('used');
      state.radio.builtCall.push(el.dataset.word);
      if (!state.radio.builtCallKeys) state.radio.builtCallKeys = [];
      state.radio.builtCallKeys.push(key);
      // Disable button as soon as user adds a chip
      const newScenarioBtn = document.getElementById('radio-new-scenario-btn');
      if (newScenarioBtn) newScenarioBtn.disabled = true;
    }
    updateRadioOutput();
  };
  renderRadioScenarioList();
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
    : `<span class="rd-quote">“</span>${state.radio.builtCall.join(', ')}.<span class="rd-quote">”</span>`;
}

function clearRadioCall() {
  state.radio.builtCall = [];
  state.radio.builtCallKeys = [];
  document.querySelectorAll('.word-chip').forEach(c => c.classList.remove('used'));
  updateRadioOutput();
  document.getElementById('radio-feedback').classList.remove('show');
}


function checkRadioCall() {
  const s = state.radio.scenario;
  const isCorrect = radioCallMatches(state.radio.builtCall, s);

  const usedDistractors = state.radio.builtCall
    .map(w => (s.distractors || []).find(d => d.text === w))
    .filter(Boolean);

  let bodyHtml = `<p style="font-family:var(--font-mono);font-size:13px;line-height:1.7;color:var(--ink)">${s.ideal}</p>`;

  if (usedDistractors.length > 0) {
    bodyHtml += `<p style="margin-top:10px;font-size:13px">` +
      (isCorrect ? '⚠️ Trap chips you avoided — good:' : '⚠️ Trap chips you included:') +
      '<br>' + usedDistractors.map(d => `• "<strong>${d.text}</strong>" — ${d.why}`).join('<br>') + '</p>';
  }
  if (s.note) {
    bodyHtml += `<p style="margin-top:10px;font-size:13px;color:var(--ink-3)">${s.note}</p>`;
  }

  // Show call template only if correct
  if (isCorrect) {
    bodyHtml += buildCallTemplateHtml(s);
  }

  // Enable New Scenario button now that they've checked their call
  const newScenarioBtn = document.getElementById('radio-new-scenario-btn');
  if (newScenarioBtn) newScenarioBtn.disabled = false;

  openVerdictSheet(
    isCorrect ? 'correct' : 'wrong',
    isCorrect ? '✓ Correct sequence' : '✗ Not quite',
    bodyHtml,
    () => retryRadioCall(),
    () => newRadioScenario()
  );
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
  const s = state.radio.scenario;
  document.getElementById('feedback-header').textContent = '✗ Ideal call';
  document.getElementById('feedback-ideal').textContent = s.ideal;
  document.getElementById('feedback-note').textContent = s.note;
}

function newRadioScenario() {
  const pool = state.radio.activeGroup
    ? RADIO_SCENARIOS.filter(s => s.group === state.radio.activeGroup)
    : RADIO_SCENARIOS;
  const prevTemplate = RADIO_SCENARIOS[state.radio.scenarioIdx];
  let template;
  do {
    template = pool[Math.floor(Math.random() * pool.length)];
  } while (template === prevTemplate && pool.length > 1);
  state.radio.scenarioIdx = RADIO_SCENARIOS.indexOf(template);
  renderRadioScenario();
}

function setRadioGroup(groupId) {
  state.radio.activeGroup = groupId;
  renderRadioScenarioList();
}

function renderRadioScenarioList() {
  const list = document.getElementById('rd-scenario-list');
  if (!list) return;
  const isAny = state.radio.activeGroup === null;
  const active = state.radio.activeGroup;
  const toggleTarget = isAny ? `'${RADIO_SCENARIO_GROUPS[0].id}'` : 'null';
  const options = RADIO_SCENARIO_GROUPS.map(g =>
    `<option value="${g.id}"${active === g.id ? ' selected' : ''}>${g.dropdownLabel}</option>`
  ).join('');
  list.innerHTML = `
    <div class="rd-type-controls">
      <div class="rd-control-col rd-control-col--type">
        <span class="rd-control-label">Call Type</span>
        <select class="rd-type-select"${isAny ? ' disabled' : ''}>${options}</select>
      </div>
      <div class="rd-control-col">
        <span class="rd-control-label">Any</span>
        <button class="rd-any-toggle${isAny ? ' rd-any-toggle--on' : ''}" onclick="setRadioGroup(${toggleTarget})" aria-label="Toggle any type"></button>
      </div>
      <button class="rd-new-icon-btn" onclick="newRadioScenario()" aria-label="New scenario">⇄</button>
    </div>`;
  const sel = list.querySelector('.rd-type-select');
  if (sel) sel.addEventListener('change', () => {
    const selectedGroup = sel.value;
    const currentGroup = state.radio.scenario?.group;
    if (selectedGroup !== currentGroup) {
      state.radio.activeGroup = selectedGroup;
      newRadioScenario();
    } else {
      setRadioGroup(selectedGroup);
    }
  });

  const g = RADIO_SCENARIO_GROUPS.find(grp => grp.id === active);
  const lbl = g ? `New ${g.label} Scenario` : 'New Scenario';
  const bottomBtn = document.getElementById('radio-new-scenario-btn');
  if (bottomBtn) bottomBtn.innerHTML = `<span class="rd-new-icon">⇄</span>${lbl}`;
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
  renderEmergencyCards();
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

function renderEmergencyCards() {
  const grid = document.getElementById('em-cards-grid');
  if (!grid) return;
  grid.innerHTML = EMERGENCIES.map((em, i) => {
    const sev = em.severity || 'high';
    const sevColor = sev === 'critical' ? 'var(--hazard)' : 'var(--kb-accent)';
    const sevLabel = sev.toUpperCase();
    const pipCount = Math.min(Math.max(em.options.length, 4), 6);
    const pips = Array.from({ length: pipCount }, () => '<div class="em-card-pip"></div>').join('');
    return `
    <div class="em-card${i === state.emergency.current ? ' active' : ''}" onclick="selectEmergency(${i})">
      <div class="em-card-badge">● ACTIVE</div>
      <div class="em-card-severity-row">
        <div class="em-card-severity-dot" style="background:${sevColor}"></div>
        <span class="em-card-severity-label mono" style="color:${sevColor}">${sevLabel}</span>
      </div>
      <div class="em-card-title">${em.title}</div>
      <div class="em-card-pips">${pips}</div>
      <div class="em-card-footer mono">${em.options.length} options · first action</div>
    </div>`;
  }).join('');
}

function selectEmergency(idx) {
  state.emergency.current = idx;
  state.emergency.answered = false;
  renderEmergency();
}

// ── PROCEDURES ──

const procState = {
  airport: { icao: '', name: '', elev: 0, tpa: 1000 },
  currentProc: null,
  currentStep: 0,
  answered: false,
  inRecall: false,
  recallGroupIdx: 0,
};

// ── AIRPORT DATABASE (bundled — works offline & file://) ──
// Format: ICAO: [name, elevation_ft_msl, notes]
// Carolinas/Southeast heavily populated; national GA coverage included

let _dropdownIdx = -1;

function searchAirports(query) {
  return searchAirportData(query, AIRPORTS);
}

function onAirportSearch(query) {
  _dropdownIdx = -1;
  const results = searchAirports(query);
  const dd = document.getElementById('proc-airport-dropdown');
  const group = document.getElementById('proc-field-group');
  if (results.length && query.trim().length >= 2) {
    dd.innerHTML = results.map(r =>
      `<div class="proc-airport-option" data-icao="${r.icao}" onclick="selectAirport('${r.icao}')">` +
      `<span class="proc-airport-option-icao">${r.icao}</span>` +
      `<span class="proc-airport-option-name">${r.name}${r.state ? ` <span class="proc-airport-option-state">${r.state}</span>` : ''}</span>` +
      `</div>`
    ).join('');
    dd.style.display = '';
    group.classList.add('dropdown-open');
  } else {
    hideAirportDropdown();
  }
}

function onAirportSearchKey(event) {
  const dd = document.getElementById('proc-airport-dropdown');
  const hidden = dd.style.display === 'none' || !dd.children.length;
  if (hidden) {
    if (event.key === 'Enter') lookupAirport();
    return;
  }
  const options = dd.querySelectorAll('.proc-airport-option');
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    _dropdownIdx = Math.min(_dropdownIdx + 1, options.length - 1);
    options.forEach((o, i) => o.classList.toggle('active', i === _dropdownIdx));
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    _dropdownIdx = Math.max(_dropdownIdx - 1, -1);
    options.forEach((o, i) => o.classList.toggle('active', i === _dropdownIdx));
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const active = dd.querySelector('.proc-airport-option.active');
    if (active) selectAirport(active.dataset.icao);
    else lookupAirport();
  } else if (event.key === 'Escape') {
    hideAirportDropdown();
  }
}

function hideAirportDropdown() {
  const dd = document.getElementById('proc-airport-dropdown');
  if (!dd) return;
  dd.style.display = 'none';
  dd.innerHTML = '';
  _dropdownIdx = -1;
  const group = document.getElementById('proc-field-group');
  if (group) group.classList.remove('dropdown-open');
}

function selectAirport(icao) {
  icao = icao.trim().toUpperCase();
  const result = document.getElementById('proc-airport-result');
  const manual = document.getElementById('proc-manual-fields');
  hideAirportDropdown();
  document.getElementById('proc-icao').value = icao;

  const ap = AIRPORTS[icao];
  if (ap) {
    const [name, elev, notes, municipality, state = ''] = ap;
    const tpa = Math.round((elev + 1000) / 100) * 100;
    const callName = airportCallName(name, municipality);
    procState.airport = { icao, name, elev, tpa, callName };
    result.innerHTML = `
      <div class="proc-airport-result">
        <div class="proc-airport-name">${name}${state ? ` <span class="proc-airport-option-state">${state}</span>` : ''}</div>
        <div class="proc-airport-meta">${icao} · Elev ${elev} ft MSL${notes ? ' · ' + notes : ''}</div>
      </div>`;
    manual.style.display = 'none';
  } else if (icao.length >= 3) {
    result.innerHTML = `<div class="proc-airport-err">⚠️ "${icao}" not in database — enter values below.</div>`;
    manual.style.display = 'block';
    procState.airport = { icao, name: icao, elev: 0, tpa: 1000 };
    document.getElementById('proc-elev').focus();
  }
}

function lookupAirport() {
  const icao = document.getElementById('proc-icao').value.trim().toUpperCase();
  if (icao.length >= 3) selectAirport(icao);
}

function randomAirport() {
  const icao = pickRandomAirport(AIRPORTS);
  document.getElementById('proc-icao').value = icao;
  selectAirport(icao);
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
  const callName = ap.callName || airportCallName(ap.name || icao);
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
        phase: 'Pattern Altitude',
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
        phase: 'Radio Call',
        prompt: 'Build your downwind position call.',
        context: `Uncontrolled field (CTAF). You're entering left downwind for runway ${rwy}. Announce so other traffic can sequence.`,
        words: [`${callName} traffic`, 'Skyhawk Four Five Two One Golf', `entering left downwind runway ${rwy}`, callName],
        ideal: `${callName} traffic, Skyhawk Four Five Two One Golf, entering left downwind runway ${rwy}, ${callName}.`,
        distractors: [
          { text: `${callName} tower`, why: 'Uncontrolled fields have no tower. Use "traffic" to address all aircraft on the CTAF frequency.' },
          { text: 'any traffic please advise', why: 'Non-standard phraseology — discouraged by the FAA. It clutters the frequency without adding useful information.' },
          { text: 'over', why: '"Over" is not used in aviation radio calls. It\'s a civilian/military misconception — just say what you need to say and release the mic.' },
        ],
        feedback: 'Five pieces every CTAF call: airport + "traffic" → who you are → where you are + runway → airport name again. The bookend airport name confirms other pilots are on the right frequency.',
        tip: { title: 'Every pattern leg', text: `Make a call on downwind, base, and final. At controlled fields, tower handles sequencing — but at ${icao} you\'re all each other has.` }
      },

      // ── 3. ABEAM — DESCENT SETUP — config (Before Landing checklist + descent config)
      {
        type: 'config',
        phase: 'Abeam — Descent Setup',
        prompt: 'Threshold at your 4 o\'clock. Run the Before Landing checklist and configure for descent.',
        context: `Numbers abeam — the trigger for everything. Power back, run the checklist, add flaps once below Vfe.`,
        controls: [
          {
            id: 'power', label: 'Power', type: 'slider',
            min: 600, max: 2300, step: 100,
            default: 2100,
            unit: 'RPM',
            correct: abeamPower,
            tolerance: 100,
            correctLabel: `~${abeamPower} RPM — begins speed bleed so flaps can be extended`,
            wrongLabel: `Target ~${abeamPower} RPM abeam the numbers. Too high keeps you fast; idle descends too steep.`,
          },
          {
            id: 'carbheat', label: 'Carb Heat', type: 'chips',
            options: ['OFF', 'ON'],
            default: 'OFF',
            correct: 'ON',
            correctLabel: 'ON — apply immediately after power reduction',
            wrongLabel: 'Carb heat ON right after reducing power. Low power settings are prime carb ice conditions.',
          },
          {
            id: 'fuel', label: fuelLabel, type: 'chips',
            options: fuelOptions,
            default: 'LEFT',
            correct: fuelCorrect,
            correctLabel: fuelCorrectLabel,
            wrongLabel: fuelWrongLabel,
          },
          {
            id: 'mixture', label: 'Mixture', type: 'chips',
            options: ['LEAN', 'RICH'],
            default: 'LEAN',
            correct: 'RICH',
            correctLabel: 'RICH — go-around power available instantly',
            wrongLabel: 'Mixture RICH before landing. A lean mixture at full throttle during a go-around causes rough running or power loss.',
          },
          {
            id: 'seats', label: 'Seats & Belts', type: 'chips',
            options: ['Unchecked', 'SECURE'],
            default: 'Unchecked',
            correct: 'SECURE',
            correctLabel: 'SECURE — confirmed both occupants',
            wrongLabel: 'Confirm seats and belts secure. Check your passenger too.',
          },
          {
            id: 'flaps', label: 'Flaps', type: 'chips',
            options: baseFlapsOptions,
            default: '0°',
            correct: '10°',
            correctLabel: `10° — first notch once speed is below ${vfe} KIAS (Vfe)`,
            wrongLabel: `Flaps 10° after speed drops below ${vfe} KIAS. Power back first, then wait for the speed to bleed before extending.`,
          },
          {
            id: 'speed', label: 'Target Airspeed', type: 'slider',
            min: 55, max: 120, step: 5,
            default: downwindSpeed + 10,
            unit: 'KIAS',
            correct: abeamSpeed,
            tolerance: 5,
            correctLabel: `~${abeamSpeed} KIAS — stabilized with flaps 10°, trimmed`,
            wrongLabel: `Target ~${abeamSpeed} KIAS after flaps 10°. Trim to hold it hands-off.`,
          },
          ...(hasFuelPump ? [{
            id: 'fuelpump', label: 'Fuel Pump', type: 'chips',
            options: ['OFF', 'ON'],
            default: 'OFF',
            correct: 'ON',
            correctLabel: 'ON — backup fuel pressure for approach and go-around',
            wrongLabel: 'Fuel pump ON for approach. Backup pressure if the engine-driven pump falters at low power.',
          }] : []),
        ],
        feedback: `Abeam sequence: power ~${abeamPower} → carb heat ON → GUMPS (${fuelCorrect} · mixture rich · seats) → flaps 10° below ${vfe} KIAS → trim ${abeamSpeed} KIAS → begin descent.`,
        tip: { title: 'Power before flaps', text: `Reduce power first to bleed speed below Vfe (${vfe} KIAS), then add flaps. Extending flaps above Vfe can damage the flap structure. Once trimmed for ${abeamSpeed} KIAS, hands off — don't muscle it around the pattern.` }
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
        tip: { title: 'Base radio call', text: `"${callName} traffic, Skyhawk Four Five Two One Golf, left base runway ${rwy}, ${callName}." Make it before the turn or early in the turn — other pilots on long final need to hear it.` }
      },

      // ── 7. BASE RADIO — radio
      {
        type: 'radio',
        phase: 'Radio Call',
        prompt: 'Build your base leg position call.',
        context: `You've turned base for runway ${rwy}. Announce before or early in the turn.`,
        words: [`${callName} traffic`, 'Skyhawk Four Five Two One Golf', `left base runway ${rwy}`, callName],
        ideal: `${callName} traffic, Skyhawk Four Five Two One Golf, left base runway ${rwy}, ${callName}.`,
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
        phase: 'Configuration',
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
        phase: 'Glidepath',
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

    ],
    recallGroups: [
      {
        label: 'Abeam Setup',
        context: `Threshold at your 4 o'clock — power back, speed bleeding. What do you configure, in order?`,
        stepStart: 0, stepEnd: 2,
        items: [
          { phase: `Power — ~${abeamPower} RPM` },
          { phase: 'Carb Heat — ON' },
          { phase: `Fuel — ${fuelCorrect}` },
          { phase: 'Mixture — RICH' },
          { phase: 'Seats & Belts — SECURE' },
          { phase: 'Flaps — 10°' },
          { phase: `Speed — ~${abeamSpeed} KIAS` },
          ...(hasFuelPump ? [{ phase: 'Fuel Pump — ON' }] : []),
        ],
        distractors: [
          { phase: 'Carb Heat — OFF', why: 'Carb heat goes ON right after reducing power — low RPM is prime carb ice territory.' },
          { phase: `Flaps — ${baseFlaps}`, why: `${baseFlaps} is for base leg. First notch (10°) abeam, once below ${vfe} KIAS.` },
          { phase: 'Mixture — LEAN', why: 'Mixture stays RICH for approach. A lean engine on a go-around can surge or lose power.' },
        ],
      },
      {
        label: 'Base',
        context: `Turning left base for runway ${rwy}. What do you configure?`,
        stepStart: 3, stepEnd: 5,
        items: [
          { phase: 'Turn — ~45° behind wingtip' },
          { phase: `Flaps — ${baseFlaps}` },
          { phase: `Speed — ~${baseSpeed} KIAS` },
          { phase: 'Radio — left base call' },
        ],
        distractors: [
          { phase: 'Flaps — 10°', why: 'You already set 10° abeam the numbers. Advance to 20° on base.' },
          { phase: `Flaps — ${finalFlaps}`, why: `Full flaps (${finalFlaps}) go on final once the runway is made — not on base.` },
          { phase: 'Carb Heat — OFF', why: 'Carb heat stays ON throughout the approach.' },
        ],
      },
      {
        label: 'Final',
        context: `Established on final for runway ${rwy}. Complete your configuration.`,
        stepStart: 6, stepEnd: 9,
        items: [
          { phase: `Flaps — ${finalFlaps} (full)` },
          { phase: `Speed — ${shortFinal}–${approach} KIAS` },
          { phase: 'Carb Heat — ON (stay on)' },
          ...(hasFuelPump ? [{ phase: 'Fuel Pump — ON (stay on)' }] : []),
          { phase: 'Stabilized by 500 ft AGL' },
        ],
        distractors: [
          { phase: `Flaps — ${baseFlaps}`, why: `${baseFlaps} was base leg. Full flaps (${finalFlaps}) once the runway is made on final.` },
          { phase: 'Carb Heat — OFF', why: 'Carb heat stays ON throughout approach — only off after landing or full-power go-around.' },
          { phase: 'Mixture — LEAN', why: 'Mixture stays RICH. You need full power available instantly for a go-around.' },
        ],
      },
    ],
  };
}

// ── PROC STATE ──
let procRadioState = { built: [], words: [] };

const procSeqState = {
  pool: [], slotCount: 0,
  nextSlot: 0, ok: 0, miss: 0,
  elapsed: 0, done: false, _timer: null,
  shakingIdx: -1, lastDistractorMsg: ''
};

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
  procState.inRecall = true;
  procState.recallGroupIdx = 0;
  const firstGroup = procState.currentProc.recallGroups?.[0] || null;
  const recallLabel = firstGroup ? firstGroup.label : 'Briefing';
  document.getElementById('proc-step-title').textContent = procState.currentProc.title + ' · ' + recallLabel;
  document.getElementById('proc-airport-tag').textContent = ap.icao || '';
  document.querySelector('.proc-progress').style.display = 'none';

  const spd = ALL_AIRCRAFT[currentAircraft].speeds;
  const speedsEl = document.getElementById('proc-speeds-strip');
  speedsEl.innerHTML =
    `<span class="proc-speeds-group"><span class="proc-speeds-label">Climb</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">Vr</span>${spd.vr}</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">Vx</span>${spd.vx}</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">Vy</span>${spd.vy}</span></span>` +
    `<span class="proc-speeds-divider"></span>` +
    `<span class="proc-speeds-group"><span class="proc-speeds-label">Approach</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">Vfe</span>${spd.vfe}</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">App</span>${spd.approach}</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">Final</span>${spd.shortFinal}</span>` +
    `<span class="proc-speed-item"><span class="proc-speed-key">Glide</span>${spd.bestGlide}</span></span>` +
    `<span class="proc-speeds-unit">KIAS</span>`;
  speedsEl.style.display = '';

  showProcScreen('proc-screen-steps');
  _initProcRecall(procState.currentProc, firstGroup);
  renderProcStep();
}

function _initProcRecall(proc, group) {
  const rawItems = group
    ? (group.items || proc.steps.slice(group.stepStart, group.stepEnd + 1).map(s => ({ phase: s.phase })))
    : proc.steps.map(s => ({ phase: s.phase }));
  const allDistractors = group ? (group.distractors || []) : (proc.distractors || []);
  const shuffledD = [...allDistractors].sort(() => Math.random() - 0.5);
  const picked = shuffledD.slice(0, Math.random() < 0.5 ? 2 : 3);
  const pool = [
    ...rawItems.map((item, relIdx) => ({ phase: item.phase, origIdx: relIdx, isDistractor: false, why: '' })),
    ...picked.map(d => ({ phase: d.phase, origIdx: -1, isDistractor: true, why: d.why })),
  ].sort(() => Math.random() - 0.5);
  if (procSeqState._timer) clearInterval(procSeqState._timer);
  procSeqState.pool = pool;
  procSeqState.slotCount = rawItems.length;
  procSeqState.nextSlot = 0;
  procSeqState.ok = 0;
  procSeqState.miss = 0;
  procSeqState.elapsed = 0;
  procSeqState.done = false;
  procSeqState.shakingIdx = -1;
  procSeqState.lastDistractorMsg = '';
  procSeqState._timer = setInterval(() => {
    if (!procSeqState.done) { procSeqState.elapsed++; renderProcSeqRecall(); }
  }, 1000);
}

function retryProcRecall() {
  const proc = procState.currentProc;
  const group = proc.recallGroups ? proc.recallGroups[procState.recallGroupIdx] : null;
  _initProcRecall(proc, group);
  renderProcSeqRecall();
}

function procAdvanceFromRecall() {
  if (procSeqState._timer) { clearInterval(procSeqState._timer); procSeqState._timer = null; }
  procState.inRecall = false;
  const group = procState.currentProc.recallGroups?.[procState.recallGroupIdx] || null;
  if (group) procState.currentStep = group.stepStart;
  document.getElementById('proc-step-title').textContent = procState.currentProc.title;
  document.querySelector('.proc-progress').style.display = '';
  renderProcStep();
  updateHash();
}

// ── NORMAL TAKEOFF ──
function buildNormalTakeoff(ap) {
  const icao = ap.icao || 'KXXX';
  const callName = ap.callName || airportCallName(ap.name || icao);
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
        tip: { title: 'Before rolling', text: `Do a final scan: strobes ON, transponder ALT, time noted, runway clear both directions. Say "${callName} traffic, Skyhawk 4521G, departing runway 27" if uncontrolled.` }
      },
      {
        type: 'radio',
        phase: 'Takeoff — Radio',
        prompt: 'Build your takeoff announcement for an uncontrolled field.',
        context: `${icao} is uncontrolled. Announce before rolling to alert traffic on downwind or base.`,
        words: [`${callName} traffic`, 'Skyhawk Four Five Two One Golf', 'departing runway two seven', callName],
        ideal: `${callName} traffic, Skyhawk Four Five Two One Golf, departing runway two seven, ${callName}.`,
        distractors: [
          { text: 'requesting takeoff clearance', why: `No tower at ${icao} — there's nobody to request clearance from. Just announce and go.` },
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
    ],
    distractors: [
      { phase: 'Downwind — Radio',    why: 'Downwind radio calls are a pattern leg step — not part of the takeoff sequence.' },
      { phase: 'Entry Configuration', why: 'Entry configuration belongs to stall and slow-flight maneuvers, not a normal takeoff.' },
      { phase: 'Flare & Touchdown',   why: 'Flare and touchdown are landing steps — the takeoff sequence ends at initial climb.' },
      { phase: 'Carb Heat — ON',      why: 'Carb heat is OFF for takeoff. It reduces power — only applied when reducing power on approach.' },
      { phase: 'Maneuvering Speed',   why: 'Maneuvering speed awareness is a slow-flight drill item, not a takeoff step.' },
      { phase: 'Rollout',             why: 'Rollout is a landing step. The takeoff sequence ends when you establish the initial climb.' },
    ],
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
    ],
    distractors: [
      { phase: 'Takeoff Roll',        why: 'Takeoff roll is a departure step — not part of the slow flight maneuver sequence.' },
      { phase: 'Base Turn',           why: 'Base turn is a traffic pattern leg, not a step in the slow flight maneuver.' },
      { phase: 'Rollout',             why: 'Rollout is a landing step — the slow flight sequence ends with Recovery.' },
      { phase: 'GUMPS Check',         why: 'GUMPS is a pre-landing flow run in the traffic pattern, not during slow flight.' },
      { phase: 'Flare & Touchdown',   why: 'Flare and touchdown are landing steps — the slow flight sequence ends at Recovery.' },
      { phase: 'Stall Recognition',   why: 'Stall recognition is a step in the stall drills, not the slow flight maneuver.' },
    ],
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
    ],
    distractors: [
      { phase: 'Takeoff Roll',        why: 'Takeoff roll is a takeoff step — not part of the power-off stall sequence.' },
      { phase: 'Turn in Slow Flight', why: 'Slow flight turns are a separate maneuver. The power-off stall goes straight to stall entry.' },
      { phase: 'Rollout',             why: 'Rollout is a landing step. The stall sequence ends at Recovery.' },
      { phase: 'Downwind — GUMPS',    why: 'GUMPS is a traffic pattern item. The stall drill doesn\'t include it.' },
      { phase: 'Initial Climb',       why: 'Initial climb is a takeoff step. After stall recovery you return to cruise, not "initial climb."' },
      { phase: 'Base Turn',           why: 'Base turn is a pattern leg, not part of the stall drill sequence.' },
    ],
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
    ],
    distractors: [
      { phase: 'Lineup',              why: 'Lineup is the first step of a normal takeoff, not a step in the stall drill.' },
      { phase: 'Flare & Touchdown',   why: 'Flare and touchdown are landing steps. The stall sequence ends at Recovery.' },
      { phase: 'Turn in Slow Flight', why: 'Slow flight turns are a separate maneuver. The power-on stall goes straight to stall entry.' },
      { phase: 'Rollout',             why: 'Rollout is a landing step. The stall sequence ends at Recovery.' },
      { phase: 'Downwind — GUMPS',    why: 'GUMPS is a traffic pattern item. The stall drill doesn\'t include it.' },
      { phase: 'Base Turn',           why: 'Base turn is a pattern leg, not part of the stall drill sequence.' },
    ],
  };
}

// ── PROC SEQUENCE RECALL ──

function tapProcSeqChip(idx) {
  const s = procSeqState;
  if (s.done) return;
  const item = s.pool[idx];
  if (!item || item._placed) return;

  if (item.isDistractor) {
    s.miss++;
    s.lastDistractorMsg = item.why;
    s.shakingIdx = idx;
    renderProcSeqRecall();
    setTimeout(() => { s.shakingIdx = -1; renderProcSeqRecall(); }, 600);
  } else if (item.origIdx === s.nextSlot) {
    s.ok++;
    s.nextSlot++;
    s.lastDistractorMsg = '';
    item._placed = true;
    if (s.nextSlot === s.totalReal) {
      s.done = true;
      clearInterval(s._timer);
      setTimeout(() => renderProcSeqRecall(), 200);
    } else {
      renderProcSeqRecall();
    }
  } else {
    s.miss++;
    s.lastDistractorMsg = '';
    s.shakingIdx = idx;
    renderProcSeqRecall();
    setTimeout(() => { s.shakingIdx = -1; renderProcSeqRecall(); }, 600);
  }
}

function renderProcSeqRecall() {
  const s = procSeqState;
  const ok = s.ok, miss = s.miss;
  const accuracy = ok + miss > 0 ? Math.round(ok / (ok + miss) * 100) : 100;
  const group = procState.currentProc?.recallGroups?.[procState.recallGroupIdx] || null;
  const isItemBased = !!group?.items;
  const eyebrow = group ? `↳ ${group.label.toUpperCase()} · SEQUENCE RECALL` : '↳ SEQUENCE RECALL · TAP IN ORDER';
  const recallTitle = group ? `Build the ${group.label.toLowerCase()} flow from memory` : 'Build the procedure from memory';
  const contextHtml = group?.context ? `<div class="seq-group-context">${group.context}</div>` : '';
  const advanceBtnLabel = group ? `Practice ${group.label} ›` : 'Begin Procedure →';
  const pct = s.totalReal > 0 ? Math.round((s.nextSlot / s.totalReal) * 100) : 0;

  const slotsHtml = Array.from({ length: s.totalReal }, (_, i) => {
    const filled = i < s.nextSlot;
    const isNext = i === s.nextSlot && !s.done;
    const label = filled ? s.pool.find(p => !p.isDistractor && p.origIdx === i)?.phase || '' : '';
    return `<div class="seq-slot-row${isNext ? ' seq-slot-row--next' : ''}">
      <span class="seq-row-idx">${String(i + 1).padStart(2, '0')}</span>
      <div class="seq-row-check${filled ? ' seq-row-check--done' : ''}">
        ${filled ? '<svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,11 12,3" fill="none" stroke="#00e887" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : ''}
      </div>
      <div>${filled ? `<div class="seq-row-filled"><span class="seq-row-name">${label}</span></div>`
        : isNext ? `<span class="seq-row-next-hint">→ WHAT'S NEXT?</span>`
        : `<span class="seq-row-placeholder"></span>`}</div>
    </div>`;
  }).join('');

  const chipsHtml = s.pool.map((item, idx) => {
    if (item._placed) return '';
    const shaking = s.shakingIdx === idx;
    return `<button class="seq-chip${shaking ? ' seq-chip--shake' : ''}" onclick="tapProcSeqChip(${idx})">${item.phase}</button>`;
  }).join('');

  const remaining = s.pool.filter(p => !p._placed).length;
  const distractorHtml = s.lastDistractorMsg
    ? `<div class="proc-seq-distractor-msg">⚠ That step doesn't belong here — ${s.lastDistractorMsg}</div>`
    : '';

  const doneHtml = s.done ? `
    <div class="seq-done-banner">
      <div class="seq-done-disc">✓</div>
      <div>
        <div class="seq-done-title">Nailed it.</div>
        <div class="seq-done-sub">${s.totalReal} / ${s.totalReal} in ${fmtSeqTime(s.elapsed)} · ${accuracy}% accuracy</div>
      </div>
      <div>
        <button class="cf-btn cf-btn--primary cf-btn--sm" onclick="procAdvanceFromRecall()">${advanceBtnLabel}</button>
        <div style="margin-top:8px"><a href="#" onclick="retryProcRecall();return false" style="font-size:12px;color:var(--ink-3);text-decoration:underline">Try again</a></div>
      </div>
    </div>` : '';

  document.getElementById('proc-step-content').innerHTML = `
    <div class="seq-page-header">
      <div>
        <div class="seq-page-eyebrow">${eyebrow}</div>
        <div class="seq-page-title">${recallTitle}</div>
        ${contextHtml}
      </div>
      <div class="seq-hud">
        <div class="seq-hud-stat"><div class="seq-hud-label">TIME</div><div class="seq-hud-val" id="proc-seq-timer">${fmtSeqTime(s.elapsed)}</div></div>
        <div class="seq-hud-stat"><div class="seq-hud-label">OK</div><div class="seq-hud-val${ok > 0 ? ' seq-hud-val--ok' : ''}">${ok}</div></div>
        <div class="seq-hud-stat"><div class="seq-hud-label">MISS</div><div class="seq-hud-val${miss > 0 ? ' seq-hud-val--miss' : ''}">${miss}</div></div>
        <div class="seq-hud-stat"><div class="seq-hud-label">ACC</div><div class="seq-hud-val">${accuracy}%</div></div>
      </div>
    </div>
    <div class="seq-progress-row">
      <div class="seq-progress-bar"><div class="seq-progress-fill" style="width:${pct}%"></div></div>
      <span class="seq-progress-count">${s.nextSlot} / ${s.totalReal}</span>
    </div>
    ${doneHtml}
    <div class="seq-grid">
      <div class="seq-slot-col">
        <div class="seq-col-eyebrow">${isItemBased ? `↓ ${group.label.toUpperCase()} CHECKLIST · IN ORDER` : '↓ THE PROCEDURE · IN ORDER'}</div>
        <div class="seq-slot-list">${slotsHtml}</div>
      </div>
      <div class="seq-pool-col">
        <div class="seq-pool-card">
          <div class="seq-pool-card-header">
            <span class="seq-pool-eyebrow">↓ TAP THE NEXT ${isItemBased ? 'ITEM' : 'STEP'}</span>
            <span class="seq-pool-left-count">${remaining} LEFT</span>
          </div>
          <div class="seq-chips">${chipsHtml}</div>
          ${distractorHtml}
          <div class="seq-pool-footer">
            <span class="seq-pool-hint">${isItemBased ? 'Tap items in correct order · distractor items are traps' : 'Tap steps in correct order · distractor steps are traps'}</span>
            ${!s.done ? `<div style="margin-top:10px;text-align:center"><a href="#" onclick="procAdvanceFromRecall();return false" style="font-size:12px;color:var(--ink-3);text-decoration:underline">Skip</a></div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}

function renderProcStep() {
  if (procState.inRecall) { renderProcSeqRecall(); return; }
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
        <button class="cf-btn cf-btn--primary" onclick="startProcedure(procState._lastProcId)">Fly Again</button>
        <button class="cf-btn cf-btn--ghost" style="margin-top:8px" onclick="procBack()">Change Procedure</button>
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
    </button>
    <div style="text-align:center;margin-top:10px;display:flex;justify-content:center;gap:24px">
      ${idx > 0 ? `<a href="#" onclick="prevProcStep();return false" style="font-size:12px;color:var(--ink-3);text-decoration:underline">← Back</a>` : ''}
      <a href="#" onclick="nextProcStep();return false" style="font-size:12px;color:var(--ink-3);text-decoration:underline">Skip</a>
    </div>`;

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
    if (speechState.listening) stopSpeech();
    procRadioInputMode = 'chips';
    speechContext = 'radio';
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

  if (allCorrect) {
    openVerdictSheet(
      'correct',
      'Configuration correct!',
      `<p>${step.feedback || 'Your configuration is correct.'}</p>`,
      () => retryConfigStep(),
      () => nextProcStep()
    );
  } else {
    // Hide wrong labels — don't reveal answers yet
    step.controls.forEach(ctrl => {
      const result = document.getElementById('result-' + ctrl.id);
      const row = document.getElementById('row-' + ctrl.id);
      if (row.classList.contains('wrong')) result.textContent = '✗ Not quite';
    });
    openVerdictSheet(
      'wrong',
      'Needs adjustment',
      '<p>One or more controls need adjustment. Tap Try Again to retry, or Next to see the correct values.</p>',
      () => retryConfigStep(),
      () => revealConfigAnswers()
    );
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
  fb.innerHTML = `<div class="proc-feedback-hd">✗ ${step.feedback}</div>`;
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
    <div class="radio-input-toggle">
      <button class="radio-input-btn active" id="proc-rbtn-chips" onclick="setProcRadioMode('chips')">Word Chips</button>
      <button class="radio-input-btn" id="proc-rbtn-speak" onclick="setProcRadioMode('speak')">🎙 Speak It</button>
    </div>
    <div id="proc-chip-area">
      <div class="proc-radio-output" id="proc-radio-output">
        <span class="placeholder">Tap words below in the correct order...</span>
      </div>
      <div class="proc-word-bank" id="proc-word-bank">${chips}</div>
      <div class="word-bank-hint">tap a word to add · tap again to remove</div>
    </div>
    <div id="proc-speak-area" style="display:none">
      <div class="radio-output" id="proc-speak-output">
        <span class="placeholder">Tap the mic and say your call...</span>
      </div>
      <div class="speak-mic-wrap">
        <button class="mic-btn" id="proc-mic-btn" onclick="toggleProcSpeech()">
          <span class="mic-icon">🎙</span>
          <span class="mic-label" id="proc-mic-label">Tap to speak</span>
        </button>
        <div class="mic-status" id="proc-mic-status"></div>
      </div>
      <div class="speak-hint">Say the full radio call out loud — speak clearly and at normal radio pace</div>
    </div>
    <div class="proc-radio-actions">
      <button class="cf-btn cf-btn--primary cf-btn--sm" onclick="checkProcRadioActive()">Check Call</button>
      <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="clearProcRadioActive()">Clear</button>
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

function setProcRadioMode(mode) {
  procRadioInputMode = mode;
  document.getElementById('proc-rbtn-chips').classList.toggle('active', mode === 'chips');
  document.getElementById('proc-rbtn-speak').classList.toggle('active', mode === 'speak');
  document.getElementById('proc-chip-area').style.display = mode === 'chips' ? '' : 'none';
  document.getElementById('proc-speak-area').style.display = mode === 'speak' ? '' : 'none';
  if (mode === 'speak') {
    speechState.transcript = '';
    document.getElementById('proc-speak-output').innerHTML =
      '<span class="placeholder">Tap the mic and say your call...</span>';
    document.getElementById('proc-mic-status').textContent = '';
  }
}

function toggleProcSpeech() {
  speechContext = 'proc';
  toggleSpeech();
}

function checkProcRadioActive() {
  if (procRadioInputMode === 'chips') checkProcRadio();
  else checkProcSpeech();
}

function clearProcRadioActive() {
  if (procRadioInputMode === 'chips') {
    clearProcRadio();
  } else {
    if (speechState.listening) stopSpeech();
    speechState.transcript = '';
    document.getElementById('proc-speak-output').innerHTML =
      '<span class="placeholder">Tap the mic and say your call...</span>';
    const fb = document.getElementById('proc-feedback');
    fb.className = 'proc-feedback';
    fb.innerHTML = '';
    document.getElementById('proc-mic-status').textContent = '';
    document.getElementById('proc-next-btn').classList.remove('show');
    procState.answered = false;
  }
}

function checkProcSpeech() {
  if (!speechState.transcript) {
    document.getElementById('proc-mic-status').textContent = 'Say your call first';
    return;
  }
  if (procState.answered) return;
  procState.answered = true;

  const step = procState.currentProc.steps[procState.currentStep];
  const result = scoreSpeechCall(speechState.transcript, step.ideal, step.words, step.speechOptional || []);
  const isGood = result.score >= 0.8;
  const pct = Math.round(result.score * 100);
  const wordHtml = result.words.map(w =>
    `<span class="speech-word ${w.status}">${w.word}</span>`
  ).join(' ');

  const bodyHtml = `
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--ink-3);margin-bottom:8px">${pct}% phonetic match</div>
    <div class="speech-score" style="margin-bottom:12px">${wordHtml}</div>
    <p style="font-size:13px;color:var(--ink-3)">${step.feedback || ''}</p>`;

  openVerdictSheet(
    isGood ? 'correct' : 'wrong',
    isGood ? `✓ Good call — ${pct}%` : `✗ ${pct}% — review below`,
    bodyHtml,
    () => clearProcRadioActive(),
    () => nextProcStep()
  );
}

function checkProcRadio() {
  if (procState.answered) return;
  procState.answered = true;
  const step = procState.currentProc.steps[procState.currentStep];
  const isCorrect = radioCallMatches(procRadioState.built, step);

  const usedDistractors = procRadioState.built
    .map(w => (step.distractors || []).find(d => d.text === w))
    .filter(Boolean);

  document.querySelectorAll('.proc-word-chip').forEach(c => { c.style.pointerEvents = 'none'; });

  let bodyHtml = `<p style="font-family:var(--font-mono);font-size:13px;line-height:1.7;color:var(--ink)">${step.ideal}</p>`;

  if (usedDistractors.length > 0) {
    bodyHtml += `<p style="margin-top:10px;font-size:13px">` +
      (isCorrect ? '⚠️ Trap chips you avoided — good:' : '⚠️ Trap chips you included:') +
      '<br>' + usedDistractors.map(d => `• "<strong>${d.text}</strong>" — ${d.why}`).join('<br>') + '</p>';
  }
  if (step.feedback) {
    bodyHtml += `<p style="margin-top:10px;font-size:13px;color:var(--ink-3)">${step.feedback}</p>`;
  }

  openVerdictSheet(
    isCorrect ? 'correct' : 'wrong',
    isCorrect ? '✓ Correct call' : '✗ Not quite',
    bodyHtml,
    () => clearProcRadio(),
    () => nextProcStep()
  );
}

function revealProcRadio() {
  const step = procState.currentProc.steps[procState.currentStep];
  const fb = document.getElementById('proc-feedback');
  fb.className = 'proc-feedback show wrong';
  fb.innerHTML = `<div class="proc-feedback-hd">✗ ${step.feedback}</div><div class="proc-feedback-bd"><strong>Ideal:</strong> ${step.ideal}</div>`;
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
  if (isCorrect) {
    fb.textContent = '✓ ' + step.feedback;
  } else {
    fb.innerHTML = `<div class="proc-feedback-hd">✗ ${step.feedback}</div>`;
  }
  document.getElementById('proc-next-btn').classList.add('show');
}

function nextProcStep() {
  procState.currentStep++;
  const proc = procState.currentProc;
  if (proc.recallGroups) {
    const group = proc.recallGroups[procState.recallGroupIdx];
    const nextGroupIdx = procState.recallGroupIdx + 1;
    if (group && procState.currentStep > group.stepEnd && nextGroupIdx < proc.recallGroups.length) {
      procState.recallGroupIdx = nextGroupIdx;
      procState.inRecall = true;
      const nextGroup = proc.recallGroups[nextGroupIdx];
      document.getElementById('proc-step-title').textContent = proc.title + ' · ' + nextGroup.label;
      document.querySelector('.proc-progress').style.display = 'none';
      _initProcRecall(proc, nextGroup);
      renderProcStep();
      updateHash();
      document.getElementById('view-procedures').scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  }
  renderProcStep();
  updateHash();
  document.getElementById('view-procedures').scrollTo({ top: 0, behavior: 'smooth' });
}

function prevProcStep() {
  if (procState.currentStep <= 0) return;
  procState.currentStep--;
  const proc = procState.currentProc;
  if (proc.recallGroups) {
    for (let i = 0; i < proc.recallGroups.length; i++) {
      const g = proc.recallGroups[i];
      if (procState.currentStep >= g.stepStart && procState.currentStep <= g.stepEnd) {
        procState.recallGroupIdx = i;
        break;
      }
    }
  }
  renderProcStep();
  updateHash();
  document.getElementById('view-procedures').scrollTo({ top: 0, behavior: 'smooth' });
}

function procBack() { showProcScreen('proc-screen-setup'); }

function filterProcedures(category) {
  document.querySelectorAll('.proc-select-card[data-category]').forEach(card => {
    card.style.display = (!category || card.dataset.category === category) ? '' : 'none';
  });
  const eyebrow = document.querySelector('#proc-screen-setup .cf-eyebrow');
  if (eyebrow) {
    const desc = category === 'airport' ? 'Procedures flown in the vicinity of the field, such as takeoffs, landings, and the traffic pattern'
               : category === 'airwork' ? 'Maneuvers practiced away from the field in the practice area, such as slow flight and stalls'
               : 'Select a procedure to begin';
    eyebrow.textContent = desc;
  }
}

function showProcScreen(id) {
  document.querySelectorAll('.proc-screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  currentProcScreen = id;
  updateHash();
}

function _setProcModeUI(mode) {
  document.querySelectorAll('#proc-mode-row .cl-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.procMode === mode);
  });
  const isProcs = mode === 'airport' || mode === 'airwork';
  document.getElementById('proc-main-mode').style.display = isProcs ? '' : 'none';
  document.getElementById('proc-vspeeds-mode').style.display = mode === 'vspeeds' ? '' : 'none';
  currentProcMode = mode;
}

function setProcMode(mode, btn) {
  _setProcModeUI(mode);
  if (mode === 'airport' || mode === 'airwork') {
    showProcScreen('proc-screen-setup');
    filterProcedures(mode);
  }
  if (mode === 'vspeeds' && !vspeedState.started && !vspeedState.finished) initVspeedDrill();
  updateHash();
}

// ── V-SPEEDS DRILL ──────────────────────────────────────────────────────────

const vspeedState = {
  started: false,
  finished: false,
  drillCount: 5,
  drillProgress: 0,
  bag: [],
  current: null,
  choices: [],
  answered: false,
  timedOut: false,
  selected: null,
  score: { correct: 0, total: 0, streak: 0 },
  history: [],
  drillMode: 'forward',   // 'forward' (symbol→speed) | 'reverse' (speed→symbol) | 'label' (symbol→name) | 'both' (random mix of all three)
  vspeedView: 'numbers',  // 'numbers' | 'situations'
  timerEnabled: false,
  timerSecs: 5,
  _timerRemaining: 0,
  _timerInterval: null,
  _questionStart: 0,
  _modeSeq: [],           // pre-built type sequence for 'both' mode
};

function _buildVspeedPool() {
  const speeds = ALL_AIRCRAFT[currentAircraft].speeds;
  return VSPEEDS_META.filter(m => speeds[m.key] != null);
}

function _buildVspeedReversePool() {
  const speeds = ALL_AIRCRAFT[currentAircraft].speeds;
  const seen = new Set();
  return VSPEEDS_META.filter(m => {
    if (speeds[m.key] == null) return false;
    const v = speeds[m.key];
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
}

function _buildVspeedDistractors(correctVal) {
  const allVals = new Set();
  Object.values(ALL_AIRCRAFT).forEach(ac => Object.values(ac.speeds).forEach(v => allVals.add(v)));
  const pool = [...allVals].filter(v => v !== correctVal);
  _shuffleArray(pool);
  return pool.slice(0, 3);
}

function _buildVspeedReverseDistractors(correctMeta, pool) {
  const correctVal = ALL_AIRCRAFT[currentAircraft].speeds[correctMeta.key];
  const others = pool.filter(m => ALL_AIRCRAFT[currentAircraft].speeds[m.key] !== correctVal);
  _shuffleArray(others);
  return others.slice(0, 3);
}

function _buildVspeedScenarioDistractors(correctMeta, pool) {
  const others = pool.filter(m => m.key !== correctMeta.key);
  _shuffleArray(others);
  return others.slice(0, 3);
}

function _buildVspeedLabelDistractors(correctMeta, pool) {
  const others = pool.filter(m => m.key !== correctMeta.key);
  _shuffleArray(others);
  return others.slice(0, 3);
}

function _pickPrompt(meta) {
  const pool = [meta.scenario, ...(meta.prompts || [])];
  return pool[Math.floor(Math.random() * pool.length)];
}

const _WHEN_ALTS = [2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000];
function _resolvePrompt(template) {
  const alt = _WHEN_ALTS[Math.floor(Math.random() * _WHEN_ALTS.length)];
  return template.replace('{alt}', alt.toLocaleString() + ' ft');
}

// Builds a shuffled type sequence for Random mode: ≥1 of each, no type > 50%.
function _buildRandomModeSequence(count) {
  const types = ['forward', 'reverse', 'label'];
  const maxPer = Math.floor(count / 2);
  const counts = { forward: 1, reverse: 1, label: 1 };
  const seq = [...types];
  while (seq.length < count) {
    const available = types.filter(t => counts[t] < maxPer);
    const t = available[Math.floor(Math.random() * available.length)];
    seq.push(t);
    counts[t]++;
  }
  return _shuffleArray(seq);
}

function setVspeedView(v) {
  vspeedState.vspeedView = v;
  if (!vspeedState.started) renderVspeedDrill();
}

function _clearVspeedTimer() {
  if (vspeedState._timerInterval) { clearInterval(vspeedState._timerInterval); vspeedState._timerInterval = null; }
}

function initVspeedDrill() {
  _clearVspeedTimer();
  Object.assign(vspeedState, {
    started: false, finished: false, drillProgress: 0, bag: [], _modeSeq: [],
    current: null, choices: [], answered: false, timedOut: false,
    selected: null, score: { correct: 0, total: 0, streak: 0 }, history: [],
  });
  renderVspeedDrill();
}

function startVspeedDrill() {
  _clearVspeedTimer();
  const pool = vspeedState.drillMode === 'reverse' ? _buildVspeedReversePool() : _buildVspeedPool();
  const modeSeq = vspeedState.drillMode === 'both'
    ? _buildRandomModeSequence(vspeedState.drillCount)
    : [];
  Object.assign(vspeedState, {
    started: true, finished: false, drillProgress: 0,
    score: { correct: 0, total: 0, streak: 0 }, history: [],
    bag: _shuffleArray([...pool]),
    _lastKey: null, _modeSeq: modeSeq,
  });
  _nextVspeedQuestion();
}

function _nextVspeedQuestion() {
  if (vspeedState.drillProgress >= vspeedState.drillCount) {
    _clearVspeedTimer();
    vspeedState.started = false;
    vspeedState.finished = true;
    renderVspeedDrill();
    return;
  }
  const effectiveMode = vspeedState.vspeedView === 'situations'
    ? 'when'
    : vspeedState.drillMode === 'both'
      ? vspeedState._modeSeq[vspeedState.drillProgress]
      : vspeedState.drillMode;
  const pool = effectiveMode === 'reverse' ? _buildVspeedReversePool() : _buildVspeedPool();
  if (!vspeedState.bag.length || vspeedState.drillMode === 'both') {
    vspeedState.bag = _shuffleArray([...pool]);
  }
  // Avoid consecutive repeat — if top of bag matches last shown, swap it with next item
  const lastKey = vspeedState._lastKey;
  if (vspeedState.bag.length > 1 && vspeedState.bag[vspeedState.bag.length - 1].key === lastKey) {
    const top = vspeedState.bag.pop();
    vspeedState.bag.splice(vspeedState.bag.length - 1, 0, top);
  }
  const meta = vspeedState.bag.pop();
  vspeedState._lastKey = meta.key;
  const correctVal = ALL_AIRCRAFT[currentAircraft].speeds[meta.key];
  const whenAnswerType = effectiveMode === 'when' ? (Math.random() < 0.5 ? 'symbol' : 'speed') : null;
  const whenPrompt     = effectiveMode === 'when' ? _resolvePrompt(_pickPrompt(meta)) : null;
  const choices = effectiveMode === 'forward'
    ? _shuffleArray([correctVal, ..._buildVspeedDistractors(correctVal)])
    : effectiveMode === 'when'
      ? whenAnswerType === 'speed'
        ? _shuffleArray([correctVal, ..._buildVspeedDistractors(correctVal)])
        : _shuffleArray([meta, ..._buildVspeedScenarioDistractors(meta, pool)])
      : effectiveMode === 'label'
        ? _shuffleArray([meta, ..._buildVspeedLabelDistractors(meta, pool)])
        : _shuffleArray([meta, ..._buildVspeedReverseDistractors(meta, pool)]);
  Object.assign(vspeedState, { current: { meta, correctVal, effectiveMode, whenAnswerType, whenPrompt }, choices, answered: false, timedOut: false, selected: null });
  renderVspeedDrill();
  vspeedState._questionStart = Date.now();
  if (vspeedState.timerEnabled) _startVspeedTimer();
}

function _startVspeedTimer() {
  _clearVspeedTimer();
  vspeedState._timerRemaining = vspeedState.timerSecs;
  vspeedState._timerInterval = setInterval(() => {
    vspeedState._timerRemaining = Math.max(0, vspeedState._timerRemaining - 0.1);
    if (vspeedState._timerRemaining <= 0) {
      _clearVspeedTimer();
      _vspeedTimeout();
    } else {
      _updateVspeedTimerDOM();
    }
  }, 100);
}

function _updateVspeedTimerDOM() {
  const bar = document.getElementById('vs-timer-bar');
  const label = document.getElementById('vs-timer-label');
  if (!bar) return;
  const pct = vspeedState._timerRemaining / vspeedState.timerSecs;
  bar.style.width = (pct * 100) + '%';
  bar.style.background = pct > 0.5 ? 'var(--terrain)' : pct > 0.2 ? 'var(--kb-accent)' : 'var(--hazard)';
  if (label) label.textContent = Math.ceil(vspeedState._timerRemaining) + 's';
}

function _vspeedTimeout() {
  if (vspeedState.answered) return;
  vspeedState.answered = true;
  vspeedState.timedOut = true;
  vspeedState.score.total++;
  vspeedState.score.streak = 0;
  vspeedState.history.push({ meta: vspeedState.current.meta, correctVal: vspeedState.current.correctVal, chosen: null, ok: false, timedOut: true, effectiveMode: vspeedState.current.effectiveMode, whenAnswerType: vspeedState.current.whenAnswerType, elapsed: vspeedState.timerSecs });
  vspeedState.drillProgress++;
  renderVspeedDrill();
}

function answerVspeed(val) {
  if (vspeedState.answered) return;
  const elapsed = Math.round((Date.now() - vspeedState._questionStart) / 100) / 10;
  _clearVspeedTimer();
  vspeedState.answered = true;
  vspeedState.selected = val;
  const em = vspeedState.current.effectiveMode;
  let correct;
  if (em === 'forward' || (em === 'when' && vspeedState.current.whenAnswerType === 'speed')) {
    correct = val === vspeedState.current.correctVal;
  } else if (em === 'label' || (em === 'when' && vspeedState.current.whenAnswerType === 'symbol')) {
    correct = val === vspeedState.current.meta.key;
  } else {
    correct = ALL_AIRCRAFT[currentAircraft].speeds[val] === vspeedState.current.correctVal;
  }
  vspeedState.score.total++;
  if (correct) { vspeedState.score.correct++; vspeedState.score.streak++; }
  else { vspeedState.score.streak = 0; }
  vspeedState.history.push({ meta: vspeedState.current.meta, correctVal: vspeedState.current.correctVal, chosen: val, ok: correct, timedOut: false, effectiveMode: em, whenAnswerType: vspeedState.current.whenAnswerType, elapsed });
  vspeedState.drillProgress++;
  renderVspeedDrill();
}

function setVspeedDrillCount(n) { vspeedState.drillCount = n; if (!vspeedState.started) renderVspeedDrill(); }
function setVspeedDrillMode(m)  { vspeedState.drillMode = m;  if (!vspeedState.started) renderVspeedDrill(); }
function setVspeedTimerEnabled(v) { vspeedState.timerEnabled = v; if (!vspeedState.started) renderVspeedDrill(); }
function setVspeedTimerSecs(n)  { vspeedState.timerSecs = n;  if (!vspeedState.started) renderVspeedDrill(); }

function renderVspeedDrill() {
  const el = document.getElementById('proc-vspeeds-mode');
  if (!el) return;
  const s = vspeedState;
  const ac = ALL_AIRCRAFT[currentAircraft];

  // ── Setup screen ──
  if (!s.started && !s.finished) {
    const repOpts = [5, 10, 15].map(n =>
      `<button class="alpha-len-btn vs-rep-btn${n === s.drillCount ? ' active' : ''}" onclick="setVspeedDrillCount(${n})">${n}</button>`
    ).join('');
    const exMeta = VSPEEDS_META[2]; // Vy
    const exVal  = ac.speeds[exMeta.key];
    const isSit  = s.vspeedView === 'situations';
    const pillHtml = `
      <div class="vs-view-toggle">
        <button class="vs-view-btn${!isSit ? ' active' : ''}" onclick="setVspeedView('numbers')">Numbers</button>
        <button class="vs-view-btn${isSit ? ' active' : ''}" onclick="setVspeedView('situations')">Situations</button>
      </div>`;

    if (isSit) {
      const sitCard = `<div class="alpha-setup-example">
        <span class="alpha-setup-ex-word" style="font-size:12px;font-family:var(--font-sans);font-weight:400;max-width:160px;text-align:left;line-height:1.3">${exMeta.scenario.slice(0, 46)}&hellip;</span>
        <span class="alpha-setup-ex-arrow">&rarr;</span>
        <span class="alpha-setup-ex-char">${exMeta.symbol}</span>
      </div>`;
      el.innerHTML = `
        <div class="alpha-drill" style="padding-top:16px">
          ${pillHtml}
          <div class="alpha-setup-desc">Read a scenario or ATC call and identify the V-speed it implies &mdash; as a symbol or a number, randomly. Builds the mental link between what you hear in the cockpit and what you do with the controls.</div>
          <div class="alpha-preview-card">${sitCard}<div class="alpha-preview-caption">Tap the symbol or speed the situation calls for &middot; ${ac.name}</div></div>
          <div class="alpha-setup-controls">
            <div class="alpha-setup-row">
              <span class="alpha-ctrl-label" style="min-width:62px">Reps</span>${repOpts}
            </div>
          </div>
          <div class="vs-mode-desc"><strong>Drill configuration:</strong> You&rsquo;ll see a V-speed symbol. Tap the situation that describes when you&rsquo;d use it. ${s.drillCount} reps, untimed.</div>
          <button class="alpha-start-btn" onclick="startVspeedDrill()">Start Drill for ${ac.name}</button>
        </div>`;
      return;
    }

    const isBoth  = s.drillMode === 'both';
    const isRev   = s.drillMode === 'reverse';
    const isLabel = s.drillMode === 'label';
    const exCaption = isBoth
      ? `Symbol, speed, or name &mdash; random mix &middot; ${ac.name}`
      : isRev
        ? `Tap the symbol that matches the speed &middot; ${ac.name}`
        : isLabel
          ? `Tap the name that matches the symbol &middot; ${ac.name}`
          : `Tap the speed that matches the symbol &middot; ${ac.name}`;
    const exCard = isBoth
      ? `<div class="alpha-setup-example">
           <span class="alpha-setup-ex-char">${exMeta.symbol}</span>
           <span class="alpha-setup-ex-arrow">&harr;</span>
           <span class="alpha-setup-ex-word">${exVal} KIAS</span>
         </div>`
      : isRev
        ? `<div class="alpha-setup-example">
             <span class="alpha-setup-ex-word">${exVal} KIAS</span>
             <span class="alpha-setup-ex-arrow">&rarr;</span>
             <span class="alpha-setup-ex-char">${exMeta.symbol}</span>
           </div>`
        : isLabel
          ? `<div class="alpha-setup-example">
               <span class="alpha-setup-ex-char">${VSPEEDS_META[4].symbol}</span>
               <span class="alpha-setup-ex-arrow">&rarr;</span>
               <span class="alpha-setup-ex-word">${VSPEEDS_META[4].label}</span>
             </div>`
          : `<div class="alpha-setup-example">
               <span class="alpha-setup-ex-char">${exMeta.symbol}</span>
               <span class="alpha-setup-ex-arrow">&rarr;</span>
               <span class="alpha-setup-ex-word">${exVal} KIAS</span>
             </div>`;
    const timerSecsOpts = [3, 5, 10].map(n =>
      `<button class="alpha-len-btn vs-rep-btn${n === s.timerSecs ? ' active' : ''}" onclick="setVspeedTimerSecs(${n})" style="visibility:${s.timerEnabled ? 'visible' : 'hidden'}">${n}s</button>`
    ).join('');
    el.innerHTML = `
      <div class="alpha-drill" style="padding-top:16px">
        ${pillHtml}
        <div class="alpha-setup-desc">Knowing v-speeds without thinking frees up your attention for everything else. This drill uses repetition to make them automatic. The goal is for the right number to surface before you even finish reading the question.</div>
        <div class="alpha-preview-card">${exCard}<div class="alpha-preview-caption">${exCaption}</div></div>
        <div class="alpha-setup-controls">
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label" style="min-width:62px">Mode</span>
            <button class="alpha-len-btn alpha-len-btn--wide${!isRev && !isBoth && !isLabel ? ' active' : ''}" onclick="setVspeedDrillMode('forward')" ${isBoth ? 'disabled' : ''}>Symbol</button>
            <button class="alpha-len-btn alpha-len-btn--wide${isRev ? ' active' : ''}" onclick="setVspeedDrillMode('reverse')" ${isBoth ? 'disabled' : ''}>Speed</button>
            <button class="alpha-len-btn alpha-len-btn--wide${isLabel ? ' active' : ''}" onclick="setVspeedDrillMode('label')" ${isBoth ? 'disabled' : ''}>Label</button>
          </div>
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label" style="min-width:62px">Random</span>
            <div class="alpha-toggle${isBoth ? ' alpha-toggle--on' : ''}" onclick="setVspeedDrillMode('${isBoth ? 'forward' : 'both'}')"></div>
            <span class="alpha-toggle-note">${isBoth ? 'mix of Symbol, Speed, &amp; Label' : ''}</span>
          </div>
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label" style="min-width:62px">Reps</span>${repOpts}
          </div>
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label" style="min-width:62px">Timer</span>
            <div class="alpha-toggle${s.timerEnabled ? ' alpha-toggle--on' : ''}" onclick="setVspeedTimerEnabled(${!s.timerEnabled})"></div>
            ${timerSecsOpts}
          </div>
        </div>
        <div class="vs-mode-desc"><strong>Drill configuration:</strong> ${
          isBoth  ? 'Random mix &mdash; symbol &rarr; speed, speed &rarr; symbol, or symbol &rarr; name.' :
          isRev   ? 'You\'ll see an airspeed. Tap the V-speed symbol it matches.' :
          isLabel ? 'You\'ll see a V-speed symbol. Tap the name it stands for.' :
                    'You\'ll see a V-speed symbol. Tap the airspeed it matches.'
        } ${s.drillCount} reps, ${s.timerEnabled ? `${s.timerSecs} second${s.timerSecs === 1 ? '' : 's'} per question.` : 'untimed.'}</div>
        <button class="alpha-start-btn" onclick="startVspeedDrill()">Start Drill for ${ac.name}</button>
        ${!s.timerEnabled ? `<div class="vs-timer-note"><strong>Note:</strong> No timer is fine while you&rsquo;re still learning the numbers. Once they start to stick, turn it on. You want these automatic, not something you have to think about when you&rsquo;re busy in the pattern.</div>` : ''}
      </div>`;
    return;
  }

  // ── Finish screen ──
  if (s.finished) {
    const pct = s.score.total ? Math.round(100 * s.score.correct / s.score.total) : 0;
    const histHtml = s.history.map(h => {
      let valHtml;
      if (h.timedOut) {
        const hint = h.effectiveMode === 'forward'   ? `${h.correctVal} KIAS`
                   : h.effectiveMode === 'when'
                     ? (h.whenAnswerType === 'speed' ? `${h.correctVal} KIAS` : h.meta.symbol)
                   : h.effectiveMode === 'label'     ? h.meta.label
                   : h.meta.symbol;
        valHtml = `<span class="vs-history-timeout">Timed out &rarr; ${hint}</span>`;
      } else if (h.effectiveMode === 'forward') {
        valHtml = h.ok
          ? `${h.correctVal} KIAS`
          : `<s>${h.chosen} KIAS</s> &rarr; ${h.correctVal} KIAS`;
      } else if (h.effectiveMode === 'label') {
        const chosenMeta = VSPEEDS_META.find(m => m.key === h.chosen);
        valHtml = h.ok
          ? '&check;'
          : `<s>${chosenMeta ? chosenMeta.label : '?'}</s> &rarr; ${h.meta.label}`;
      } else if (h.effectiveMode === 'when') {
        if (h.whenAnswerType === 'speed') {
          valHtml = h.ok
            ? `${h.correctVal} KIAS`
            : `<s>${h.chosen} KIAS</s> &rarr; ${h.correctVal} KIAS`;
        } else {
          const chosenMeta = VSPEEDS_META.find(m => m.key === h.chosen);
          valHtml = h.ok
            ? h.meta.symbol
            : `<s>${chosenMeta ? chosenMeta.symbol : '?'}</s> &rarr; ${h.meta.symbol}`;
        }
      } else {
        const chosenMeta = VSPEEDS_META.find(m => m.key === h.chosen);
        valHtml = h.ok
          ? h.meta.symbol
          : `<s>${chosenMeta ? chosenMeta.symbol : '?'}</s> &rarr; ${h.meta.symbol}`;
      }
      const timeHtml = h.elapsed !== undefined ? `<span class="vs-history-time">${h.elapsed}s</span>` : '';
      return `<div class="vs-history-row${h.ok ? ' ok' : ' miss'}">
        <span class="vs-history-symbol">${h.meta.symbol}</span>
        <span class="vs-history-label">${h.meta.label}</span>
        <span class="vs-history-val">${valHtml}</span>
        ${timeHtml}
      </div>`;
    }).join('');
    const mostlyFast = shouldNudgeVspeedTimer(s.history, s.score, s.timerEnabled);
    const nudgeHtml = mostlyFast
      ? `<div class="vs-timer-note"><strong>Nice.</strong> Most of those came in under 4 seconds. Try turning on the timer and see how you hold up under pressure.</div>`
      : '';
    el.innerHTML = `
      <div class="alpha-drill" style="padding-top:16px">
        <div class="alpha-finish-score">${s.score.correct} / ${s.score.total}</div>
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--ink-3);margin-bottom:16px">${pct}% correct</div>
        <div class="cf-eyebrow" style="margin-bottom:8px">Your Answers</div>
        <div class="vs-history">${histHtml}</div>
        ${nudgeHtml}
        <div style="display:flex;gap:8px;margin-top:20px">
          <button class="alpha-start-btn" style="flex:1" onclick="startVspeedDrill()">Go Again</button>
          <button class="alpha-stop-btn" style="flex:1;margin-top:0" onclick="initVspeedDrill()">Settings</button>
        </div>
      </div>`;
    return;
  }

  // ── Active question ──
  const { meta, correctVal, effectiveMode } = s.current;
  const isRev   = effectiveMode === 'reverse';
  const isWhen  = effectiveMode === 'when';
  const isLabel = effectiveMode === 'label';
  const progressHtml = `<span class="alpha-progress">${s.drillProgress + 1} / ${s.drillCount}</span>`;
  const streakBadge = s.score.streak >= 3 ? `<span class="alpha-score-streak">&#128293;&nbsp;${s.score.streak}</span>` : '';
  const scoreHtml = `<div class="alpha-score"><span class="alpha-score-stat">${s.score.correct}/${s.drillProgress}</span>${streakBadge}</div>`;
  const backBtn = `<button class="vs-back-btn" onclick="initVspeedDrill()">&lsaquo; Settings</button>`;

  const timerHtml = s.timerEnabled ? `
    <div class="vs-timer">
      <div class="vs-timer-track"><div class="vs-timer-bar" id="vs-timer-bar" style="width:100%;background:var(--terrain)"></div></div>
      <span class="vs-timer-label" id="vs-timer-label">${Math.ceil(s._timerRemaining || s.timerSecs)}s</span>
    </div>` : '';

  let cardHtml, choicesHtml;
  if (isLabel) {
    cardHtml = `<div class="vs-card"><div class="vs-symbol">${meta.symbol}</div></div>`;
    choicesHtml = s.choices.map(m => {
      const isCorrect = m.key === meta.key;
      let cls = 'vs-choice vs-choice--label';
      if (s.answered) {
        if (isCorrect)             cls += ' correct';
        else if (m.key === s.selected) cls += ' wrong';
        else                       cls += ' dim';
      }
      return `<button class="${cls}" onclick="answerVspeed('${m.key}')" ${s.answered ? 'disabled' : ''}>${m.label}</button>`;
    }).join('');
  } else if (isWhen) {
    const { whenAnswerType, whenPrompt } = s.current;
    cardHtml = `<div class="vs-card vs-card--prompt"><div class="vs-prompt-text">${whenPrompt}</div></div>`;
    if (whenAnswerType === 'speed') {
      choicesHtml = s.choices.map(v => {
        let cls = 'vs-choice';
        if (s.answered) {
          if (v === correctVal)     cls += ' correct';
          else if (v === s.selected) cls += ' wrong';
          else                      cls += ' dim';
        }
        return `<button class="${cls}" onclick="answerVspeed(${v})" ${s.answered ? 'disabled' : ''}>${v}<span class="vs-choice-unit">KIAS</span></button>`;
      }).join('');
    } else {
      choicesHtml = s.choices.map(m => {
        const isCorrect = m.key === meta.key;
        let cls = 'vs-choice vs-choice--sym';
        if (s.answered) {
          if (isCorrect)               cls += ' correct';
          else if (m.key === s.selected) cls += ' wrong';
          else                         cls += ' dim';
        }
        return `<button class="${cls}" onclick="answerVspeed('${m.key}')" ${s.answered ? 'disabled' : ''}>
          <span class="vs-choice-sym-label">${m.symbol}</span>
          ${s.answered ? `<span class="vs-choice-sym-def">${m.label}</span>` : ''}
        </button>`;
      }).join('');
    }
  } else if (!isRev) {
    cardHtml = `<div class="vs-card"><div class="vs-symbol">${meta.symbol}</div>${s.drillMode !== 'both' ? `<div class="vs-label">${meta.label}</div>` : ''}</div>`;
    choicesHtml = s.choices.map(v => {
      let cls = 'vs-choice';
      if (s.answered) {
        if (v === correctVal) cls += ' correct';
        else if (v === s.selected) cls += ' wrong';
        else cls += ' dim';
      }
      return `<button class="${cls}" onclick="answerVspeed(${v})" ${s.answered ? 'disabled' : ''}>${v}<span class="vs-choice-unit">KIAS</span></button>`;
    }).join('');
  } else {
    cardHtml = `<div class="vs-card"><div class="vs-symbol vs-symbol--speed">${correctVal}<span class="vs-symbol-unit">KIAS</span></div><div class="vs-label">Which V-speed is this?</div></div>`;
    choicesHtml = s.choices.map(m => {
      const isCorrect = ALL_AIRCRAFT[currentAircraft].speeds[m.key] === correctVal;
      let cls = 'vs-choice vs-choice--sym';
      if (s.answered) {
        if (isCorrect) cls += ' correct';
        else if (m.key === s.selected) cls += ' wrong';
        else cls += ' dim';
      }
      return `<button class="${cls}" onclick="answerVspeed('${m.key}')" ${s.answered ? 'disabled' : ''}>
        <span class="vs-choice-sym-label">${m.symbol}</span>
        <span class="vs-choice-sym-def">${m.label}</span>
      </button>`;
    }).join('');
  }

  const nextBtn = s.answered
    ? `<button class="alpha-start-btn" style="margin-top:16px" onclick="_nextVspeedQuestion()">Next &rarr;</button>`
    : '';

  el.innerHTML = `
    <div class="alpha-drill" style="padding-top:16px">
      <div class="alpha-drill-header">${backBtn}${progressHtml}${scoreHtml}</div>
      ${timerHtml}
      ${cardHtml}
      <div class="vs-choices${isWhen ? ' vs-choices--when' : ''}">${choicesHtml}</div>
      ${nextBtn}
    </div>`;

  if (s.timerEnabled && !s.answered) _updateVspeedTimerDOM();
}

// ── SEQUENCE RECALL ──
let seqState = {
  phase: 'preflight',
  shuffled: [],   // all items shuffled, each has origIdx
  order: [],      // legacy drag-and-drop ordering (kept for compat)
  checked: false,
  dragSrc: null,  // { type: 'pool'|'slot', idx }
  // tap-in-order state
  nextSlot: 0,    // next slot index to fill
  ok: 0,          // correct taps
  miss: 0,        // wrong taps
  elapsed: 0,     // seconds since drill start
  _timer: null,   // setInterval handle
  done: false,    // completion flag
  shakingIdx: null, // origIdx of chip currently animating shake
};

function setClMode(mode, btn) {
  document.querySelectorAll('.cl-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cl-reference-mode').style.display = mode === 'reference' ? '' : 'none';
  document.getElementById('cl-recall-mode').style.display = mode === 'recall' ? '' : 'none';
  if (mode === 'recall') {
    if (state.checklist.phase === 'preflight') {
      state.checklist.phase = 'beforestart';
      document.querySelectorAll('.phase-btn').forEach((b, i) => {
        b.classList.toggle('active', Object.keys(CHECKLISTS)[i] === 'beforestart');
      });
    }
    initSeqRecall();
  }
  currentClMode = mode;
  updatePreflightBtn();
  updateHash();
}

function updatePreflightBtn() {
  const btn = document.querySelector('.phase-btn');
  if (!btn) return;
  const inRecall = currentClMode === 'recall';
  btn.disabled = inRecall;
  const note = document.getElementById('preflight-recall-note');
  if (note) note.style.display = inRecall ? '' : 'none';
}

function initSeqRecall() {
  if (seqState._timer) clearInterval(seqState._timer);
  const phase = state.checklist.phase || 'preflight';
  const list = CHECKLISTS[phase];
  seqState.phase = phase;
  seqState.shuffled = list.items
    .map((item, i) => ({ ...item, origIdx: i }))
    .sort(() => Math.random() - 0.5);
  seqState.order = new Array(list.items.length).fill(-1);
  seqState.placed = new Set();
  const hasBucketsInit = list.items.some(it => it.bucket);
  seqState.freeSelections = new Set();
  seqState.freeChecked = false;
  seqState.freeCorrect = false;
  seqState.freeSlotResults = [];
  const gateItem = list.items.find(it => it.bucket === 'gate');
  if (gateItem) {
    const nonGatePool = list.items.filter(it => it.bucket !== 'gate');
    const distractors = [...nonGatePool].sort(() => Math.random() - 0.5).slice(0, 5).map(it => it.action);
    seqState.gateOptions = [gateItem.action, ...distractors].sort(() => Math.random() - 0.5);
  } else {
    seqState.gateOptions = [];
  }
  seqState.gateAnswer = '';
  seqState.gateChecked = false;
  seqState.gateCorrect = false;
  seqState.pickerOpen = false;
  seqState.checked = false;
  seqState.dragSrc = null;
  seqState._selectedPool = null;
  seqState._selectedSlot = null;
  seqState.nextSlot = 0;
  seqState.ok = 0;
  seqState.miss = 0;
  seqState.elapsed = 0;
  seqState.done = false;
  seqState.shakingIdx = null;
  seqState._timer = setInterval(() => {
    if (!seqState.done) {
      seqState.elapsed++;
      const el = document.getElementById('seq-timer');
      if (el) el.textContent = fmtSeqTime(seqState.elapsed);
    }
  }, 1000);
  renderSeqRecall();
}

function fmtSeqTime(s) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function tapChip(origIdx) {
  if (seqState.done) return;
  const list = CHECKLISTS[seqState.phase];
  const item = list.items[origIdx];
  const hasBuckets = list.items.some(it => it.bucket);

  if (hasBuckets) {
    if (item.bucket === 'ordered') {
      const nextOrderedIdx = list.items
        .findIndex((it, i) => it.bucket === 'ordered' && !seqState.placed.has(i));
      if (nextOrderedIdx !== origIdx) {
        seqState.miss++;
        seqState.shakingIdx = origIdx;
        renderSeqRecall();
        setTimeout(() => {
          seqState.shakingIdx = null;
          const chip = document.querySelector('.seq-chip--shake');
          if (chip) chip.classList.remove('seq-chip--shake');
        }, 600);
        return;
      }
    }
    seqState.ok++;
    seqState.placed.add(origIdx);
    const orderedCount = list.items.filter(it => it.bucket === 'ordered').length;
    if (seqState.placed.size === orderedCount && seqState.freeCorrect && seqState.gateCorrect) {
      seqState.done = true;
      clearInterval(seqState._timer);
      setTimeout(renderSeqRecall, 600);
    } else {
      renderSeqRecall();
    }
  } else {
    if (origIdx === seqState.nextSlot) {
      seqState.ok++;
      seqState.nextSlot++;
      if (seqState.nextSlot === list.items.length) {
        seqState.done = true;
        clearInterval(seqState._timer);
        setTimeout(renderSeqRecall, 600);
      } else {
        renderSeqRecall();
      }
    } else {
      seqState.miss++;
      seqState.shakingIdx = origIdx;
      renderSeqRecall();
      setTimeout(() => {
        seqState.shakingIdx = null;
        const chip = document.querySelector('.seq-chip--shake');
        if (chip) chip.classList.remove('seq-chip--shake');
      }, 600);
    }
  }
}

function toggleFreeItem(action) {
  if (seqState.freeCorrect) return;
  const list = CHECKLISTS[seqState.phase];
  const freeCount = list.items.filter(it => it.bucket === 'free').length;
  if (seqState.freeSelections.has(action)) {
    seqState.freeSelections.delete(action);
  } else if (seqState.freeSelections.size < freeCount) {
    seqState.freeSelections.add(action);
  }
  seqState.freeChecked = false;
  seqState.freeSlotResults = [];
  renderSeqRecall();
}

function checkFreeItems() {
  const list = CHECKLISTS[seqState.phase];
  const freeSet = new Set(list.items.filter(it => it.bucket === 'free').map(it => it.action));
  const selected = seqState.freeSelections;
  seqState.freeChecked = true;
  seqState.freeCorrect = selected.size === freeSet.size && [...selected].every(s => freeSet.has(s));
  if (seqState.freeCorrect) {
    const orderedCount = list.items.filter(it => it.bucket === 'ordered').length;
    if (seqState.placed.size === orderedCount && seqState.gateCorrect) {
      seqState.done = true;
      clearInterval(seqState._timer);
    }
  }
  renderSeqRecall();
}

function retryFreeItems() {
  seqState.freeSelections = new Set();
  seqState.freeChecked = false;
  seqState.freeCorrect = false;
  seqState.freeSlotResults = [];
  renderSeqRecall();
}

function showFreeAnswers() {
  const list = CHECKLISTS[seqState.phase];
  const freeSet = new Set(list.items.filter(it => it.bucket === 'free').map(it => it.action));
  seqState.freeSelections = freeSet;
  seqState.freeChecked = true;
  seqState.freeCorrect = true;
  seqState.pickerOpen = false;
  renderSeqRecall();
}

function selectGateAnswer(action) {
  if (seqState.gateCorrect) return;
  const list = CHECKLISTS[seqState.phase];
  const gateItem = list.items.find(it => it.bucket === 'gate');
  seqState.gateAnswer = action;
  seqState.gateChecked = true;
  seqState.gateCorrect = action === gateItem.action;
  renderSeqRecall();
}

function retryGateAnswer() {
  seqState.gateAnswer = '';
  seqState.gateChecked = false;
  seqState.gateCorrect = false;
  renderSeqRecall();
}

function togglePicker() {
  seqState.pickerOpen = !seqState.pickerOpen;
  renderSeqRecall();
}

function renderSeqRecall() {
  const phase = seqState.phase;
  const list = CHECKLISTS[phase];
  const total = list.items.length;
  const nextSlot = seqState.nextSlot;
  const hasBuckets = list.items.some(it => it.bucket);
  const placed = seqState.placed || new Set();
  const nextOrderedIdx = hasBuckets
    ? list.items.findIndex((it, i) => it.bucket === 'ordered' && !placed.has(i))
    : -1;
  const ok = seqState.ok;
  const miss = seqState.miss;
  const accuracy = ok + miss > 0 ? Math.round(ok / (ok + miss) * 100) : 100;

  const freeItems = hasBuckets ? list.items.filter(it => it.bucket === 'free') : [];
  const gateCompleted = hasBuckets && seqState.gateCorrect ? 1 : 0;
  const freeCompleted = hasBuckets && seqState.freeCorrect ? freeItems.length : 0;
  const completedCount = hasBuckets ? gateCompleted + freeCompleted + placed.size : nextSlot;
  const pct = Math.round(completedCount / total * 100);

  // Slot rows
  const slotsHtml = list.items.map((item, i) => {
    const filled = hasBuckets
      ? (item.bucket === 'gate' ? seqState.gateCorrect : item.bucket === 'free' ? seqState.freeCorrect : placed.has(i))
      : i < nextSlot;
    const isNext = hasBuckets ? false : i === nextSlot && !seqState.done;
    return `<div class="seq-slot-row${isNext ? ' seq-slot-row--next' : ''}">
      <span class="seq-row-idx">${String(i + 1).padStart(2, '0')}</span>
      <div class="seq-row-check${filled ? ' seq-row-check--done' : ''}">
        ${filled ? '<svg width="11" height="9" viewBox="0 0 12 10" fill="none"><path d="M1 5L4.5 8.5L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' : ''}
      </div>
      <div>
        ${filled
          ? `<div class="seq-row-filled">
               <span class="seq-row-name">${item.action}</span>
               ${item.value ? `<span class="seq-row-call">· ${item.value}</span>` : ''}
             </div>`
          : isNext
          ? `<span class="seq-row-next-hint">→ NEXT IN SEQUENCE</span>`
          : `<span class="seq-row-placeholder"></span>`}
      </div>
      <div></div>
    </div>`;
  }).join('');

  // Completion banner
  const doneBanner = seqState.done ? `
    <div class="seq-done-banner">
      <div class="seq-done-disc">✓</div>
      <div style="flex:1">
        <div class="seq-done-title">Nailed it.</div>
        <div class="seq-done-sub">${completedCount} / ${total} in ${fmtSeqTime(seqState.elapsed)} · ${accuracy}% accuracy. Logged to your record.</div>
      </div>
      <button class="cf-btn cf-btn--solid cf-btn--sm" onclick="initSeqRecall()">Try again</button>
    </div>` : '';

  // Pool
  const seqActionCounts = {};
  list.items.forEach(li => { seqActionCounts[li.action] = (seqActionCounts[li.action] || 0) + 1; });

  let poolHtml;
  if (seqState.done) {
    poolHtml = '';
  } else if (hasBuckets) {
    const gateItem = list.items.find(it => it.bucket === 'gate');
    const freeSet = new Set(freeItems.map(it => it.action));
    const freeCount = freeItems.length;
    const selCount = seqState.freeSelections.size;

    // ── Section 1: gate (multiple choice) ──
    const gateOptHtml = seqState.gateOptions.map(opt => {
      const isSel = seqState.gateAnswer === opt;
      const isCorrect = seqState.gateChecked && opt === gateItem.action;
      const isWrong = seqState.gateChecked && isSel && opt !== gateItem.action;
      return `<button class="seq-gate-opt${isCorrect ? ' seq-gate-opt--correct' : ''}${isWrong ? ' seq-gate-opt--wrong' : ''}${isSel && !seqState.gateChecked ? ' seq-gate-opt--selected' : ''}"
                onclick="selectGateAnswer('${opt.replace(/'/g, "\\'")}')"
                ${seqState.gateCorrect ? 'disabled' : ''}>${opt}</button>`;
    }).join('');
    const gateFooter = seqState.gateChecked && !seqState.gateCorrect
      ? `<div class="seq-pool-footer"><button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="retryGateAnswer()">Try Again</button></div>`
      : '';

    // ── Section 2: free (accordion picker) ──
    const sec2Locked = !seqState.gateCorrect;
    const universeActions = [...new Set(
      Object.values(CHECKLISTS).flatMap(cl => cl.items).map(it => it.action)
    )].filter(a => a !== (gateItem && gateItem.action)).sort();
    const freeListHtml = universeActions.map(a => {
      const isSelected = seqState.freeSelections.has(a);
      const isCorrect = seqState.freeChecked && isSelected && freeSet.has(a);
      const isWrong = seqState.freeChecked && isSelected && !freeSet.has(a);
      const isMissed = seqState.freeChecked && !isSelected && freeSet.has(a);
      return `<button class="seq-free-item${isSelected ? ' seq-free-item--selected' : ''}${isCorrect ? ' seq-free-item--correct' : ''}${isWrong ? ' seq-free-item--wrong' : ''}${isMissed ? ' seq-free-item--missed' : ''}"
                onclick="toggleFreeItem('${a.replace(/'/g, "\\'")}')"
                ${seqState.freeCorrect ? 'disabled' : ''}>${a}</button>`;
    }).join('');
    const previewHtml = selCount === 0
      ? `<span class="seq-picker-empty">Nothing selected yet — tap Open to choose</span>`
      : [...seqState.freeSelections].map(a => {
          const isCorrect = seqState.freeChecked && freeSet.has(a);
          const isWrong = seqState.freeChecked && !freeSet.has(a);
          return `<span class="seq-picker-tag${isCorrect ? ' seq-picker-tag--correct' : ''}${isWrong ? ' seq-picker-tag--wrong' : ''}">${a}</span>`;
        }).join('');
    const sec2Body = sec2Locked
      ? `<div class="seq-card-lock">Complete section 1 first</div>`
      : seqState.pickerOpen
      ? `<div class="seq-free-list">${freeListHtml}</div>
         <div class="seq-pool-footer" style="gap:8px;flex-wrap:wrap">
           <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="togglePicker()">Done ▲</button>
           <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="showFreeAnswers()">Show Answers</button>
         </div>`
      : `<div class="seq-picker-preview">${previewHtml}</div>
         <div class="seq-pool-footer" style="gap:8px;flex-wrap:wrap">
           <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="togglePicker()">${selCount === 0 ? 'Open ▼' : 'Edit ▼'}</button>
           ${selCount === freeCount && !seqState.freeChecked ? `<button class="cf-btn cf-btn--primary cf-btn--sm" onclick="checkFreeItems()">Check</button>` : ''}
           ${seqState.freeChecked && !seqState.freeCorrect ? `<button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="retryFreeItems()">Try Again</button>` : ''}
           ${seqState.freeChecked && !seqState.freeCorrect ? `<button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="showFreeAnswers()">Show Answers</button>` : ''}
           ${seqState.freeCorrect ? `<span class="seq-free-ok">All correct</span>` : ''}
         </div>`;

    // ── Section 3: ordered chips ──
    const sec3Locked = !seqState.freeCorrect;
    const orderedChipsHtml = seqState.shuffled
      .filter(it => list.items[it.origIdx].bucket === 'ordered')
      .map(it => {
        const chipPlaced = placed.has(it.origIdx);
        const shaking = seqState.shakingIdx === it.origIdx;
        const chipLabel = seqActionCounts[it.action] > 1 && it.value
          ? `${it.action} — ${it.value.toLowerCase().replace(/\s+[—–-]\s+.*$/, '')}`
          : it.action;
        return `<button class="seq-chip${shaking ? ' seq-chip--shake' : ''}"
                  onclick="tapChip(${it.origIdx})"
                  ${chipPlaced || sec3Locked ? 'disabled' : ''}>${chipLabel}</button>`;
      }).join('');
    const orderedRemaining = list.items.filter(it => it.bucket === 'ordered').length - placed.size;
    const sec3Body = sec3Locked
      ? `<div class="seq-card-lock">Complete section 2 first</div>`
      : `<div class="seq-chips">${orderedChipsHtml}</div>
         <div class="seq-pool-footer"><span class="seq-pool-hint">Tap the highlighted chip next.</span></div>`;

    poolHtml = `
      <div class="seq-pool-card">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">① WHAT MUST HAPPEN FIRST?</span>
        </div>
        <div class="seq-gate-options">${gateOptHtml}</div>
        ${gateFooter}
      </div>
      <div class="seq-pool-card seq-ordered-pool${sec2Locked ? ' seq-card--locked' : ''}">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">② SETUP ITEMS — ANY ORDER</span>
          <span class="seq-pool-left-count">${selCount} / ${freeCount}</span>
        </div>
        ${sec2Body}
      </div>
      <div class="seq-pool-card seq-ordered-pool${sec3Locked ? ' seq-card--locked' : ''}">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">③ TAP IN SEQUENCE</span>
          <span class="seq-pool-left-count">${orderedRemaining} LEFT</span>
        </div>
        ${sec3Body}
      </div>`;
  } else {
    const remaining = seqState.shuffled.filter(it => it.origIdx >= nextSlot).length;
    poolHtml = `<div class="seq-pool-card">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">↓ TAP THE NEXT ITEM</span>
          <span class="seq-pool-left-count">${remaining} LEFT</span>
        </div>
        <div class="seq-chips">
          ${seqState.shuffled.map(it => {
            const chipPlaced = it.origIdx < nextSlot;
            const shaking = seqState.shakingIdx === it.origIdx;
            const chipLabel = seqActionCounts[it.action] > 1 && it.value ? `${it.action} — ${it.value.toLowerCase().replace(/\s+[—–-]\s+.*$/, '')}` : it.action;
            return `<button class="seq-chip${shaking ? ' seq-chip--shake' : ''}"
                      onclick="tapChip(${it.origIdx})"
                      ${chipPlaced ? 'disabled' : ''}>${chipLabel}</button>`;
          }).join('')}
        </div>
        <div class="seq-pool-footer">
          <span class="seq-pool-hint">Tap chips in the correct order to fill each slot.</span>
        </div>
      </div>`;
  }

  document.getElementById('seq-content').innerHTML = `
    <div class="seq-page-header">
      <div>
        <div class="seq-page-eyebrow">↳ DRILL · TAP IN ORDER · ${list.label.toUpperCase()}</div>
        <h2 class="seq-page-title">Build the checklist <span>from memory</span>.</h2>
      </div>
      <div class="seq-hud">
        <div class="seq-hud-stat">
          <div class="seq-hud-label">TIME</div>
          <div class="seq-hud-val" id="seq-timer">${fmtSeqTime(seqState.elapsed)}</div>
        </div>
        <div class="seq-hud-stat">
          <div class="seq-hud-label">OK</div>
          <div class="seq-hud-val${ok > 0 ? ' seq-hud-val--ok' : ''}">${ok}</div>
        </div>
        <div class="seq-hud-stat">
          <div class="seq-hud-label">MISS</div>
          <div class="seq-hud-val${miss > 0 ? ' seq-hud-val--miss' : ''}">${miss}</div>
        </div>
        <div class="seq-hud-stat">
          <div class="seq-hud-label">ACC</div>
          <div class="seq-hud-val">${accuracy}%</div>
        </div>
      </div>
    </div>
    <div class="seq-progress-row">
      <div class="seq-progress-bar"><div class="seq-progress-fill" style="width:${pct}%"></div></div>
      <span class="seq-progress-count">${completedCount} / ${total}</span>
    </div>
    <div class="seq-grid">
      ${hasBuckets ? `
      <aside class="seq-pool-col">
        ${poolHtml}
        <div class="seq-pool-actions">
          <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="initSeqRecall()">Restart</button>
        </div>
      </aside>
      <div class="seq-slot-col">
        <div class="seq-col-eyebrow">↓ THE CHECKLIST · IN ORDER</div>
        <div class="seq-slot-list">${slotsHtml}</div>
        ${doneBanner}
      </div>
      ` : `
      <div class="seq-slot-col">
        <div class="seq-col-eyebrow">↓ THE CHECKLIST · IN ORDER</div>
        <div class="seq-slot-list">${slotsHtml}</div>
        ${doneBanner}
      </div>
      <aside class="seq-pool-col">
        ${poolHtml}
        <div class="seq-pool-actions">
          <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="initSeqRecall()">Restart</button>
        </div>
      </aside>
      `}
    </div>`;
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
      <button class="cf-btn cf-btn--primary" onclick="initSeqRecall()">Try Again</button>
      <button class="cf-btn cf-btn--ghost" onclick="seqNextPhase()">Next Phase</button>
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
  _touch.grabOffsetX = e.touches[0].clientX - rect.left;
  _touch.grabOffsetY = e.touches[0].clientY - rect.top;
}

function seqTouchMove(e) {
  if (!_touch.ghost) return;
  e.preventDefault();
  const t = e.touches[0];
  _touch.ghost.style.left = (t.clientX - _touch.grabOffsetX) + 'px';
  _touch.ghost.style.top = (t.clientY - _touch.grabOffsetY) + 'px';
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
let procRadioInputMode = 'chips'; // 'chips' | 'speak'
let speechContext = 'radio'; // 'radio' | 'proc' — controls which DOM elements speech functions target
const SPEECH_DOM = {
  radio: { btn: 'mic-btn', label: 'mic-label', status: 'mic-status', output: 'radio-speak-output' },
  proc:  { btn: 'proc-mic-btn', label: 'proc-mic-label', status: 'proc-mic-status', output: 'proc-speak-output' }
};
let speechState = { recognition: null, listening: false, transcript: '' };

function setRadioMode(mode, btn) {
  document.querySelectorAll('#view-radio .cl-mode-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('radio-calls-mode').style.display = mode === 'chips' ? '' : 'none';
  document.getElementById('radio-atis-mode').style.display = mode === 'atis' ? '' : 'none';
  document.getElementById('radio-alpha-mode').style.display = mode === 'alpha' ? '' : 'none';
  const instrEl = document.getElementById('radio-instructions');
  if (instrEl) {
    if (mode === 'chips') instrEl.classList.add('show');
    else instrEl.classList.remove('show');
  }
  if (mode === 'atis' && !atisState.generated) newATIS();
  if (mode === 'alpha' && !alphaState.started && !alphaState.sequence.length) initAlphaDrill();
  currentRadioMode = mode;
  updateHash();
}

// ── PHONETIC ALPHABET DRILL ──
const alphaState = {
  drillMode: 'drill',
  seqLen: 3,
  randomLen: false,
  alphanumeric: false,
  autoAdvance: false,
  drillCount: 5,
  drillProgress: 0,
  finished: false,
  history: [],
  started: false,
  sequence: [],
  expected: [],
  expectedDisplay: [],
  results: [],
  answered: false,
  wasCorrect: null,
  spokenText: '',
  score: { correct: 0, total: 0, streak: 0 },
  maxTime: 3,
  timeLeft: 3,
  _timer: null,
  _recognition: null,
  listening: false,
  bag: [],
  _transcript: '',
};

function initAlphaDrill() {
  if (alphaState._timer) { clearInterval(alphaState._timer); alphaState._timer = null; }
  if (alphaState._recognition) { try { alphaState._recognition.stop(); } catch(e) {} alphaState._recognition = null; }
  alphaState.score = { correct: 0, total: 0, streak: 0 };
  alphaState.sequence = [];
  alphaState.listening = false;
  alphaState.started = false;
  alphaState.finished = false;
  alphaState.drillProgress = 0;
  alphaState.bag = [];
  alphaState._transcript = '';
  renderAlphaDrill();
}

function startAlphaDrill() {
  alphaState.started = true;
  alphaState.finished = false;
  alphaState.drillProgress = 0;
  alphaState.history = [];
  alphaState.score = { correct: 0, total: 0, streak: 0 };
  alphaState.bag = _shuffleArray([..._buildAlphaPool()]);
  alphaState._transcript = '';
  _nextAlphaQuestion();
}

function setAlphaDrillCount(n) {
  alphaState.drillCount = n;
  if (alphaState.started) stopAlphaDrill();
  else renderAlphaDrill();
}

function _finishAlphaDrill() {
  if (alphaState._timer) { clearInterval(alphaState._timer); alphaState._timer = null; }
  if (alphaState._recognition) { try { alphaState._recognition.stop(); } catch(e) {} alphaState._recognition = null; }
  alphaState.started = false;
  alphaState.finished = true;
  alphaState.listening = false;
  renderAlphaDrill();
}

function stopAlphaDrill() {
  if (alphaState._timer) { clearInterval(alphaState._timer); alphaState._timer = null; }
  if (alphaState._recognition) { try { alphaState._recognition.stop(); } catch(e) {} alphaState._recognition = null; }
  alphaState.started = false;
  alphaState.listening = false;
  alphaState.sequence = [];
  renderAlphaDrill();
}

function _buildAlphaPool() {
  const letters = Object.keys(PHONETIC_ALPHABET);
  return alphaState.alphanumeric ? [...letters, ...Object.keys(PHONETIC_NUMBERS)] : letters;
}

function _shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function _nextAlphaQuestion() {
  if (alphaState.drillProgress >= alphaState.drillCount) { _finishAlphaDrill(); return; }
  if (alphaState._timer) { clearInterval(alphaState._timer); alphaState._timer = null; }
  if (alphaState._recognition) { try { alphaState._recognition.stop(); } catch(e) {} alphaState._recognition = null; }
  const pool = _buildAlphaPool();
  const len = alphaState.randomLen ? Math.floor(Math.random() * 5) + 1 : alphaState.seqLen;

  // Bag-based selection: cycle through pool without repeats before refilling
  if (alphaState.bag.length < len) {
    const recentSet = new Set(alphaState.sequence);
    const refill = pool.filter(c => !recentSet.has(c));
    alphaState.bag.push(..._shuffleArray(refill.length >= len ? refill : [...pool]));
  }
  const seq = [];
  for (let i = 0; i < len; i++) {
    const avoid = i === 0 ? alphaState.sequence[alphaState.sequence.length - 1] : seq[i - 1];
    let idx = avoid ? alphaState.bag.findIndex(c => c !== avoid) : 0;
    if (idx < 0) idx = 0;
    seq.push(alphaState.bag.splice(idx, 1)[0]);
  }

  // Ensure at least 1 letter when alphanumeric is on; for len>=3 also ensure at least 1 digit
  if (alphaState.alphanumeric) {
    const letters = Object.keys(PHONETIC_ALPHABET);
    const numbers = Object.keys(PHONETIC_NUMBERS);
    if (!seq.some(ch => PHONETIC_ALPHABET[ch])) {
      seq[Math.floor(Math.random() * seq.length)] = letters[Math.floor(Math.random() * letters.length)];
    }
    if (seq.length >= 3 && !seq.some(ch => PHONETIC_NUMBERS[ch] !== undefined)) {
      seq[Math.floor(Math.random() * seq.length)] = numbers[Math.floor(Math.random() * numbers.length)];
    }
  }
  const _numDisplay = {'0':'Zero','1':'One','2':'Two','3':'Three','4':'Four','5':'Five','6':'Six','7':'Seven','8':'Eight','9':'Nine'};
  alphaState.sequence = seq;
  alphaState.expected = seq.map(ch => PHONETIC_ALPHABET[ch] || PHONETIC_NUMBERS[ch] || ch);
  alphaState.expectedDisplay = seq.map(ch => PHONETIC_ALPHABET[ch] || _numDisplay[ch] || ch);
  alphaState.results = Array(len).fill(null);
  alphaState.answered = false;
  alphaState.wasCorrect = null;
  alphaState.spokenText = '';
  alphaState.listening = false;
  alphaState._transcript = '';
  alphaState.maxTime = len === 1 ? 3 : Math.round(len * 1.8 + 1);
  alphaState.timeLeft = alphaState.maxTime;
  alphaState._timer = setInterval(() => {
    alphaState.timeLeft = Math.max(0, alphaState.timeLeft - 0.1);
    if (alphaState.timeLeft <= 0 && !alphaState.answered) { alphaTimeout(); }
    else { _renderAlphaTimer(); }
  }, 100);
  renderAlphaDrill();
  // Auto-start mic after a short pause so the user can see the letter
  setTimeout(() => {
    if (alphaState.started && !alphaState.answered && !alphaState.listening) startAlphaSpeech();
  }, 400);
}

function _renderAlphaTimer() {
  const fill = document.getElementById('alpha-timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (alphaState.timeLeft / alphaState.maxTime) * 100);
  fill.style.width = pct + '%';
  fill.className = 'alpha-timer-fill' + (pct < 30 ? ' alpha-timer-fill--urgent' : '');
}

function alphaTimeout() {
  if (alphaState.answered) return;
  if (alphaState._timer) { clearInterval(alphaState._timer); alphaState._timer = null; }
  if (alphaState._recognition) {
    try { alphaState._recognition.stop(); } catch(e) {}
    alphaState._recognition = null;
  }
  alphaState.listening = false;
  // Grade whatever was accumulated before the timer ran out
  const accumulated = alphaState._transcript && alphaState._transcript.trim();
  if (accumulated) { gradeAlphaResponse(accumulated); return; }
  alphaState.answered = true;
  alphaState.wasCorrect = false;
  alphaState.spokenText = '(no answer)';
  alphaState.results = Array(alphaState.sequence.length).fill(false);
  alphaState.history.push({ sequence: [...alphaState.sequence], display: [...alphaState.expectedDisplay], results: [...alphaState.results], spoken: '(no answer)', correct: false });
  alphaState.score.total++;
  alphaState.score.streak = 0;
  alphaState.drillProgress++;
  renderAlphaDrill();
  if (alphaState.autoAdvance) setTimeout(_nextAlphaQuestion, 1800);
}

// Internal helper — starts a single (non-continuous) recognition session and restarts
// automatically on silence so the user can say all words without being cut off early.
function _startAlphaRecognizer() {
  const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
  if (!SR || alphaState.answered || !alphaState.listening) return;
  const recog = new SR();
  recog.lang = 'en-US';
  recog.interimResults = false;
  recog.maxAlternatives = 1;
  alphaState._recognition = recog;
  recog.onresult = (e) => {
    const piece = e.results[0][0].transcript;
    alphaState._transcript = ((alphaState._transcript || '') + ' ' + piece).trim();
    // Grade as soon as the user has said enough real words to cover the sequence,
    // correct or not — so a wrong answer like "umbrella" grades immediately rather
    // than letting the timer run. Fillers (oh, umm, etc.) don't count toward the total.
    if (countPhoneticAttemptWords(alphaState._transcript) >= alphaState.sequence.length) {
      try { recog.stop(); } catch(_) {}
      gradeAlphaResponse(alphaState._transcript.trim());
    }
  };
  recog.onerror = () => {
    alphaState._recognition = null;
    alphaState.listening = false;
    renderAlphaDrill();
  };
  recog.onend = () => {
    alphaState._recognition = null;
    if (!alphaState.answered && alphaState.timeLeft > 0.3) {
      // Time remains — restart so user can keep speaking across natural pauses
      setTimeout(() => _startAlphaRecognizer(), 50);
    } else if (!alphaState.answered) {
      alphaState.listening = false;
      const t = alphaState._transcript && alphaState._transcript.trim();
      if (t) gradeAlphaResponse(t);
      else renderAlphaDrill();
    }
  };
  recog.start();
}

function startAlphaSpeech() {
  if (alphaState.answered || alphaState.listening) return;
  const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
  if (!SR) { alert('Speech recognition not available. Use HTTPS or a supported browser.'); return; }
  alphaState.listening = true;
  alphaState._transcript = '';
  renderAlphaDrill();
  _startAlphaRecognizer();
}

function gradeAlphaResponse(transcript) {
  if (alphaState.answered) return;
  if (alphaState._timer) { clearInterval(alphaState._timer); alphaState._timer = null; }
  alphaState.answered = true;
  alphaState.spokenText = transcript;
  alphaState.results = gradeAlphaSequence(transcript, alphaState.expected);
  const allCorrect = alphaState.results.every(Boolean);
  alphaState.wasCorrect = allCorrect;
  alphaState.history.push({ sequence: [...alphaState.sequence], display: [...alphaState.expectedDisplay], results: [...alphaState.results], spoken: transcript, correct: allCorrect });
  alphaState.score.total++;
  alphaState.drillProgress++;
  if (allCorrect) { alphaState.score.correct++; alphaState.score.streak++; }
  else { alphaState.score.streak = 0; }
  renderAlphaDrill();
  if (alphaState.autoAdvance) setTimeout(_nextAlphaQuestion, allCorrect ? 800 : 2000);
}

function setAlphaAutoAdvance(val) {
  alphaState.autoAdvance = val;
  renderAlphaDrill();
}

function setAlphaDrillMode(mode) {
  alphaState.drillMode = mode;
  if (alphaState.started) stopAlphaDrill();
  else renderAlphaDrill();
}

function setAlphaSeqLen(len) {
  if (len === null) { alphaState.randomLen = true; }
  else { alphaState.randomLen = false; alphaState.seqLen = len; }
  if (!alphaState.randomLen && alphaState.seqLen < 3) alphaState.alphanumeric = false;
  if (alphaState.started) stopAlphaDrill();
  else renderAlphaDrill();
}

function setAlphaAlphanumeric(val) {
  alphaState.alphanumeric = val;
  if (alphaState.started) stopAlphaDrill();
  else renderAlphaDrill();
}

function renderAlphaDrill() {
  const s = alphaState;
  const pct = Math.max(0, (s.timeLeft / s.maxTime) * 100);
  const acc = s.score.total > 0 ? Math.round(s.score.correct / s.score.total * 100) : null;
  const len = s.sequence.length || s.seqLen;

  const lenBtns = [1,2,3,4,5].map(n => {
    const active = !s.randomLen && s.seqLen === n;
    return `<button class="alpha-len-btn${active?' active':''}" onclick="setAlphaSeqLen(${n})">${n}</button>`;
  }).join('') + `<button class="alpha-len-btn${s.randomLen?' active':''}" onclick="setAlphaSeqLen(null)">?</button>`;

  const drillCountBtns = [5,10,15,20].map(n => {
    const active = s.drillCount === n;
    return `<button class="alpha-len-btn alpha-len-btn--wide${active?' active':''}" onclick="setAlphaDrillCount(${n})">${n}</button>`;
  }).join('');

  if (!s.started && !s.finished) {
    document.getElementById('radio-alpha-mode').innerHTML = `
      <div class="alpha-drill">
        <div class="alpha-setup-desc">Practice NATO phonetic pronunciation. Configure the settings below, then tap Start.</div>
        <div class="alpha-setup-controls">
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label">Characters</span>${lenBtns}
          </div>
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label">Reps</span>${drillCountBtns}
          </div>
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label">Alphanumeric</span>
            ${!s.randomLen && s.seqLen < 3
              ? `<div class="alpha-toggle alpha-toggle--disabled"></div><span class="alpha-toggle-note">requires count 3 or more</span>`
              : `<div class="alpha-toggle${s.alphanumeric?' alpha-toggle--on':''}" onclick="setAlphaAlphanumeric(${!s.alphanumeric})"></div>`
            }
          </div>
          <div class="alpha-setup-row">
            <span class="alpha-ctrl-label">Auto-Advance</span>
            <div class="alpha-toggle${s.autoAdvance?' alpha-toggle--on':''}" onclick="setAlphaAutoAdvance(${!s.autoAdvance})"></div>
          </div>
        </div>
        <div class="alpha-preview-card">
          <div class="alpha-setup-example">
            <span class="alpha-setup-ex-char">N</span>
            <span class="alpha-setup-ex-arrow">&rarr;</span>
            <span class="alpha-setup-ex-word">November</span>
          </div>
          <div class="alpha-preview-caption">You&rsquo;ll see one or more characters depending on your settings above &mdash; say the phonetic word(s) out loud</div>
          <div class="alpha-zero-note">
            <span class="alpha-zero-prefix">Note:</span>
            <span class="alpha-zero-char">0</span><span class="alpha-zero-label">Zero</span>
            <span class="alpha-zero-sep">vs</span>
            <span class="alpha-zero-char">O</span><span class="alpha-zero-label">Oscar</span>
          </div>
        </div>
        <button class="alpha-start-btn" onclick="startAlphaDrill()">Start Drill</button>
      </div>`;
    return;
  }

  if (s.finished) {
    const finalAcc = s.score.total > 0 ? Math.round(s.score.correct / s.score.total * 100) : 0;
    const grade = finalAcc >= 90 ? 'Excellent' : finalAcc >= 70 ? 'Good' : 'Keep practicing';
    const reviewHtml = s.history.map((entry, i) => {
      const charsHtml = entry.sequence.map((ch, j) => {
        const ok = entry.results[j];
        return `<span class="alpha-review-char${ok ? ' alpha-review-char--ok' : ' alpha-review-char--miss'}">${ch}<span class="alpha-review-phonetic">${entry.display[j]}</span></span>`;
      }).join('');
      const spokenHtml = !entry.correct && entry.spoken !== '(no answer)'
        ? `<span class="alpha-review-spoken">You said: ${entry.spoken}</span>` : '';
      const noAnswerHtml = entry.spoken === '(no answer)'
        ? `<span class="alpha-review-spoken">No answer</span>` : '';
      return `<div class="alpha-review-row${entry.correct ? ' alpha-review-row--ok' : ' alpha-review-row--miss'}">
        <span class="alpha-review-num">${i + 1}</span>
        <div class="alpha-review-body">${charsHtml}${spokenHtml}${noAnswerHtml}</div>
      </div>`;
    }).join('');
    document.getElementById('radio-alpha-mode').innerHTML = `
      <div class="alpha-drill">
        <div class="alpha-finish-card">
          <div class="alpha-finish-label">Session Complete</div>
          <div class="alpha-finish-score">${s.score.correct} / ${s.score.total}</div>
          <div class="alpha-finish-acc">${finalAcc}% &mdash; ${grade}</div>
        </div>
        <div class="alpha-review">${reviewHtml}</div>
        <div class="alpha-finish-actions">
          <button class="alpha-start-btn" onclick="startAlphaDrill()">Go Again</button>
          <button class="alpha-stop-btn" onclick="initAlphaDrill()">Settings</button>
        </div>
      </div>`;
    return;
  }

  const progressHtml = `<span class="alpha-progress">${s.drillProgress + 1} / ${s.drillCount}</span>`;
  const scoreHtml = s.score.total > 0
    ? `<div class="alpha-score"><span class="alpha-score-stat">${s.score.correct}/${s.score.total}</span><span class="alpha-score-acc">${acc}%</span>${s.score.streak >= 3 ? `<span class="alpha-score-streak">&#128293;&nbsp;${s.score.streak}</span>` : ''}</div>` : '';

  const timerHtml = `<div class="alpha-timer-bar"><div class="alpha-timer-fill${pct < 30 ? ' alpha-timer-fill--urgent' : ''}" id="alpha-timer-fill" style="width:${pct}%"></div></div>`;

  const fontSizes = ['', '5rem', '4rem', '3.5rem', '3rem', '2.5rem'];
  const fs = fontSizes[Math.min(len, 5)];

  let seqHtml;
  if (len === 1 && s.sequence.length) {
    const res = s.results[0];
    const cls = s.answered ? (res ? ' alpha-letter--correct' : ' alpha-letter--wrong') : '';
    const below = s.answered ? `<div class="alpha-single-phonetic">${s.expectedDisplay[0]}</div>` : '';
    seqHtml = `<div class="alpha-single"><div class="alpha-letter${cls}" style="font-size:${fs}">${s.sequence[0]}</div>${below}</div>`;
  } else if (s.sequence.length) {
    const cells = s.sequence.map((ch, i) => {
      const res = s.results[i];
      const cls = s.answered && res !== null ? (res ? ' alpha-seq-cell--correct' : ' alpha-seq-cell--wrong') : '';
      const below = s.answered ? `<div class="alpha-seq-phonetic">${s.expectedDisplay[i]}</div>` : `<div class="alpha-seq-phonetic-ph"></div>`;
      return `<div class="alpha-seq-cell${cls}"><div class="alpha-seq-char" style="font-size:${fs}">${ch}</div>${below}</div>`;
    }).join('');
    seqHtml = `<div class="alpha-seq-row">${cells}</div>`;
  } else {
    seqHtml = `<div class="alpha-letter" style="font-size:5rem">?</div>`;
  }

  const spokenFeedback = s.answered && !s.wasCorrect && s.spokenText && s.spokenText !== '(no answer)'
    ? `<div class="alpha-spoken-feedback">You said: <em>${s.spokenText}</em></div>` : '';

  const micHtml = !s.answered
    ? `<button class="alpha-mic-btn${s.listening ? ' alpha-mic-btn--listening' : ''}" onclick="startAlphaSpeech()" ${s.listening ? 'disabled' : ''}>${s.listening ? '&#9210;&nbsp;Listening&hellip;' : '&#127897;&nbsp;Say it'}</button>` : '';

  const isLast = s.drillProgress >= s.drillCount - 1;
  const nextHtml = s.answered
    ? `<button class="alpha-next-btn" onclick="_nextAlphaQuestion()">${isLast ? 'Finish' : 'Next'} &rsaquo;</button>` : '';

  const hintText = len > 1 ? `Say all ${len} in order &middot; NATO phonetic` : `Say the phonetic word &middot; NATO standard`;

  const settingsTagHtml = [
    s.randomLen ? '?' : `${s.seqLen} char${s.seqLen > 1 ? 's' : ''}`,
    s.alphanumeric ? 'Letters & Numbers' : 'Letters only',
  ].map(t => `<span class="alpha-settings-tag">${t}</span>`).join('');

  document.getElementById('radio-alpha-mode').innerHTML = `
    <div class="alpha-drill">
      <div class="alpha-settings-tags">${settingsTagHtml}</div>
      <div class="alpha-drill-header">
        ${progressHtml}
        ${scoreHtml}
      </div>
      ${timerHtml}
      <div class="alpha-letter-card">${seqHtml}${spokenFeedback}<div class="alpha-actions">${micHtml}${nextHtml}</div></div>
      <div class="alpha-hint">${hintText}</div>
      <button class="alpha-stop-btn" onclick="stopAlphaDrill()">&#9632;&nbsp;Stop Drill</button>
    </div>`;
}

function setRadioInputMode(mode) {
  radioInputMode = mode;
  updateHash();
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
  // Enable New Scenario button when clearing, so user can skip if desired
  const newScenarioBtn = document.getElementById('radio-new-scenario-btn');
  if (newScenarioBtn) newScenarioBtn.disabled = false;
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
  const dom = SPEECH_DOM[speechContext];
  if (!SpeechRecognition) {
    document.getElementById(dom.status).textContent = 'Speech not supported in this browser';
    return;
  }

  const rec = new SpeechRecognition();
  rec.lang = 'en-US';
  rec.continuous = true; // radio call length is unknown — user stops manually
  rec.interimResults = true;
  rec.maxAlternatives = 3;

  speechState.recognition = rec;
  speechState.listening = true;
  speechState.transcript = '';

  const btn = document.getElementById(dom.btn);
  const status = document.getElementById(dom.status);
  const output = document.getElementById(dom.output);

  btn.classList.add('listening');
  document.getElementById(dom.label).textContent = 'Listening...';
  status.textContent = 'Speak now';
  if (speechContext === 'radio') document.getElementById('radio-feedback').classList.remove('show');

  rec.onresult = (e) => {
    let interim = '';
    let finals = speechState.transcript;
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finals = (finals + ' ' + t).trim();
      else interim += t;
    }
    speechState.transcript = finals;
    output.textContent = interim ? finals + ' ' + interim : finals;
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
  const dom = SPEECH_DOM[speechContext];
  const btn = document.getElementById(dom.btn);
  if (btn) btn.classList.remove('listening');
  const label = document.getElementById(dom.label);
  if (label) label.textContent = 'Tap to speak';
}

function checkSpeechCall() {
  if (!speechState.transcript) {
    document.getElementById('mic-status').textContent = 'Say your call first';
    return;
  }

  const s = state.radio.scenario;
  const result = scoreSpeechCall(speechState.transcript, s.ideal, s.words, s.speechOptional || []);
  const isGood = result.score >= 0.8;
  const pct = Math.round(result.score * 100);
  const wordHtml = result.words.map(w =>
    `<span class="speech-word ${w.status}">${w.word}</span>`
  ).join(' ');

  const bodyHtml = `
    <div style="font-family:var(--font-mono);font-size:12px;color:var(--ink-3);margin-bottom:8px">${pct}% phonetic match</div>
    <div class="speech-score" style="margin-bottom:12px">${wordHtml}</div>
    <p style="font-size:13px;color:var(--ink-3)">${s.note}</p>`;

  // Enable New Scenario button now that they've checked their call
  const newScenarioBtn = document.getElementById('radio-new-scenario-btn');
  if (newScenarioBtn) newScenarioBtn.disabled = false;

  openVerdictSheet(
    isGood ? 'correct' : 'wrong',
    isGood ? `✓ Good call — ${pct}%` : `✗ ${pct}% — review below`,
    bodyHtml,
    () => clearRadioCallActive(),
    () => newRadioScenario()
  );
}

function buildSpeechResultHTML(result, retryFn, revealFn) {
  const isGood = result.score >= 0.8;
  const pct = Math.round(result.score * 100);
  const wordHtml = result.words.map(w =>
    `<span class="speech-word ${w.status}">${w.word}</span>`
  ).join(' ');
  const buttonsHtml = !isGood
    ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="${retryFn}">↩ Try Again</button>
        <button class="cf-btn cf-btn--ghost cf-btn--sm" onclick="${revealFn}">Show Ideal Call</button>
      </div>`
    : '';
  return { isGood, pct, wordHtml, buttonsHtml };
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
      `<span class="atis-trans-label">ATIS read — fill in what you heard. You can play again if needed.</span>`;
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
    <div class="atis-results-detail">
      ${results.map(r => `
        <div class="atis-result-row">
          <div class="atis-result-label">${r.label}</div>
          <div class="atis-result-yours ${r.isCorrect ? 'correct' : 'wrong'}">${r.userVal || '—'}</div>
          ${!r.isCorrect ? `<div class="atis-result-correct">→ ${r.answer}</div>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="atis-transcript-reveal">
      <div class="cf-eyebrow" style="margin-bottom:8px">// Full ATIS text</div>
      ${d.script}
    </div>
    <div style="display:flex;gap:8px">
      <button class="cf-btn cf-btn--primary" onclick="newATIS()">New ATIS</button>
      <button class="cf-btn cf-btn--ghost" onclick="playATISAgain()">&#9654; Play Again</button>
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

// ── TODAY SCREEN ──────────────────────────────────────────────────────────

function navigateDrill(target) {
  if (target === 'recall') {
    switchDrill('checklist');
    const recallBtn = document.querySelector('#view-checklist .cl-mode-btn:nth-child(2)');
    if (recallBtn) setClMode('recall', recallBtn);
    return;
  }
  if (target === 'reference' || target === 'checklist') { switchDrill('checklist'); return; }
  if (target === 'radio' || target === 'procedures' || target === 'emergency') {
    switchDrill(target);
    return;
  }
  _switchViewOnly(target);
  updateHash();
}

// Hash scheme: #[aircraft/]view[/sub1[/sub2]]
// Examples: #radio/atis  #checklist/recall/runup  #cherokee140/emergency
function restoreNav() {
  const raw = location.hash.slice(1);
  _restoringNav = true;

  // Default: mobile shows drills hub + opens drill sheet, desktop jumps to checklist
  if (!raw) {
    if (window.innerWidth < 768) {
      _switchViewOnly('drills-hub');
      _setBottomTabActive('drills');
    } else {
      switchDrill('checklist');
    }
    _restoringNav = false;
    updateHash();
    return;
  }

  const parts = raw.split('/');
  let i = 0;

  // Optional aircraft prefix
  if (parts[i] === 'cessna172ikl' || parts[i] === 'cherokee140') {
    const aircraft = parts[i++];
    if (aircraft !== currentAircraft) {
      const acBtn = document.querySelector(`[data-aircraft="${aircraft}"]`);
      if (acBtn) switchAircraft(aircraft, acBtn);
    }
  }

  const view = parts[i++] || 'drills-hub';

  if (view === 'checklist') {
    const clMode  = parts[i]     || 'reference';
    const clPhase = parts[i + 1] || 'preflight';
    // Phase before mode — initSeqRecall reads state.checklist.phase
    if (clPhase !== state.checklist.phase) selectPhase(clPhase);
    if (clMode !== 'reference') {
      const btn = [...document.querySelectorAll('#view-checklist .cl-mode-btn')]
        .find(b => b.getAttribute('onclick').includes(`'${clMode}'`));
      if (btn) setClMode(clMode, btn);
    }
  } else if (view === 'radio') {
    const sub = parts[i] || '';
    if (sub === 'atis') {
      const btn = [...document.querySelectorAll('#view-radio .cl-mode-btn')]
        .find(b => b.getAttribute('onclick').includes("'atis'"));
      if (btn) setRadioMode('atis', btn);
    } else if (sub === 'alpha') {
      const btn = [...document.querySelectorAll('#view-radio .cl-mode-btn')]
        .find(b => b.getAttribute('onclick').includes("'alpha'"));
      if (btn) setRadioMode('alpha', btn);
    } else if (sub === 'speak') {
      setRadioInputMode('speak');
    }
  } else if (view === 'procedures') {
    const sub = parts[i];
    if (sub === 'vspeeds') {
      _setProcModeUI('vspeeds');
      if (!vspeedState.started && !vspeedState.finished) initVspeedDrill();
    } else if (sub === 'airport' || sub === 'airwork') {
      _setProcModeUI(sub);
      showProcScreen('proc-screen-setup');
      filterProcedures(sub);
    } else {
      const icao     = sub;
      const procId   = parts[i + 1];
      const stepPart = parts[i + 2];
      if (icao && procId) {
        const apData = AIRPORTS[icao];
        if (apData) {
          const [name, elev] = apData;
          procState.airport = { icao, name, elev, tpa: Math.round((elev + 1000) / 100) * 100 };
          document.getElementById('proc-icao').value = icao;
          lookupAirport();
        }
        startProcedure(procId);
        if (stepPart && stepPart !== 'recall') {
          const stepIdx = parseInt(stepPart, 10);
          if (!isNaN(stepIdx)) {
            procAdvanceFromRecall();
            procState.currentStep = stepIdx;
            renderProcStep();
          }
        }
      } else {
        showProcScreen('proc-screen-setup');
      }
    }
  }

  // Switch view and sync nav indicators
  _switchViewOnly(view);
  if (view === 'checklist') { _setActiveDrill('checklist'); _setBottomTabActive('drills'); }
  else if (view === 'radio') { _setActiveDrill('radio'); _setBottomTabActive('drills'); }
  else if (view === 'procedures') { _setActiveDrill('procedures'); _setBottomTabActive('drills'); }
  else if (view === 'emergency') { _setActiveDrill('emergency'); _setBottomTabActive('drills'); }

  _restoringNav = false;
  updateHash(); // canonicalize URL
}

// ── VERDICT SHEET ──
// Callbacks stored here because the sheet's buttons fire onclick strings — they can't
// capture closures from the drill render that opened the sheet.
const verdictState = { onTryAgain: null, onNext: null };

function openVerdictSheet(status, title, body, onTryAgain, onNext) {
  verdictState.onTryAgain = onTryAgain;
  verdictState.onNext = onNext;
  document.getElementById('verdict-title').textContent = title;
  document.getElementById('verdict-body').innerHTML = body;
  const sheet = document.getElementById('verdict-sheet');
  sheet.dataset.status = status;
  document.getElementById('verdict-try-again-btn').style.display = onTryAgain ? '' : 'none';
  const overlay = document.getElementById('verdict-overlay');
  overlay.style.display = '';
  requestAnimationFrame(() => requestAnimationFrame(() => {
    overlay.classList.add('open');
    sheet.classList.add('open');
  }));
}

function closeVerdictSheet() {
  const overlay = document.getElementById('verdict-overlay');
  const sheet = document.getElementById('verdict-sheet');
  overlay.style.display = 'none';
  overlay.classList.remove('open');
  sheet.classList.remove('open');
  sheet.addEventListener('transitionend', () => {
    const nextBtn = document.getElementById('proc-next-btn');
    if (nextBtn) nextBtn.classList.add('show');
  }, { once: true });
}

function buildCallTemplateHtml(s) {
  if (!s || !s.rule) return '';
  const callType = s.rule?.repeats ? 'CTAF' : 'Controlled';
  const patternText = s.rule?.repeats
    ? '[Airport], [callsign], [position] runway [runway], [airport].'
    : '[Airport], [callsign], [position] runway [runway].';
  return `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--rule)">
    <div style="font-family:var(--font-sans);font-size:12px;letter-spacing:0.08em;color:var(--accent2);text-transform:uppercase;margin-bottom:10px">Call Template for ${callType}</div>
    <p style="font-size:13px;line-height:1.6;color:var(--ink);margin:0;font-family:var(--font-mono)">${patternText}</p>
  </div>`;
}

function openHintSheet() {
  const s = state.radio.scenario;
  if (!s || !s.rule) return;

  const body = document.getElementById('hint-sheet-body');
  const callType = s.rule?.repeats ? 'CTAF' : 'Controlled';
  const patternText = s.rule?.repeats
    ? '[Airport], [callsign], [position] runway [runway], [airport].'
    : '[Airport], [callsign], [position] runway [runway].';
  body.innerHTML = `
    <div style="padding: 20px;">
      <div style="font-family: var(--font-sans); font-size: 12px; letter-spacing: 0.08em; color: var(--accent2); text-transform: uppercase; margin-bottom: 14px;">${callType} Call Template</div>
      <p style="font-size: 14px; line-height: 1.8; color: var(--ink); margin: 0; font-family: var(--font-mono);">${patternText}</p>
    </div>`;

  const overlay = document.getElementById('hint-overlay');
  const sheet = document.getElementById('hint-sheet');
  overlay.style.display = 'block';
  sheet.style.display = 'block';
  setTimeout(() => {
    overlay.classList.add('open');
    sheet.classList.add('open');
  }, 0);
}

function closeHintSheet() {
  const overlay = document.getElementById('hint-overlay');
  const sheet = document.getElementById('hint-sheet');
  overlay.style.display = 'none';
  overlay.classList.remove('open');
  sheet.classList.remove('open');
}

function verdictTryAgain() {
  closeVerdictSheet();
  if (verdictState.onTryAgain) verdictState.onTryAgain();
}

function verdictNext() {
  closeVerdictSheet();
  if (verdictState.onNext) verdictState.onNext();
}

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

function updateSpeechNote() {
  const offlineNote = document.getElementById('rd-offline-note');
  if (!offlineNote || !('webkitSpeechRecognition' in window)) return;

  const isAndroidDevice = isAndroid();
  const isOnline = navigator.onLine;

  if (isAndroidDevice) {
    if (isOnline) {
      offlineNote.textContent = ' Word chips work offline — Speak It requires internet.';
    } else {
      offlineNote.textContent = ' Offline. Word chips work — Speak It requires internet.';
    }
    // Disable Speak It button if Android and offline
    const speakBtn = document.getElementById('rbtn-speak');
    if (speakBtn) {
      speakBtn.disabled = !isOnline;
      speakBtn.title = !isOnline ? 'Speak It requires internet on Android' : '';
    }
  } else {
    // iOS or other devices with on-device speech
    offlineNote.textContent = ' Works offline.';
    const speakBtn = document.getElementById('rbtn-speak');
    if (speakBtn) {
      speakBtn.disabled = false;
      speakBtn.title = '';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Sync mode toggle button state with boot-time mode
  _applyMode(document.documentElement.dataset.mode || 'day', false);
  // Initialize aircraft header button
  const acLabel = document.getElementById('cf-aircraft-label');
  if (acLabel) acLabel.textContent = ALL_AIRCRAFT[currentAircraft].label || ALL_AIRCRAFT[currentAircraft].name;
  initChecklist();
  initRadio();
  initEmergency();
  // Update speech availability note based on device and connection
  updateSpeechNote();
  window.addEventListener('online', updateSpeechNote);
  window.addEventListener('offline', updateSpeechNote);
  lookupAirport();
  restoreNav();
  window.addEventListener('hashchange', restoreNav);


  // Swipe up on bottom nav to open drill sheet
  const bottomNav = document.getElementById('cf-bottom-nav');
  let _navSwipeStartY = 0;
  bottomNav.addEventListener('touchstart', e => { _navSwipeStartY = e.touches[0].clientY; }, { passive: true });
  bottomNav.addEventListener('touchend', e => {
    if (_navSwipeStartY - e.changedTouches[0].clientY > 30) openDrillSheet();
  }, { passive: true });

  // Swipe down on drill sheet to close
  const drillSheet = document.getElementById('drill-sheet');
  let _sheetSwipeStartY = 0;
  drillSheet.addEventListener('touchstart', e => { _sheetSwipeStartY = e.touches[0].clientY; }, { passive: true });
  drillSheet.addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - _sheetSwipeStartY > 60) closeDrillSheet();
  }, { passive: true });
});

// Export for testing
if (typeof module !== 'undefined') module.exports = { isAndroid, buildCallTemplateHtml };
