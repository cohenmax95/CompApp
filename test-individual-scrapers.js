// Test each AVM scraper individually
const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";

const scrapers = [
    'NARRPR',
    'Redfin',
    'ComeHome',
    'Realtor.com',
    'Trulia',
    'Bank of America',
    'Xome',
    'Eppraisal',
    'PennyMac',
    'HomeLight',
    'Century21',
    'Zillow'
];

async function testScraper(name) {
    console.log(`\n🔍 Testing ${name}...`);
    try {
        const response = await fetch('http://localhost:3000/api/avm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        const data = await response.json();

        const result = data.results?.find(r => r.source === name);
        if (result?.estimate) {
            console.log(`   ✅ $${result.estimate.toLocaleString()}`);
            return { name, estimate: result.estimate, works: true };
        } else {
            console.log(`   ❌ No estimate`);
            return { name, works: false };
        }
    } catch (e) {
        console.log(`   ❌ Error: ${e.message}`);
        return { name, works: false, error: e.message };
    }
}

async function testAll() {
    console.log('🏠 TESTING ALL SCRAPERS INDIVIDUALLY');
    console.log('Address:', address);
    console.log('='.repeat(60));

    const results = [];

    for (const scraper of scrapers) {
        const result = await testScraper(scraper);
        results.push(result);
        // Wait between tests to avoid overwhelming the server
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:\n');

    const working = results.filter(r => r.works);
    const failed = results.filter(r => !r.works);

    console.log(`✅ WORKING (${working.length}):`);
    working.forEach(r => {
        console.log(`   ${r.name.padEnd(20)} $${r.estimate?.toLocaleString()}`);
    });

    console.log(`\n❌ NOT WORKING (${failed.length}):`);
    failed.forEach(r => {
        console.log(`   ${r.name}`);
    });
}

testAll();
