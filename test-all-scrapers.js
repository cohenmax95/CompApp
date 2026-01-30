// Test each AVM scraper individually
const testAddress = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";

async function testScrapers() {
    console.log(`\n🏠 Testing all scrapers for: ${testAddress}\n`);
    console.log('='.repeat(60));

    const scrapers = [
        'NARRPR',
        'Zillow',
        'Redfin',
        'Realtor.com',
        'Trulia',
        'ComeHome',
        'Bank of America',
        'Xome'
    ];

    for (const scraper of scrapers) {
        console.log(`\n📍 Testing ${scraper}...`);
        const start = Date.now();

        try {
            const res = await fetch('http://localhost:3000/api/avm/test-single', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: testAddress, source: scraper })
            });

            const data = await res.json();
            const elapsed = ((Date.now() - start) / 1000).toFixed(1);

            if (data.estimate) {
                console.log(`   ✅ ${scraper}: $${data.estimate.toLocaleString()} (${elapsed}s)`);
                if (data.propertyData?.sqft) {
                    console.log(`      📐 ${data.propertyData.sqft} sqft, ${data.propertyData.beds} bed, ${data.propertyData.baths} bath`);
                }
                if (data.comps?.length) {
                    console.log(`      🏘️  ${data.comps.length} comparable sales`);
                }
            } else {
                console.log(`   ❌ ${scraper}: No estimate (${elapsed}s)`);
                if (data.error) console.log(`      Error: ${data.error}`);
            }
        } catch (error) {
            console.log(`   ❌ ${scraper}: Failed - ${error.message}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('Test complete!\n');
}

testScrapers();
