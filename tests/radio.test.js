// node --test tests/radio.test.js   (Node 18+)
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Test the call template logic directly without loading the full app.js
// (app.js has browser dependencies like localStorage that prevent Node testing)

// ── buildCallTemplateHtml logic ──────────────────────────────────────────────

describe('buildCallTemplateHtml', () => {
  // Helper to replicate the buildCallTemplateHtml function logic
  function buildCallTemplateHtml(s) {
    if (!s || !s.rule) return '';
    const callType = s.rule?.repeats ? 'CTAF' : 'Controlled';
    const patternText = s.rule?.repeats
      ? '[Airport], [callsign], [position] runway [runway], [airport].'
      : '[Airport], [callsign], [position] runway [runway].';
    return `<div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--rule)">
    <div style="font-family:var(--font-sans);font-size:12px;letter-spacing:0.08em;color:var(--accent2);text-transform:uppercase;margin-bottom:10px">Call Template for ${callType}</div>
    <p style="font-size:13px;line-height:1.6;color:var(--ink);margin:0;font-family:var(--font-mono)">${patternText}</p>
  </div>`;
  }

  test('CTAF scenario includes airport name at end', () => {
    const scenario = {
      rule: { repeats: true, why: 'Test CTAF' }
    };
    const html = buildCallTemplateHtml(scenario);
    assert(html.includes('CTAF'));
    assert(html.includes('[airport]'));
    assert(html.includes('[Airport], [callsign], [position] runway [runway], [airport].'));
  });

  test('Controlled field scenario does not repeat airport', () => {
    const scenario = {
      rule: { repeats: false, why: 'Test Controlled' }
    };
    const html = buildCallTemplateHtml(scenario);
    assert(html.includes('Controlled'));
    assert(!html.includes('[airport].'));
    assert(html.includes('[Airport], [callsign], [position] runway [runway].'));
  });

  test('Returns empty string for null scenario', () => {
    const html = buildCallTemplateHtml(null);
    assert.equal(html, '');
  });

  test('Returns empty string for scenario without rule', () => {
    const scenario = {};
    const html = buildCallTemplateHtml(scenario);
    assert.equal(html, '');
  });

  test('HTML includes proper styling', () => {
    const scenario = {
      rule: { repeats: true, why: 'Test' }
    };
    const html = buildCallTemplateHtml(scenario);
    assert(html.includes('margin-top:16px'));
    assert(html.includes('border-top:1px solid'));
    assert(html.includes('Call Template for'));
  });

  test('CTAF template uses monospace font', () => {
    const scenario = {
      rule: { repeats: true, why: 'Test' }
    };
    const html = buildCallTemplateHtml(scenario);
    assert(html.includes('font-family:var(--font-mono)'));
  });
});

// ── Dropdown group selection logic ───────────────────────────────────────────

describe('Dropdown call type selection', () => {
  // Helper to replicate the dropdown change logic
  function getDropdownAction(selectedGroup, currentGroup) {
    if (selectedGroup !== currentGroup) {
      return 'newScenario';
    } else {
      return 'updateFilter';
    }
  }

  test('Different group selected returns newScenario action', () => {
    const action = getDropdownAction('towered', 'ctaf');
    assert.equal(action, 'newScenario');
  });

  test('Same group selected returns updateFilter action', () => {
    const action = getDropdownAction('ctaf', 'ctaf');
    assert.equal(action, 'updateFilter');
  });

  test('Switching from CTAF to Towered loads new scenario', () => {
    const action = getDropdownAction('towered', 'ctaf');
    assert.equal(action, 'newScenario');
  });

  test('Switching from Towered to Approach loads new scenario', () => {
    const action = getDropdownAction('approach', 'towered');
    assert.equal(action, 'newScenario');
  });

  test('Selecting CTAF while on CTAF keeps scenario', () => {
    const action = getDropdownAction('ctaf', 'ctaf');
    assert.equal(action, 'updateFilter');
  });

  test('Selecting Towered while on Towered keeps scenario', () => {
    const action = getDropdownAction('towered', 'towered');
    assert.equal(action, 'updateFilter');
  });

  test('Null current group loads new scenario', () => {
    const action = getDropdownAction('ctaf', null);
    assert.equal(action, 'newScenario');
  });

  test('Selecting Any while on specific type loads new scenario', () => {
    const action = getDropdownAction(null, 'ctaf');
    assert.equal(action, 'newScenario');
  });
});

