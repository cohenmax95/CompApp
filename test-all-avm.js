// Test all 12 AVM scrapers individually
const address = "779 Hibiscus Dr, Royal Palm Beach, FL 33411";

async function testAll() {
    console.log('🏠 TESTING ALL 12 AVM SCRAPERS');
    console.log('Address:', address);
    console.log('='.repeat(60));

    try {
        const response = await fetch('http://localhost:3000/api/avm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
        });

        const data = await response.json();

        console.log('\n📊 RESULTS:\n');

        if (data.results && data.results.length > 0) {
            const working = data.results.filter(r => r.estimate);
            const failed = data.results.filter(r => !r.estimate);

            console.log(`✅ WORKING (${working.length}):`);
            working.forEach(r => {
                console.log(`   ${r.source.padEnd(20)} $${r.estimate?.toLocaleString() || 'N/A'}`);
            });

            console.log(`\n❌ NO DATA (${failed.length}):`);
            failed.forEach(r => {
                console.log(`   ${r.source}`);
            });

            if (data.aggregated) {
                console.log('\n📈 AGGREGATED:');
                console.log(`   Average: $${data.aggregated.avgEstimate?.toLocaleString()}`);
                console.log(`   Range: $${data.aggregated.lowEstimate?.toLocaleString()} - $${data.aggregated.highEstimate?.toLocaleString()}`);
            }
        } else {
            console.log('No results returned');
        }

        console.log('\n' + '='.repeat(60));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testAll();
