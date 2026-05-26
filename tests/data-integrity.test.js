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
const CHECKLIST_PHASES = ['preflight','beforestart','enginestart','runup','beforelanding'];

// ── ALL_AIRCRAFT ─────────────────────────────────────────────────────────────

describe('ALL_AIRCRAFT — top-level structure', () => {
  test('contains c172 and cherokee140', () => {
    for (const id of AIRCRAFT_IDS) {
      assert.ok(ALL_AIRCRAFT[id], `missing aircraft: ${id}`);
    }
  });

  for (const id of AIRCRAFT_IDS) {
    test(`${id} has required keys`, () => {
      const ac = ALL_AIRCRAFT[id];
      assert.ok(ac.name,       `${id}.name missing`);
      assert.ok(ac.label,      `${id}.label missing`);
      assert.ok(ac.speeds,     `${id}.speeds missing`);
      assert.ok(ac.checklists, `${id}.checklists missing`);
      assert.ok(Array.isArray(ac.emergencies), `${id}.emergencies must be array`);
    });

    test(`${id} speeds has required keys`, () => {
      const s = ALL_AIRCRAFT[id].speeds;
      for (const key of ['vr','vx','vy','approach','shortFinal']) {
        assert.ok(typeof s[key] === 'number', `${id}.speeds.${key} must be a number`);
      }
    });
  }
});

describe('ALL_AIRCRAFT — checklist items', () => {
  for (const id of AIRCRAFT_IDS) {
    const ac = ALL_AIRCRAFT[id];
    for (const [phaseId, phase] of Object.entries(ac.checklists)) {
      test(`${id}/${phaseId} — every item has action and value`, () => {
        assert.ok(Array.isArray(phase.items), `${id}/${phaseId}.items must be array`);
        for (const item of phase.items) {
          assert.ok(item.action, `${id}/${phaseId} item missing action: ${JSON.stringify(item)}`);
          assert.ok(item.value,  `${id}/${phaseId} item missing value: ${JSON.stringify(item)}`);
        }
      });

      test(`${id}/${phaseId} — every zone value is in KNOWN_ZONES`, () => {
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

describe('ALL_AIRCRAFT — emergencies', () => {
  for (const id of AIRCRAFT_IDS) {
    test(`${id} emergencies — every item has required fields`, () => {
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

// ── RADIO_SCENARIOS ──────────────────────────────────────────────────────────

describe('RADIO_SCENARIOS — structure', () => {
  test('is a non-empty array', () => {
    assert.ok(Array.isArray(RADIO_SCENARIOS));
    assert.ok(RADIO_SCENARIOS.length > 0);
  });

  for (let i = 0; i < RADIO_SCENARIOS.length; i++) {
    const s = RADIO_SCENARIOS[i];
    const label = `scenario[${i}] "${s.type || '?'}"`;

    test(`${label} — required fields present`, () => {
      assert.ok(s.type,             `${label} missing type`);
      assert.ok(s.ideal,            `${label} missing ideal`);
      assert.ok(Array.isArray(s.words) && s.words.length > 0, `${label} missing words`);
      assert.ok(Array.isArray(s.distractors),                 `${label} missing distractors`);
      assert.ok(s.rule && typeof s.rule.repeats === 'boolean', `${label} missing rule.repeats`);
      assert.ok(s.rule.why,         `${label} missing rule.why`);
      assert.ok(s.note,             `${label} missing note`);
    });

    test(`${label} — every distractor has text and why`, () => {
      for (const d of s.distractors) {
        assert.ok(d.text, `${label} distractor missing text`);
        assert.ok(d.why,  `${label} distractor missing why`);
      }
    });

    if (s.speechOptional) {
      test(`${label} — speechOptional is array of strings`, () => {
        assert.ok(Array.isArray(s.speechOptional));
        for (const w of s.speechOptional) {
          assert.equal(typeof w, 'string', `${label} speechOptional entry must be string`);
        }
      });
    }
  }
});

// ── AIRPORTS ─────────────────────────────────────────────────────────────────

describe('AIRPORTS — structure', () => {
  test('is a non-empty object', () => {
    assert.ok(typeof AIRPORTS === 'object');
    assert.ok(Object.keys(AIRPORTS).length > 0);
  });

  test('KUZA is present (default airport)', () => {
    assert.ok(AIRPORTS['KUZA'], 'KUZA must be in the airport database');
  });

  test('every entry is [name, elevation_ft, notes]', () => {
    for (const [icao, entry] of Object.entries(AIRPORTS)) {
      assert.ok(Array.isArray(entry),          `${icao}: entry must be array`);
      assert.equal(entry.length, 3,            `${icao}: entry must have 3 elements`);
      assert.equal(typeof entry[0], 'string',  `${icao}: name must be string`);
      assert.equal(typeof entry[1], 'number',  `${icao}: elevation must be number`);
      assert.equal(typeof entry[2], 'string',  `${icao}: notes must be string`);
    }
  });

  test('ICAO codes are 4 uppercase letters', () => {
    for (const icao of Object.keys(AIRPORTS)) {
      assert.match(icao, /^[A-Z]{4}$/, `"${icao}" is not a valid 4-letter ICAO code`);
    }
  });
});
