// Run from repo root: node generate-airports.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const NOTES = {
  KCLT: 'Class B — not for pattern work',
  KRDU: 'Class C',
  KGSO: 'Class C',
  KAVL: 'Mountain — DA matters',
  KCHS: 'Class C',
  KATL: 'Class B',
  KPDK: 'Class D — busy GA field',
  KSAV: 'Class C',
  KOSH: 'Home of AirVenture',
  KSNA: 'Class C',
  KVNY: 'Busy Class D',
  KSAN: 'Class B',
  KLAX: 'Class B',
  KSFO: 'Class B',
  KOAK: 'Class C',
  KFAT: 'Class C',
  KBUR: 'Class C',
  KLAS: 'Class B',
  KPHX: 'Class B',
  KSDL: 'Busy Class D',
  KDVT: 'Busiest GA field in US',
  KTUS: 'Class C',
  KABQ: 'High DA — density altitude matters',
  KDEN: 'Class B',
  KAPA: 'Busy GA',
  KICT: 'Class C',
  KOKC: 'Class C',
  KTUL: 'Class C',
  KDAL: 'Class D',
  KDFW: 'Class B',
  KHOU: 'Class C',
  KIAH: 'Class B',
  KAUS: 'Class C',
  KSAT: 'Class C',
  KMSY: 'Class C',
  KBHM: 'Class C',
  KHSV: 'Class C',
  KMEM: 'Class B',
  KJAN: 'Class C',
  KLIT: 'Class C',
  KSTL: 'Class B',
  KMKC: 'Class D',
  KMCI: 'Class B',
  KORD: 'Class B',
  KMDW: 'Class B',
  KIND: 'Class C',
  KCMH: 'Class C',
  KCVG: 'Class C',
  KCLE: 'Class B',
  KPIT: 'Class B',
  KBUF: 'Class C',
  KROC: 'Class C',
  KSYR: 'Class C',
  KALB: 'Class C',
  KPWM: 'Class C',
  KBTV: 'Class C',
  KBOS: 'Class B',
  KPVD: 'Class C',
  KBDL: 'Class B',
  KJFK: 'Class B',
  KLGA: 'Class B',
  KEWR: 'Class B',
  KTEB: 'Class D — busy bizjet field',
  KPHL: 'Class B',
  KBWI: 'Class B',
  KDCA: 'Class B — SFRA',
  KIAD: 'Class B',
  KORF: 'Class C',
  KRIC: 'Class C',
  KROA: 'Class C',
  KLEX: 'Class C',
  KSDF: 'Class C',
  KPNS: 'Class C',
  KTLH: 'Class C',
  KJAX: 'Class C',
  KMCO: 'Class B',
  KSFB: 'Class C',
  KTPA: 'Class B',
  KPIE: 'Class C',
  KSRQ: 'Class C',
  KRSW: 'Class C',
  KFLL: 'Class B',
  KMIA: 'Class B',
  KPBI: 'Class C',
  KGNV: 'Class C',
  KSEA: 'Class B',
  KBFI: 'Class D',
  KPAE: 'Class C',
  KPDX: 'Class C',
  KEUG: 'Class C',
  KMFR: 'Class C',
  KBOI: 'Class C',
  KBTM: 'High elevation',
  KBIL: 'Class C',
  KGTF: 'Class C',
  KMSO: 'Class C',
  KJAC: 'High DA, mountain',
  KSLC: 'Class B',
  KPRC: 'High DA',
  KSGF: 'Class C',
  KPIA: 'Class C',
  KMLI: 'Class C',
  KRFD: 'Class C',
  KMSN: 'Class C',
  KGRB: 'Class C',
  KATW: 'Class C',
  KRST: 'Class C',
  KMSP: 'Class B',
  KDLH: 'Class C',
  KFAR: 'Class C',
  KBIS: 'Class C',
  KRAP: 'Class C',
  KOMA: 'Class C',
  KLNK: 'Class C',
  PHNL: 'Class B',
  PANC: 'Class C',
  PAMR: 'Busy GA',
  PAFA: 'Class C',
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

console.log('Fetching OurAirports data...');
https.get('https://davidmegginson.github.io/ourairports-data/airports.csv', (res) => {
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const data = Buffer.concat(chunks).toString('utf8');
    const lines = data.split('\n');
    const headers = parseCSVLine(lines[0]);

    const idx = {
      ident:       headers.indexOf('ident'),
      type:        headers.indexOf('type'),
      name:        headers.indexOf('name'),
      elev:        headers.indexOf('elevation_ft'),
      country:     headers.indexOf('iso_country'),
      municipality: headers.indexOf('municipality'),
    };

    const VALID_TYPES = new Set(['small_airport', 'medium_airport', 'large_airport']);
    const airports = {};
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const f = parseCSVLine(line);

      if (f[idx.country] !== 'US') continue;
      if (!VALID_TYPES.has(f[idx.type])) continue;

      const ident = f[idx.ident];
      if (ident.length !== 4) continue;
      // Only proper ICAO codes: K (continental US), PA (Alaska), PH (Hawaii)
      if (!ident.startsWith('K') && !ident.startsWith('PA') && !ident.startsWith('PH')) continue;

      const elevStr = f[idx.elev];
      if (!elevStr) { skipped++; continue; }

      const name = f[idx.name];
      const elev = parseInt(elevStr) || 0;
      const municipality = f[idx.municipality] || '';
      const notes = NOTES[ident] || '';

      airports[ident] = [name, elev, notes, municipality];
    }

    const date = new Date().toISOString().slice(0, 10);
    const count = Object.keys(airports).length;

    const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    let out = `// Generated from OurAirports — https://ourairports.com/data/\n`;
    out    += `// Filter: US public-use airports (small/medium/large), 4-char ICAO ident, elevation known\n`;
    out    += `// Updated: ${date} · ${count} airports\n`;
    out    += `// Format: [name, elevation_ft_msl, notes, municipality]\n\n`;
    out    += `const AIRPORTS = {\n`;

    for (const [icao, d] of Object.entries(airports).sort()) {
      const [name, elev, notes, muni] = d;
      out += `  ${icao}: ['${esc(name)}', ${elev}, '${esc(notes)}', '${esc(muni)}'],\n`;
    }

    out += `};\n`;

    const outPath = path.join(__dirname, 'js', 'airports.js');
    fs.writeFileSync(outPath, out, 'utf8');
    console.log(`Done — ${count} airports written to js/airports.js (${skipped} skipped: no elevation)`);
  });
}).on('error', err => {
  console.error('Fetch failed:', err.message);
  process.exit(1);
});
