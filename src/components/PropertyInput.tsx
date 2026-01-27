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
    onFetchAVMs?: () => void;
    addressHistory?: string[];
    onSaveToHistory?: (addr: string) => void;
}

export default function PropertyInput({
    inputs,
    onInputsChange,
    address,
    onAddressChange,
    sqft,
    onSqftChange,
    onFetchAVMs,
    addressHistory = [],
    onSaveToHistory,
}: PropertyInputProps) {
    const [arvPercent, setArvPercent] = useState(70);
    const [selectedLevel, setSelectedLevel] = useState<RehabLevel>(REHAB_LEVELS[4]);
    const [showHistory, setShowHistory] = useState(false);

    const updateInput = <K extends keyof OfferInputs>(key: K, value: OfferInputs[K]) => {
        onInputsChange({ ...inputs, [key]: value });
    };

    const formatInputValue = (value: number) => value > 0 ? value.toLocaleString() : '';
    const parseInputValue = (value: string) => {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    const repairEstimate = sqft > 0 ? calculateRepairEstimate(sqft, selectedLevel) : null;

    const applyRepair = (amount: number) => {
        updateInput('repairEstimate', amount);
    };

    const calculateMAO = () => {
        if (inputs.arv <= 0) return 0;
        return Math.round(inputs.arv * (arvPercent / 100) - inputs.repairEstimate);
    };

    const handleFetchAVMs = () => {
        if (address.trim() && onSaveToHistory) {
            onSaveToHistory(address);
        }
        onFetchAVMs?.();
    };

    const selectFromHistory = (addr: string) => {
        onAddressChange(addr);
        setShowHistory(false);
    };

    return (
        <div className="glass-card p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#4CAF50] to-[#2E7D32] flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">Property Details</h3>
                    <p className="text-xs text-slate-500">Enter address, press Enter to fetch</p>
                </div>
                {addressHistory.length > 0 && (
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                        title="Recent addresses"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="space-y-5">
                {/* Recent Addresses Dropdown */}
                {showHistory && addressHistory.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1 animate-fade-in">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Recent Addresses</p>
                        {addressHistory.slice(0, 5).map((addr, i) => (
                            <button
                                key={i}
                                onClick={() => selectFromHistory(addr)}
                                className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-700 transition-colors truncate"
                            >
                                {addr}
                            </button>
                        ))}
                    </div>
                )}

                {/* Address */}
                <div>
                    <AddressAutocomplete
                        value={address}
                        onChange={onAddressChange}
                        onEnter={handleFetchAVMs}
                        placeholder="Enter address, press Enter..."
                        className="input-field"
                    />
                </div>

                {/* ARV - Full Width, Prominent */}
                <div>
                    <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">After Repair Value (ARV)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 text-lg font-bold">$</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9,]*"
                            value={formatInputValue(inputs.arv)}
                            onChange={(e) => updateInput('arv', parseInputValue(e.target.value))}
                            placeholder="450,000"
                            className="input-field pl-9 text-xl sm:text-2xl font-bold h-12 sm:h-14 bg-slate-800/80"
                        />
                    </div>
                </div>

                {/* Sq Ft + Condition Row */}
                <div className="grid grid-cols-5 gap-3">
                    <div className="col-span-2">
                        <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">Sq Ft</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9,]*"
                            value={sqft > 0 ? sqft.toLocaleString() : ''}
                            onChange={(e) => onSqftChange(parseInputValue(e.target.value))}
                            placeholder="1,500"
                            className="input-field font-semibold"
                        />
                    </div>
                    <div className="col-span-3">
                        <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">Condition</label>
                        <select
                            value={selectedLevel.id}
                            onChange={(e) => {
                                const level = REHAB_LEVELS.find(l => l.id === parseInt(e.target.value));
                                if (level) setSelectedLevel(level);
                            }}
                            className="input-field font-semibold"
                        >
                            {REHAB_LEVELS.map((level) => (
                                <option key={level.id} value={level.id}>
                                    {level.shortLabel} (${level.lowPerSqft}-${level.highPerSqft}/sf)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Repair Estimate Buttons */}
                {repairEstimate && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border border-amber-500/20">
                        <label className="text-xs text-amber-400/80 mb-3 block uppercase tracking-wide font-medium">
                            Repair Estimate • {sqft.toLocaleString()} sf
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => applyRepair(repairEstimate.low)}
                                className={`p-3 rounded-xl text-center transition-all ${inputs.repairEstimate === repairEstimate.low
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <div className="text-[10px] uppercase tracking-wide opacity-60">Low</div>
                                <div className="font-bold text-sm">{formatCurrency(repairEstimate.low)}</div>
                            </button>
                            <button
                                onClick={() => applyRepair(repairEstimate.median)}
                                className={`p-3 rounded-xl text-center transition-all ${inputs.repairEstimate === repairEstimate.median
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <div className="text-[10px] uppercase tracking-wide opacity-60">Mid</div>
                                <div className="font-bold text-sm">{formatCurrency(repairEstimate.median)}</div>
                            </button>
                            <button
                                onClick={() => applyRepair(repairEstimate.high)}
                                className={`p-3 rounded-xl text-center transition-all ${inputs.repairEstimate === repairEstimate.high
                                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                                    }`}
                            >
                                <div className="text-[10px] uppercase tracking-wide opacity-60">High</div>
                                <div className="font-bold text-sm">{formatCurrency(repairEstimate.high)}</div>
                            </button>
                        </div>
                        {/* Custom input */}
                        <div className="relative mt-3">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9,]*"
                                value={formatInputValue(inputs.repairEstimate)}
                                onChange={(e) => updateInput('repairEstimate', parseInputValue(e.target.value))}
                                placeholder="Or enter custom..."
                                className="input-field pl-7 text-sm h-10"
                            />
                        </div>
                    </div>
                )}

                {/* No sqft message */}
                {!repairEstimate && (
                    <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 text-center text-slate-500 text-sm">
                        Enter sq ft above to calculate repair estimates
                    </div>
                )}

                {/* Secondary Inputs */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">As-Is Value</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9,]*"
                                value={formatInputValue(inputs.asIsValue)}
                                onChange={(e) => updateInput('asIsValue', parseInputValue(e.target.value))}
                                placeholder="380,000"
                                className="input-field pl-7"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block uppercase tracking-wide font-medium">List Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9,]*"
                                value={formatInputValue(inputs.listPrice)}
                                onChange={(e) => updateInput('listPrice', parseInputValue(e.target.value))}
                                placeholder="400,000"
                                className="input-field pl-7"
                            />
                        </div>
                    </div>
                </div>

                {/* Quick MAO Slider - Only when ARV entered */}
                {inputs.arv > 0 && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border border-emerald-500/20">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-emerald-400/80 uppercase tracking-wide font-medium">Quick MAO Calculator</span>
                            <span className="text-xl font-bold text-white">{arvPercent}%</span>
                        </div>

                        <input
                            type="range"
                            min="50"
                            max="90"
                            step="5"
                            value={arvPercent}
                            onChange={(e) => setArvPercent(parseInt(e.target.value))}
                            className="w-full h-2 rounded-lg cursor-pointer mb-2"
                            style={{
                                background: `linear-gradient(to right, #10b981 0%, #10b981 ${(arvPercent - 50) * 2.5}%, #334155 ${(arvPercent - 50) * 2.5}%, #334155 100%)`
                            }}
                        />

                        <div className="flex justify-between text-[10px] text-slate-500 mb-4">
                            <span>50%</span><span>60%</span><span>70%</span><span>80%</span><span>90%</span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60">
                            <span className="text-sm text-slate-400">Max Allowable Offer</span>
                            <span className="text-2xl font-bold text-emerald-400">{formatCurrency(calculateMAO())}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
