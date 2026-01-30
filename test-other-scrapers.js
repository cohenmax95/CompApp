// Test all other scrapers individually (excluding Zillow)
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";
const debugDir = path.join(__dirname, 'zillow-debug');
if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });

async function createPage(browser) {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    return page;
}

async function testRedfin() {
    console.log('\n🔴 Testing REDFIN...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await createPage(browser);
        const url = `https://www.redfin.com/search?searchAddress=${encodeURIComponent(address)}`;
        console.log(`   URL: ${url.substring(0, 70)}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        await page.screenshot({ path: path.join(debugDir, 'redfin.png') });

        const data = await page.evaluate(() => {
            const text = document.body.innerText;
            const priceMatch = text.match(/\$[\d,]+/);
            return { foundPrice: priceMatch ? priceMatch[0] : null };
        });

        if (data.foundPrice) {
            console.log(`   ✅ Found price: ${data.foundPrice}`);
        } else if (title.includes('denied') || title.includes('blocked')) {
            console.log('   ❌ Access denied');
        } else {
            console.log('   ⚠️  No price found');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testTrulia() {
    console.log('\n🏠 Testing TRULIA...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await createPage(browser);
        const url = `https://www.trulia.com/property/${encodeURIComponent(address.replace(/[,#]/g, '').replace(/\s+/g, '-'))}`;
        console.log(`   URL: ${url.substring(0, 70)}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        await page.screenshot({ path: path.join(debugDir, 'trulia.png') });

        if (title.includes('denied') || title.includes('blocked') || title.includes('error')) {
            console.log('   ❌ Access denied');
        } else {
            console.log('   ✅ Page loaded');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testComeHome() {
    console.log('\n🏡 Testing COMEHOME...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await createPage(browser);
        const url = `https://www.comehome.com/property/${encodeURIComponent(address.replace(/[,#]/g, '').replace(/\s+/g, '-').toLowerCase())}`;
        console.log(`   URL: ${url.substring(0, 70)}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        await page.screenshot({ path: path.join(debugDir, 'comehome.png') });

        const data = await page.evaluate(() => {
            const text = document.body.innerText;
            const priceMatch = text.match(/\$[\d,]+/);
            return { foundPrice: priceMatch ? priceMatch[0] : null };
        });

        if (data.foundPrice) {
            console.log(`   ✅ Found price: ${data.foundPrice}`);
        } else {
            console.log('   ⚠️  No price found');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testBankOfAmerica() {
    console.log('\n🏦 Testing BANK OF AMERICA...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await createPage(browser);
        const url = `https://www.bankofamerica.com/real-estate/homevalue/home-value-estimator/?REQUEST_LOCALE=en-US&cm_sp=RRE-HP-HeroDesktop-HVE`;
        console.log(`   URL: ${url.substring(0, 70)}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        await page.screenshot({ path: path.join(debugDir, 'bofa.png') });

        if (title.includes('denied') || title.includes('blocked')) {
            console.log('   ❌ Access denied');
        } else {
            console.log('   ✅ Page loaded');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testRealtor() {
    console.log('\n🏘️  Testing REALTOR.COM...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await createPage(browser);
        const url = `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(address.replace(/[,#]/g, '').replace(/\s+/g, '-'))}`;
        console.log(`   URL: ${url.substring(0, 70)}...`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        await page.screenshot({ path: path.join(debugDir, 'realtor.png') });

        if (title.includes('denied') || title.includes('blocked') || title.includes('error')) {
            console.log('   ❌ Access denied');
        } else {
            console.log('   ✅ Page loaded');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function runAll() {
    console.log('\n🧪 TESTING ALL SCRAPERS');
    console.log('='.repeat(60));
    console.log(`Address: ${address}\n`);

    await testRedfin();
    await testTrulia();
    await testComeHome();
    await testBankOfAmerica();
    await testRealtor();

    console.log('\n' + '='.repeat(60));
    console.log('📸 Screenshots saved to zillow-debug/');
    console.log('Tests complete!\n');
}

runAll();
