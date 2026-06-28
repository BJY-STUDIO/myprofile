const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:1337/admin/auth/login', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await (await page.$('input[type="email"], input[name="email"]')).fill('jerry@bjy-studio.com');
  await (await page.$('input[type="password"], input[name="password"]')).fill('Admin2026!');
  await (await page.$('button[type="submit"]')).click();
  await page.waitForURL('**/admin**', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  // Content Manager - check what text is actually there
  await page.goto('http://localhost:1337/admin/content-manager', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const cmText = await page.textContent('body');
  console.log('=== Content Manager raw text ===');
  console.log(cmText.substring(0, 2500));

  // Settings - check what text is actually there  
  await page.goto('http://localhost:1337/admin/settings', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const settingsText = await page.textContent('body');
  console.log('\n=== Settings raw text ===');
  console.log(settingsText.substring(0, 2000));

  // Dashboard - check Deploy sidebar entry specifically
  await page.goto('http://localhost:1337/admin', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  const dashText = await page.textContent('body');
  // Extract just the sidebar portion
  const sidebarMatch = dashText.match(/Workplace(.+?)Menu/);
  if (sidebarMatch) {
    console.log('\n=== Sidebar items ===');
    console.log(sidebarMatch[1]);
  }

  await browser.close();
})();