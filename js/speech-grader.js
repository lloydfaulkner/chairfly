// Normalize spoken transcript text for speech grading.
// Converts word-form numbers to digits and collapses compound number phrases.
function normalizeSpoken(s) {
  let t = s.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  t = t.replace(/\b(niner|nine|eight|seven|six|five|four|three|two|one|zero)\b/g, m =>
    ({niner:'9',nine:'9',eight:'8',seven:'7',six:'6',five:'5',
      four:'4',three:'3',two:'2',one:'1',zero:'0'}[m]));
  t = t.replace(/\b(nineteen|eighteen|seventeen|sixteen|fifteen|fourteen|thirteen|twelve|eleven)\b/g, m =>
    ({nineteen:'19',eighteen:'18',seventeen:'17',sixteen:'16',fifteen:'15',
      fourteen:'14',thirteen:'13',twelve:'12',eleven:'11'}[m]));
  t = t.replace(/\b(ninety|eighty|seventy|sixty|fifty|forty|thirty|twenty|ten)\b/g, m =>
    ({ninety:'90',eighty:'80',seventy:'70',sixty:'60',fifty:'50',
      forty:'40',thirty:'30',twenty:'20',ten:'10'}[m]));
  // combine tens+ones: "30 5" → "35"
  t = t.replace(/\b(10|20|30|40|50|60|70|80|90) ([1-9])\b/g, (m,a,b) => String(parseInt(a)+parseInt(b)));
  // "N thousand M hundred" → N*1000+M*100 ("three thousand five hundred" → 3500)
  t = t.replace(/\b(\d+) thousand (\d+) hundred\b/g, (m,a,b) => String(parseInt(a)*1000+parseInt(b)*100));
  t = t.replace(/\b(\d+) thousand\b/g, (m,n) => String(parseInt(n)*1000));
  // "N hundred" → N*100 ("thirty-five hundred" / "eighteen hundred" → 3500 / 1800)
  t = t.replace(/\b(\d+) hundred\b/g, (m,n) => String(parseInt(n)*100));
  return t.trim();
}

// Score a spoken transcript against the expected word chips for a radio call.
// words: array of chip strings (the expected call, split into chips)
// optionalWords: array of chip strings that are optional (excluded from denominator)
// Returns { score: 0–1, words: [{word, status}] }
// status values: 'match' | 'close' | 'miss' | 'optional'
function scoreSpeechCall(spoken, ideal, words, optionalWords = []) {
  const normalize = normalizeSpoken;

  // Per AIM 4-2-4: manufacturer name and model name are interchangeable as callsign prefix
  const CALLSIGN_ALIASES = { cessna: 'skyhawk', skyhawk: 'cessna' };

  const spokenNorm = normalize(spoken);
  const spokenWords = spokenNorm.split(/\s+/);
  const spokenDigits = spokenNorm.replace(/\D/g, '');

  const optionalSet = new Set(optionalWords.flatMap(w => normalize(w).split(/\s+/)));
  const keyWords = words.flatMap(w => normalize(w).split(/\s+/));

  const wordResults = keyWords.map(kw => {
    if (spokenWords.includes(kw)) return { word: kw, status: 'match' };
    // multi-digit keyWord: match if digit sequence appears in spoken digit stream
    if (/^\d{2,}$/.test(kw) && spokenDigits.includes(kw)) return { word: kw, status: 'match' };
    // single-digit keyWord: match if it appears inside a spoken multi-digit token
    if (/^\d$/.test(kw) && spokenWords.some(sw => /^\d{2,}$/.test(sw) && sw.includes(kw)))
      return { word: kw, status: 'match' };
    if (CALLSIGN_ALIASES[kw] && spokenWords.includes(CALLSIGN_ALIASES[kw]))
      return { word: kw, status: 'match' };
    if (optionalSet.has(kw)) return { word: kw, status: 'optional' };
    const close = spokenWords.some(sw =>
      sw.length > 2 && (sw.startsWith(kw.slice(0,3)) || kw.startsWith(sw.slice(0,3)))
    );
    return { word: kw, status: close ? 'close' : 'miss' };
  });

  const required = wordResults.filter(w => w.status !== 'optional');
  const matched = required.filter(w => w.status === 'match').length;
  const close = required.filter(w => w.status === 'close').length;
  const score = required.length > 0 ? (matched + close * 0.5) / required.length : 1;

  return { score, words: wordResults };
}

if (typeof module !== 'undefined') module.exports = { normalizeSpoken, scoreSpeechCall };
