'use client';

import { OfferResults, formatCurrency } from '@/lib/calculations';
import OfferCard from './OfferCard';

interface OfferResultsDisplayProps {
    results: OfferResults;
    hasInputs: boolean;
}

export default function OfferResultsDisplay({ results, hasInputs }: OfferResultsDisplayProps) {
    if (!hasInputs) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Enter Property Values</h3>
                <p className="text-slate-400">Add ARV, As-Is Value, and Repair Estimate to calculate offers</p>
            </div>
        );
    }

    // Icons for each offer type
    const icons = {
        wholesale: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        wholetail: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        flip: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
        ),
    };

    // Filter out novation-related strategies from exit strategies display
    const filteredExitStrategies = results.exitStrategies.filter(
        s => !s.toLowerCase().includes('novation') && !s.toLowerCase().includes('renovate to sell')
    );

    // Determine best non-novation strategy
    const nonNovationBest = results.bestStrategy?.toLowerCase().includes('novation') ||
        results.bestStrategy?.toLowerCase().includes('renovate to sell')
        ? (filteredExitStrategies[0] || 'Wholesale')
        : results.bestStrategy;

    return (
        <div className="space-y-6">
            {/* Summary Header */}
            {nonNovationBest && nonNovationBest !== 'None viable' && (
                <div className="glass-card p-5 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <p className="text-sm text-blue-300">Best Exit Strategy</p>
                            <p className="text-2xl font-bold text-white">{nonNovationBest}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-blue-300">Best Offer Price</p>
                            <p className="text-2xl font-bold gradient-text">{formatCurrency(results.bestOffer.offerPrice)}</p>
                        </div>
                        {filteredExitStrategies.length > 0 && (
                            <div className="w-full text-sm text-slate-300">
                                <span className="font-medium">{filteredExitStrategies.length}</span> viable strategies: {filteredExitStrategies.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Cash Offers Section */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Wholesale Offers (MAO)
                </h3>
                <div className="offer-grid">
                    <OfferCard
                        title="60% of ARV"
                        subtitle="Conservative"
                        offer={results.cashOffer1}
                        colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600"
                        icon={icons.wholesale}
                    />
                    <OfferCard
                        title="70% of ARV"
                        subtitle="Standard"
                        offer={results.cashOffer2}
                        colorClass="bg-gradient-to-br from-emerald-600 to-teal-600"
                        icon={icons.wholesale}
                        isHighlighted={nonNovationBest === 'Wholesale'}
                    />
                    <OfferCard
                        title="80% of ARV"
                        subtitle="Aggressive"
                        offer={results.cashOffer3}
                        colorClass="bg-gradient-to-br from-teal-500 to-cyan-600"
                        icon={icons.wholesale}
                    />
                    <OfferCard
                        title="85% of ARV"
                        subtitle="Max Offer"
                        offer={results.maxWholesale}
                        colorClass="bg-gradient-to-br from-slate-600 to-slate-700"
                        icon={icons.wholesale}
                    />
                </div>
            </div>

            {/* Renovation Strategies Section (No Novation) */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Renovation Strategies
                </h3>
                <div className="offer-grid">
                    <OfferCard
                        title="Wholetail"
                        subtitle="Min. Repairs & Relist"
                        offer={results.wholetail}
                        colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
                        icon={icons.wholetail}
                        isHighlighted={nonNovationBest === 'Wholetail'}
                    />
                    <OfferCard
                        title="Fix & Flip"
                        subtitle="Full Renovation"
                        offer={results.fixAndFlip}
                        colorClass="bg-gradient-to-br from-red-500 to-rose-600"
                        icon={icons.flip}
                        isHighlighted={nonNovationBest === 'Fix & Flip'}
                    />
                </div>
            </div>
        </div>
    );
}
