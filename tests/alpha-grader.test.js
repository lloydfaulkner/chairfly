// node --test tests/alpha-grader.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { _alphaMatchWord, gradeAlphaSequence } = require('../js/alpha-grader.js');
const { PHONETIC_ALPHABET, PHONETIC_NUMBERS } = require('../js/data.js');

// ── PHONETIC_ALPHABET data integrity ─────────────────────────────────────────

describe('PHONETIC_ALPHABET', () => {
  test('AllTwentySixLetters_ArePresent', () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    for (const l of letters) assert.ok(PHONETIC_ALPHABET[l], `Missing letter: ${l}`);
    assert.equal(Object.keys(PHONETIC_ALPHABET).length, 26);
  });

  const icaoSpellings = [
    ['A', 'Alfa'],
    ['J', 'Juliett'],
    ['X', 'X-ray'],
  ];
  for (const [letter, word] of icaoSpellings) {
    test(`Letter${letter}_UsesICAOSpelling_${word}`, () =>
      assert.equal(PHONETIC_ALPHABET[letter], word));
  }

  test('AllValues_AreNonEmptyStrings', () => {
    for (const [k, v] of Object.entries(PHONETIC_ALPHABET)) {
      assert.equal(typeof v, 'string', `${k} value is not a string`);
      assert.ok(v.length > 0, `${k} value is empty`);
    }
  });
});

// ── PHONETIC_NUMBERS data integrity ──────────────────────────────────────────

describe('PHONETIC_NUMBERS', () => {
  test('AllTenDigits_ArePresent', () => {
    for (const d of '0123456789'.split('')) assert.ok(PHONETIC_NUMBERS[d], `Missing digit: ${d}`);
    assert.equal(Object.keys(PHONETIC_NUMBERS).length, 10);
  });

  const icaoNumbers = [
    ['1', 'Wun'],
    ['2', 'Too'],
    ['3', 'Tree'],
    ['4', 'Fower'],
    ['5', 'Fife'],
    ['8', 'Ait'],
    ['9', 'Niner'],
  ];
  for (const [digit, word] of icaoNumbers) {
    test(`Digit${digit}_UsesICAOPronunciation_${word}`, () =>
      assert.equal(PHONETIC_NUMBERS[digit], word));
  }

  test('SixSevenZero_UseStandardEnglish', () => {
    assert.equal(PHONETIC_NUMBERS['0'], 'Zero');
    assert.equal(PHONETIC_NUMBERS['6'], 'Six');
    assert.equal(PHONETIC_NUMBERS['7'], 'Seven');
  });
});

// ── _alphaMatchWord ───────────────────────────────────────────────────────────

describe('_alphaMatchWord', () => {
  // Exact matches (case-insensitive)
  const exactCases = [
    ['november', 'November'],
    ['whiskey',  'Whiskey'],
    ['golf',     'Golf'],
    ['zero',     'Zero'],
    ['six',      'Six'],
    ['seven',    'Seven'],
  ];
  for (const [spoken, expected] of exactCases) {
    test(`ExactMatch_${expected}_ReturnsTrue`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), true));
  }

  // ICAO alphabet variants accepted
  const alphabetVariants = [
    ['alpha',  'Alfa',    'alpha accepted for Alfa'],
    ['juliet', 'Juliett', 'juliet accepted for Juliett'],
    ['ray',    'X-ray',   'ray accepted for X-ray'],
  ];
  for (const [spoken, expected, label] of alphabetVariants) {
    test(`AlphabetVariant_${label}`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), true));
  }

  // ICAO numbers: standard English accepted in place of ICAO pronunciation
  const numberVariants = [
    ['one',   'Wun'],
    ['two',   'Too'],
    ['three', 'Tree'],
    ['four',  'Fower'],
    ['five',  'Fife'],
    ['eight', 'Ait'],
    ['nine',  'Niner'],
  ];
  for (const [spoken, expected] of numberVariants) {
    test(`NumberVariant_${spoken}_AcceptedFor_${expected}`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), true));
  }

  // ICAO numbers spoken as ICAO — exact match path
  const icaoExact = [
    ['wun',   'Wun'],
    ['too',   'Too'],
    ['tree',  'Tree'],
    ['fower', 'Fower'],
    ['fife',  'Fife'],
    ['ait',   'Ait'],
    ['niner', 'Niner'],
  ];
  for (const [spoken, expected] of icaoExact) {
    test(`ICAOExact_${spoken}_MatchesExpected`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), true));
  }

  // Additional spoken variants that speech recognizer commonly produces
  const speechVariants = [
    ['won',   'Wun',   'won as alternative for wun'],
    ['to',    'Too',   'to as alternative for too'],
    ['free',  'Tree',  'free as alternative for tree'],
    ['fore',  'Fower', 'fore as alternative for fower'],
    ['ate',   'Ait',   'ate as alternative for ait'],
  ];
  for (const [spoken, expected, label] of speechVariants) {
    test(`SpeechVariant_${label}`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), true));
  }

  // Prefix close-match (first 4 chars)
  test('PrefixMatch_FoxtroMatchesFoxtrot', () =>
    assert.equal(_alphaMatchWord('foxtro', 'Foxtrot'), true));
  test('PrefixMatch_UnifMatchesUniform', () =>
    assert.equal(_alphaMatchWord('unif', 'Uniform'), true));

  // Non-matches
  const nonMatches = [
    ['apple',    'Alfa',    'completely wrong letter word'],
    ['midnight', 'Mike',    'wrong word entirely'],
    ['victor',   'Foxtrot', 'wrong phonetic word'],
    ['zero',     'Niner',   'wrong number word'],
  ];
  for (const [spoken, expected, label] of nonMatches) {
    test(`NoMatch_${label}`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), false));
  }

  // Prefix rule: spoken starts with first 4 chars of expected (handles truncated recognition)
  test('PrefixRule_WhiskeysTruncated_MatchesWhiskey', () =>
    assert.equal(_alphaMatchWord('whiskeys', 'Whiskey'), true));

  // Prefix rule does not match unrelated words
  test('PrefixRule_UnrelatedWord_NoMatch', () =>
    assert.equal(_alphaMatchWord('hotdog', 'Whiskey'), false));

  // STT misrecognition variants
  test('STTVariant_QuebecAsGoback_Accepted', () =>
    assert.equal(_alphaMatchWord('goback', 'Quebec'), true));

  // Less-common map entries — all in the variant map but untested until now
  const mapEdgeCases = [
    ['when',  'Wun',   '"when" STT mishear of wun'],
    ['for',   'Fower', '"for" homophone of fower'],
    ['ex',    'X-ray', '"ex" prefix accepted for x-ray'],
    ['wife',  'Fife',  '"wife" rhyme accepted for fife'],
    ['minor', 'Niner', '"minor" rhyme accepted for niner'],
    ['diner', 'Niner', '"diner" rhyme accepted for niner'],
    ['tu',    'Too',   '"tu" accepted for too'],
    ['power', 'Fower', '"power" rhyme accepted for fower'],
  ];
  for (const [spoken, expected, label] of mapEdgeCases) {
    test(`MapEdge_${label}`, () =>
      assert.equal(_alphaMatchWord(spoken, expected), true));
  }
});

// ── gradeAlphaSequence ────────────────────────────────────────────────────────

describe('gradeAlphaSequence', () => {
  test('SingleCorrectWord_ReturnsTrue', () =>
    assert.deepEqual(gradeAlphaSequence('november', ['November']), [true]));

  test('SingleWrongWord_ReturnsFalse', () =>
    assert.deepEqual(gradeAlphaSequence('whiskey', ['November']), [false]));

  test('AllCorrectSequence_ReturnsAllTrue', () =>
    assert.deepEqual(
      gradeAlphaSequence('whiskey india november', ['Whiskey', 'India', 'November']),
      [true, true, true]
    ));

  test('MiddleWordWrong_CorrectBooleansAroundIt', () =>
    assert.deepEqual(
      gradeAlphaSequence('whiskey oscar november', ['Whiskey', 'India', 'November']),
      [true, false, true]
    ));

  test('AllWrong_ReturnsAllFalse', () =>
    assert.deepEqual(
      gradeAlphaSequence('alpha beta gamma', ['Whiskey', 'India', 'November']),
      [false, false, false]
    ));

  test('ExtraLeadingWords_AreIgnored', () =>
    assert.deepEqual(
      gradeAlphaSequence('um uh november', ['November']),
      [true]
    ));

  test('ICAONumberVariant_FourMatchesFower', () =>
    assert.deepEqual(
      gradeAlphaSequence('whiskey four november', ['Whiskey', 'Fower', 'November']),
      [true, true, true]
    ));

  test('DigitCharacter_ConvertedToWordBeforeMatching', () =>
    assert.deepEqual(
      gradeAlphaSequence('4', ['Fower']),
      [true]
    ));

  test('MixedDigitsAndLetters_GradedCorrectly', () =>
    assert.deepEqual(
      gradeAlphaSequence('november 4 golf', ['November', 'Fower', 'Golf']),
      [true, true, true]
    ));

  test('EmptyTranscript_ReturnsAllFalse', () =>
    assert.deepEqual(
      gradeAlphaSequence('', ['November', 'Golf']),
      [false, false]
    ));

  test('SingleChar_4_MatchesFower', () =>
    assert.deepEqual(gradeAlphaSequence('4', ['Fower']), [true]));

  test('SingleChar_9_MatchesNiner', () =>
    assert.deepEqual(gradeAlphaSequence('9', ['Niner']), [true]));

  test('GreedySkip_MatchesLaterOccurrence', () => {
    // "india" doesn't match "Whiskey", so grader skips to find whiskey later
    const result = gradeAlphaSequence('india whiskey', ['Whiskey']);
    assert.deepEqual(result, [true]);
  });

  test('WrongOrder_PartialCredit_GreedyBehavior', () => {
    // "india whiskey november": grader finds whiskey at index 1 for expected[0],
    // then india is already consumed so india=false, november=true
    const result = gradeAlphaSequence('india whiskey november', ['Whiskey', 'India', 'November']);
    assert.deepEqual(result, [true, false, true]);
  });

  // ── Colon-separated digits (STT artefact: "three six" → "3:6") ──────────────

  test('ColonSeparated_ThreeSix_GradesCorrectly', () =>
    assert.deepEqual(
      gradeAlphaSequence('victor 3:6', ['Victor', 'Tree', 'Six']),
      [true, true, true]
    ));

  // ── Compound number handling ──────────────────────────────────────────────────

  test('CompoundNumber_SixtyEight_GradesSixAndEight', () =>
    assert.deepEqual(
      gradeAlphaSequence('golf sixty-eight', ['Golf', 'Six', 'Eight']),
      [true, true, true]
    ));

  test('CompoundNumber_SpaceSeparated_SixtyEight', () =>
    assert.deepEqual(
      gradeAlphaSequence('golf sixty eight', ['Golf', 'Six', 'Eight']),
      [true, true, true]
    ));

  test('CompoundNumber_TwentyThree_GradesTwoAndThree', () =>
    assert.deepEqual(
      gradeAlphaSequence('twenty-three', ['Too', 'Tree']),
      [true, true]
    ));

  test('CompoundNumber_InSequence_Golf68November', () =>
    assert.deepEqual(
      gradeAlphaSequence('golf sixty-eight november', ['Golf', 'Six', 'Eight', 'November']),
      [true, true, true, true]
    ));

  // ── Bigram matching (STT splits a single word across two tokens) ──────────────

  test('BigramMatch_Quebec_GoBack_Accepted', () =>
    assert.deepEqual(
      gradeAlphaSequence('go back', ['Quebec']),
      [true]
    ));

  test('BigramMatch_Quebec_InSequence', () =>
    assert.deepEqual(
      gradeAlphaSequence('november go back golf', ['November', 'Quebec', 'Golf']),
      [true, true, true]
    ));

  // ── Hyphenated phonetic words in transcript ───────────────────────────────────

  test('Hyphenated_XRay_MatchesXRayExpected', () =>
    assert.deepEqual(
      gradeAlphaSequence('golf x-ray mike', ['Golf', 'X-ray', 'Mike']),
      [true, true, true]
    ));

  // ── ICAO words (niner/wun/etc.) spoken in full-sequence context ───────────────

  test('ICAOWord_Niner_MatchesInSequence', () =>
    assert.deepEqual(
      gradeAlphaSequence('golf niner mike', ['Golf', 'Niner', 'Mike']),
      [true, true, true]
    ));

  test('ICAOWord_Wun_MatchesInSequence', () =>
    assert.deepEqual(
      gradeAlphaSequence('alpha wun bravo', ['Alfa', 'Wun', 'Bravo']),
      [true, true, true]
    ));

  test('ICAOWord_Tree_MatchesInSequence', () =>
    assert.deepEqual(
      gradeAlphaSequence('november tree golf', ['November', 'Tree', 'Golf']),
      [true, true, true]
    ));

  // ── Five-character sequence ───────────────────────────────────────────────────

  test('FiveCharSequence_AllCorrect', () =>
    assert.deepEqual(
      gradeAlphaSequence('alfa bravo charlie delta echo', ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo']),
      [true, true, true, true, true]
    ));

  test('FiveCharSequence_OneWrong', () =>
    assert.deepEqual(
      gradeAlphaSequence('alfa oscar charlie delta echo', ['Alfa', 'Bravo', 'Charlie', 'Delta', 'Echo']),
      [true, false, true, true, true]
    ));

  // ── Case insensitivity ────────────────────────────────────────────────────────

  test('UpperCaseTranscript_StillMatches', () =>
    assert.deepEqual(
      gradeAlphaSequence('NOVEMBER GOLF', ['November', 'Golf']),
      [true, true]
    ));
});
