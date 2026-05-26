// node --test tests/speech-grader.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSpoken, scoreSpeechCall } = require('../js/speech-grader.js');

const cap = s => s[0].toUpperCase() + s.slice(1);

// ── normalizeSpoken ──────────────────────────────────────────────────────────

describe('normalizeSpoken', () => {
  const singleDigitCases = [
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
  for (const [input, expected] of singleDigitCases) {
    test(`SingleDigitWord${cap(input)}_Returns${expected}`, () =>
      assert.equal(normalizeSpoken(input), expected));
  }

  const teenCases = [
    ['eleven',    '11'],
    ['twelve',    '12'],
    ['thirteen',  '13'],
    ['fourteen',  '14'],
    ['fifteen',   '15'],
    ['sixteen',   '16'],
    ['seventeen', '17'],
    ['eighteen',  '18'],
    ['nineteen',  '19'],
  ];
  for (const [input, expected] of teenCases) {
    test(`TeenWord${cap(input)}_Returns${expected}`, () =>
      assert.equal(normalizeSpoken(input), expected));
  }

  const tensCases = [
    ['ten',     '10'],
    ['twenty',  '20'],
    ['thirty',  '30'],
    ['forty',   '40'],
    ['fifty',   '50'],
    ['sixty',   '60'],
    ['seventy', '70'],
    ['eighty',  '80'],
    ['ninety',  '90'],
  ];
  for (const [input, expected] of tensCases) {
    test(`TensWord${cap(input)}_Returns${expected}`, () =>
      assert.equal(normalizeSpoken(input), expected));
  }

  test('CompoundThirtyFive_Returns35', () =>
    assert.equal(normalizeSpoken('thirty five'), '35'));

  test('CompoundTwentySeven_Returns27', () =>
    assert.equal(normalizeSpoken('twenty seven'), '27'));

  test('EighteenHundred_Returns1800', () =>
    assert.equal(normalizeSpoken('eighteen hundred'), '1800'));

  test('ThirtyFiveHundred_Returns3500', () =>
    assert.equal(normalizeSpoken('thirty five hundred'), '3500'));

  test('ThreeThousandFiveHundred_Returns3500', () =>
    assert.equal(normalizeSpoken('three thousand five hundred'), '3500'));

  test('ThreeThousand_Returns3000', () =>
    assert.equal(normalizeSpoken('three thousand'), '3000'));

  test('OneThousandTwoHundred_Returns1200', () =>
    assert.equal(normalizeSpoken('one thousand two hundred'), '1200'));

  test('HyphensAndApostrophes_AreStripped', () =>
    assert.equal(normalizeSpoken("rock hill's"), 'rock hills'));

  test('SpaceSeparatedDigitTokens_ArePreserved', () =>
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

describe('scoreSpeechCall', () => {
  test('IdenticalTranscript_ReturnsScore1', () => {
    const { score } = scoreSpeechCall(
      'Caldwell traffic Cessna four five two one golf ten miles east three thousand five hundred inbound landing runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
    );
    assert.equal(score, 1);
  });

  test('SkyhawkCallsignForCessnaKeyword_ReturnsScore1', () => {
    const { score } = scoreSpeechCall(
      'Caldwell traffic Skyhawk four five two one golf ten miles east three thousand five hundred inbound landing runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
    );
    assert.equal(score, 1);
  });

  test('CessnaCallsignForSkyhawkKeyword_ReturnsScore1', () => {
    const words = ['Rock Hill traffic', 'Skyhawk Four Five Two One Golf', 'final runway two seven', 'Rock Hill'];
    const { score } = scoreSpeechCall(
      'Rock Hill traffic Cessna four five two one golf final runway two seven Rock Hill',
      '',
      words,
    );
    assert.equal(score, 1);
  });

  test('OmittedOptionalWord_DoesNotLowerScore', () => {
    const { score } = scoreSpeechCall(
      'Caldwell traffic Cessna four five two one golf ten miles east three thousand five hundred inbound runway two seven Caldwell',
      PATTERN_IDEAL,
      PATTERN_WORDS,
      ['landing'],
    );
    assert.equal(score, 1);
  });

  test('OmittedOptionalWord_StatusIsOptional', () => {
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

  test('SpokenWordNumbers3500_MatchDigitKeyword', () => {
    const words = ['Caldwell traffic', '3500', 'Caldwell'];
    const { score } = scoreSpeechCall(
      'Caldwell traffic three thousand five hundred Caldwell',
      '',
      words,
    );
    assert.equal(score, 1);
  });

  test('RunTogetherDigits4521_MatchesSingleDigitKeywords', () => {
    // recognizer says "4521" as one token; each of 4,5,2,1 should match
    const words = ['Cessna Four Five Two One Golf'];
    const { score } = scoreSpeechCall('Cessna 4521 Golf', '', words);
    assert.equal(score, 1);
  });

  test('RunwayWordNumbers_MatchDigitKeyword27', () => {
    const words = ['runway two seven'];
    const { score } = scoreSpeechCall('runway two seven', '', words);
    assert.equal(score, 1);
  });

  test('RawNNumber_ReturnsScoreLessThan1', () => {
    const words = ['Cessna Four Five Two One Golf'];
    const { score } = scoreSpeechCall('N4521G', '', words);
    assert.ok(score < 1, `expected score < 1, got ${score}`);
  });

  test('CompletelyWrongTranscript_ReturnsScore0', () => {
    const words = ['Caldwell traffic', 'Cessna Four Five Two One Golf', 'Caldwell'];
    const { score } = scoreSpeechCall('random gibberish here', '', words);
    assert.ok(score === 0, `expected 0, got ${score}`);
  });

  test('ExtraNovemberPrefix_DoesNotLowerScore', () => {
    // AIM 4-2-4: "November" spoken before tail digits is extra and ignored
    const words = ['Cessna Four Five Two One Golf'];
    const { score } = scoreSpeechCall(
      'Cessna November four five two one golf',
      '',
      words,
    );
    assert.equal(score, 1);
  });

  test('PrefixCloseMatch_ContributesHalfPoint', () => {
    const words = ['Caldwell traffic'];
    const { score, words: wordResults } = scoreSpeechCall('Caldwel traffic', '', words);
    const caldwell = wordResults.find(w => w.word === 'caldwell');
    assert.equal(caldwell?.status, 'close');
    assert.ok(score > 0 && score < 1);
  });
});
