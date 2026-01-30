// Quick test promising sites from research
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const PROXY = {
    host: 'na.proxy.2captcha.com',
    port: 2334,
    user: 'u3afe36c356dc05cc-zone-custom-region-us',
    pass: 'u3afe36c356dc05cc'
};

const SITES = [
    { name: 'Movoto', url: 'https://www.movoto.com/home-value/' },
    { name: 'SmartAsset', url: 'https://smartasset.com/mortgage/home-value-estimator' },
    { name: 'HomeGain', url: 'https://www.homegain.com/homevalues/' },
    { name: 'Bankrate', url: 'https://www.bankrate.com/real-estate/home-value-estimator/' },
    { name: 'Century21', url: 'https://www.century21northhomes.com/home-value-estimator/' },
];

async function testSite(browser, site) {
    console.log(`\n📍 ${site.name}...`);
    try {
        const page = await browser.newPage();
        await page.authenticate({ username: PROXY.user, password: PROXY.pass });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

        const response = await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 20000 });
        const status = response?.status();
        const title = await page.title();

        const hasInput = await page.evaluate(() => {
            const inputs = document.querySelectorAll('input[type="text"], input[placeholder*="address"]');
            return inputs.length > 0;
        });

        console.log(`   ${status} | "${title.substring(0, 40)}..." | Input: ${hasInput ? '✅' : '❌'}`);
        await page.close();
        return { ...site, status, hasInput, works: status === 200 && hasInput };
    } catch (e) {
        console.log(`   ❌ ${e.message.substring(0, 40)}`);
        return { ...site, works: false };
    }
}

async function run() {
    console.log('\n🔍 QUICK TEST NEW SITES');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', `--proxy-server=${PROXY.host}:${PROXY.port}`]
    });

    for (const site of SITES) {
        await testSite(browser, site);
    }
    await browser.close();
    console.log('\nDone!');
}

run();
