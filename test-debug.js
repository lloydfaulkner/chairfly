const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Loading app...');
    await page.goto('http://127.0.0.1:8080/index.html');
    await page.waitForLoadState('networkidle');

    // Debug: What's on the page?
    const buttons = await page.$$('button');
    console.log(`Found ${buttons.length} buttons`);

    // Find buttons with "Recall" text
    const buttonTexts = await page.$$eval('button', els => els.map(el => ({ text: el.textContent.trim(), onclick: el.getAttribute('onclick') })));
    console.log('Buttons found:');
    buttonTexts.slice(0, 20).forEach((btn, i) => {
      if (btn.text || btn.onclick) {
        console.log(`  ${i}: ${btn.text} | onclick="${btn.onclick?.substring(0, 40)}"`);
      }
    });

    // Look for Recall button specifically
    const recallButtons = await page.$$('button:has-text("Recall")');
    console.log(`Found ${recallButtons.length} Recall buttons`);

    if (recallButtons.length > 0) {
      console.log('Clicking first Recall button...');
      await recallButtons[0].click();
      await page.waitForTimeout(1000);
    }

    // Check what's visible now
    const viewChecklist = await page.$('#view-checklist');
    const seqContent = await page.$('#seq-content');
    const recallMode = await page.$('#cl-recall-mode');

    console.log(`\nDOM state:`);
    console.log(`  #view-checklist exists: ${!!viewChecklist}`);
    console.log(`  #seq-content exists: ${!!seqContent}`);
    console.log(`  #cl-recall-mode exists: ${!!recallMode}`);

    // Check if seq-content has content
    const seqHtml = await page.evaluate(() => {
      const el = document.querySelector('#seq-content');
      return el ? el.innerHTML.substring(0, 200) : 'NOT FOUND';
    });
    console.log(`  #seq-content innerHTML (first 200 chars): ${seqHtml}`);

    // Look for phase selector
    const phaseSelector = await page.$('#phase-selector');
    console.log(`  #phase-selector exists: ${!!phaseSelector}`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/debug-state.png' });
    console.log('\n✅ Screenshot saved: /tmp/debug-state.png');

    await page.waitForTimeout(3000);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
