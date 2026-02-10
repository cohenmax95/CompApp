'use client';

import { useState } from 'react';
import { OfferResults, OfferInputs, formatCurrency } from '@/lib/calculations';
import OfferCard from './OfferCard';
import FixFlipCalculator from './FixFlipCalculator';
import PropertyInput from './PropertyInput';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface OfferResultsDisplayProps {
    results: OfferResults;
    hasInputs: boolean;
    arv: number;
    repairEstimate: number;
    sqft: number;
    inputs: OfferInputs;
    onInputsChange: (inputs: OfferInputs) => void;
    onSqftChange: (sqft: number) => void;
    county?: string | null;
}

export default function OfferResultsDisplay({
    results, hasInputs, arv, repairEstimate, sqft,
    inputs, onInputsChange, onSqftChange, county
}: OfferResultsDisplayProps) {
    const [activeTab, setActiveTab] = useState<'fixflip' | 'wholesale'>('fixflip');
    const [arvPercent, setArvPercent] = useState(70);

    // Wholesale MAO calculation
    const calculateMAO = () => {
        if (arv <= 0) return 0;
        return Math.round(arv * (arvPercent / 100) - repairEstimate);
    };

    const calculateProfit = () => {
        const mao = calculateMAO();
        const totalCosts = mao + repairEstimate + (arv * 0.12);
        return Math.round(arv - totalCosts);
    };

    if (!hasInputs) {
        return (
            <div className="glass-card p-8 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Ready to Calculate</h3>
                <p className="text-slate-400 text-sm">Enter ARV and property details above to see offers</p>
            </div>
        );
    }

    const mao = calculateMAO();
    const profit = calculateProfit();
    const isViable = profit > 0;

    return (
        <div className="space-y-4">
            {/* Tab Bar */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fixflip' | 'wholesale')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-800/60 rounded-xl p-1 h-auto">
                    <TabsTrigger value="fixflip" className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400">
                        Fix & Flip
                    </TabsTrigger>
                    <TabsTrigger value="wholesale" className="rounded-lg py-2.5 text-sm font-medium data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400">
                        Wholesale / Wholetail
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Tab Content */}
            {activeTab === 'fixflip' ? (
                <div className="glass-card p-5 space-y-5">
                    {/* Repair Estimate inside Fix & Flip tab */}
                    <PropertyInput
                        inputs={inputs}
                        onInputsChange={onInputsChange}
                        sqft={sqft}
                        onSqftChange={onSqftChange}
                    />

                    <div className="border-t border-slate-700/50 pt-4">
                        <h3 className="font-bold text-white text-lg mb-1">Fix & Flip Breakdown</h3>
                        <p className="text-xs text-slate-500 mb-4">Step-by-step profit analysis</p>
                        <FixFlipCalculator arv={arv} repairEstimate={repairEstimate} sqft={sqft} county={county} />
                    </div>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Wholesale MAO Slider */}
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-semibold text-white mb-4">Wholesale Offer (MAO)</h3>

                        <div className="mb-5">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-400">% of ARV</span>
                                <span className="text-2xl font-bold text-emerald-400">{arvPercent}%</span>
                            </div>
                            <input
                                type="range" min="50" max="90" step="1"
                                value={arvPercent}
                                onChange={(e) => setArvPercent(parseInt(e.target.value))}
                                className="w-full h-3 rounded-lg cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${(arvPercent - 50) * 2.5}%, #334155 ${(arvPercent - 50) * 2.5}%, #334155 100%)`
                                }}
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span>
                            </div>
                        </div>

                        {/* Result */}
                        <div className={`p-4 rounded-xl ${isViable ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
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
                    <div className="glass-card p-5">
                        <h3 className="text-lg font-semibold text-white mb-3">Wholetail</h3>
                        <OfferCard
                            title="Wholetail"
                            subtitle="Min. Repairs & Relist"
                            offer={results.wholetail}
                            colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
                            icon={
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
