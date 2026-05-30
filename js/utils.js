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

// Returns the spoken airport name used in CTAF calls ("Rock Hill", "Raleigh-Durham", etc.)
// Prefers the municipality field from OurAirports data; falls back to parsing the full name.
function airportCallName(name, municipality = '') {
  if (municipality) return municipality;
  let n = name.split(' / ')[0].trim();
  n = n.replace(/\s+(Int['']?l|International|Regional|Municipal|Executive|Memorial|Airport|Field|ARB|NAS|AFB|State)$/i, '').trim();
  return n || name;
}

// Returns true when an untimed V-speeds drill result suggests the user is ready for the timer.
// Requires: timer off, 3+ non-timeout answers, 75%+ answered under 4s, 60%+ overall correct.
function shouldNudgeVspeedTimer(history, score, timerEnabled) {
  if (timerEnabled) return false;
  const answered = history.filter(h => !h.timedOut && h.elapsed !== undefined);
  if (answered.length < 3) return false;
  if (answered.filter(h => h.elapsed < 4).length / answered.length < 0.75) return false;
  if (score.total === 0 || score.correct / score.total < 0.6) return false;
  return true;
}

// Searches an airports object ({ ICAO: [name, elev, notes, municipality, state] }) by query.
// Matches ICAO prefix, airport name, municipality, or exact state abbreviation.
// Returns up to 8 results sorted so ICAO prefix matches come first.
function searchAirportData(query, airports) {
  const q = query.trim();
  if (q.length < 2) return [];
  const qUp = q.toUpperCase();
  const results = [];
  for (const [icao, data] of Object.entries(airports)) {
    const [name, elev, notes, municipality = '', state = ''] = data;
    const icaoMatch = icao.startsWith(qUp);
    const nameMatch = name.toUpperCase().includes(qUp) || municipality.toUpperCase().includes(qUp) || state.toUpperCase() === qUp;
    if (icaoMatch || nameMatch) results.push({ icao, name, elev, notes, municipality, state, icaoMatch });
  }
  results.sort((a, b) => b.icaoMatch - a.icaoMatch);
  return results.slice(0, 8);
}

// Returns a random ICAO key from an airports object.
function pickRandomAirport(airports) {
  const keys = Object.keys(airports);
  return keys[Math.floor(Math.random() * keys.length)];
}

if (typeof module !== 'undefined') module.exports = { calcTPA, _firstSentence, radioCallMatches, airportCallName, shouldNudgeVspeedTimer, searchAirportData, pickRandomAirport };
