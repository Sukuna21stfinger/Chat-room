const { chromium } = require('playwright-chromium');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));

  // Capture network responses for auth endpoints
  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (url.includes('/api/auth/login') || url.includes('/api/auth/guest') || url.includes('/api/auth/register')) {
        const text = await response.text();
        console.log(`NETWORK ${response.status()} ${response.request().method()} ${url} -> ${text}`);
      }
    } catch (err) {
      console.error('Response read error', err);
    }
  });

  // Visit app
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  console.log('Opening', appUrl);
  await page.goto(appUrl, { waitUntil: 'networkidle' });

  // Try login with test credentials
  try {
    console.log('Attempting UI login with test@example.com');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/auth/login') && r.status() < 600, { timeout: 5000 }),
      page.click('button[type="submit"]')
    ]);

    // Check if token stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    console.log('Login token present in localStorage:', Boolean(token));
  } catch (err) {
    console.error('UI login error:', err.message || err);
  }

  // Try guest login
  try {
    console.log('Attempting UI guest login (Quick Guest)');
    // find button with Quick Guest text
    const guestBtn = await page.$('button:has-text("Quick Guest")');
    if (guestBtn) {
      await Promise.all([
        page.waitForResponse(r => r.url().includes('/api/auth/guest') && r.status() < 600, { timeout: 5000 }),
        guestBtn.click()
      ]);
      const token2 = await page.evaluate(() => localStorage.getItem('token'));
      console.log('Guest login token present in localStorage:', Boolean(token2));
    } else {
      console.log('Guest button not found on page');
    }
  } catch (err) {
    console.error('UI guest error:', err.message || err);
  }

  await browser.close();
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
