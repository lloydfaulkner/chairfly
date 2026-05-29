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
  };
  if ((map[e] || []).includes(s) || (map[s] || []).includes(e)) return true;
  if (e.length >= 4 && s.startsWith(e.slice(0, 4))) return true;
  return false;
}

// Grades a spoken transcript against an ordered array of expected NATO phonetic words.
// Returns a boolean array — one entry per expected word.
// Speech recognizer sometimes returns bare digit characters; those are converted to
// English words before matching so "4" is treated the same as "four".
function gradeAlphaSequence(transcript, expected) {
  const digitToWord = {
    '0':'zero','1':'one','2':'two','3':'three','4':'four',
    '5':'five','6':'six','7':'seven','8':'eight','9':'nine',
  };
  const tokens = transcript.toLowerCase().trim().split(/\s+/).filter(Boolean)
    .map(t => digitToWord[t] || t.replace(/[^a-z]/g, '')).filter(Boolean);
  let remaining = [...tokens];
  return expected.map(exp => {
    const idx = remaining.findIndex(t => _alphaMatchWord(t, exp));
    if (idx >= 0) { remaining.splice(0, idx + 1); return true; }
    return false;
  });
}

if (typeof module !== 'undefined') module.exports = { _alphaMatchWord, gradeAlphaSequence };
