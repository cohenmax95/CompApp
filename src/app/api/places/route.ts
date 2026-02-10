import { NextRequest, NextResponse } from 'next/server';

// Google Maps API Key
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || 'AIzaSyAkxeGZUHnkU9PrAt-4wPtntT8yM1gLJVE';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const input = searchParams.get('input');

    if (!input || input.length < 3) {
        return NextResponse.json({ predictions: [] });
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&components=country:us&key=${GOOGLE_API_KEY}`
        );

        if (!response.ok) {
            console.error('Google Places API error:', response.status);
            return NextResponse.json({ predictions: [], error: 'API error' });
        }

        const data = await response.json();

        return NextResponse.json({
            predictions: data.predictions?.map((p: { description: string; place_id: string }) => ({
                description: p.description,
                placeId: p.place_id,
            })) || [],
        });
    } catch (error) {
        console.error('Places autocomplete error:', error);
        return NextResponse.json({ predictions: [], error: 'Failed to fetch' });
    }
}
