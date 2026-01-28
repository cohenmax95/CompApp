// AVM (Automated Valuation Model) types

export interface AVMResult {
    source: string;
    estimate: number;
    low: number;
    high: number;
    lastUpdated: string;
    url?: string;
    comps?: Array<{
        address: string;
        price: number;
        sqft?: number;
        beds?: number;
        baths?: number;
        soldDate?: string;
        distance?: string;
        pricePerSqft?: number;
    }>;
}

export interface PropertyData {
    sqft: number;
    beds: number;
    baths: number;
    yearBuilt: number;
    lotSize: number;
    // Additional fields from RentCast API
    propertyType?: string;
    lastSaleDate?: string;
    lastSalePrice?: number;
    county?: string;
    subdivision?: string;
}

export interface AVMFetchResult {
    address: string;
    results: AVMResult[];
    propertyData: PropertyData;
    errors: string[];
    fetchedAt: string;
}

// Parse address into components for API queries
export interface ParsedAddress {
    streetNumber: string;
    streetName: string;
    city: string;
    state: string;
    zipCode: string;
    fullAddress: string;
}

export function parseAddress(address: string): ParsedAddress | null {
    const cleanAddress = address.trim();
    if (!cleanAddress) return null;

    const parts = cleanAddress.split(',').map(p => p.trim());
    if (parts.length < 2) return null;

    const streetParts = parts[0].match(/^(\d+)\s+(.+)$/);
    const streetNumber = streetParts?.[1] || '';
    const streetName = streetParts?.[2] || parts[0];
    const city = parts[1] || '';

    let state = '';
    let zipCode = '';

    if (parts.length >= 3) {
        const stateZip = parts[2].trim();
        const stateZipMatch = stateZip.match(/^([A-Z]{2})\s*(\d{5})?/i);
        if (stateZipMatch) {
            state = stateZipMatch[1].toUpperCase();
            zipCode = stateZipMatch[2] || '';
        } else {
            state = stateZip;
        }
    }

    if (parts.length >= 4) {
        const possibleZip = parts[3].trim();
        if (/^\d{5}/.test(possibleZip)) {
            zipCode = possibleZip.slice(0, 5);
        }
    }

    return { streetNumber, streetName, city, state, zipCode, fullAddress: cleanAddress };
}

export function formatAVMCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// Rehab levels from spreadsheet - $/sq ft ranges
// Each level has a low and high estimate per sq ft
export interface RehabLevel {
    id: number;
    label: string;
    shortLabel: string;
    lowPerSqft: number;
    highPerSqft: number;
    description: string;
}

export const REHAB_LEVELS: RehabLevel[] = [
    { id: 10, label: '10) Move-In Ready', shortLabel: 'Move-In', lowPerSqft: 5, highPerSqft: 8, description: 'Very Rare! EXCELLENT' },
    { id: 9, label: '9) Minor Touch Ups', shortLabel: 'Touch Up', lowPerSqft: 8, highPerSqft: 12, description: 'Near Perfect - GREAT' },
    { id: 8, label: '8) Very Light Reno', shortLabel: 'Light', lowPerSqft: 12, highPerSqft: 22, description: 'Great Condition, Few Updates' },
    { id: 7, label: '7) Cosmetic Reno', shortLabel: 'Cosmetic', lowPerSqft: 25, highPerSqft: 35, description: 'Good Condition, Dated' },
    { id: 6, label: '6) Moderate Rehab', shortLabel: 'Moderate', lowPerSqft: 40, highPerSqft: 55, description: 'Livable, Needs Full Remodel' },
    { id: 5, label: '5) Major Rehab', shortLabel: 'Major', lowPerSqft: 55, highPerSqft: 75, description: "Ugly But Livable - Grandma's House" },
    { id: 4, label: '4) Significant Rehab', shortLabel: 'Significant', lowPerSqft: 75, highPerSqft: 90, description: 'Ugly & Unlivable' },
    { id: 3, label: '3) Extensive + Structural', shortLabel: 'Gut Job', lowPerSqft: 90, highPerSqft: 115, description: 'Full Gut Job - YIKES' },
    { id: 2, label: '2) Major Structural', shortLabel: 'Structural', lowPerSqft: 115, highPerSqft: 175, description: 'To The Studs Rehab' },
    { id: 1, label: '1) Tear-Down', shortLabel: 'Tear Down', lowPerSqft: 200, highPerSqft: 300, description: 'Nothing Salvageable' },
];

// Calculate repair estimate with 20% buffer (from spreadsheet B184)
export function calculateRepairEstimate(sqft: number, level: RehabLevel): { low: number; median: number; high: number } {
    const buffer = 0.20; // 20% margin of error from spreadsheet
    const lowBase = sqft * level.lowPerSqft;
    const highBase = sqft * level.highPerSqft;

    // Apply buffer and round to nearest $1,000
    const low = Math.round((lowBase * (1 + buffer)) / 1000) * 1000;
    const high = Math.round((highBase * (1 + buffer)) / 1000) * 1000;
    const median = Math.round(((low + high) / 2) / 1000) * 1000;

    return { low, median, high };
}
