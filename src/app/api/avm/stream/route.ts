import { NextRequest } from 'next/server';
import { parseAddress, PropertyData } from '@/lib/avm';

// RentCast API key for property valuations
const RENTCAST_API_KEY = '647e5f595c784cdba15fc418d95d3541';

interface SourceStatus {
    source: string;
    status: 'checking' | 'found' | 'not_found' | 'error';
    estimate?: number;
    low?: number;
    high?: number;
    url?: string;
    propertyData?: Partial<PropertyData>;
    error?: string;
}

// Stream helper
function createSSEStream() {
    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController<Uint8Array>;

    const stream = new ReadableStream({
        start(c) {
            controller = c;
        },
    });

    return {
        stream,
        send: (data: SourceStatus) => {
            try {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
            } catch (e) {
                console.error('Error sending SSE:', e);
            }
        },
        close: () => {
            try {
                controller.close();
            } catch (e) {
                console.error('Error closing SSE:', e);
            }
        },
    };
}

// RentCast API fetch with proper error handling
async function fetchRentCast(address: string): Promise<{
    estimate?: number;
    low?: number;
    high?: number;
    rentEstimate?: number;
    rentLow?: number;
    rentHigh?: number;
    url: string;
    propertyData?: Partial<PropertyData>;
    comps?: Array<{
        address: string;
        price: number;
        sqft: number;
        beds: number;
        baths: number;
        correlation: number;
        distance: number;
        daysOld: number;
    }>;
} | null> {
    try {
        console.log('[Stream] Fetching RentCast for:', address);

        const valueUrl = `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`;
        const valueRes = await fetch(valueUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': RENTCAST_API_KEY,
            },
        });

        if (!valueRes.ok) {
            console.error('[Stream] RentCast API error:', valueRes.status);
            return null;
        }

        const valueData = await valueRes.json();
        console.log('[Stream] RentCast response received');

        // Also fetch rent estimate
        let rentEstimate = 0;
        let rentLow = 0;
        let rentHigh = 0;
        try {
            const rentUrl = `https://api.rentcast.io/v1/avm/rent?address=${encodeURIComponent(address)}`;
            const rentRes = await fetch(rentUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Api-Key': RENTCAST_API_KEY,
                },
            });
            if (rentRes.ok) {
                const rentData = await rentRes.json();
                rentEstimate = rentData.rent || 0;
                rentLow = rentData.rentRangeLow || 0;
                rentHigh = rentData.rentRangeHigh || 0;
            }
        } catch (e) {
            console.log('[Stream] Rent API skipped:', e);
        }

        if (valueData.price || valueData.priceHigh) {
            const estimate = valueData.price || Math.round((valueData.priceLow + valueData.priceHigh) / 2);
            const subject = valueData.subjectProperty || {};

            // Extract comps
            const comps = (valueData.comparables || []).map((comp: {
                formattedAddress?: string;
                price?: number;
                squareFootage?: number;
                bedrooms?: number;
                bathrooms?: number;
                correlation?: number;
                distance?: number;
                daysOld?: number;
            }) => ({
                address: comp.formattedAddress || '',
                price: comp.price || 0,
                sqft: comp.squareFootage || 0,
                beds: comp.bedrooms || 0,
                baths: comp.bathrooms || 0,
                correlation: comp.correlation || 0,
                distance: comp.distance || 0,
                daysOld: comp.daysOld || 0,
            }));

            return {
                estimate,
                low: valueData.priceRangeLow || Math.round(estimate * 0.95),
                high: valueData.priceRangeHigh || Math.round(estimate * 1.05),
                rentEstimate,
                rentLow,
                rentHigh,
                url: `https://app.rentcast.io/app?address=${encodeURIComponent(address)}`,
                propertyData: {
                    sqft: subject.squareFootage || 0,
                    beds: subject.bedrooms || 0,
                    baths: subject.bathrooms || 0,
                    yearBuilt: subject.yearBuilt || 0,
                    lotSize: subject.lotSize || 0,
                    propertyType: subject.propertyType || '',
                    lastSaleDate: subject.lastSaleDate || '',
                    lastSalePrice: subject.lastSalePrice || 0,
                },
                comps,
            };
        }

        return null;
    } catch (error) {
        console.error('[Stream] RentCast error:', error);
        return null;
    }
}

// Streaming AVM endpoint - ONLY uses RentCast API (no Puppeteer scrapers)
// This is fast and reliable - scrapers are deprecated due to unreliability
export async function GET(request: NextRequest) {
    const address = request.nextUrl.searchParams.get('address');

    if (!address) {
        return new Response(JSON.stringify({ error: 'Address is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const parsed = parseAddress(address);
    if (!parsed) {
        return new Response(JSON.stringify({ error: 'Could not parse address' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { stream, send, close } = createSSEStream();

    // Process in background - non-blocking
    (async () => {
        console.log('[Stream] Starting AVM lookup for:', address);

        // All source names for UI display
        const allSourceNames = [
            'RentCast', 'Zillow', 'Redfin', 'Realtor.com',
            'Trulia', 'ComeHome', 'Bank of America', 'Xome'
        ];

        // Send initial 'checking' status for all sources
        for (const name of allSourceNames) {
            send({ source: name, status: 'checking' });
            await new Promise(r => setTimeout(r, 50)); // Small stagger for visual effect
        }

        // Fetch RentCast (the only reliable source)
        try {
            const result = await fetchRentCast(address);

            if (result?.estimate) {
                console.log('[Stream] RentCast found:', result.estimate);
                send({
                    source: 'RentCast',
                    status: 'found',
                    estimate: result.estimate,
                    low: result.low,
                    high: result.high,
                    url: result.url,
                    propertyData: result.propertyData,
                });
            } else {
                console.log('[Stream] RentCast returned no estimate');
                send({ source: 'RentCast', status: 'not_found' });
            }
        } catch (e) {
            console.error('[Stream] RentCast error:', e);
            send({ source: 'RentCast', status: 'error', error: String(e) });
        }

        // Mark all web scrapers as unavailable (they're unreliable on Railway)
        // Show them with small delays so user sees the "checking" animation
        const webScrapers = ['Zillow', 'Redfin', 'Realtor.com', 'Trulia', 'ComeHome', 'Bank of America', 'Xome'];
        for (const name of webScrapers) {
            await new Promise(r => setTimeout(r, 150)); // Stagger for visual effect
            send({
                source: name,
                status: 'not_found',
                error: 'Scraper unavailable'
            });
        }

        // Signal completion
        console.log('[Stream] Complete');
        send({ source: '_complete', status: 'found' });
        close();
    })();

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
