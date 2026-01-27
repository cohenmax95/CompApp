'use client';

import { useState } from 'react';
import { OfferInputs, formatCurrency } from '@/lib/calculations';
import AddressAutocomplete from './AddressAutocomplete';

interface PropertyInputProps {
    inputs: OfferInputs;
    onInputsChange: (inputs: OfferInputs) => void;
    address: string;
    onAddressChange: (address: string) => void;
}

// Rehab cost presets based on typical renovation levels
const REHAB_PRESETS = [
    { label: 'Light', value: 15000, description: 'Paint, carpet, minor fixes' },
    { label: 'Moderate', value: 35000, description: 'Kitchen/bath updates, flooring' },
    { label: 'Heavy', value: 65000, description: 'Major systems, structural' },
    { label: 'Full Gut', value: 100000, description: 'Complete renovation' },
];

export default function PropertyInput({
    inputs,
    onInputsChange,
    address,
    onAddressChange
}: PropertyInputProps) {
    const [arvPercent, setArvPercent] = useState(70);

    const updateInput = <K extends keyof OfferInputs>(key: K, value: OfferInputs[K]) => {
        onInputsChange({ ...inputs, [key]: value });
    };

    const formatInputValue = (value: number) => value > 0 ? value.toString() : '';
    const parseInputValue = (value: string) => {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    // Calculate MAO based on slider percentage
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

            {/* ARV Input */}
            <div>
                <label className="input-label">ARV (After Repair Value)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                        type="text"
                        value={formatInputValue(inputs.arv)}
                        onChange={(e) => updateInput('arv', parseInputValue(e.target.value))}
                        placeholder="Enter ARV..."
                        className="input-field pl-7 text-xl font-bold"
                    />
                </div>
            </div>

            {/* MAO Slider - The main feature! */}
            {inputs.arv > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-emerald-300">Quick Offer Calculator</label>
                        <span className="text-2xl font-bold text-white">{arvPercent}% of ARV</span>
                    </div>

                    {/* Slider */}
                    <input
                        type="range"
                        min="50"
                        max="90"
                        step="5"
                        value={arvPercent}
                        onChange={(e) => setArvPercent(parseInt(e.target.value))}
                        className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                        style={{
                            background: `linear-gradient(to right, #10b981 0%, #10b981 ${(arvPercent - 50) * 2.5}%, #334155 ${(arvPercent - 50) * 2.5}%, #334155 100%)`
                        }}
                    />

                    {/* Slider Labels */}
                    <div className="flex justify-between text-xs text-slate-400 mt-2">
                        <span>50%</span>
                        <span>60%</span>
                        <span>70%</span>
                        <span>80%</span>
                        <span>90%</span>
                    </div>

                    {/* MAO Result */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-900/50 flex items-center justify-between">
                        <span className="text-slate-300">Max Offer (MAO):</span>
                        <span className="text-2xl font-bold text-emerald-400">{formatCurrency(calculateMAO())}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 text-center">
                        {formatCurrency(inputs.arv)} × {arvPercent}% − {formatCurrency(inputs.repairEstimate)} repairs
                    </p>
                </div>
            )}

            {/* Rehab Cost Presets */}
            <div>
                <label className="input-label mb-2">Repair Estimate</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                    {REHAB_PRESETS.map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => updateInput('repairEstimate', preset.value)}
                            className={`p-2 rounded-lg text-center transition-all ${inputs.repairEstimate === preset.value
                                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            <div className="text-xs font-medium">{preset.label}</div>
                            <div className="text-sm font-bold">${(preset.value / 1000)}k</div>
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                        type="text"
                        value={formatInputValue(inputs.repairEstimate)}
                        onChange={(e) => updateInput('repairEstimate', parseInputValue(e.target.value))}
                        placeholder="Or enter custom amount..."
                        className="input-field pl-7"
                    />
                </div>
            </div>

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

            {/* Quick Stats */}
            {inputs.arv > 0 && inputs.repairEstimate > 0 && (
                <div className="pt-4 border-t border-slate-700/50">
                    <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-slate-800/50">
                            <p className="text-xs text-slate-400">Repair % of ARV</p>
                            <p className="text-lg font-semibold text-white">
                                {((inputs.repairEstimate / inputs.arv) * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50">
                            <p className="text-xs text-slate-400">Equity Potential</p>
                            <p className="text-lg font-semibold text-emerald-400">
                                {formatCurrency(inputs.arv - (inputs.asIsValue || inputs.arv * 0.85) - inputs.repairEstimate)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
