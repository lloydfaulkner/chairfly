// Pattern altitude: field elevation + AGL, rounded to nearest 100 ft MSL.
function calcTPA(elev, agl = 1000) {
  return Math.round((elev + agl) / 100) * 100;
}

// Returns the first sentence from a string (terminated by . ? or !).
// Falls back to the full cleaned string if no terminator is found.
function _firstSentence(s) {
  const clean = s.replace(/\s+/g, ' ').trim();
  const m = clean.match(/^.+?[.?!](?:\s|$)/);
  return m ? m[0].trim() : clean;
}

// Returns true if builtCall exactly matches step.words or any acceptedVariant.
function radioCallMatches(builtCall, step) {
  const allAccepted = [step.words, ...(step.acceptedVariants || [])];
  return allAccepted.some(v => builtCall.join(',') === v.join(','));
}

if (typeof module !== 'undefined') module.exports = { calcTPA, _firstSentence, radioCallMatches };
