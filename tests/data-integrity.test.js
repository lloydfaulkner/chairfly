// node --test tests/data-integrity.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { ALL_AIRCRAFT, RADIO_SCENARIOS, AIRPORTS } = require('../js/data.js');

const KNOWN_ZONES = new Set([
  'sixpack','avionics','master','beacon','ignition','primer','cb',
  'throttle','mixture','carbheat','flaps','trim','fuel','pitot','oil',
  'static','controls','seats','tires',
]);

const AIRCRAFT_IDS = ['c172', 'cherokee140'];

// ── ALL_AIRCRAFT ─────────────────────────────────────────────────────────────

describe('ALL_AIRCRAFT', () => {
  test('BothAircraftIds_ArePresent', () => {
    for (const id of AIRCRAFT_IDS) {
      assert.ok(ALL_AIRCRAFT[id], `missing aircraft: ${id}`);
    }
  });

  for (const id of AIRCRAFT_IDS) {
    test(`${id}_RequiredTopLevelKeys_AreAllPresent`, () => {
      const ac = ALL_AIRCRAFT[id];
      assert.ok(ac.name,       `${id}.name missing`);
      assert.ok(ac.label,      `${id}.label missing`);
      assert.ok(ac.speeds,     `${id}.speeds missing`);
      assert.ok(ac.checklists, `${id}.checklists missing`);
      assert.ok(Array.isArray(ac.emergencies), `${id}.emergencies must be array`);
    });

    test(`${id}Speeds_RequiredKeys_AreAllNumeric`, () => {
      const s = ALL_AIRCRAFT[id].speeds;
      for (const key of ['vr','vx','vy','approach','shortFinal']) {
        assert.ok(typeof s[key] === 'number', `${id}.speeds.${key} must be a number`);
      }
    });
  }
});

describe('ALL_AIRCRAFT_ChecklistItems', () => {
  for (const id of AIRCRAFT_IDS) {
    const ac = ALL_AIRCRAFT[id];
    for (const [phaseId, phase] of Object.entries(ac.checklists)) {
      test(`${id}_${phaseId}Items_HaveActionAndValue`, () => {
        assert.ok(Array.isArray(phase.items), `${id}/${phaseId}.items must be array`);
        for (const item of phase.items) {
          assert.ok(item.action, `${id}/${phaseId} item missing action: ${JSON.stringify(item)}`);
          assert.ok(item.value,  `${id}/${phaseId} item missing value: ${JSON.stringify(item)}`);
        }
      });

      test(`${id}_${phaseId}Items_UseOnlyValidZones`, () => {
        for (const item of phase.items) {
          if (item.zone) {
            assert.ok(
              KNOWN_ZONES.has(item.zone),
              `${id}/${phaseId} unknown zone "${item.zone}" on action "${item.action}"`,
            );
          }
        }
      });
    }
  }
});

describe('ALL_AIRCRAFT_Emergencies', () => {
  for (const id of AIRCRAFT_IDS) {
    test(`${id}Emergencies_AllHaveRequiredFields`, () => {
      const emergencies = ALL_AIRCRAFT[id].emergencies;
      assert.ok(emergencies.length > 0, `${id} has no emergencies`);
      for (const e of emergencies) {
        assert.ok(e.title,                   `${id} emergency missing title`);
        assert.ok(e.situation,               `${id} emergency missing situation`);
        assert.ok(Array.isArray(e.options),  `${id} emergency missing options array`);
        assert.ok(e.options.length >= 2,     `${id} emergency "${e.title}" needs at least 2 options`);
        assert.equal(typeof e.correct, 'number', `${id} emergency "${e.title}" .correct must be an index number`);
        assert.ok(e.correct >= 0 && e.correct < e.options.length,
          `${id} emergency "${e.title}" .correct ${e.correct} is out of range`);
        assert.ok(e.explanation, `${id} emergency "${e.title}" missing explanation`);
      }
    });
  }
});

// ── ALL_AIRCRAFT speed ordering ──────────────────────────────────────────────

describe('ALL_AIRCRAFT_Speeds', () => {
  for (const id of AIRCRAFT_IDS) {
    const s = ALL_AIRCRAFT[id].speeds;

    test(`${id}Speeds_VrLessThanVx_IsAerodynamicallyOrdered`, () =>
      assert.ok(s.vr < s.vx, `${id}: Vr(${s.vr}) must be < Vx(${s.vx})`));

    test(`${id}Speeds_VxLessThanVy_IsAerodynamicallyOrdered`, () =>
      assert.ok(s.vx < s.vy, `${id}: Vx(${s.vx}) must be < Vy(${s.vy})`));

    test(`${id}Speeds_ShortFinalLessThanApproach_IsCorrect`, () =>
      assert.ok(s.shortFinal < s.approach, `${id}: shortFinal(${s.shortFinal}) must be < approach(${s.approach})`));

    test(`${id}Speeds_ApproachAtOrBelowVfe_IsWithinFlapsLimit`, () =>
      assert.ok(s.approach <= s.vfe, `${id}: approach(${s.approach}) must be <= Vfe(${s.vfe})`));
  }
});

// ── RADIO_SCENARIOS ──────────────────────────────────────────────────────────

describe('RADIO_SCENARIOS', () => {
  test('RadioScenarios_IsNonEmptyArray', () => {
    assert.ok(Array.isArray(RADIO_SCENARIOS));
    assert.ok(RADIO_SCENARIOS.length > 0);
  });

  for (let i = 0; i < RADIO_SCENARIOS.length; i++) {
    const s = RADIO_SCENARIOS[i];
    const type = s.type || 'unknown';

    test(`Scenario${i}_${type}_RequiredFields_AreAllPresent`, () => {
      assert.ok(s.type,             `scenario[${i}] missing type`);
      assert.ok(s.ideal,            `scenario[${i}] missing ideal`);
      assert.ok(Array.isArray(s.words) && s.words.length > 0, `scenario[${i}] missing words`);
      assert.ok(Array.isArray(s.distractors),                 `scenario[${i}] missing distractors`);
      assert.ok(s.rule && typeof s.rule.repeats === 'boolean', `scenario[${i}] missing rule.repeats`);
      assert.ok(s.rule.why,         `scenario[${i}] missing rule.why`);
      assert.ok(s.note,             `scenario[${i}] missing note`);
    });

    test(`Scenario${i}_${type}Distractors_HaveTextAndWhy`, () => {
      for (const d of s.distractors) {
        assert.ok(d.text, `scenario[${i}] distractor missing text`);
        assert.ok(d.why,  `scenario[${i}] distractor missing why`);
      }
    });

    test(`Scenario${i}_${type}Distractors_DoNotMatchAnyWordChip`, () => {
      const wordSet = new Set(s.words);
      for (const d of s.distractors) {
        assert.ok(
          !wordSet.has(d.text),
          `scenario[${i}] distractor "${d.text}" is also a correct word chip — trap chip would be correct`,
        );
      }
    });

    if (s.speechOptional) {
      test(`Scenario${i}_${type}SpeechOptional_IsStringArray`, () => {
        assert.ok(Array.isArray(s.speechOptional));
        for (const w of s.speechOptional) {
          assert.equal(typeof w, 'string', `scenario[${i}] speechOptional entry must be string`);
        }
      });
    }
  }
});

// ── AIRPORTS ─────────────────────────────────────────────────────────────────

describe('AIRPORTS', () => {
  test('Airports_IsNonEmptyObject', () => {
    assert.ok(typeof AIRPORTS === 'object');
    assert.ok(Object.keys(AIRPORTS).length > 0);
  });

  test('KuzaAirport_IsPresent', () =>
    assert.ok(AIRPORTS['KUZA'], 'KUZA must be in the airport database'));

  test('AllEntries_HaveNameElevationNotesStructure', () => {
    for (const [icao, entry] of Object.entries(AIRPORTS)) {
      assert.ok(Array.isArray(entry),          `${icao}: entry must be array`);
      assert.equal(entry.length, 3,            `${icao}: entry must have 3 elements`);
      assert.equal(typeof entry[0], 'string',  `${icao}: name must be string`);
      assert.equal(typeof entry[1], 'number',  `${icao}: elevation must be number`);
      assert.equal(typeof entry[2], 'string',  `${icao}: notes must be string`);
    }
  });

  test('AllIcaoCodes_AreValid4LetterFormat', () => {
    for (const icao of Object.keys(AIRPORTS)) {
      assert.match(icao, /^[A-Z]{4}$/, `"${icao}" is not a valid 4-letter ICAO code`);
    }
  });
});
