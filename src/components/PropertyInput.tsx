'use client';

import { useState } from 'react';
import { OfferInputs, formatCurrency } from '@/lib/calculations';
import { REHAB_LEVELS, RehabLevel, calculateRepairEstimate } from '@/lib/avm';
import AddressAutocomplete from './AddressAutocomplete';

interface PropertyInputProps {
    inputs: OfferInputs;
    onInputsChange: (inputs: OfferInputs) => void;
    address: string;
    onAddressChange: (address: string) => void;
    sqft: number;
    onSqftChange: (sqft: number) => void;
}

export default function PropertyInput({
    inputs,
    onInputsChange,
    address,
    onAddressChange,
    sqft,
    onSqftChange,
}: PropertyInputProps) {
    const [arvPercent, setArvPercent] = useState(70);
    const [selectedLevel, setSelectedLevel] = useState<RehabLevel>(REHAB_LEVELS[4]); // Default: Moderate Rehab

    const updateInput = <K extends keyof OfferInputs>(key: K, value: OfferInputs[K]) => {
        onInputsChange({ ...inputs, [key]: value });
    };

    const formatInputValue = (value: number) => value > 0 ? value.toString() : '';
    const parseInputValue = (value: string) => {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate repair estimate based on sqft and selected level
    const repairEstimate = sqft > 0 ? calculateRepairEstimate(sqft, selectedLevel) : { low: 0, median: 0, high: 0 };

    // Apply selected repair estimate
    const applyRepair = (amount: number) => {
        updateInput('repairEstimate', amount);
    };

    // Calculate MAO
    const calculateMAO = () => {
        if (inputs.arv <= 0) return 0;
        return Math.round(inputs.arv * (arvPercent / 100) - inputs.repairEstimate);
    };

    return (
        <div className="glass-card p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-semibold text-white">Property Details</h3>
                    <p className="text-sm text-slate-400">Enter property values</p>
                </div>
            </div>

            {/* Property Address */}
            <div>
                <label className="input-label">Property Address</label>
                <AddressAutocomplete
                    value={address}
                    onChange={onAddressChange}
                    placeholder="Start typing an address..."
                    className="input-field"
                />
            </div>

            {/* ARV and Sq Ft side by side */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="input-label">ARV (After Repair Value)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.arv)}
                            onChange={(e) => updateInput('arv', parseInputValue(e.target.value))}
                            placeholder="Enter ARV"
                            className="input-field pl-7 text-lg font-bold"
                        />
                    </div>
                </div>
                <div>
                    <label className="input-label">Square Footage</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={sqft > 0 ? sqft.toString() : ''}
                            onChange={(e) => onSqftChange(parseInputValue(e.target.value))}
                            placeholder="e.g. 1500"
                            className="input-field text-lg font-bold"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">sq ft</span>
                    </div>
                </div>
            </div>

            {/* MAO Slider */}
            {inputs.arv > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-emerald-300">Quick Offer Calculator</label>
                        <span className="text-2xl font-bold text-white">{arvPercent}% of ARV</span>
                    </div>

                    <input
                        type="range"
                        min="50"
                        max="90"
                        step="5"
                        value={arvPercent}
                        onChange={(e) => setArvPercent(parseInt(e.target.value))}
                        className="w-full h-3 rounded-lg cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(arvPercent - 50) * 2.5}%, #334155 ${(arvPercent - 50) * 2.5}%, #334155 100%)`
                        }}
                    />

                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-slate-900/50 flex items-center justify-between">
                        <span className="text-slate-300">Max Offer (MAO):</span>
                        <span className="text-2xl font-bold text-emerald-400">{formatCurrency(calculateMAO())}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 text-center">
                        {formatCurrency(inputs.arv)} × {arvPercent}% − {formatCurrency(inputs.repairEstimate)} repairs
                    </p>
                </div>
            )}

            {/* Property Condition Selector - 10 Levels */}
            <div>
                <label className="input-label">Property Condition (from spreadsheet)</label>
                <select
                    value={selectedLevel.id}
                    onChange={(e) => {
                        const level = REHAB_LEVELS.find(l => l.id === parseInt(e.target.value));
                        if (level) setSelectedLevel(level);
                    }}
                    className="input-field text-base"
                >
                    {REHAB_LEVELS.map((level) => (
                        <option key={level.id} value={level.id}>
                            {level.label} — ${level.lowPerSqft}-${level.highPerSqft}/sqft
                        </option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">{selectedLevel.description}</p>
            </div>

            {/* Repair Estimate with Sq Ft */}
            {sqft > 0 && (
                <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-amber-300">Repair Estimate ({sqft.toLocaleString()} sq ft × ${selectedLevel.lowPerSqft}-${selectedLevel.highPerSqft}/sqft + 20% buffer)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <button
                            onClick={() => applyRepair(repairEstimate.low)}
                            className={`p-3 rounded-lg text-center transition-all ${inputs.repairEstimate === repairEstimate.low
                                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <div className="text-xs">Low</div>
                            <div className="text-lg font-bold">{formatCurrency(repairEstimate.low)}</div>
                        </button>
                        <button
                            onClick={() => applyRepair(repairEstimate.median)}
                            className={`p-3 rounded-lg text-center transition-all ${inputs.repairEstimate === repairEstimate.median
                                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <div className="text-xs">Median</div>
                            <div className="text-lg font-bold">{formatCurrency(repairEstimate.median)}</div>
                        </button>
                        <button
                            onClick={() => applyRepair(repairEstimate.high)}
                            className={`p-3 rounded-lg text-center transition-all ${inputs.repairEstimate === repairEstimate.high
                                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <div className="text-xs">High</div>
                            <div className="text-lg font-bold">{formatCurrency(repairEstimate.high)}</div>
                        </button>
                    </div>

                    <div className="mt-3">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                                type="text"
                                value={formatInputValue(inputs.repairEstimate)}
                                onChange={(e) => updateInput('repairEstimate', parseInputValue(e.target.value))}
                                placeholder="Or enter custom amount"
                                className="input-field pl-7"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* No sq ft warning */}
            {sqft === 0 && (
                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-600/50 text-center text-slate-400 text-sm">
                    Enter square footage above to calculate repair estimates
                </div>
            )}

            {/* Secondary Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="input-label">As-Is Value</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.asIsValue)}
                            onChange={(e) => updateInput('asIsValue', parseInputValue(e.target.value))}
                            placeholder="Current value"
                            className="input-field pl-7"
                        />
                    </div>
                </div>
                <div>
                    <label className="input-label">List/Ask Price</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.listPrice)}
                            onChange={(e) => updateInput('listPrice', parseInputValue(e.target.value))}
                            placeholder="Asking price"
                            className="input-field pl-7"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
