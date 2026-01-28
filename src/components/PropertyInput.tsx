'use client';

import { useState } from 'react';
import { OfferInputs, formatCurrency } from '@/lib/calculations';
import { REHAB_LEVELS, RehabLevel, calculateRepairEstimate } from '@/lib/avm';

interface PropertyInputProps {
    inputs: OfferInputs;
    onInputsChange: (inputs: OfferInputs) => void;
    sqft: number;
    onSqftChange: (sqft: number) => void;
}

export default function PropertyInput({
    inputs,
    onInputsChange,
    sqft,
    onSqftChange,
}: PropertyInputProps) {
    const [selectedLevel, setSelectedLevel] = useState<RehabLevel>(REHAB_LEVELS[4]);

    const updateInput = <K extends keyof OfferInputs>(key: K, value: OfferInputs[K]) => {
        onInputsChange({ ...inputs, [key]: value });
    };

    const repairEstimate = sqft > 0 ? calculateRepairEstimate(sqft, selectedLevel) : null;

    const applyRepair = (amount: number) => {
        updateInput('repairEstimate', amount);
    };

    return (
        <div className="glass-card p-5">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Repair Estimate</h3>
                    <p className="text-xs text-slate-500">Set sqft and choose repair level</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Sq Ft Input */}
                <div>
                    <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">Square Feet</label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9,]*"
                        value={sqft > 0 ? sqft.toLocaleString() : ''}
                        onChange={(e) => onSqftChange(parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0)}
                        placeholder="2,000"
                        className="input-field font-semibold text-lg"
                    />
                </div>

                {/* Repair Estimate Buttons */}
                {repairEstimate && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => applyRepair(repairEstimate.low)}
                                className={`p-3 rounded-xl text-center transition-all ${inputs.repairEstimate === repairEstimate.low
                                    ? 'bg-amber-500 text-white shadow-lg'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                    }`}
                            >
                                <p className="text-xs text-slate-400 mb-1">LOW</p>
                                <p className="font-bold text-white">{formatCurrency(repairEstimate.low)}</p>
                            </button>
                            <button
                                onClick={() => applyRepair(repairEstimate.median)}
                                className={`p-3 rounded-xl text-center transition-all ${inputs.repairEstimate === repairEstimate.median
                                    ? 'bg-amber-500 text-white shadow-lg'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                    }`}
                            >
                                <p className="text-xs text-slate-400 mb-1">MID</p>
                                <p className="font-bold text-white">{formatCurrency(repairEstimate.median)}</p>
                            </button>
                            <button
                                onClick={() => applyRepair(repairEstimate.high)}
                                className={`p-3 rounded-xl text-center transition-all ${inputs.repairEstimate === repairEstimate.high
                                    ? 'bg-amber-500 text-white shadow-lg'
                                    : 'bg-slate-800 hover:bg-slate-700'
                                    }`}
                            >
                                <p className="text-xs text-slate-400 mb-1">HIGH</p>
                                <p className="font-bold text-white">{formatCurrency(repairEstimate.high)}</p>
                            </button>
                        </div>

                        {/* Selected Value Display */}
                        <div className="p-3 rounded-xl bg-slate-800/50 text-center">
                            <span className="text-slate-400 text-sm">Selected: </span>
                            <span className="text-white font-bold text-lg">{formatCurrency(inputs.repairEstimate)}</span>
                        </div>
                    </div>
                )}

                {/* No sqft message */}
                {!repairEstimate && (
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center text-slate-500 text-sm">
                        Enter square feet to see repair estimates
                    </div>
                )}
            </div>
        </div>
    );
}
