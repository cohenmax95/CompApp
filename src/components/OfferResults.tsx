'use client';

import { useState } from 'react';
import { OfferResults, formatCurrency } from '@/lib/calculations';
import OfferCard from './OfferCard';
import FixFlipCalculator from './FixFlipCalculator';

interface OfferResultsDisplayProps {
    results: OfferResults;
    hasInputs: boolean;
    arv: number;
    repairEstimate: number;
    sqft: number;
}

export default function OfferResultsDisplay({ results, hasInputs, arv, repairEstimate, sqft }: OfferResultsDisplayProps) {
    const [arvPercent, setArvPercent] = useState(70);

    // Calculate MAO based on slider
    const calculateMAO = () => {
        if (arv <= 0) return 0;
        return Math.round(arv * (arvPercent / 100) - repairEstimate);
    };

    const calculateProfit = () => {
        const mao = calculateMAO();
        // Estimate profit as difference between ARV and (MAO + repairs + holding/closing costs ~15%)
        const totalCosts = mao + repairEstimate + (arv * 0.12);
        return Math.round(arv - totalCosts);
    };

    if (!hasInputs) {
        return (
            <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center animate-pulse">
                    <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Ready to Calculate</h3>
                <p className="text-slate-400 max-w-sm mx-auto">Enter the property ARV and Repair Estimate to calculate offers</p>
            </div>
        );
    }

    const icons = {
        wholetail: (
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    };

    const mao = calculateMAO();
    const profit = calculateProfit();
    const isViable = profit > 0;

    return (
        <div className="space-y-6">
            {/* Wholesale Offer Slider */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Wholesale Offer (MAO)
                </h3>

                {/* Slider */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">% of ARV</span>
                        <span className="text-2xl font-bold text-emerald-400">{arvPercent}%</span>
                    </div>
                    <input
                        type="range"
                        min="50"
                        max="90"
                        step="1"
                        value={arvPercent}
                        onChange={(e) => setArvPercent(parseInt(e.target.value))}
                        className="w-full h-3 rounded-lg cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(arvPercent - 50) * 2.5}%, #334155 ${(arvPercent - 50) * 2.5}%, #334155 100%)`
                        }}
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>50%</span>
                        <span>60%</span>
                        <span>70%</span>
                        <span>80%</span>
                        <span>90%</span>
                    </div>
                </div>

                {/* Result */}
                <div className={`p-5 rounded-xl ${isViable ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-400 mb-1">Max Allowable Offer</p>
                            <p className="text-3xl font-bold text-white">{formatCurrency(mao)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-slate-400 mb-1">Est. Profit</p>
                            <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(profit)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="flex gap-2 mt-4">
                    {[60, 65, 70, 75, 80, 85].map((pct) => (
                        <button
                            key={pct}
                            onClick={() => setArvPercent(pct)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${arvPercent === pct
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            {pct}%
                        </button>
                    ))}
                </div>
            </div>

            {/* Wholetail Card */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Wholetail
                </h3>
                <OfferCard
                    title="Wholetail"
                    subtitle="Min. Repairs & Relist"
                    offer={results.wholetail}
                    colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
                    icon={icons.wholetail}
                />
            </div>

            {/* Fix & Flip Calculator - Full Breakdown */}
            <FixFlipCalculator
                arv={arv}
                repairEstimate={repairEstimate}
                sqft={sqft}
            />
        </div>
    );
}
