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
                <div>
                    <h3 className="font-semibold text-white">Settings</h3>
                    <p className="text-sm text-slate-400">Margins, rates & costs</p>
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
