// Quick test of updated scrapers
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";

async function testComeHome() {
    console.log('\n🏡 Testing COMEHOME (direct URL)...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

        const addressSlug = address.replace(/[,#.]/g, '').replace(/\s+/g, '-');
        const url = `https://www.comehome.com/property-details/${addressSlug}`;
        console.log(`   URL: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        const data = await page.evaluate(() => {
            const text = document.body.innerText;
            const priceMatch = text.match(/\$([0-9,]+)/);
            return { price: priceMatch ? priceMatch[1] : null };
        });

        if (data.price) {
            console.log(`   ✅ Found estimate: $${data.price}`);
        } else if (title.toLowerCase().includes('not found')) {
            console.log('   ❌ Page not found');
        } else {
            console.log('   ⚠️  No price found');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function testBofA() {
    console.log('\n🏦 Testing BANK OF AMERICA...');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36');

        const url = 'https://homevaluerealestatecenter.bankofamerica.com/';
        console.log(`   URL: ${url}`);

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
        await new Promise(r => setTimeout(r, 2000));

        const title = await page.title();
        console.log(`   Title: "${title}"`);

        // Find and type in address input
        const addressInput = await page.$('#address');
        if (addressInput) {
            console.log('   ✅ Found #address input');
            await addressInput.click();
            await addressInput.type(address, { delay: 30 });
            await new Promise(r => setTimeout(r, 2500));

            const suggestion = await page.$('.pac-item');
            if (suggestion) {
                console.log('   ✅ Found autocomplete suggestion');
                await suggestion.click();
                await new Promise(r => setTimeout(r, 3000));

                const text = await page.evaluate(() => document.body.innerText);
                const priceMatch = text.match(/Estimated\s*home\s*value[\s\n]*\$([0-9,]+)/i);
                if (priceMatch) {
                    console.log(`   ✅ Found estimate: $${priceMatch[1]}`);
                } else {
                    console.log('   ⚠️  No clear estimate found');
                }
            } else {
                console.log('   ⚠️  No autocomplete suggestions');
            }
        } else {
            console.log('   ❌ Address input not found');
        }

        await browser.close();
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        await browser.close();
    }
}

async function runTests() {
    console.log('\n🧪 TESTING UPDATED SCRAPERS');
    console.log('='.repeat(60));
    console.log(`Address: ${address}\n`);

    await testComeHome();
    await testBofA();

    console.log('\n' + '='.repeat(60));
    console.log('Tests complete!\n');
}

runTests();
