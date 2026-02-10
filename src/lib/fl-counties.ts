// FL county effective property tax rates (approximate % of market value)
// Source: FL Dept of Revenue — rates vary annually; these are reasonable estimates

export interface CountyTaxInfo {
    county: string;
    effectiveRate: number; // % of market value
}

export const FL_COUNTY_TAX_RATES: Record<string, number> = {
    'alachua': 1.07,
    'baker': 0.83,
    'bay': 0.82,
    'bradford': 0.93,
    'brevard': 0.97,
    'broward': 1.08,
    'calhoun': 0.76,
    'charlotte': 0.93,
    'citrus': 0.92,
    'clay': 0.94,
    'collier': 0.80,
    'columbia': 0.84,
    'desoto': 0.98,
    'dixie': 0.79,
    'duval': 1.01,
    'escambia': 0.88,
    'flagler': 0.97,
    'franklin': 0.68,
    'gadsden': 1.03,
    'gilchrist': 0.82,
    'glades': 0.97,
    'gulf': 0.70,
    'hamilton': 0.93,
    'hardee': 0.94,
    'hendry': 1.02,
    'hernando': 1.01,
    'highlands': 0.89,
    'hillsborough': 1.06,
    'holmes': 0.66,
    'indian river': 0.96,
    'jackson': 0.81,
    'jefferson': 0.88,
    'lafayette': 0.78,
    'lake': 0.99,
    'lee': 1.01,
    'leon': 1.04,
    'levy': 0.89,
    'liberty': 0.69,
    'madison': 0.86,
    'manatee': 0.99,
    'marion': 0.93,
    'martin': 0.91,
    'miami-dade': 1.02,
    'monroe': 0.63,
    'nassau': 0.85,
    'okaloosa': 0.76,
    'okeechobee': 1.02,
    'orange': 0.97,
    'osceola': 1.08,
    'palm beach': 1.05,
    'pasco': 1.03,
    'pinellas': 0.96,
    'polk': 0.97,
    'putnam': 1.01,
    'santa rosa': 0.76,
    'sarasota': 0.89,
    'seminole': 0.92,
    'st. johns': 0.83,
    'st. lucie': 1.09,
    'sumter': 0.92,
    'suwannee': 0.86,
    'taylor': 0.87,
    'union': 0.92,
    'volusia': 0.95,
    'wakulla': 0.86,
    'walton': 0.64,
    'washington': 0.72,
};

/**
 * Detect FL county from a full address string.
 * Looks for "County" in the string, or matches known FL county names.
 */
export function detectCountyFromAddress(address: string): string | null {
    const lower = address.toLowerCase();

    // Try to match "X County" pattern first
    const countyMatch = lower.match(/(\w[\w\s.-]*?)\s+county/);
    if (countyMatch) {
        const name = countyMatch[1].trim();
        if (FL_COUNTY_TAX_RATES[name] !== undefined) return name;
    }

    // Try direct city → county mapping for major FL cities
    const cityToCounty: Record<string, string> = {
        'miami': 'miami-dade',
        'fort lauderdale': 'broward',
        'west palm beach': 'palm beach',
        'boca raton': 'palm beach',
        'delray beach': 'palm beach',
        'boynton beach': 'palm beach',
        'jupiter': 'palm beach',
        'tampa': 'hillsborough',
        'st petersburg': 'pinellas',
        'saint petersburg': 'pinellas',
        'clearwater': 'pinellas',
        'orlando': 'orange',
        'kissimmee': 'osceola',
        'jacksonville': 'duval',
        'tallahassee': 'leon',
        'pensacola': 'escambia',
        'fort myers': 'lee',
        'cape coral': 'lee',
        'naples': 'collier',
        'sarasota': 'sarasota',
        'bradenton': 'manatee',
        'lakeland': 'polk',
        'daytona beach': 'volusia',
        'ocala': 'marion',
        'gainesville': 'alachua',
        'port st. lucie': 'st. lucie',
        'port saint lucie': 'st. lucie',
        'melbourne': 'brevard',
        'palm bay': 'brevard',
        'spring hill': 'hernando',
        'deland': 'volusia',
        'sanford': 'seminole',
        'altamonte springs': 'seminole',
        'port charlotte': 'charlotte',
        'punta gorda': 'charlotte',
        'homestead': 'miami-dade',
        'hialeah': 'miami-dade',
        'coral gables': 'miami-dade',
        'doral': 'miami-dade',
        'davie': 'broward',
        'hollywood': 'broward',
        'pompano beach': 'broward',
        'coral springs': 'broward',
        'pembroke pines': 'broward',
        'miramar': 'broward',
        'sunrise': 'broward',
        'plantation': 'broward',
        'deerfield beach': 'broward',
        'lauderhill': 'broward',
        'margate': 'broward',
        'coconut creek': 'broward',
        'tamarac': 'broward',
        'weston': 'broward',
        'north lauderdale': 'broward',
        'winter park': 'orange',
        'apopka': 'orange',
        'winter garden': 'orange',
        'ocoee': 'orange',
        'st. augustine': 'st. johns',
        'saint augustine': 'st. johns',
        'panama city': 'bay',
        'key west': 'monroe',
        'winter haven': 'polk',
        'bartow': 'polk',
        'haines city': 'polk',
        'oviedo': 'seminole',
        'lake mary': 'seminole',
        'longwood': 'seminole',
        'casselberry': 'seminole',
        'new smyrna beach': 'volusia',
        'ormond beach': 'volusia',
        'deltona': 'volusia',
        'palm coast': 'flagler',
        'venice': 'sarasota',
        'north port': 'sarasota',
        'estero': 'lee',
        'bonita springs': 'lee',
        'lehigh acres': 'lee',
        'marco island': 'collier',
        'immokalee': 'collier',
        'ave maria': 'collier',
        'riverview': 'hillsborough',
        'brandon': 'hillsborough',
        'plant city': 'hillsborough',
        'temple terrace': 'hillsborough',
        'valrico': 'hillsborough',
        'lutz': 'hillsborough',
        'new port richey': 'pasco',
        'wesley chapel': 'pasco',
        'zephyrhills': 'pasco',
        'land o lakes': 'pasco',
        'hudson': 'pasco',
        'the villages': 'sumter',
        'leesburg': 'lake',
        'clermont': 'lake',
        'tavares': 'lake',
        'eustis': 'lake',
        'mount dora': 'lake',
        'vero beach': 'indian river',
        'sebastian': 'indian river',
        'stuart': 'martin',
        'titusville': 'brevard',
        'cocoa': 'brevard',
        'rockledge': 'brevard',
        'merritt island': 'brevard',
    };

    for (const [city, county] of Object.entries(cityToCounty)) {
        if (lower.includes(city)) return county;
    }

    // Fallback: check if any county name appears directly in the address
    for (const county of Object.keys(FL_COUNTY_TAX_RATES)) {
        if (lower.includes(county)) return county;
    }

    return null;
}

/**
 * Get the effective property tax rate for a given FL county.
 * Returns 1.0 as the default if county not found.
 */
export function getCountyTaxRate(county: string | null): number {
    if (!county) return 1.0;
    return FL_COUNTY_TAX_RATES[county.toLowerCase()] ?? 1.0;
}
