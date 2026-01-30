// Test direct Zillow search with maximum stealth
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function testDirectZillow() {
    const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";
    console.log('\n🏠 Testing DIRECT Zillow for:', address);
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
        ],
    });

    try {
        const page = await browser.newPage();

        // Maximum stealth
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });

        // Override navigator properties
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => false });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            window.chrome = { runtime: {} };
        });

        // Use Zillow's search URL format
        const searchUrl = `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`;
        console.log('\n1️⃣  Going directly to Zillow search...');
        console.log(`   URL: ${searchUrl}`);

        const response = await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log(`   Status: ${response.status()}`);

        await new Promise(r => setTimeout(r, 3000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        // Save screenshot
        const debugDir = path.join(__dirname, 'zillow-debug');
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
        await page.screenshot({ path: path.join(debugDir, 'direct_zillow.png'), fullPage: true });
        console.log('   📸 Screenshot saved');

        if (title.includes('Access') || title.includes('Denied')) {
            console.log('\n   ❌ Zillow blocked access');
            await browser.close();
            return;
        }

        // Try to extract data
        console.log('\n2️⃣  Extracting Zestimate...');
        const data = await page.evaluate(() => {
            const allText = document.body.innerText;

            // Check for Zestimate
            const zestimateMatch = allText.match(/Zestimate[®:]?\s*\$?([\d,]+)/i) ||
                allText.match(/\$?([\d,]+)\s*Zestimate/i);
            if (zestimateMatch) {
                return { estimate: parseInt(zestimateMatch[1].replace(/,/g, '')), method: 'visible_text' };
            }

            // Check __NEXT_DATA__
            const nextData = document.getElementById('__NEXT_DATA__');
            if (nextData) {
                const text = nextData.textContent || '';
                const match = text.match(/"zestimate":(\d+)/);
                if (match) return { estimate: parseInt(match[1]), method: '__NEXT_DATA__' };
            }

            return { estimate: 0, method: 'none' };
        });

        if (data.estimate > 0) {
            console.log(`   ✅ Zestimate: $${data.estimate.toLocaleString()} (via ${data.method})`);
        } else {
            console.log('   ❌ No Zestimate extracted');

            // Check what we got
            const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
            console.log('\n   Page content preview:');
            console.log('   ' + bodyText.replace(/\n/g, '\n   '));
        }

        await browser.close();
        console.log('\n' + '='.repeat(60));
        console.log('Test complete!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await browser.close();
    }
}

testDirectZillow();
