// Standalone test for Zillow via Google with CAPTCHA solving
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');

puppeteer.use(StealthPlugin());

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY || '4f79e12ed663c4cd4a26dc0186744710';

async function solveCaptcha(siteKey, pageUrl) {
    console.log('   🔓 Submitting CAPTCHA to 2Captcha...');
    try {
        const submitRes = await fetch(
            `https://2captcha.com/in.php?key=${CAPTCHA_API_KEY}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${encodeURIComponent(pageUrl)}&json=1`
        );
        const submitData = await submitRes.json();

        if (submitData.status !== 1) {
            console.error('   ❌ 2Captcha submit error:', submitData);
            return null;
        }

        const captchaId = submitData.request;
        console.log(`   ⏳ CAPTCHA submitted (ID: ${captchaId}), waiting for solution...`);

        // Poll for result (max 2 minutes)
        for (let i = 0; i < 24; i++) {
            await new Promise(r => setTimeout(r, 5000));
            process.stdout.write(`   ⏳ Polling... (${(i + 1) * 5}s)\r`);

            const resultRes = await fetch(
                `https://2captcha.com/res.php?key=${CAPTCHA_API_KEY}&action=get&id=${captchaId}&json=1`
            );
            const resultData = await resultRes.json();

            if (resultData.status === 1) {
                console.log('\n   ✅ CAPTCHA solved!');
                return resultData.request;
            } else if (resultData.request !== 'CAPCHA_NOT_READY') {
                console.error('\n   ❌ 2Captcha result error:', resultData);
                return null;
            }
        }

        console.log('\n   ❌ CAPTCHA solving timed out');
        return null;
    } catch (error) {
        console.error('   ❌ 2Captcha error:', error.message);
        return null;
    }
}

async function testZillowViaGoogle() {
    const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";
    console.log('\n🏠 Testing Zillow via Google for:', address);
    console.log('='.repeat(60));

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Step 1: Google search
        const googleQuery = `${address} zillow`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
        console.log('\n1️⃣  Searching Google...');

        await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 2000));

        const googleTitle = await page.title();
        const googleContent = await page.content();
        console.log(`   Page title: "${googleTitle}"`);

        // Check for CAPTCHA
        const isGoogleCaptcha = googleContent.includes('unusual traffic') ||
            googleContent.includes("I'm not a robot") ||
            googleContent.includes('captcha');

        if (isGoogleCaptcha) {
            console.log('   ⚠️  Google CAPTCHA detected!');

            // Save screenshot
            const debugDir = path.join(__dirname, 'zillow-debug');
            if (!fs.existsSync(debugDir)) fs.mkdirSync(debugDir, { recursive: true });
            await page.screenshot({ path: path.join(debugDir, 'google_captcha.png') });

            // Try to find sitekey
            const captchaInfo = await page.evaluate(() => {
                const siteKey = document.querySelector('[data-sitekey]')?.getAttribute('data-sitekey') || '';
                return { siteKey };
            });

            if (captchaInfo.siteKey) {
                console.log(`   Found sitekey: ${captchaInfo.siteKey}`);
                const token = await solveCaptcha(captchaInfo.siteKey, googleUrl);

                if (token) {
                    // Inject token
                    await page.evaluate((t) => {
                        const textarea = document.getElementById('g-recaptcha-response');
                        if (textarea) textarea.value = t;
                        const form = document.querySelector('form');
                        if (form) form.submit();
                    }, token);

                    await new Promise(r => setTimeout(r, 3000));

                    // Reload
                    await page.goto(googleUrl, { waitUntil: 'networkidle2', timeout: 20000 });
                    await new Promise(r => setTimeout(r, 2000));
                    console.log('   Page reloaded after CAPTCHA solve');
                }
            } else {
                console.log('   ❌ No sitekey found - cannot solve CAPTCHA');
                await browser.close();
                return;
            }
        } else {
            console.log('   ✅ No CAPTCHA - normal results page');
        }

        // Step 2: Find Zillow link
        console.log('\n2️⃣  Looking for Zillow link...');
        const zillowLink = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            for (const link of links) {
                const href = link.href || '';
                if (href.includes('zillow.com') && (href.includes('/homedetails/') || href.includes('/homes/'))) {
                    return href;
                }
            }
            return null;
        });

        if (!zillowLink) {
            console.log('   ❌ No Zillow link found');
            await page.screenshot({ path: path.join(__dirname, 'zillow-debug', 'google_no_link.png'), fullPage: true });
            await browser.close();
            return;
        }

        console.log(`   ✅ Found: ${zillowLink.substring(0, 80)}...`);

        // Step 3: Navigate to Zillow
        console.log('\n3️⃣  Navigating to Zillow...');
        await page.goto(zillowLink, { waitUntil: 'networkidle2', timeout: 25000 });
        await new Promise(r => setTimeout(r, 2000));

        const zillowTitle = await page.title();
        console.log(`   Page title: "${zillowTitle}"`);

        // Step 4: Extract Zestimate
        console.log('\n4️⃣  Extracting Zestimate...');
        const data = await page.evaluate(() => {
            const allText = document.body.innerText;

            // Method 1: Visible text
            const zestimateMatch = allText.match(/(?:Zestimate[®:]?\s*\$?([\d,]+)|\$?([\d,]+)\s*Zestimate)/i);
            if (zestimateMatch) {
                return { estimate: parseInt((zestimateMatch[1] || zestimateMatch[2]).replace(/,/g, '')), method: 'visible_text' };
            }

            // Method 2: __NEXT_DATA__
            const nextDataScript = document.getElementById('__NEXT_DATA__');
            if (nextDataScript) {
                try {
                    const text = nextDataScript.textContent || '';
                    const match = text.match(/"zestimate":(\d+)/);
                    if (match) return { estimate: parseInt(match[1]), method: '__NEXT_DATA__' };
                } catch (e) { }
            }

            return { estimate: 0, method: 'none' };
        });

        if (data.estimate > 0) {
            console.log(`   ✅ Zestimate: $${data.estimate.toLocaleString()} (via ${data.method})`);
        } else {
            console.log('   ❌ No Zestimate found');
            await page.screenshot({ path: path.join(__dirname, 'zillow-debug', 'zillow_no_estimate.png'), fullPage: true });
        }

        await browser.close();
        console.log('\n' + '='.repeat(60));
        console.log('Test complete!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await browser.close();
    }
}

testZillowViaGoogle();
