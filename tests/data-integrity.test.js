// node --test tests/data-integrity.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { ALL_AIRCRAFT, RADIO_SCENARIOS, RADIO_SCENARIO_GROUPS, VSPEEDS_META } = require('../js/data.js');
const { AIRPORTS } = require('../js/airports.js');

const KNOWN_ZONES = new Set([
  'sixpack','avionics','master','beacon','ignition','primer','cb',
  'throttle','mixture','carbheat','flaps','trim','fuel','pitot','oil',
  'static','controls','seats','tires',
]);

const AIRCRAFT_IDS = ['cessna172ikl', 'cherokee140'];

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

    test(`${id}Speeds_Vs0LessThanVs_IsAerodynamicallyOrdered`, () =>
      assert.ok(s.vs0 < s.vs, `${id}: Vs0(${s.vs0}) must be < Vs(${s.vs})`));

    test(`${id}Speeds_VnoLessThanVne_IsAerodynamicallyOrdered`, () =>
      assert.ok(s.vno < s.vne, `${id}: Vno(${s.vno}) must be < Vne(${s.vne})`));
  }
});

// ── VSPEEDS_META ─────────────────────────────────────────────────────────────

describe('VSPEEDS_META', () => {
  test('IsNonEmptyArray', () => {
    assert.ok(Array.isArray(VSPEEDS_META));
    assert.ok(VSPEEDS_META.length > 0);
  });

  test('AllEntries_HaveKeySymbolLabel', () => {
    for (const m of VSPEEDS_META) {
      assert.ok(m.key,    `VSPEEDS_META entry missing key: ${JSON.stringify(m)}`);
      assert.ok(m.symbol, `VSPEEDS_META entry missing symbol: ${JSON.stringify(m)}`);
      assert.ok(m.label,  `VSPEEDS_META entry missing label: ${JSON.stringify(m)}`);
    }
  });

  test('AllEntries_HaveNonEmptyScenario', () => {
    for (const m of VSPEEDS_META) {
      assert.ok(
        typeof m.scenario === 'string' && m.scenario.trim().length > 0,
        `VSPEEDS_META entry missing scenario: ${JSON.stringify(m)}`,
      );
    }
  });

  test('NoDuplicateKeys', () => {
    const keys = VSPEEDS_META.map(m => m.key);
    assert.equal(new Set(keys).size, keys.length, 'VSPEEDS_META has duplicate keys');
  });

  test('NoDuplicateSymbols', () => {
    const symbols = VSPEEDS_META.map(m => m.symbol);
    assert.equal(new Set(symbols).size, symbols.length, 'VSPEEDS_META has duplicate symbols');
  });

  for (const id of AIRCRAFT_IDS) {
    test(`${id}Speeds_ContainAllVspeedsMetaKeys`, () => {
      const speeds = ALL_AIRCRAFT[id].speeds;
      for (const m of VSPEEDS_META) {
        assert.ok(
          typeof speeds[m.key] === 'number',
          `${id}.speeds.${m.key} (${m.symbol}) missing or not a number`,
        );
      }
    });
  }
});

// ── RADIO_SCENARIOS ──────────────────────────────────────────────────────────

describe('RADIO_SCENARIOS', () => {
  test('RadioScenarios_IsNonEmptyArray', () => {
    assert.ok(Array.isArray(RADIO_SCENARIOS));
    assert.ok(RADIO_SCENARIOS.length > 0);
  });

  for (let i = 0; i < RADIO_SCENARIOS.length; i++) {
    const template = RADIO_SCENARIOS[i];
    const type = template.type || 'unknown';

    test(`Scenario${i}_${type}_RequiredFields_AreAllPresent`, () => {
      const s = template.build ? template.build() : template;
      assert.ok(s.type,             `scenario[${i}] missing type`);
      assert.ok(s.ideal,            `scenario[${i}] missing ideal`);
      assert.ok(Array.isArray(s.words) && s.words.length > 0, `scenario[${i}] missing words`);
      assert.ok(Array.isArray(s.distractors),                 `scenario[${i}] missing distractors`);
      assert.ok(s.rule && typeof s.rule.repeats === 'boolean', `scenario[${i}] missing rule.repeats`);
      assert.ok(s.rule.why,         `scenario[${i}] missing rule.why`);
      assert.ok(s.note,             `scenario[${i}] missing note`);
    });

    test(`Scenario${i}_${type}Distractors_HaveTextAndWhy`, () => {
      const s = template.build ? template.build() : template;
      for (const d of s.distractors) {
        assert.ok(d.text, `scenario[${i}] distractor missing text`);
        assert.ok(d.why,  `scenario[${i}] distractor missing why`);
      }
    });

    test(`Scenario${i}_${type}Distractors_DoNotMatchAnyWordChip`, () => {
      const s = template.build ? template.build() : template;
      const wordSet = new Set(s.words);
      for (const d of s.distractors) {
        assert.ok(
          !wordSet.has(d.text),
          `scenario[${i}] distractor "${d.text}" is also a correct word chip — trap chip would be correct`,
        );
      }
    });

    test(`Scenario${i}_${type}SpeechOptional_IfPresentIsStringArray`, () => {
      const s = template.build ? template.build() : template;
      if (!s.speechOptional) return;
      assert.ok(Array.isArray(s.speechOptional));
      for (const w of s.speechOptional) {
        assert.equal(typeof w, 'string', `scenario[${i}] speechOptional entry must be string`);
      }
    });
  }
});

// ── RADIO_SCENARIO_GROUPS ────────────────────────────────────────────────────

describe('RADIO_SCENARIO_GROUPS', () => {
  test('IsNonEmptyArray', () => {
    assert.ok(Array.isArray(RADIO_SCENARIO_GROUPS));
    assert.ok(RADIO_SCENARIO_GROUPS.length > 0);
  });

  test('AllEntries_HaveIdLabelSub', () => {
    for (const g of RADIO_SCENARIO_GROUPS) {
      assert.ok(g.id,    `group missing id`);
      assert.ok(g.label, `group missing label`);
      assert.ok(g.sub,   `group missing sub`);
    }
  });

  test('AllScenarios_HaveValidGroup', () => {
    const groupIds = new Set(RADIO_SCENARIO_GROUPS.map(g => g.id));
    for (const s of RADIO_SCENARIOS) {
      assert.ok(groupIds.has(s.group), `scenario "${s.type}" has invalid group: "${s.group}"`);
    }
  });
});

// ── AIRPORTS ─────────────────────────────────────────────────────────────────

describe('AIRPORTS', () => {
  test('Airports_IsNonEmptyObject', () => {
    assert.ok(typeof AIRPORTS === 'object');
    assert.ok(Object.keys(AIRPORTS).length > 0);
  });

  test('AllEntries_HaveNameElevationNotesMunicipalityStateStructure', () => {
    for (const [icao, entry] of Object.entries(AIRPORTS)) {
      assert.ok(Array.isArray(entry),          `${icao}: entry must be array`);
      assert.equal(entry.length, 5,            `${icao}: entry must have 5 elements`);
      assert.equal(typeof entry[0], 'string',  `${icao}: name must be string`);
      assert.equal(typeof entry[1], 'number',  `${icao}: elevation must be number`);
      assert.equal(typeof entry[2], 'string',  `${icao}: notes must be string`);
      assert.equal(typeof entry[3], 'string',  `${icao}: municipality must be string`);
      assert.equal(typeof entry[4], 'string',  `${icao}: state must be string`);
    }
  });

  test('KuzaAirport_HasCorrectElevation', () => {
    const [, elev] = AIRPORTS['KUZA'];
    assert.equal(elev, 666, 'KUZA elevation must be 666 ft MSL');
  });

  test('LocalAirports_AreAllPresent', () => {
    for (const icao of ['KUZA', 'KJQF', 'KSVH', 'KCLT', 'KRDU']) {
      assert.ok(AIRPORTS[icao], `${icao} must be in the airport database`);
    }
  });

  test('AllIcaoCodes_Are4CharAlphanumericStartingWithKPAPH', () => {
    for (const icao of Object.keys(AIRPORTS)) {
      assert.match(icao, /^[A-Z0-9]{4}$/, `"${icao}" is not a valid 4-char ident`);
      assert.ok(
        icao.startsWith('K') || icao.startsWith('PA') || icao.startsWith('PH'),
        `"${icao}" must start with K, PA, or PH`,
      );
    }
  });
});
