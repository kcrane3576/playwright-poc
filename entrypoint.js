// entrypoint.js
const { chromium, firefox } = require('playwright-core');

const QUICK = process.argv.includes('--quick');  // healthcheck uses this
const MODE  = process.env.RUN_MODE || 'check';   // future-proofing

async function sanityCheck({ quick = false } = {}) {
  // Quick = Chromium only (fast healthcheck); otherwise Chromium + Firefox
  const targets = quick ? { chromium } : { chromium, firefox };

  console.log(`Playwright sanity check (quick=${quick})...`);
  let ok = true;

  for (const [name, engine] of Object.entries(targets)) {
    try {
      const browser = await engine.launch({ headless: true });
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      // Navigate to prove networking/rendering pipeline works
      await page.goto('https://example.com', { timeout: 15000 });
      await browser.close();
      console.log(`${name} launched and navigated successfully`);
    } catch (err) {
      ok = false;
      console.error(`${name} failed:`, err.message || err);
    }
  }

  console.log(ok ? 'Sanity check complete (PASS)' : 'Sanity check complete (FAIL)');
  // Critical for Docker HEALTHCHECK:
  process.exitCode = ok ? 0 : 1;
}

(async () => {
  switch (MODE) {
    case 'check':
      await sanityCheck({ quick: QUICK });
      break;
    default:
      console.error(`Unknown RUN_MODE=${MODE}`);
      process.exit(2);
  }
})();
