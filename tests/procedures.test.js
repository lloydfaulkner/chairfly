// node --test tests/procedures.test.js   (Node 18+)
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

// Provide globals that app.js references at module scope
const { ALL_AIRCRAFT, RADIO_SCENARIOS, RADIO_SCENARIO_GROUPS, PHONETIC_ALPHABET, PHONETIC_NUMBERS, VSPEEDS_META } = require('../js/data.js');
global.ALL_AIRCRAFT = ALL_AIRCRAFT;
global.RADIO_SCENARIOS = RADIO_SCENARIOS;
global.RADIO_SCENARIO_GROUPS = RADIO_SCENARIO_GROUPS;
global.PHONETIC_ALPHABET = PHONETIC_ALPHABET;
global.PHONETIC_NUMBERS = PHONETIC_NUMBERS;
global.VSPEEDS_META = VSPEEDS_META;

// Stub browser globals that app.js references at module scope
global.localStorage = { getItem: () => null, setItem: () => {} };

// Stub DOM functions that app.js calls at module scope or inside tested functions
global.renderProcSeqRecall = () => {};
global.document = { addEventListener: () => {}, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], documentElement: { dataset: {} } };
global.window = { addEventListener: () => {}, location: { hash: '' }, matchMedia: () => ({ addEventListener: () => {} }) };
global.navigator = { onLine: true };

const { buildPowerOnStall, _initProcRecall, procSeqState } = require('../js/app.js');

const SAMPLE_AP = { icao: 'KUZA', name: 'Rock Hill / York County Airport', elev: 666, tpa: 1700, callName: 'Rock Hill' };

// ── buildPowerOnStall ─────────────────────────────────────────────────────────

describe('buildPowerOnStall', () => {
  const proc = buildPowerOnStall(SAMPLE_AP);

  test('ReturnsTitle', () => {
    assert.equal(proc.title, 'Power On Stall');
  });

  test('HasSevenSteps', () => {
    assert.equal(proc.steps.length, 7);
  });

  test('AllSteps_HaveTypeAndPhase', () => {
    for (const step of proc.steps) {
      assert.ok(step.type, `step missing type: ${JSON.stringify(step)}`);
      assert.ok(step.phase, `step missing phase: ${JSON.stringify(step)}`);
    }
  });

  test('ChoiceSteps_HaveFourOptionsWithExactlyOneCorrect', () => {
    const choiceSteps = proc.steps.filter(s => s.type === 'choice');
    assert.ok(choiceSteps.length > 0, 'expected at least one choice step');
    for (const step of choiceSteps) {
      assert.ok(step.prompt, `choice step missing prompt in phase: ${step.phase}`);
      assert.ok(Array.isArray(step.options), `choice step missing options in phase: ${step.phase}`);
      assert.equal(step.options.length, 4, `${step.phase}: expected 4 options`);
      const correct = step.options.filter(o => o.correct === true);
      assert.equal(correct.length, 1, `${step.phase}: expected exactly 1 correct option, found ${correct.length}`);
      const wrong = step.options.filter(o => o.correct === false);
      assert.equal(wrong.length, 3, `${step.phase}: expected 3 wrong options`);
      assert.ok(step.feedback, `choice step missing feedback in phase: ${step.phase}`);
    }
  });

  test('ConfigSteps_HaveControlsArray', () => {
    const configSteps = proc.steps.filter(s => s.type === 'config');
    assert.ok(configSteps.length > 0, 'expected at least one config step');
    for (const step of configSteps) {
      assert.ok(step.prompt, `config step missing prompt in phase: ${step.phase}`);
      assert.ok(Array.isArray(step.controls), `config step missing controls in phase: ${step.phase}`);
      assert.ok(step.controls.length > 0, `config step has empty controls in phase: ${step.phase}`);
      for (const ctrl of step.controls) {
        assert.ok(ctrl.id,    `${step.phase} control missing id`);
        assert.ok(ctrl.label, `${step.phase} control missing label`);
        assert.ok(ctrl.type,  `${step.phase} control missing type`);
        assert.ok(ctrl.correct !== undefined, `${step.phase} control missing correct`);
      }
    }
  });

  test('HasRecallItems', () => {
    assert.ok(Array.isArray(proc.recallItems), 'recallItems must be an array');
    assert.ok(proc.recallItems.length > 0, 'recallItems must not be empty');
  });

  test('RecallItems_HaveTenEntries', () => {
    assert.equal(proc.recallItems.length, 10);
  });

  test('RecallItems_AllHaveNonEmptyPhase', () => {
    for (const item of proc.recallItems) {
      assert.ok(typeof item.phase === 'string' && item.phase.trim().length > 0,
        `recallItem missing phase: ${JSON.stringify(item)}`);
    }
  });

  test('RecallItems_HaveNoPhaseOverlapWithDistractors', () => {
    const distractorPhases = new Set(proc.distractors.map(d => d.phase));
    for (const item of proc.recallItems) {
      assert.ok(!distractorPhases.has(item.phase),
        `recallItem phase "${item.phase}" also appears in distractors — would be unresolvable`);
    }
  });

  test('HasDistractors', () => {
    assert.ok(Array.isArray(proc.distractors), 'distractors must be array');
    assert.ok(proc.distractors.length >= 3, 'need at least 3 distractors to fill pick pool');
  });

  test('Distractors_AllHavePhaseAndWhy', () => {
    for (const d of proc.distractors) {
      assert.ok(d.phase, `distractor missing phase: ${JSON.stringify(d)}`);
      assert.ok(d.why,   `distractor missing why: ${JSON.stringify(d)}`);
    }
  });

  test('RecallItemPhases_AreUnique', () => {
    const phases = proc.recallItems.map(i => i.phase);
    assert.equal(new Set(phases).size, phases.length, 'recallItems has duplicate phase labels');
  });

  test('EntryAltitudeStep_CoversMinimumAndPreferredAltitudes', () => {
    const step = proc.steps.find(s => s.phase === 'Entry Altitude');
    assert.ok(step, 'Entry Altitude step must exist');
    const correctOption = step.options.find(o => o.correct === true);
    assert.ok(correctOption.text.includes('1,500'), 'correct answer must mention 1,500 ft AGL minimum');
    assert.ok(correctOption.text.includes('2,500') || correctOption.text.includes('3,000'), 'correct answer must mention preferred training altitude');
  });

  test('MixtureFuelFlaps_ConfigStep_HasThreeControls', () => {
    const step = proc.steps.find(s => s.phase === 'Mixture/Fuel/Flaps');
    assert.ok(step, 'Mixture/Fuel/Flaps config step must exist');
    assert.equal(step.controls.length, 3);
    const ids = step.controls.map(c => c.id);
    assert.ok(ids.includes('mixture'), 'must have mixture control');
    assert.ok(ids.includes('fuel'),    'must have fuel control');
    assert.ok(ids.includes('flaps'),   'must have flaps control');
  });

  test('RecoveryStep_RudderIsFirstControl', () => {
    const step = proc.steps.find(s => s.phase === 'Rudder/Break/Vy');
    assert.ok(step, 'Rudder/Break/Vy step must exist');
    assert.equal(step.controls[0].id, 'rudder', 'rudder must be the first control (sequence matters)');
  });
});

// ── _initProcRecall ───────────────────────────────────────────────────────────

describe('_initProcRecall', () => {
  function initAndCapture(proc, group) {
    _initProcRecall(proc, group);
    clearInterval(procSeqState._timer);
    procSeqState._timer = null;
  }

  test('WithRecallItems_SetsPoolFromRecallItems', () => {
    const proc = buildPowerOnStall(SAMPLE_AP);
    initAndCapture(proc, null);
    const realItems = procSeqState.pool.filter(p => !p.isDistractor);
    assert.equal(realItems.length, proc.recallItems.length);
  });

  test('WithRecallItems_SetsTotalRealToRecallItemsLength', () => {
    const proc = buildPowerOnStall(SAMPLE_AP);
    initAndCapture(proc, null);
    assert.equal(procSeqState.totalReal, proc.recallItems.length);
    assert.equal(procSeqState.totalReal, 10);
  });

  test('TotalReal_NotSlotCount_PropertyExists', () => {
    // regression test: the bug used 'slotCount' which was undefined
    assert.ok('totalReal' in procSeqState, 'procSeqState must have totalReal, not slotCount');
    assert.ok(!('slotCount' in procSeqState), 'slotCount was the old bug — must not exist');
  });

  test('ResetsStateToZero', () => {
    const proc = buildPowerOnStall(SAMPLE_AP);
    procSeqState.ok = 5;
    procSeqState.miss = 3;
    procSeqState.nextSlot = 2;
    procSeqState.done = true;
    initAndCapture(proc, null);
    assert.equal(procSeqState.ok, 0);
    assert.equal(procSeqState.miss, 0);
    assert.equal(procSeqState.nextSlot, 0);
    assert.equal(procSeqState.done, false);
  });

  test('PoolContainsDistractors', () => {
    const proc = buildPowerOnStall(SAMPLE_AP);
    initAndCapture(proc, null);
    const distractors = procSeqState.pool.filter(p => p.isDistractor);
    assert.ok(distractors.length >= 2 && distractors.length <= 3,
      `expected 2–3 distractors, got ${distractors.length}`);
  });

  test('PoolItems_HavePhaseAndOrigIdx', () => {
    const proc = buildPowerOnStall(SAMPLE_AP);
    initAndCapture(proc, null);
    for (const item of procSeqState.pool) {
      assert.ok(typeof item.phase === 'string' && item.phase.trim().length > 0,
        `pool item missing phase: ${JSON.stringify(item)}`);
      assert.equal(typeof item.isDistractor, 'boolean');
      if (!item.isDistractor) {
        assert.ok(item.origIdx >= 0 && item.origIdx < procSeqState.totalReal,
          `real item origIdx ${item.origIdx} out of range`);
      }
    }
  });

  test('WithoutRecallItems_FallsBackToSteps', () => {
    const procNoRecall = {
      title: 'Test Proc',
      steps: [
        { type: 'choice', phase: 'Step A', prompt: 'Q?', options: [{ text: 'A', correct: true, why: '' }], feedback: 'f' },
        { type: 'choice', phase: 'Step B', prompt: 'Q?', options: [{ text: 'B', correct: true, why: '' }], feedback: 'f' },
      ],
      distractors: [
        { phase: 'X One', why: 'distractor' },
        { phase: 'X Two', why: 'distractor' },
        { phase: 'X Three', why: 'distractor' },
      ],
    };
    initAndCapture(procNoRecall, null);
    assert.equal(procSeqState.totalReal, 2);
  });
});
