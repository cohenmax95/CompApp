// Test DuckDuckGo instead of Google
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

async function testDuckDuckGo() {
    const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";
    console.log('Starting DuckDuckGo test for:', address);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Try DuckDuckGo
        const ddgQuery = `${address} zillow`;
        const ddgUrl = `https://duckduckgo.com/?q=${encodeURIComponent(ddgQuery)}`;
        console.log('Going to DuckDuckGo:', ddgUrl);

        await page.goto(ddgUrl, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 3000));

        const ddgTitle = await page.title();
        console.log('DuckDuckGo page title:', ddgTitle);

        // Save screenshot
        const debugDir = path.join(__dirname, 'zillow-debug');
        if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
        await page.screenshot({ path: path.join(debugDir, 'test_ddg.png'), fullPage: true });
        console.log('Saved DuckDuckGo screenshot');

        // Find Zillow link
        const zillowLink = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
                const href = link.href || '';
                if (href.includes('zillow.com') && (href.includes('/homedetails/') || href.includes('/homes/'))) {
                    return href;
                }
            }
            // Fallback
            for (const link of links) {
                const href = link.href || '';
                if (href.includes('zillow.com')) {
                    return href;
                }
            }
            return null;
        });

        console.log('Zillow link found:', zillowLink || 'NONE');

        if (zillowLink) {
            console.log('Navigating to Zillow...');
            await page.goto(zillowLink, { waitUntil: 'networkidle2', timeout: 25000 });
            await new Promise(r => setTimeout(r, 2000));

            const zillowTitle = await page.title();
            console.log('Zillow page title:', zillowTitle);

            await page.screenshot({ path: path.join(debugDir, 'test_zillow_ddg.png'), fullPage: true });
            console.log('Saved Zillow screenshot');

            // Extract Zestimate
            const data = await page.evaluate(() => {
                const allText = document.body.innerText;
                const zestimateMatch = allText.match(/(?:Zestimate[®:]?\s*\$?([\d,]+)|\$?([\d,]+)\s*Zestimate)/i);
                if (zestimateMatch) {
                    return { estimate: parseInt((zestimateMatch[1] || zestimateMatch[2]).replace(/,/g, '')), method: 'visible_text' };
                }
                return { estimate: 0, method: 'none' };
            });

            console.log('Extraction result:', data);
        }

        await browser.close();
        console.log('Test complete!');

    } catch (error) {
        console.error('Error:', error.message);
        await browser.close();
    }
}

testDuckDuckGo();
