// Core calculation types matching the spreadsheet structure

export interface OfferInputs {
    arv: number;              // After Repair Value
    asIsValue: number;        // Current As-Is Value
    repairEstimate: number;   // Estimated repair costs
    listPrice: number;        // Asking/List price
}

export interface OfferSettings {
    // Profit margins
    desiredGrossProfit: number;      // Default: 0.15 (15%)
    desiredGrossRevenue: number;     // Default: 0.30 (30%)

    // Interest & costs
    renovationInterestRate: number;  // Default: 0.15 (15%)
    novationCostsPercent: number;    // Default: 0.13 (13%)
    wholetailCostsPercent: number;   // Default: 0.20 (20%)

    // Reserves
    minProfitReserve: number;        // Default: 10000
    makeReadyReserve: number;        // Default: 5000

    // DOM & timing
    avgDaysOnMarket: number;         // Default: 60
    weeksPerTenK: number;            // Default: 2.5 weeks per $10k renovation
}

export interface SingleOfferResult {
    offerPrice: number;
    expectedProfit: number;
    marginPercent: number;
    closingDate: Date;
    isViable: boolean;
    terms: string;
    daysToClose: number;
}

export interface OfferResults {
    // Cash offers (wholesale)
    cashOffer1: SingleOfferResult;   // 1st offer @ 15% gross profit
    cashOffer2: SingleOfferResult;   // 2nd offer @ 22.5% gross (midpoint)
    cashOffer3: SingleOfferResult;   // 3rd offer @ 30% gross revenue
    maxWholesale: SingleOfferResult; // Max allowable before approval

    // Novation offers
    novationOnly: SingleOfferResult;

    // Renovation offers
    wholetail: SingleOfferResult;
    renovateToSell: SingleOfferResult;
    fixAndFlip: SingleOfferResult;

    // Summary
    exitStrategies: string[];
    bestOffer: SingleOfferResult;
    bestStrategy: string;
}

// Default settings matching the spreadsheet
export const DEFAULT_SETTINGS: OfferSettings = {
    desiredGrossProfit: 0.15,
    desiredGrossRevenue: 0.30,
    renovationInterestRate: 0.15,
    novationCostsPercent: 0.13,
    wholetailCostsPercent: 0.20,
    minProfitReserve: 10000,
    makeReadyReserve: 5000,
    avgDaysOnMarket: 60,
    weeksPerTenK: 2.5,
};

/**
 * Round down to the nearest increment (e.g., $1,100 for MLS listing)
 */
function roundDownTo(value: number, increment: number): number {
    return Math.floor(value / increment) * increment;
}

/**
 * Calculate discount to sell fast (greater of $15k or 5% of value)
 */
function calcDiscountToSellFast(value: number): number {
    return Math.max(15000, value * 0.05);
}

/**
 * Calculate business days from today, excluding weekends
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    let daysAdded = 0;

    while (daysAdded < businessDays) {
        result.setDate(result.getDate() + 1);
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            daysAdded++;
        }
    }

    return result;
}

/**
 * Calculate renovation time based on repair estimate
 */
function calcRenovationDays(repairEstimate: number, weeksPerTenK: number): number {
    const weeks = (repairEstimate / 10000) * weeksPerTenK;
    return Math.ceil(weeks * 7);
}

/**
 * Main calculation engine - replicates all spreadsheet formulas
 */
export function calculateOffers(
    inputs: OfferInputs,
    settings: OfferSettings = DEFAULT_SETTINGS
): OfferResults {
    const { arv, asIsValue, repairEstimate, listPrice } = inputs;
    const today = new Date();

    // Validate inputs
    if (arv <= 0 || asIsValue <= 0) {
        return getEmptyResults();
    }

    // ===========================================
    // CASH OFFERS (Wholesale) - Classic MAO Formula
    // MAO = ARV × Percentage - Repairs
    // ===========================================

    // Conservative: 60% of ARV - Repairs (highest profit margin)
    const cashOffer1Price = arv * 0.60 - repairEstimate;
    const cashOffer1Profit = arv - cashOffer1Price - repairEstimate;

    // Standard: 70% of ARV - Repairs (industry standard)
    const cashOffer2Price = arv * 0.70 - repairEstimate;
    const cashOffer2Profit = arv - cashOffer2Price - repairEstimate;

    // Aggressive: 80% of ARV - Repairs (thinner margin, competitive)
    const cashOffer3Price = arv * 0.80 - repairEstimate;
    const cashOffer3Profit = arv - cashOffer3Price - repairEstimate;

    // Max Wholesale: 85% of ARV - Repairs (last resort before walking)
    const maxWholesalePrice = arv * 0.85 - repairEstimate;
    const maxWholesaleProfit = arv - maxWholesalePrice - repairEstimate;

    // Wholesale closing: 30 business days
    const wholesaleClosingDays = 45;
    const wholesaleClosingDate = addBusinessDays(today, 30);

    // ===========================================
    // NOVATION-ONLY OFFER
    // ===========================================

    // Novation-Only calculation from spreadsheet
    // As-Is Value - Discount to Sell Fast = MLS List Price
    const discountToSellFast = calcDiscountToSellFast(asIsValue);
    const mlsListPrice = roundDownTo(asIsValue - discountToSellFast, 1100);

    // Closing costs, realtor commissions, price drops (default 15%)
    const closingCostsPercent = settings.novationCostsPercent + 0.02; // 13% + 2% buffer
    const closingCosts = mlsListPrice * closingCostsPercent;

    // Max Novation-Only Offer = MLS List Price - Costs - Reserves - Min Profit
    const novationOnlyPrice = mlsListPrice - closingCosts - settings.makeReadyReserve - settings.minProfitReserve;
    const novationOnlyProfit = mlsListPrice - novationOnlyPrice - closingCosts - settings.makeReadyReserve;

    // Novation closing: 60 business days + buffer + DOM
    const novationClosingDays = 90 + settings.avgDaysOnMarket;
    const novationClosingDate = addBusinessDays(today, 60 + Math.ceil(settings.avgDaysOnMarket * 0.7));

    // ===========================================
    // WHOLETAIL OFFER
    // ===========================================

    // Wholetail: Light rehab, relist at As-Is value or slightly above
    // Costs are higher (20%) due to holding costs
    const wholetailListPrice = roundDownTo(asIsValue, 1000);
    const wholetailCosts = wholetailListPrice * settings.wholetailCostsPercent;

    // Include interest on renovation loan
    const renovationDays = calcRenovationDays(repairEstimate, settings.weeksPerTenK);
    const renovationInterest = repairEstimate * settings.renovationInterestRate * (renovationDays / 365);

    const wholetailPrice = wholetailListPrice - wholetailCosts - repairEstimate - renovationInterest - settings.minProfitReserve;
    const wholetailProfit = wholetailListPrice - wholetailPrice - repairEstimate - wholetailCosts - renovationInterest;

    // Wholetail closing: Reno time + DOM + buffer
    const wholetailClosingDays = renovationDays + settings.avgDaysOnMarket + 30;
    const wholetailClosingDate = addBusinessDays(today, Math.ceil(wholetailClosingDays * 0.7));

    // ===========================================
    // RENOVATE TO SELL (RTS) / NOVATION FIX & FLIP
    // ===========================================

    // RTS uses ARV as target sale price
    const rtsListPrice = roundDownTo(arv, 1000);
    const rtsCosts = rtsListPrice * settings.novationCostsPercent;
    const rtsRenovationInterest = repairEstimate * settings.renovationInterestRate * ((renovationDays + settings.avgDaysOnMarket) / 365);

    const rtsPrice = rtsListPrice - rtsCosts - repairEstimate - rtsRenovationInterest - settings.minProfitReserve;
    const rtsProfit = rtsListPrice - rtsPrice - repairEstimate - rtsCosts - rtsRenovationInterest;

    // RTS closing: Reno time + DOM + significant buffer
    const rtsClosingDays = renovationDays + settings.avgDaysOnMarket + 60;
    const rtsClosingDate = addBusinessDays(today, Math.ceil(rtsClosingDays * 0.7));

    // ===========================================
    // FIX & FLIP (Traditional)
    // ===========================================

    // Fix & Flip: We buy, renovate, sell at ARV with slight discount
    const flipListPrice = roundDownTo(arv * 0.97, 1000); // 3% discount to sell faster
    const flipCosts = flipListPrice * settings.wholetailCostsPercent;
    const flipRenovationInterest = repairEstimate * settings.renovationInterestRate * ((renovationDays + settings.avgDaysOnMarket) / 365);

    const flipPrice = flipListPrice - flipCosts - repairEstimate - flipRenovationInterest - settings.minProfitReserve * 1.5;
    const flipProfit = flipListPrice - flipPrice - repairEstimate - flipCosts - flipRenovationInterest;

    // Flip closing: same as RTS
    const flipClosingDays = renovationDays + settings.avgDaysOnMarket + 60;
    const flipClosingDate = addBusinessDays(today, Math.ceil(flipClosingDays * 0.7));

    // ===========================================
    // BUILD RESULTS
    // ===========================================

    const buildResult = (
        price: number,
        profit: number,
        salesPrice: number,
        closingDate: Date,
        daysToClose: number,
        terms: string
    ): SingleOfferResult => ({
        offerPrice: Math.max(0, Math.round(price)),
        expectedProfit: Math.round(profit),
        marginPercent: salesPrice > 0 ? (profit / salesPrice) * 100 : 0,
        closingDate,
        // Fixed: Only check listPrice if it's actually set (> 0)
        isViable: profit >= settings.minProfitReserve && price > 0 && (listPrice <= 0 || price <= listPrice),
        terms,
        daysToClose,
    });

    const results: OfferResults = {
        cashOffer1: buildResult(
            cashOffer1Price, cashOffer1Profit, arv, wholesaleClosingDate, wholesaleClosingDays,
            '$1,000 Refundable EMD, we pay all closing costs, 5 Biz Days Option Period, 30 Biz Days to close'
        ),
        cashOffer2: buildResult(
            cashOffer2Price, cashOffer2Profit, arv, wholesaleClosingDate, wholesaleClosingDays,
            '$1,000 Refundable EMD, we pay all closing costs, 5 Biz Days Option Period, 30 Biz Days to close'
        ),
        cashOffer3: buildResult(
            cashOffer3Price, cashOffer3Profit, arv, wholesaleClosingDate, wholesaleClosingDays,
            '$1,000 Refundable EMD, we pay all closing costs, 45 Biz Day Option Period, 5 Biz Days to close after'
        ),
        maxWholesale: buildResult(
            maxWholesalePrice, maxWholesaleProfit, arv, wholesaleClosingDate, wholesaleClosingDays,
            'Max offer before management approval needed'
        ),
        novationOnly: buildResult(
            novationOnlyPrice, novationOnlyProfit, mlsListPrice, novationClosingDate, novationClosingDays,
            '$500 Refundable EMD, Seller pays own closing costs, 90 Biz Day Option Period, right to list in MLS'
        ),
        wholetail: buildResult(
            wholetailPrice, wholetailProfit, wholetailListPrice, wholetailClosingDate, wholetailClosingDays,
            'We take it down to do min. repairs & relist'
        ),
        renovateToSell: buildResult(
            rtsPrice, rtsProfit, rtsListPrice, rtsClosingDate, rtsClosingDays,
            'Partner program with seller, novation + renovation'
        ),
        fixAndFlip: buildResult(
            flipPrice, flipProfit, flipListPrice, flipClosingDate, flipClosingDays,
            'Traditional flip with slight discount to sell faster'
        ),
        exitStrategies: [],
        bestOffer: {} as SingleOfferResult,
        bestStrategy: '',
    };

    // Determine viable exit strategies (excluding novation-based strategies)
    // Note: Novation calculations are preserved in results for future use if needed
    const strategies: { name: string; offer: SingleOfferResult }[] = [
        { name: 'Wholesale', offer: results.cashOffer3 },
        // { name: 'Novation-Only', offer: results.novationOnly }, // Currently not used
        { name: 'Wholetail', offer: results.wholetail },
        // { name: 'Renovate to Sell', offer: results.renovateToSell }, // Currently not used
        { name: 'Fix & Flip', offer: results.fixAndFlip },
    ];

    results.exitStrategies = strategies
        .filter(s => s.offer.isViable)
        .map(s => s.name);

    // Find best offer (highest viable offer price)
    const viableStrategies = strategies.filter(s => s.offer.isViable);
    if (viableStrategies.length > 0) {
        const best = viableStrategies.reduce((a, b) =>
            a.offer.offerPrice > b.offer.offerPrice ? a : b
        );
        results.bestOffer = best.offer;
        results.bestStrategy = best.name;
    } else {
        results.bestOffer = results.cashOffer3;
        results.bestStrategy = 'None viable';
    }

    return results;
}

function getEmptyResults(): OfferResults {
    const emptyOffer: SingleOfferResult = {
        offerPrice: 0,
        expectedProfit: 0,
        marginPercent: 0,
        closingDate: new Date(),
        isViable: false,
        terms: '',
        daysToClose: 0,
    };

    return {
        cashOffer1: emptyOffer,
        cashOffer2: emptyOffer,
        cashOffer3: emptyOffer,
        maxWholesale: emptyOffer,
        novationOnly: emptyOffer,
        wholetail: emptyOffer,
        renovateToSell: emptyOffer,
        fixAndFlip: emptyOffer,
        exitStrategies: [],
        bestOffer: emptyOffer,
        bestStrategy: '',
    };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
