const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto('http://127.0.0.1:8080/index.html');
  await page.waitForLoadState('networkidle');

  // Navigate to checklist tab
  await page.click('[href="#checklist"]');
  await page.waitForSelector('[onclick*="switchMode"]');

  // Click the Sequence Recall mode toggle
  const modeToggle = await page.$('[onclick*="switchMode"]');
  if (modeToggle) {
    await modeToggle.click();
    await page.waitForTimeout(500);
  }

  // Wait for the sequence recall UI to render
  await page.waitForSelector('.seq-gate-opt', { timeout: 5000 });

  // Take screenshot before check
  await page.screenshot({ path: '/tmp/before-check.png' });
  console.log('✅ Screenshot before check: /tmp/before-check.png');

  // Get initial scroll position
  const initialScrollTop = await page.evaluate(() => {
    const container = document.querySelector('#seq-content');
    return container ? container.parentElement.scrollTop : 0;
  });
  console.log(`Initial scroll position: ${initialScrollTop}`);

  // Answer the first (gate) section - click first option
  const gateOptions = await page.$$('.seq-gate-opt');
  if (gateOptions.length > 0) {
    await gateOptions[0].click();
    await page.waitForTimeout(300);
    console.log('✅ Selected gate answer');

    // Now check if there's a Check button for the second section (free items)
    const checkButtons = await page.$$('button:has-text("Check")');
    if (checkButtons.length > 0) {
      // Click the Check button (should be for the free items section)
      await checkButtons[0].click();
      await page.waitForTimeout(1000);
      console.log('✅ Clicked Check button on free items section');
    }
  }

  // Get scroll position after check (this is where the scroll should happen)
  const afterScrollTop = await page.evaluate(() => {
    const container = document.querySelector('#seq-content');
    return container ? container.parentElement.scrollTop : 0;
  });
  console.log(`Scroll position after check: ${afterScrollTop}`);

  // Get the position of the first gate card
  const gateCardInfo = await page.evaluate(() => {
    const poolCol = document.querySelector('.seq-pool-col');
    const firstCard = document.querySelector('#seq-content .seq-pool-card');
    const gateHeader = document.querySelector('.seq-pool-eyebrow');

    if (poolCol && firstCard) {
      return {
        poolColTop: poolCol.getBoundingClientRect().top,
        poolColRect: {
          top: poolCol.getBoundingClientRect().top,
          bottom: poolCol.getBoundingClientRect().bottom,
          height: poolCol.getBoundingClientRect().height
        },
        firstCardRect: {
          top: firstCard.getBoundingClientRect().top,
          bottom: firstCard.getBoundingClientRect().bottom,
          height: firstCard.getBoundingClientRect().height
        },
        gateHeaderText: gateHeader ? gateHeader.textContent : 'Not found'
      };
    }
    return null;
  });

  console.log('\nGate Card Position:');
  console.log(JSON.stringify(gateCardInfo, null, 2));

  // Take screenshot after check
  await page.screenshot({ path: '/tmp/after-check.png' });
  console.log('\n✅ Screenshot after check: /tmp/after-check.png');

  // Check if the gate card is fully visible in the viewport
  const isFullyVisible = await page.evaluate(() => {
    const poolCol = document.querySelector('.seq-pool-col');
    const firstCard = document.querySelector('#seq-content .seq-pool-card');

    if (poolCol && firstCard) {
      const rect = poolCol.getBoundingClientRect();
      const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
      return { isInViewport, top: rect.top, bottom: rect.bottom, height: rect.height };
    }
    return null;
  });

  console.log('\nVisibility check:');
  console.log(JSON.stringify(isFullyVisible, null, 2));

  if (isFullyVisible && isFullyVisible.isInViewport) {
    console.log('\n✅ PASS: Gate section is fully visible at the top of viewport');
  } else if (isFullyVisible && isFullyVisible.top < window.innerHeight && isFullyVisible.top > 0) {
    console.log('\n⚠️  Gate section is partially visible - might still be scrolling to middle');
  }

  await browser.close();
})().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
