// Resolve normalizeSpoken from speech-grader.js — browser global or Node require.
// This keeps number-normalization logic in one place.
const _normalize = (function() {
  if (typeof normalizeSpoken === 'function') return normalizeSpoken;
  if (typeof require !== 'undefined') return require('./speech-grader.js').normalizeSpoken;
  return s => s;
})();

// Matches a single spoken word against an expected NATO phonetic word.
// Handles ICAO spelling variants (Alfa/Alpha, Juliett/Juliet, X-ray) and
// ICAO number pronunciations (Fower/Four, Ait/Eight, Niner/Nine, etc.).
function _alphaMatchWord(spoken, expected) {
  const s = spoken.toLowerCase().replace(/[^a-z]/g, '');
  const e = expected.toLowerCase().replace(/[^a-z]/g, '');
  if (s === e) return true;
  const map = {
    'alfa':['alpha'], 'juliett':['juliet'], 'xray':['ray','ex'],
    'wun':['one','won','when'], 'too':['two','to','tu'],
    'tree':['three','free'], 'fower':['four','for','fore','power'],
    'fife':['five','wife','life'], 'ait':['eight','ate'],
    'niner':['nine','minor','diner'],
    'quebec':['goback','gobak','kebek'],
  };
  if ((map[e] || []).includes(s) || (map[s] || []).includes(e)) return true;
  if (e.length >= 4 && s.startsWith(e.slice(0, 4))) return true;
  return false;
}

// Grades a spoken transcript against an ordered array of expected NATO phonetic words.
// Returns a boolean array — one entry per expected word.
// Handles compound numbers ("sixty-eight" → six + eight) and STT word splits
// ("go back" → "goback" bigram tried against expected).
function gradeAlphaSequence(transcript, expected) {
  const digitToWord = {
    '0':'zero','1':'one','2':'two','3':'three','4':'four',
    '5':'five','6':'six','7':'seven','8':'eight','9':'nine',
  };

  // Replace hyphens/colons with spaces before normalizing so "sixty-eight" and "3:6"
  // both collapse correctly via normalizeSpoken (shared with speech-grader.js).
  const t = _normalize(transcript.replace(/[-:]/g, ' '));

  // Tokenize; expand multi-digit digit-strings into individual digit words.
  const tokens = t.trim().split(/\s+/).filter(Boolean)
    .flatMap(tok => {
      if (/^\d+$/.test(tok)) return tok.split('').map(d => digitToWord[d] || d);
      return [tok.replace(/[^a-z]/g, '')];
    })
    .filter(Boolean);

  let remaining = [...tokens];
  return expected.map(exp => {
    const idx = remaining.findIndex(tok => _alphaMatchWord(tok, exp));
    if (idx >= 0) { remaining.splice(0, idx + 1); return true; }
    // Bigram fallback: try adjacent token pairs (e.g. "go back" → "goback" for "Quebec")
    for (let i = 0; i < remaining.length - 1; i++) {
      if (_alphaMatchWord(remaining[i] + remaining[i + 1], exp)) {
        remaining.splice(0, i + 2);
        return true;
      }
    }
    return false;
  });
}

if (typeof module !== 'undefined') module.exports = { _alphaMatchWord, gradeAlphaSequence };
