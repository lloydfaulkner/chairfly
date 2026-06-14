const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Loading app...');
    await page.goto('http://127.0.0.1:8080/index.html');
    await page.waitForLoadState('networkidle');

    // The page should be loaded. Click the Recall button to switch modes.
    console.log('Switching to Recall mode...');
    const recallBtn = await page.$('[onclick*="setClMode(\'recall\'"]');
    if (recallBtn) {
      await recallBtn.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('Could not find Recall button');
    }

    // Wait for sequence recall to render
    console.log('Waiting for Sequence Recall UI...');
    await page.waitForSelector('.seq-gate-opt', { timeout: 10000 });

    // Take screenshot showing the initial state
    await page.screenshot({ path: '/tmp/01-initial-state.png' });
    console.log('✅ Screenshot 1: Initial state');

    // Select the first gate option
    console.log('Selecting first gate option...');
    const gateOpts = await page.$$('.seq-gate-opt');
    if (gateOpts.length > 0) {
      await gateOpts[0].click();
      await page.waitForTimeout(500);
    }

    // Now we need to complete the free items selection.
    // First, open the picker
    console.log('Opening free items picker...');
    const pickerToggle = await page.$('button:has-text("Open ▼")');
    if (pickerToggle) {
      await pickerToggle.click();
      await page.waitForTimeout(500);
    }

    // Select all free items
    const freeItems = await page.$$('.seq-free-item');
    console.log(`Found ${freeItems.length} free items`);

    for (const item of freeItems) {
      await item.click();
      await page.waitForTimeout(100);
    }

    // Now click Check on the free items
    console.log('Clicking Check button on free items...');
    const checkButtons = await page.$$('button:has-text("Check")');
    console.log(`Found ${checkButtons.length} Check buttons`);

    if (checkButtons.length > 0) {
      // Get the scroll position BEFORE clicking
      const scrollBefore = await page.evaluate(() => {
        const container = document.querySelector('#cl-recall-mode');
        return container ? container.scrollTop : 0;
      });
      console.log(`Scroll position before: ${scrollBefore}`);

      // Click Check
      await checkButtons[0].click();
      await page.waitForTimeout(1500);

      // Get scroll position AFTER clicking (the scroll should have happened)
      const scrollAfter = await page.evaluate(() => {
        const container = document.querySelector('#cl-recall-mode');
        return container ? container.scrollTop : 0;
      });
      console.log(`Scroll position after: ${scrollAfter}`);
      console.log(`Scroll distance moved: ${scrollAfter - scrollBefore}`);

      // Take screenshot after the scroll
      await page.screenshot({ path: '/tmp/02-after-check.png' });
      console.log('✅ Screenshot 2: After Check clicked');

      // Check the visibility of the gate section
      const gateVisibility = await page.evaluate(() => {
        const poolCol = document.querySelector('.seq-pool-col');
        const firstCard = document.querySelector('#seq-content .seq-pool-card');
        const gateEyebrow = document.querySelector('.seq-pool-eyebrow');

        if (poolCol && firstCard && gateEyebrow) {
          const poolRect = poolCol.getBoundingClientRect();
          const gateRect = gateEyebrow.getBoundingClientRect();

          // Check if gate section is at or near top of viewport
          const container = document.querySelector('#cl-recall-mode');
          const isVisible = {
            gateAtTop: gateRect.top >= 0 && gateRect.top < 200, // within first 200px
            poolColInView: poolRect.top <= 200, // top of pool col is near viewport top
            poolColHeight: poolRect.height,
            gateEyebrowText: gateEyebrow.textContent.trim(),
            containerScrollTop: container ? container.scrollTop : 'N/A'
          };
          return isVisible;
        }
        return { error: 'Could not find elements' };
      });

      console.log('\n📊 Gate Section Visibility:');
      console.log(JSON.stringify(gateVisibility, null, 2));

      if (gateVisibility.gateAtTop) {
        console.log('\n✅ PASS: Gate section is near the top of viewport (first 200px)');
      } else {
        console.log('\n⚠️ Issue: Gate section is not at the top as expected');
      }
    } else {
      console.log('❌ Could not find Check button');
    }

    await page.waitForTimeout(2000);
  } catch (err) {
    console.error('❌ Test error:', err.message);
  } finally {
    await browser.close();
  }
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
