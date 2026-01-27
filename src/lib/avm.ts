// AVM (Automated Valuation Model) types

export interface AVMResult {
    source: string;
    estimate: number;
    low: number;
    high: number;
    lastUpdated: string;
    url?: string;
}

export interface AVMFetchResult {
    address: string;
    results: AVMResult[];
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
    // Simple address parser - handles common formats
    // Example: "123 Main St, Miami, FL 33101"

    const cleanAddress = address.trim();
    if (!cleanAddress) return null;

    // Try to extract components
    const parts = cleanAddress.split(',').map(p => p.trim());

    if (parts.length < 2) {
        return null;
    }

    // Street address
    const streetParts = parts[0].match(/^(\d+)\s+(.+)$/);
    const streetNumber = streetParts?.[1] || '';
    const streetName = streetParts?.[2] || parts[0];

    // City
    const city = parts[1] || '';

    // State and Zip
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

    // Check for zip in last part
    if (parts.length >= 4) {
        const possibleZip = parts[3].trim();
        if (/^\d{5}/.test(possibleZip)) {
            zipCode = possibleZip.slice(0, 5);
        }
    }

    return {
        streetNumber,
        streetName,
        city,
        state,
        zipCode,
        fullAddress: cleanAddress,
    };
}

// Format currency for display
export function formatAVMCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}
