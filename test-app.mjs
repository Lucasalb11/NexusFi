import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testNexusFi() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  const screenshotsDir = join(__dirname, 'screenshots');
  
  try {
    console.log('1. Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: join(screenshotsDir, '1-login.png'), fullPage: true });
    console.log('   ✓ Screenshot saved: 1-login.png');
    console.log('   Current URL:', page.url());

    console.log('\n2. Looking for "Connect Wallet" button...');
    const connectButton = await page.locator('button:has-text("Connect Wallet"), button:has-text("Conectar Carteira")').first();
    if (await connectButton.isVisible()) {
      console.log('   ✓ Found Connect Wallet button');
      await connectButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(screenshotsDir, '2-dashboard.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 2-dashboard.png');
      console.log('   Current URL:', page.url());
    } else {
      console.log('   ✗ Connect Wallet button not found');
    }

    console.log('\n3. Navigating to /wallet...');
    const walletNav = await page.locator('a[href="/wallet"], button:has-text("Carteira")').first();
    if (await walletNav.isVisible()) {
      await walletNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '3-wallet.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 3-wallet.png');
      console.log('   Current URL:', page.url());
    } else {
      console.log('   Trying direct navigation...');
      await page.goto('http://localhost:3000/wallet', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '3-wallet.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 3-wallet.png');
    }

    console.log('\n4. Navigating to /deposit...');
    const depositNav = await page.locator('a[href="/deposit"], button:has-text("Depositar")').first();
    if (await depositNav.isVisible()) {
      await depositNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '4-deposit.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 4-deposit.png');
      console.log('   Current URL:', page.url());
    } else {
      console.log('   Trying direct navigation...');
      await page.goto('http://localhost:3000/deposit', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '4-deposit.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 4-deposit.png');
    }

    console.log('\n5. Navigating to /credit...');
    const creditNav = await page.locator('a[href="/credit"], button:has-text("Crédito")').first();
    if (await creditNav.isVisible()) {
      await creditNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '5-credit.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 5-credit.png');
      console.log('   Current URL:', page.url());
    } else {
      console.log('   Trying direct navigation...');
      await page.goto('http://localhost:3000/credit', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '5-credit.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 5-credit.png');
    }

    console.log('\n6. Navigating to /settings...');
    const settingsNav = await page.locator('a[href="/settings"], button:has-text("Config")').first();
    if (await settingsNav.isVisible()) {
      await settingsNav.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '6-settings.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 6-settings.png');
      console.log('   Current URL:', page.url());
    } else {
      console.log('   Trying direct navigation...');
      await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: join(screenshotsDir, '6-settings.png'), fullPage: true });
      console.log('   ✓ Screenshot saved: 6-settings.png');
    }

    console.log('\n✅ All screenshots captured successfully!');
    console.log('Screenshots saved in:', screenshotsDir);

  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

testNexusFi();
