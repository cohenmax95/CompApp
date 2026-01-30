// Test new AVM scrapers
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";

async function testOwnerly() {
    console.log('\n🏠 Testing OWNERLY...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

        const addressSlug = address.toLowerCase().replace(/[,#.]/g, '').replace(/\s+/g, '-');
        const url = `https://www.ownerly.com/property/${addressSlug}`;
        console.log(`   URL: ${url}`);

        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        console.log(`   Status: ${response?.status()}`);

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        const data = await page.evaluate(() => {
            const text = document.body.innerText;
            const priceMatch = text.match(/\$([0-9,]+)/);
            return { price: priceMatch ? priceMatch[1] : null };
        });

        if (data.price) {
            console.log(`   ✅ Found price: $${data.price}`);
        } else {
            console.log('   ⚠️  No price found');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testHomesnap() {
    console.log('\n📸 Testing HOMESNAP...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

        const url = `https://www.homesnap.com/search?q=${encodeURIComponent(address)}`;
        console.log(`   URL: ${url.substring(0, 60)}...`);

        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        console.log(`   Status: ${response?.status()}`);

        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        const data = await page.evaluate(() => {
            const text = document.body.innerText;
            const priceMatch = text.match(/\$([0-9,]+)/);
            return { price: priceMatch ? priceMatch[1] : null };
        });

        if (data.price) {
            console.log(`   ✅ Found price: $${data.price}`);
        } else {
            console.log('   ⚠️  No price found');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testOpendoor() {
    console.log('\n🚪 Testing OPENDOOR...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

        const url = 'https://www.opendoor.com/homes';
        console.log(`   URL: ${url}`);

        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        console.log(`   Status: ${response?.status()}`);

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        if (title.includes('denied') || title.includes('error')) {
            console.log('   ❌ Access denied');
        } else {
            console.log('   ✅ Page loaded (needs search interaction)');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function runTests() {
    console.log('\n🧪 TESTING NEW SCRAPERS');
    console.log('='.repeat(60));
    console.log(`Address: ${address}\n`);

    await testOwnerly();
    await testHomesnap();
    await testOpendoor();

    console.log('\n' + '='.repeat(60));
    console.log('Tests complete!\n');
}

runTests();
