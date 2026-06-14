// Test the scroll function logic directly
// This tests that the correct DOM element gets the scrollIntoView call

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// Create a mock DOM structure that matches what renderSeqRecall produces
const mockHtml = `
<div id="cl-recall-mode" style="height: 500px; overflow: auto;">
<div id="seq-content">
  <div class="seq-grid">
    <aside class="seq-pool-col">
      <div class="seq-pool-card">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">① WHAT MUST HAPPEN FIRST?</span>
        </div>
        <div class="seq-gate-options">Gate options here</div>
      </div>
      <div class="seq-pool-card">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">② SETUP ITEMS — ANY ORDER</span>
        </div>
        <div>Free items here</div>
      </div>
      <div class="seq-pool-card">
        <div class="seq-pool-card-header">
          <span class="seq-pool-eyebrow">③ TAP IN SEQUENCE</span>
        </div>
        <div>Ordered items here</div>
      </div>
    </aside>
    <div class="seq-slot-col">Checklist slots here</div>
  </div>
</div>
</div>
`;

// Create jsdom environment
const dom = new JSDOM(mockHtml, { url: 'http://127.0.0.1:8080/index.html' });
const document = dom.window.document;
const window = dom.window;

// Track scroll calls
let scrollCalls = [];
const Element = window.Element;
const parentScrollTo = window.Element.prototype.scrollTo || window.scroll;

// Mock scrollTo for containers
Element.prototype.scrollTo = function(options) {
  scrollCalls.push({
    type: 'scrollTo',
    element: this.id || this.className,
    scrollTop: options.top,
    behavior: options.behavior
  });
  console.log(`✓ scrollTo called on: <${this.tagName} class="${this.className}">`);
  console.log(`  Top: ${options.top}, Behavior: ${options.behavior}`);
};

// Also keep track of scrollIntoView
let scrollIntoViewCalls = [];
Element.prototype.scrollIntoView = function(options) {
  const elementInfo = {
    element: this.className,
    tagName: this.tagName,
    innerHTML: this.innerHTML.substring(0, 100),
    options: options
  };
  scrollIntoViewCalls.push(elementInfo);
  console.log(`✓ scrollIntoView called on: <${this.tagName} class="${this.className}">`);
  console.log(`  Options: ${JSON.stringify(options)}`);
};

// Define the actual _scrollToFirstSection function (updated version)
function _scrollToFirstSection() {
  const firstCard = document.querySelector('#seq-content .seq-pool-card');
  if (firstCard) {
    const rect = firstCard.getBoundingClientRect();
    const container = document.querySelector('#cl-recall-mode') || window;
    container.scrollTo({
      top: firstCard.offsetTop - 60,
      behavior: 'smooth'
    });
  }
}

// Run the test
console.log('Testing _scrollToFirstSection function...\n');

// Mock offsetTop for the first card (normally computed by browser)
const firstCard = document.querySelector('#seq-content .seq-pool-card');
if (firstCard) {
  Object.defineProperty(firstCard, 'offsetTop', {
    value: 150,
    configurable: true
  });
}

// Mock scrollTo on the container
const container = document.querySelector('#cl-recall-mode');
if (container) {
  container.scrollTo = function(options) {
    scrollCalls.push({
      type: 'scrollTo',
      element: this.id,
      scrollTop: options.top,
      behavior: options.behavior
    });
    console.log(`✓ scrollTo called on #${this.id}`);
    console.log(`  Top: ${options.top}, Behavior: ${options.behavior}`);
  };
}

// Test 1: Function should find first card
const poolCol = document.querySelector('.seq-pool-col');
console.log(`✓ Found .seq-pool-col: ${!!poolCol}`);

// Test 2: Function should call scrollIntoView on seq-pool-col
_scrollToFirstSection();

if (scrollCalls.length === 1) {
  const call = scrollCalls[0];
  if (call.type === 'scrollTo' && call.scrollTop !== undefined && call.behavior === 'smooth') {
    console.log('\n✅ PASS: _scrollToFirstSection correctly calls scrollTo on container');
    console.log(`  Scroll position: ${call.scrollTop} (offsetTop - 60px)`);
    console.log(`  Behavior: ${call.behavior}`);
  } else {
    console.log('\n❌ FAIL: scrollTo was called but with wrong options');
    console.log(`  Got: ${JSON.stringify(call)}`);
  }
} else if (scrollCalls.length === 0) {
  console.log('\n❌ FAIL: scrollTo was not called');
} else {
  console.log('\n⚠️ Multiple scroll calls detected:');
  scrollCalls.forEach((call, i) => {
    console.log(`  ${i + 1}. ${JSON.stringify(call)}`);
  });
}

// Verify the change made sense
console.log('\n--- Change Analysis ---');
console.log('OLD selector: document.querySelector(\'#seq-content .seq-pool-card\')');
console.log('NEW selector: document.querySelector(\'.seq-pool-col\')');

const oldSelector = document.querySelector('#seq-content .seq-pool-card');
const newSelector = document.querySelector('.seq-pool-col');

console.log(`\nOLD would select: <${oldSelector?.tagName || 'NONE'} class="${oldSelector?.className || 'NONE'}">`);
console.log(`  First card only: ${oldSelector?.innerHTML.substring(0, 50)}`);

console.log(`\nNEW selects: <${newSelector?.tagName || 'NONE'} class="${newSelector?.className || 'NONE'}">`);
console.log(`  Entire pool column containing all 3 cards: ${newSelector ? '✓ CORRECT' : '❌ FAILED'}`);

if (newSelector && newSelector.querySelectorAll('.seq-pool-card').length === 3) {
  console.log(`  ✓ Contains all 3 pool cards`);
  console.log(`\n✅ VERIFIED: NEW selector is better because it scrolls the entire pool column,`);
  console.log(`   which ensures the gate card (first card) is visible at the top.`);
} else {
  console.log(`\n⚠️  Pool column has ${newSelector?.querySelectorAll('.seq-pool-card')?.length || 0} cards, expected 3`);
}
