'use client';

import { OfferInputs } from '@/lib/calculations';
import AddressAutocomplete from './AddressAutocomplete';

interface PropertyInputProps {
    inputs: OfferInputs;
    onInputsChange: (inputs: OfferInputs) => void;
    address: string;
    onAddressChange: (address: string) => void;
}

export default function PropertyInput({
    inputs,
    onInputsChange,
    address,
    onAddressChange
}: PropertyInputProps) {
    const updateInput = <K extends keyof OfferInputs>(
        key: K,
        value: OfferInputs[K]
    ) => {
        onInputsChange({ ...inputs, [key]: value });
    };

    const formatInputValue = (value: number) => {
        return value > 0 ? value.toString() : '';
    };

    const parseInputValue = (value: string) => {
        const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
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

            {/* Property Address with Autocomplete */}
            <div>
                <label className="input-label">Property Address</label>
                <AddressAutocomplete
                    value={address}
                    onChange={onAddressChange}
                    placeholder="Start typing an address..."
                    className="input-field"
                />
            </div>

            {/* Value Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="input-label flex items-center gap-1">
                        ARV
                        <span className="tooltip text-slate-500" data-tooltip="After Repair Value - fully renovated market value">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.arv)}
                            onChange={(e) => updateInput('arv', parseInputValue(e.target.value))}
                            placeholder="469,000"
                            className="input-field pl-7 text-lg font-semibold"
                        />
                    </div>
                </div>

                <div>
                    <label className="input-label flex items-center gap-1">
                        As-Is Value
                        <span className="tooltip text-slate-500" data-tooltip="Current value in present condition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.asIsValue)}
                            onChange={(e) => updateInput('asIsValue', parseInputValue(e.target.value))}
                            placeholder="425,000"
                            className="input-field pl-7 text-lg font-semibold"
                        />
                    </div>
                </div>

                <div>
                    <label className="input-label flex items-center gap-1">
                        Repair Estimate
                        <span className="tooltip text-slate-500" data-tooltip="Estimated cost to reach ARV">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.repairEstimate)}
                            onChange={(e) => updateInput('repairEstimate', parseInputValue(e.target.value))}
                            placeholder="16,000"
                            className="input-field pl-7 text-lg font-semibold"
                        />
                    </div>
                </div>

                <div>
                    <label className="input-label flex items-center gap-1">
                        List/Ask Price
                        <span className="tooltip text-slate-500" data-tooltip="Seller's asking price">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                            type="text"
                            value={formatInputValue(inputs.listPrice)}
                            onChange={(e) => updateInput('listPrice', parseInputValue(e.target.value))}
                            placeholder="400,000"
                            className="input-field pl-7 text-lg font-semibold"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            {inputs.arv > 0 && inputs.asIsValue > 0 && (
                <div className="pt-4 border-t border-slate-700/50">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-slate-800/50">
                            <p className="text-xs text-slate-400">Repair %</p>
                            <p className="text-lg font-semibold text-white">
                                {((inputs.repairEstimate / inputs.arv) * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50">
                            <p className="text-xs text-slate-400">Equity Gap</p>
                            <p className="text-lg font-semibold text-white">
                                ${((inputs.arv - inputs.asIsValue) / 1000).toFixed(0)}k
                            </p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50">
                            <p className="text-xs text-slate-400">As-Is / ARV</p>
                            <p className="text-lg font-semibold text-white">
                                {((inputs.asIsValue / inputs.arv) * 100).toFixed(0)}%
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
