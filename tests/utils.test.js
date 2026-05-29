// node --test tests/utils.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { calcTPA, _firstSentence, radioCallMatches, airportCallName } = require('../js/utils.js');

// ── calcTPA ──────────────────────────────────────────────────────────────────

describe('calcTPA', () => {
  const airportCases = [
    ['KUZA',  666,  1700],
    ['KJQF',  705,  1700],
    ['KCLT',  748,  1700],
    ['KSPA',  801,  1800],
    ['KGSO',  925,  1900],
    ['KSVH',  968,  2000],
    ['KRDU',  435,  1400],
    ['KGMU', 1048,  2000],
  ];
  for (const [icao, elev, expected] of airportCases) {
    test(`${icao}Elev${elev}_Returns${expected}`, () =>
      assert.equal(calcTPA(elev), expected));
  }

  test('SeaLevelElevation_Returns1000', () =>
    assert.equal(calcTPA(0), 1000));

  test('ExactHundredMultipleElev_ReturnsUnchanged', () =>
    assert.equal(calcTPA(500), 1500));

  test('MidpointElev550_RoundsUpTo1600', () =>
    // 550 + 1000 = 1550 → round(15.5) = 16 → 1600
    assert.equal(calcTPA(550), 1600));

  test('CustomAgl800WithKuzaElev_Returns1500', () =>
    // 666 + 800 = 1466 → 1500
    assert.equal(calcTPA(666, 800), 1500));
});

// ── radioCallMatches ─────────────────────────────────────────────────────────

describe('radioCallMatches', () => {
  const step = { words: ['Rock Hill traffic', 'Cessna Four Five Two One Golf', 'Rock Hill'] };

  test('CorrectSequence_ReturnsTrue', () =>
    assert.equal(radioCallMatches(
      ['Rock Hill traffic', 'Cessna Four Five Two One Golf', 'Rock Hill'], step), true));

  test('WrongChipOrder_ReturnsFalse', () =>
    assert.equal(radioCallMatches(
      ['Cessna Four Five Two One Golf', 'Rock Hill traffic', 'Rock Hill'], step), false));

  test('ExtraChipAppended_ReturnsFalse', () =>
    assert.equal(radioCallMatches(
      ['Rock Hill traffic', 'Cessna Four Five Two One Golf', 'Rock Hill', 'Rock Hill'], step), false));

  test('MissingLastChip_ReturnsFalse', () =>
    assert.equal(radioCallMatches(
      ['Rock Hill traffic', 'Cessna Four Five Two One Golf'], step), false));

  test('EmptyBuiltCall_ReturnsFalse', () =>
    assert.equal(radioCallMatches([], step), false));

  const stepWithVariants = {
    words: ['Caldwell traffic', 'Cessna Four Five Two One Golf', 'Caldwell'],
    acceptedVariants: [
      ['Caldwell traffic', 'Skyhawk Four Five Two One Golf', 'Caldwell'],
    ],
  };

  test('PrimaryWords_ReturnsTrue', () =>
    assert.equal(radioCallMatches(
      ['Caldwell traffic', 'Cessna Four Five Two One Golf', 'Caldwell'], stepWithVariants), true));

  test('SkyhawkAcceptedVariant_ReturnsTrue', () =>
    assert.equal(radioCallMatches(
      ['Caldwell traffic', 'Skyhawk Four Five Two One Golf', 'Caldwell'], stepWithVariants), true));

  test('UnknownCallsign_ReturnsFalse', () =>
    assert.equal(radioCallMatches(
      ['Caldwell traffic', 'Cherokee Four Five Two One Golf', 'Caldwell'], stepWithVariants), false));

  test('NoAcceptedVariantsProperty_StillMatchesPrimaryWords', () => {
    const simple = { words: ['Alpha', 'Bravo'] };
    assert.equal(radioCallMatches(['Alpha', 'Bravo'], simple), true);
    assert.equal(radioCallMatches(['Bravo', 'Alpha'], simple), false);
  });
});

// ── _firstSentence ───────────────────────────────────────────────────────────

describe('_firstSentence', () => {
  test('SingleSentenceWithPeriod_ReturnsFullSentence', () =>
    assert.equal(_firstSentence('Carb heat prevents ice buildup.'), 'Carb heat prevents ice buildup.'));

  test('TwoSentences_ReturnsFirstOnly', () =>
    assert.equal(_firstSentence('First sentence. Second sentence.'), 'First sentence.'));

  test('QuestionMarkTerminator_ReturnsUpToQuestionMark', () =>
    assert.equal(_firstSentence('Why? Because reasons.'), 'Why?'));

  test('ExclamationMarkTerminator_ReturnsUpToExclamation', () =>
    assert.equal(_firstSentence('Critical step! Do not skip.'), 'Critical step!'));

  test('NoTerminator_ReturnsFullString', () =>
    assert.equal(_firstSentence('No terminator here'), 'No terminator here'));

  test('InternalWhitespace_IsCollapsed', () =>
    assert.equal(_firstSentence('Too  many   spaces.'), 'Too many spaces.'));

  test('LeadingTrailingWhitespace_IsTrimmed', () =>
    assert.equal(_firstSentence('  Leading and trailing.  '), 'Leading and trailing.'));

  test('NewlineCharacters_AreCollapsedToSpaces', () =>
    assert.equal(_firstSentence('Line one.\nLine two.'), 'Line one.'));
});

// ── airportCallName ──────────────────────────────────────────────────────────

describe('airportCallName', () => {
  test('MunicipalityPresent_TakesPriorityOverNameParsing', () =>
    assert.equal(airportCallName('Rock Hill - York County Airport', 'Rock Hill'), 'Rock Hill'));

  test('MunicipalityPresent_UsedDirectlyWithoutStripping', () =>
    assert.equal(airportCallName('Charlotte Douglas International Airport', 'Charlotte'), 'Charlotte'));

  test('EmptyMunicipality_FallsBackToNameParsing', () =>
    assert.equal(airportCallName('Rock Hill - York County Airport', ''), 'Rock Hill - York County'));

  test('SlashSeparator_UsesFirstPartOnly', () =>
    assert.equal(airportCallName('Raleigh-Durham / International Airport', ''), 'Raleigh-Durham'));

  test('SuffixAirport_IsStripped', () =>
    assert.equal(airportCallName('Gastonia Municipal Airport', ''), 'Gastonia Municipal'));

  test('SuffixInternational_IsStripped', () =>
    assert.equal(airportCallName('Charlotte Douglas International', ''), 'Charlotte Douglas'));

  test('SuffixIntl_IsStripped', () =>
    assert.equal(airportCallName('Miami Intl', ''), 'Miami'));

  test('SuffixRegional_IsStripped', () =>
    assert.equal(airportCallName('Piedmont Triad Regional', ''), 'Piedmont Triad'));

  test('SuffixField_IsStripped', () =>
    assert.equal(airportCallName('Hawthorne Field', ''), 'Hawthorne'));

  test('NoSuffixAndNoMunicipality_ReturnsNameAsIs', () =>
    assert.equal(airportCallName('Caldwell', ''), 'Caldwell'));

  test('NoArguments_DefaultsToEmptyMunicipality', () =>
    assert.equal(airportCallName('Rock Hill Airport'), 'Rock Hill'));
});
