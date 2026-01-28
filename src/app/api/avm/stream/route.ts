import { NextRequest } from 'next/server';
import { parseAddress, PropertyData } from '@/lib/avm';
import puppeteer, { Browser, Page } from 'puppeteer';

// Import from main route - we'll re-export the scraper functions
// For now, we define a simplified streaming version

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
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        },
        close: () => {
            controller.close();
        },
    };
}

// Simplified RentCast fetch for streaming
async function fetchRentCastStreaming(address: string): Promise<{
    estimate?: number;
    low?: number;
    high?: number;
    rentEstimate?: number;
    url: string;
    propertyData?: Partial<PropertyData>;
} | null> {
    try {
        const valueUrl = `https://api.rentcast.io/v1/avm/value?address=${encodeURIComponent(address)}`;
        const valueRes = await fetch(valueUrl, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': RENTCAST_API_KEY,
            },
        });

        if (!valueRes.ok) {
            console.error('RentCast value API error:', valueRes.status);
            return null;
        }

        const valueData = await valueRes.json();

        if (valueData.price || valueData.priceHigh) {
            const estimate = valueData.price || Math.round((valueData.priceLow + valueData.priceHigh) / 2);
            const subject = valueData.subjectProperty || {};

            return {
                estimate,
                low: valueData.priceRangeLow || Math.round(estimate * 0.95),
                high: valueData.priceRangeHigh || Math.round(estimate * 1.05),
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
            };
        }

        return { url: `https://app.rentcast.io/app?address=${encodeURIComponent(address)}` };
    } catch (error) {
        console.error('RentCast API error:', error);
        return null;
    }
}

// Streaming AVM endpoint using Server-Sent Events
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

    // Process sources in background
    (async () => {
        const sources = [
            { name: 'RentCast', fn: fetchRentCastStreaming },
            // Web scrapers would go here but they require Puppeteer which doesn't stream well
            // The UI will show these as 'checking' status
        ];

        // Send initial status for all sources
        const allSourceNames = [
            'RentCast', 'Zillow', 'Redfin', 'Realtor.com',
            'Trulia', 'ComeHome', 'Bank of America', 'Xome'
        ];

        for (const name of allSourceNames) {
            send({ source: name, status: 'checking' });
        }

        // Fetch RentCast first (API - fast and reliable)
        try {
            const result = await fetchRentCastStreaming(address);
            if (result?.estimate) {
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
                send({ source: 'RentCast', status: 'not_found' });
            }
        } catch (e) {
            send({ source: 'RentCast', status: 'error', error: String(e) });
        }

        // Mark web scrapers as not available (require server Puppeteer)
        // In production on Railway, these would actually run
        const webScrapers = ['Zillow', 'Redfin', 'Realtor.com', 'Trulia', 'ComeHome', 'Bank of America', 'Xome'];
        for (const name of webScrapers) {
            // Small delay to show the checking animation
            await new Promise(r => setTimeout(r, 200));
            send({
                source: name,
                status: 'not_found',
                error: 'Web scraping requires server deployment'
            });
        }

        // Signal completion
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
