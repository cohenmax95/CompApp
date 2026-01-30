// Test new AVM sites with US proxy
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const PROXY = {
    host: 'na.proxy.2captcha.com',
    port: 2334,
    user: 'u3afe36c356dc05cc-zone-custom-region-us',
    pass: 'u3afe36c356dc05cc'
};

const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";

// Sites to test
const SITES_TO_TEST = [
    { name: 'Rocket Homes', url: 'https://www.rockethomes.com/home-value' },
    { name: 'RE/MAX', url: 'https://www.remax.com/home-value' },
    { name: 'FSBO', url: 'https://www.fsbo.com/home-value' },
    { name: 'ForSaleByOwner', url: 'https://www.forsalebyowner.com/sell/home-value' },
    { name: 'Eppraisal', url: 'https://www.eppraisal.com/' },
    { name: 'HomeLight', url: 'https://www.homelight.com/home-value-estimator' },
    { name: 'PennyMac', url: 'https://www.pennymac.com/home-value' },
    { name: 'Xome Property', url: 'https://www.xome.com/realestate/fl/royal-palm-beach/33411/779-hibiscus-dr' },
];

async function testSite(browser, site) {
    console.log(`\n📍 Testing ${site.name}...`);
    console.log(`   URL: ${site.url}`);

    try {
        const page = await browser.newPage();
        await page.authenticate({ username: PROXY.user, password: PROXY.pass });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        const response = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const status = response?.status();
        const title = await page.title();

        console.log(`   Status: ${status}`);
        console.log(`   Title: "${title.substring(0, 60)}..."`);

        // Check for address input
        const hasAddressInput = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="address"], input[name*="address"], input[id*="address"]');
            return inputs.length > 0;
        });

        if (status === 200 && !title.toLowerCase().includes('denied') && !title.toLowerCase().includes('blocked')) {
            console.log(`   ✅ ACCESSIBLE`);
            if (hasAddressInput) {
                console.log(`   ✅ Has address input - CAN SCRAPE`);
            }
            await page.close();
            return { ...site, status: 'accessible', hasInput: hasAddressInput };
        } else if (status === 403) {
            console.log(`   ❌ Blocked (403)`);
            await page.close();
            return { ...site, status: 'blocked' };
        } else {
            console.log(`   ⚠️ Status: ${status}`);
            await page.close();
            return { ...site, status: 'unknown', httpStatus: status };
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message.substring(0, 50)}`);
        return { ...site, status: 'error', error: e.message };
    }
}

async function runTests() {
    console.log('\n🔍 TESTING NEW AVM SITES WITH US PROXY');
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            `--proxy-server=${PROXY.host}:${PROXY.port}`
        ]
    });

    const results = [];
    for (const site of SITES_TO_TEST) {
        const result = await testSite(browser, site);
        results.push(result);
    }

    await browser.close();

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('-'.repeat(60));

    const accessible = results.filter(r => r.status === 'accessible');
    const blocked = results.filter(r => r.status === 'blocked');

    console.log(`\n✅ ACCESSIBLE (${accessible.length}):`);
    accessible.forEach(r => console.log(`   - ${r.name} ${r.hasInput ? '(has input)' : ''}`));

    console.log(`\n❌ BLOCKED (${blocked.length}):`);
    blocked.forEach(r => console.log(`   - ${r.name}`));

    console.log('\n' + '='.repeat(60));
}

runTests();
