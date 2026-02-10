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
            <div className="mb-5">
                <h3 className="font-bold text-white text-lg">Repair Estimate</h3>
                <p className="text-xs text-slate-500">Set sqft and choose repair level</p>
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

                        {/* Custom / Selected Value Input */}
                        <div className="p-3 rounded-xl bg-slate-800/50">
                            <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">Custom Rehab Amount</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9,]*"
                                    value={inputs.repairEstimate > 0 ? inputs.repairEstimate.toLocaleString() : ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                        applyRepair(val);
                                    }}
                                    placeholder="Enter custom amount"
                                    className="input-field pl-7 font-semibold text-lg"
                                />
                            </div>
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
