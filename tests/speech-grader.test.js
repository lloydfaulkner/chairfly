// node --test tests/speech-grader.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSpoken, scoreSpeechCall } = require('../js/speech-grader.js');

// ── normalizeSpoken ──────────────────────────────────────────────────────────

describe('normalizeSpoken — single digit words', () => {
  const cases = [
    ['niner', '9'],
    ['nine',  '9'],
    ['eight', '8'],
    ['seven', '7'],
    ['six',   '6'],
    ['five',  '5'],
    ['four',  '4'],
    ['three', '3'],
    ['two',   '2'],
    ['one',   '1'],
    ['zero',  '0'],
  ];
  for (const [input, expected] of cases) {
    test(input, () => assert.equal(normalizeSpoken(input), expected));
  }
});

describe('normalizeSpoken — teens', () => {
  const cases = [
    ['eleven',   '11'],
    ['twelve',   '12'],
    ['thirteen', '13'],
    ['fourteen', '14'],
    ['fifteen',  '15'],
    ['sixteen',  '16'],
    ['seventeen','17'],
    ['eighteen', '18'],
    ['nineteen', '19'],
  ];
  for (const [input, expected] of cases) {
    test(input, () => assert.equal(normalizeSpoken(input), expected));
  }
});

describe('normalizeSpoken — tens', () => {
  const cases = [
    ['ten',    '10'],
    ['twenty', '20'],
    ['thirty', '30'],
    ['forty',  '40'],
    ['fifty',  '50'],
    ['sixty',  '60'],
    ['seventy','70'],
    ['eighty', '80'],
    ['ninety', '90'],
  ];
  for (const [input, expected] of cases) {
    test(input, () => assert.equal(normalizeSpoken(input), expected));
  }
});

describe('normalizeSpoken — compound numbers', () => {
  test('thirty five → 35', () =>
    assert.equal(normalizeSpoken('thirty five'), '35'));

  test('twenty seven → 27', () =>
    assert.equal(normalizeSpoken('twenty seven'), '27'));

  test('eighteen hundred → 1800 (altitude)', () =>
    assert.equal(normalizeSpoken('eighteen hundred'), '1800'));

  test('thirty five hundred → 3500 (altitude)', () =>
    assert.equal(normalizeSpoken('thirty five hundred'), '3500'));

  test('three thousand five hundred → 3500', () =>
    assert.equal(normalizeSpoken('three thousand five hundred'), '3500'));

  test('three thousand → 3000', () =>
    assert.equal(normalizeSpoken('three thousand'), '3000'));

  test('one thousand two hundred → 1200', () =>
    assert.equal(normalizeSpoken('one thousand two hundred'), '1200'));
});

describe('normalizeSpoken — punctuation stripped', () => {
  test('removes hyphens and apostrophes', () =>
    assert.equal(normalizeSpoken("rock hill's"), 'rock hills'));

  test('preserves spaces between tokens', () =>
    assert.equal(normalizeSpoken('four five two one golf'), '4 5 2 1 golf'));
});

// ── scoreSpeechCall ──────────────────────────────────────────────────────────

// Shared fixture: pattern-entry call for tail N4521G
const PATTERN_WORDS = [
  'Caldwell traffic',
  'Cessna Four Five Two One Golf',
  'ten miles east',
  'three thousand five hundred',
  'inbound landing runway two seven',
  'Caldwell',
];
const PATTERN_IDEAL = 'Caldwell traffic, Cessna Four Five Two One Golf, ten miles east, three thousand five hundred, inbound landing runway two seven, Caldwell.';

describe('scoreSpeechCall — perfect match', () => {
  test('spoken identical to ideal scores 1.0', () => {
    const { score } = scoreSpeechCall(
      'Caldwell traffic Cessna four five two one golf ten miles east three thousand five hundred inbound landing runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
    );
    assert.equal(score, 1);
  });
});

describe('scoreSpeechCall — callsign alias (AIM 4-2-4)', () => {
  test('Skyhawk accepted in place of Cessna', () => {
    const { score } = scoreSpeechCall(
      'Caldwell traffic Skyhawk four five two one golf ten miles east three thousand five hundred inbound landing runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
    );
    assert.equal(score, 1);
  });

  test('Cessna accepted in place of Skyhawk when Skyhawk is the keyword', () => {
    const words = ['Rock Hill traffic', 'Skyhawk Four Five Two One Golf', 'final runway two seven', 'Rock Hill'];
    const { score } = scoreSpeechCall(
      'Rock Hill traffic Cessna four five two one golf final runway two seven Rock Hill',
      '',
      words,
    );
    assert.equal(score, 1);
  });
});

describe('scoreSpeechCall — optional words', () => {
  test('omitting an optional word does not lower the score', () => {
    // "landing" is optional in this scenario
    const { score } = scoreSpeechCall(
      'Caldwell traffic Cessna four five two one golf ten miles east three thousand five hundred inbound runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
      ['landing'],
    );
    assert.equal(score, 1);
  });

  test('optional word status is "optional" in wordResults', () => {
    const { words } = scoreSpeechCall(
      'Caldwell traffic Cessna four five two one golf ten miles east three thousand five hundred inbound runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
      ['landing'],
    );
    const landing = words.find(w => w.word === 'landing');
    assert.ok(landing, 'landing keyword should appear in results');
    assert.equal(landing.status, 'optional');
  });
});

describe('scoreSpeechCall — number matching', () => {
  test('spoken word numbers match digit keywords (3500)', () => {
    // "three thousand five hundred" in spoken text should match chip "3500"
    const words = ['Caldwell traffic', '3500', 'Caldwell'];
    const { score } = scoreSpeechCall(
      'Caldwell traffic three thousand five hundred Caldwell',
      '',
      words,
    );
    assert.equal(score, 1);
  });

  test('speech recognizer returning run-together digits (4521) matches single-digit keywords', () => {
    // recognizer says "4521" as one token; each of 4,5,2,1 should match
    const words = ['Cessna Four Five Two One Golf'];
    const { score } = scoreSpeechCall(
      'Cessna 4521 Golf',
      '',
      words,
    );
    assert.equal(score, 1);
  });

  test('runway "two seven" matches keyword "27"', () => {
    const words = ['runway two seven'];
    const { score } = scoreSpeechCall('runway two seven', '', words);
    assert.equal(score, 1);
  });
});

describe('scoreSpeechCall — miss cases', () => {
  test('raw N-number alphanumeric scores less than 1.0', () => {
    const words = ['Cessna Four Five Two One Golf'];
    const { score } = scoreSpeechCall('N4521G', '', words);
    assert.ok(score < 1, `expected score < 1, got ${score}`);
  });

  test('completely wrong call scores 0', () => {
    const words = ['Caldwell traffic', 'Cessna Four Five Two One Golf', 'Caldwell'];
    const { score } = scoreSpeechCall('random gibberish here', '', words);
    assert.ok(score === 0, `expected 0, got ${score}`);
  });

  test('extra "November" prefix is ignored — does not lower score', () => {
    // AIM 4-2-4: "November" spoken before tail digits is extra and ignored
    const words = ['Cessna Four Five Two One Golf'];
    const { score } = scoreSpeechCall(
      'Cessna November four five two one golf',
      '',
      words,
    );
    assert.equal(score, 1);
  });
});

describe('scoreSpeechCall — close match', () => {
  test('prefix close match contributes 0.5 to score', () => {
    // "Caldwel" (typo) should be close to "Caldwell"
    const words = ['Caldwell traffic'];
    const { score, words: wordResults } = scoreSpeechCall('Caldwel traffic', '', words);
    const caldwell = wordResults.find(w => w.word === 'caldwell');
    assert.equal(caldwell?.status, 'close');
    assert.ok(score > 0 && score < 1);
  });
});
