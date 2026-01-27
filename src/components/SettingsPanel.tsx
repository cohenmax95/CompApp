'use client';

import { OfferSettings, DEFAULT_SETTINGS } from '@/lib/calculations';
import { useState } from 'react';

interface SettingsPanelProps {
    settings: OfferSettings;
    onSettingsChange: (settings: OfferSettings) => void;
}

export default function SettingsPanel({ settings, onSettingsChange }: SettingsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const updateSetting = <K extends keyof OfferSettings>(
        key: K,
        value: OfferSettings[K]
    ) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const resetToDefaults = () => {
        onSettingsChange(DEFAULT_SETTINGS);
    };

    return (
        <div className="glass-card p-5">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Settings</h3>
                        <p className="text-sm text-slate-400">Margins, rates & costs</p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="mt-5 pt-5 border-t border-slate-700/50 space-y-5 animate-fade-in">
                    {/* Profit Margins */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Profit Margins</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Gross Profit %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(settings.desiredGrossProfit * 100).toFixed(0)}
                                        onChange={(e) => updateSetting('desiredGrossProfit', parseFloat(e.target.value) / 100)}
                                        className="input-field pr-8"
                                        min="0"
                                        max="100"
                                        step="1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Gross Revenue %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(settings.desiredGrossRevenue * 100).toFixed(0)}
                                        onChange={(e) => updateSetting('desiredGrossRevenue', parseFloat(e.target.value) / 100)}
                                        className="input-field pr-8"
                                        min="0"
                                        max="100"
                                        step="1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Costs */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Costs & Rates</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Renovation Interest %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(settings.renovationInterestRate * 100).toFixed(0)}
                                        onChange={(e) => updateSetting('renovationInterestRate', parseFloat(e.target.value) / 100)}
                                        className="input-field pr-8"
                                        min="0"
                                        max="30"
                                        step="1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Novation Costs %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(settings.novationCostsPercent * 100).toFixed(0)}
                                        onChange={(e) => updateSetting('novationCostsPercent', parseFloat(e.target.value) / 100)}
                                        className="input-field pr-8"
                                        min="0"
                                        max="30"
                                        step="1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Wholetail Costs %</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={(settings.wholetailCostsPercent * 100).toFixed(0)}
                                        onChange={(e) => updateSetting('wholetailCostsPercent', parseFloat(e.target.value) / 100)}
                                        className="input-field pr-8"
                                        min="0"
                                        max="30"
                                        step="1"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Weeks per $10k Reno</label>
                                <input
                                    type="number"
                                    value={settings.weeksPerTenK}
                                    onChange={(e) => updateSetting('weeksPerTenK', parseFloat(e.target.value))}
                                    className="input-field"
                                    min="0.5"
                                    max="10"
                                    step="0.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reserves */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Reserves</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="input-label">Min Profit Reserve</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={settings.minProfitReserve}
                                        onChange={(e) => updateSetting('minProfitReserve', parseFloat(e.target.value))}
                                        className="input-field pl-7"
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="input-label">Make Ready Reserve</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                                    <input
                                        type="number"
                                        value={settings.makeReadyReserve}
                                        onChange={(e) => updateSetting('makeReadyReserve', parseFloat(e.target.value))}
                                        className="input-field pl-7"
                                        min="0"
                                        step="1000"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Days on Market */}
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">Market Timing</h4>
                        <div>
                            <label className="input-label">Avg Days on Market</label>
                            <input
                                type="number"
                                value={settings.avgDaysOnMarket}
                                onChange={(e) => updateSetting('avgDaysOnMarket', parseInt(e.target.value))}
                                className="input-field"
                                min="7"
                                max="365"
                                step="1"
                            />
                        </div>
                    </div>

                    <button
                        onClick={resetToDefaults}
                        className="btn-secondary w-full mt-4"
                    >
                        Reset to Defaults
                    </button>
                </div>
            )}
        </div>
    );
}
