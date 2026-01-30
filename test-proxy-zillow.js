// Test Zillow with US residential proxy
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// NEW US proxy credentials
const PROXY = {
    host: 'na.proxy.2captcha.com',
    port: 2334,
    user: 'u3afe36c356dc05cc-zone-custom-region-us',
    pass: 'u3afe36c356dc05cc'
};

async function testZillowUS() {
    console.log('\n🇺🇸 TESTING ZILLOW WITH US RESIDENTIAL PROXY');
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            `--proxy-server=${PROXY.host}:${PROXY.port}`,
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });

    try {
        const page = await browser.newPage();

        await page.authenticate({
            username: PROXY.user,
            password: PROXY.pass
        });

        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        // Verify US IP first
        console.log('\n🔍 Verifying US proxy IP...');
        await page.goto('http://ip-api.com/json', { waitUntil: 'networkidle2', timeout: 30000 });
        const ipData = await page.evaluate(() => document.body.innerText);
        console.log(`   ${ipData.substring(0, 200)}`);

        // Parse country
        try {
            const parsed = JSON.parse(ipData);
            console.log(`   Country: ${parsed.country}`);
            console.log(`   City: ${parsed.city}`);
        } catch (e) { }

        // Now test Zillow
        const zillowUrl = 'https://www.zillow.com/homedetails/779-Hibiscus-Dr-Royal-Palm-Beach-FL-33411/46324547_zpid/';
        console.log(`\n🏠 Testing Zillow...`);
        console.log(`   URL: ${zillowUrl}`);

        const response = await page.goto(zillowUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 3000));

        const status = response?.status();
        const title = await page.title();

        console.log(`\n📊 Results:`);
        console.log(`   HTTP Status: ${status}`);
        console.log(`   Title: "${title}"`);

        if (status === 200 && !title.includes('denied') && !title.includes('Access')) {
            console.log('   ✅ SUCCESS!');

            const data = await page.evaluate(() => {
                const text = document.body.innerText;
                const zestMatch = text.match(/Zestimate[^\$]*\$([0-9,]+)/i);
                const priceMatch = text.match(/\$([0-9]{1,3}(?:,[0-9]{3})+)/);
                return {
                    zestimate: zestMatch ? zestMatch[1] : null,
                    price: priceMatch ? priceMatch[1] : null,
                    hasZestimate: text.toLowerCase().includes('zestimate')
                };
            });

            if (data.zestimate) {
                console.log(`\n   🏆 ZESTIMATE: $${data.zestimate}`);
            } else if (data.price) {
                console.log(`   💰 Price found: $${data.price}`);
            }
        } else if (status === 403) {
            console.log('   ❌ BLOCKED (403)');
        } else if (status === 407) {
            console.log('   ❌ Proxy auth failed (407)');
        }

        await browser.close();
    } catch (e) {
        console.log(`\n❌ Error: ${e.message}`);
        await browser.close();
    }

    console.log('\n' + '='.repeat(60));
}

testZillowUS();
