'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    OfferInputs,
    OfferSettings,
    OfferResults,
    DEFAULT_SETTINGS,
    calculateOffers,
    formatCurrency
} from '@/lib/calculations';
import { detectCountyFromAddress } from '@/lib/fl-counties';
import SettingsPanel from '@/components/SettingsPanel';
import OfferResultsDisplay from '@/components/OfferResults';
import AVMPanel, { AVMPanelRef } from '@/components/AVMPanel';
import { ToastContainer, OfflineIndicator, ConfirmModal, showToast } from '@/components/Toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddressAutocomplete from '@/components/AddressAutocomplete';

interface AppState {
    settings: OfferSettings;
    inputs: OfferInputs;
    address: string;
    sqft: number;
    beds: number;
    baths: number;
}

const STORAGE_KEY = 'compapp-state';

const DEFAULT_STATE: AppState = {
    settings: DEFAULT_SETTINGS,
    inputs: {
        arv: 0,
        asIsValue: 0,
        repairEstimate: 0,
        listPrice: 0,
    },
    address: '',
    sqft: 0,
    beds: 0,
    baths: 0,
};

export default function Home() {
    const [state, setState] = useState<AppState>(DEFAULT_STATE);
    const [isLoaded, setIsLoaded] = useState(false);
    const [mode, setMode] = useState<'avm' | 'manual'>('avm');
    const [avmCollapsed, setAvmCollapsed] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setState({
                    ...DEFAULT_STATE,
                    ...parsed,
                    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
                });
                // If we have an ARV already, start collapsed
                if (parsed.inputs?.arv > 0) {
                    setAvmCollapsed(true);
                }
            }
        } catch (e) {
            console.error('Failed to load saved state:', e);
        }
        setIsLoaded(true);
    }, []);

    // Apply AVM estimates to inputs
    const handleApplyAVMEstimate = (arv: number, asIsValue: number, sqftFromAVM?: number) => {
        setState((s) => ({
            ...s,
            inputs: {
                ...s.inputs,
                arv,
                asIsValue,
                repairEstimate: 0,
            },
            sqft: sqftFromAVM || s.sqft,
        }));
        setAvmCollapsed(true); // Auto-collapse after applying
    };

    // Save state to localStorage on change
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.error('Failed to save state:', e);
            }
        }
    }, [state, isLoaded]);

    // Calculate offers in real-time
    const results: OfferResults = useMemo(() => {
        return calculateOffers(state.inputs, state.settings);
    }, [state.inputs, state.settings]);

    const hasInputs = state.inputs.arv > 0;

    // Auto-detect FL county from address
    const detectedCounty = useMemo(() => {
        return detectCountyFromAddress(state.address);
    }, [state.address]);

    // Auto-derive asIsValue when only ARV is set (manual mode)
    useEffect(() => {
        if (mode === 'manual' && state.inputs.arv > 0 && state.inputs.asIsValue === 0) {
            setState((s) => ({
                ...s,
                inputs: {
                    ...s.inputs,
                    asIsValue: Math.round(s.inputs.arv * 0.90),
                    listPrice: Math.round(s.inputs.arv * 0.90),
                },
            }));
        }
    }, [mode, state.inputs.arv, state.inputs.asIsValue]);

    // Money formatting helper for manual input
    const formatMoneyInput = (value: number) => {
        if (value === 0) return '';
        return value.toLocaleString('en-US');
    };

    const parseMoneyInput = (raw: string): number => {
        return parseInt(raw.replace(/[^0-9]/g, '')) || 0;
    };

    // Confirm reset modal
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const handleResetAll = () => {
        setState(DEFAULT_STATE);
        localStorage.removeItem(STORAGE_KEY);
        setShowConfirmReset(false);
        setAvmCollapsed(false);
        setMode('avm');
        showToast('All data reset', 'info');
    };

    // Address history management
    const [addressHistory, setAddressHistory] = useState<string[]>([]);
    const HISTORY_KEY = 'compapp-history';

    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_KEY);
            if (saved) setAddressHistory(JSON.parse(saved));
        } catch (e) { console.error('Failed to load history:', e); }
    }, []);

    const saveToHistory = (addr: string) => {
        if (!addr.trim()) return;
        const updated = [addr, ...addressHistory.filter(a => a !== addr)].slice(0, 10);
        setAddressHistory(updated);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    };

    // Copy offer summary to clipboard
    const copyToClipboard = async () => {
        const text = `${state.address || 'Property'}

Offers Summary:
• 70% MAO: ${formatCurrency(results.cashOffer2.offerPrice)}
• 80% MAO: ${formatCurrency(results.cashOffer3.offerPrice)}
• Wholetail: ${formatCurrency(results.wholetail.offerPrice)}
• Fix & Flip: ${formatCurrency(results.fixAndFlip.offerPrice)}

Best Strategy: ${results.bestStrategy}
Best Offer: ${formatCurrency(results.bestOffer.offerPrice)}

ARV: ${formatCurrency(state.inputs.arv)}
As-Is: ${formatCurrency(state.inputs.asIsValue)}
Repairs: ${formatCurrency(state.inputs.repairEstimate)}`;

        try {
            await navigator.clipboard.writeText(text);
            showToast('Copied to clipboard!', 'success');
        } catch (e) {
            showToast('Copy failed', 'error');
        }
    };

    // Share via native share API
    const shareOffer = async () => {
        const text = `Property: ${state.address || 'See details'}
ARV: ${formatCurrency(state.inputs.arv)}
Best Offer: ${formatCurrency(results.bestOffer.offerPrice)} (${results.bestStrategy})`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'FL Home Buyers - Comp Analysis',
                    text: text,
                });
            } catch (e) {
                if ((e as Error).name !== 'AbortError') console.error('Share failed:', e);
            }
        } else {
            await navigator.clipboard.writeText(text);
            showToast('Link copied!', 'info');
        }
    };

    const exportToPDF = async () => {
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();
        const green = [76, 175, 80] as const;
        const dark = [30, 40, 35] as const;

        // Header bar
        doc.setFillColor(...dark);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('Comp Analysis', 20, 18);
        doc.setFontSize(10);
        doc.setTextColor(160, 200, 165);
        doc.text(`${state.address || 'Property Not Specified'}`, 20, 28);
        const detailParts: string[] = [];
        if (state.beds > 0) detailParts.push(`${state.beds} bed`);
        if (state.baths > 0) detailParts.push(`${state.baths} bath`);
        if (state.sqft > 0) detailParts.push(`${state.sqft.toLocaleString()} sqft`);
        const detailStr = detailParts.length > 0 ? detailParts.join(' · ') : '';
        if (detailStr) {
            doc.setFontSize(9);
            doc.setTextColor(140, 180, 145);
            doc.text(detailStr, 20, 33);
        }
        doc.setFontSize(10);
        doc.setTextColor(160, 200, 165);
        doc.text(`Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 140, 28);

        // Property values
        let y = 48;
        doc.setFontSize(13);
        doc.setTextColor(...green);
        doc.text('PROPERTY VALUES', 20, y);
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        const vals = [
            ['After Repair Value (ARV)', formatCurrency(state.inputs.arv)],
            ['Repair Estimate', formatCurrency(state.inputs.repairEstimate)],
            ['As-Is Value', formatCurrency(state.inputs.asIsValue)],
        ];
        vals.forEach(([label, val]) => {
            doc.text(label, 25, y);
            doc.setTextColor(30, 30, 30);
            doc.text(val, 130, y);
            doc.setTextColor(80, 80, 80);
            y += 7;
        });

        // Divider
        y += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 8;

        // Fix & Flip Breakdown
        doc.setFontSize(13);
        doc.setTextColor(...green);
        doc.text('FIX & FLIP BREAKDOWN', 20, y);
        y += 8;
        doc.setFontSize(10);

        const ffItems = [
            { label: 'Purchase Price (70% ARV − repairs)', value: formatCurrency(Math.round(state.inputs.arv * 0.70 - state.inputs.repairEstimate)) },
            { label: 'Acquisition Closing (~2%)', value: formatCurrency(Math.round((state.inputs.arv * 0.70 - state.inputs.repairEstimate) * 0.02)) },
            { label: 'Renovation Costs', value: formatCurrency(state.inputs.repairEstimate) },
            { label: 'Buyer Agent Commission (3%)', value: formatCurrency(Math.round(state.inputs.arv * 0.03)) },
            { label: 'Title & Recording (0.5%)', value: formatCurrency(Math.round(state.inputs.arv * 0.005)) },
            { label: 'FL Doc Stamps (0.7%)', value: formatCurrency(Math.round(state.inputs.arv * 0.007)) },
        ];

        ffItems.forEach(({ label, value }) => {
            doc.setTextColor(80, 80, 80);
            doc.text(label, 25, y);
            doc.setTextColor(30, 30, 30);
            doc.text(value, 155, y);
            y += 7;
        });

        // Profit highlight
        y += 2;
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(20, y - 4, 170, 16, 3, 3, 'F');
        doc.setFontSize(11);
        doc.setTextColor(...green);
        doc.text('Fix & Flip Profit:', 25, y + 4);
        doc.text(formatCurrency(results.fixAndFlip.expectedProfit), 155, y + 4);
        y += 22;

        // Divider
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 8;

        // Wholesale / Wholetail
        doc.setFontSize(13);
        doc.setTextColor(...green);
        doc.text('WHOLESALE & WHOLETAIL', 20, y);
        y += 8;
        doc.setFontSize(10);

        const wsItems = [
            { label: '70% MAO', value: formatCurrency(results.cashOffer2.offerPrice), profit: formatCurrency(results.cashOffer2.expectedProfit), viable: results.cashOffer2.isViable },
            { label: '80% MAO', value: formatCurrency(results.cashOffer3.offerPrice), profit: formatCurrency(results.cashOffer3.expectedProfit), viable: results.cashOffer3.isViable },
            { label: 'Wholetail', value: formatCurrency(results.wholetail.offerPrice), profit: formatCurrency(results.wholetail.expectedProfit), viable: results.wholetail.isViable },
        ];

        wsItems.forEach(({ label, value, profit, viable }) => {
            const icon = viable ? '✓' : '✗';
            doc.setTextColor(viable ? 34 : 220, viable ? 139 : 38, viable ? 34 : 38);
            doc.text(icon, 25, y);
            doc.setTextColor(80, 80, 80);
            doc.text(label, 32, y);
            doc.setTextColor(30, 30, 30);
            doc.text(`${value}  (${profit} profit)`, 100, y);
            y += 7;
        });

        // Best Strategy footer
        y += 6;
        doc.setFillColor(...dark);
        doc.roundedRect(20, y - 4, 170, 14, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(`Best Strategy: ${results.bestStrategy}`, 25, y + 4);
        doc.text(`Best Offer: ${formatCurrency(results.bestOffer.offerPrice)}`, 120, y + 4);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(180, 180, 180);
        doc.text('FL Home Buyers — Comp Calculator', 20, 285);

        doc.save(`comp-analysis-${state.address ? state.address.split(',')[0].replace(/\s+/g, '-') : 'report'}.pdf`);
        showToast('PDF exported!', 'success');
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-[#1a2b22] via-[#243828] to-[#1a2b22]">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1a2b22]/90 border-b border-[#3d6b48]/30">
                <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <img src="/logo.png" alt="FL Home Buyers" className="h-9 w-auto" />
                        <div className="flex items-center gap-2">
                            <button onClick={copyToClipboard} disabled={!hasInputs}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Copy">
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button onClick={shareOffer} disabled={!hasInputs}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Share">
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            <button onClick={exportToPDF} disabled={!hasInputs}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Export PDF">
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </button>
                            <button onClick={() => setShowConfirmReset(true)}
                                className="p-2 rounded-lg hover:bg-[#1a3318]/50 transition-colors"
                                title="Reset All">
                                <svg className="w-4 h-4 text-[#88b088]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content — single column, mobile-first */}
            <div className="max-w-2xl mx-auto px-3.5 py-4 space-y-4">

                {/* Mode Toggle: AVM Lookup / Manual Entry */}
                <Tabs value={mode} onValueChange={(v) => setMode(v as 'avm' | 'manual')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-800/60 rounded-xl p-1 h-auto">
                        <TabsTrigger value="avm" className="rounded-lg py-2 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400">
                            AVM Lookup
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="rounded-lg py-2 text-sm font-medium data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400">
                            Manual Entry
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* AVM Mode */}
                {mode === 'avm' && (
                    <div>
                        {avmCollapsed ? (
                            /* Collapsed AVM — one-line summary */
                            <button
                                onClick={() => setAvmCollapsed(false)}
                                className="w-full glass-card p-4 text-left flex items-center justify-between hover:bg-slate-800/70 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm text-slate-400 truncate">{state.address || 'No address'}</p>
                                    <p className="text-lg font-bold text-white">ARV: {formatCurrency(state.inputs.arv)}</p>
                                </div>
                                <span className="text-xs text-slate-500 ml-3 shrink-0">Tap to edit</span>
                            </button>
                        ) : (
                            /* Expanded AVM Panel */
                            <AVMPanel
                                address={state.address}
                                onAddressChange={(address) => setState((s) => ({ ...s, address }))}
                                onApplyEstimate={handleApplyAVMEstimate}
                            />
                        )}
                    </div>
                )}

                {/* Manual Mode — ARV-only input with money formatting */}
                {mode === 'manual' && (
                    <div className="glass-card p-4 space-y-3">
                        {/* Address */}
                        <div>
                            <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider font-semibold">Property Address</label>
                            <AddressAutocomplete
                                value={state.address}
                                onChange={(address) => setState((s) => ({ ...s, address }))}
                                placeholder="123 Main St, Tampa, FL 33601"
                                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-600 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                            />
                        </div>

                        {/* Beds / Baths / Sqft row */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Beds</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={state.beds > 0 ? state.beds : ''}
                                    onChange={(e) => setState((s) => ({ ...s, beds: parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0 }))}
                                    placeholder="3"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-center font-semibold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Baths</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={state.baths > 0 ? state.baths : ''}
                                    onChange={(e) => setState((s) => ({ ...s, baths: parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0 }))}
                                    placeholder="2"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-center font-semibold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Sq Ft</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={state.sqft > 0 ? state.sqft.toLocaleString() : ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value.replace(/[^0-9]/g, '')) || 0;
                                        setState((s) => ({ ...s, sqft: val }));
                                    }}
                                    placeholder="1,800"
                                    className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-center font-semibold focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {/* ARV */}
                        <div>
                            <label className="text-xs text-slate-400 mb-1.5 block uppercase tracking-wider font-semibold">After Repair Value (ARV)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-medium">$</span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9,]*"
                                    value={formatMoneyInput(state.inputs.arv)}
                                    onChange={(e) => {
                                        const val = parseMoneyInput(e.target.value);
                                        setState((s) => ({
                                            ...s,
                                            inputs: {
                                                ...s.inputs,
                                                arv: val,
                                                asIsValue: Math.round(val * 0.90),
                                                listPrice: Math.round(val * 0.90),
                                            },
                                        }));
                                    }}
                                    placeholder="350,000"
                                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600 text-white text-2xl font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">As-Is value auto-set to 90% of ARV</p>
                        </div>
                    </div>
                )}

                {/* Tabbed Results */}
                <OfferResultsDisplay
                    results={results}
                    hasInputs={hasInputs}
                    arv={state.inputs.arv}
                    repairEstimate={state.inputs.repairEstimate}
                    sqft={state.sqft}
                    inputs={state.inputs}
                    onInputsChange={(inputs) => setState((s) => ({ ...s, inputs }))}
                    onSqftChange={(sqft) => setState((s) => ({ ...s, sqft }))}
                    county={detectedCounty}
                />

                {/* Settings — collapsible at bottom */}
                <SettingsPanel
                    settings={state.settings}
                    onSettingsChange={(settings) => setState((s) => ({ ...s, settings }))}
                />
            </div>

            {/* Footer */}
            <footer className="mt-6 pb-5 text-center text-sm text-[#557755]">
                <p>FL Home Buyers Comp Calculator</p>
                <a href="/tutorial" className="inline-block mt-1.5 text-xs text-slate-500 hover:text-emerald-400 transition-colors underline underline-offset-2 decoration-slate-700 hover:decoration-emerald-400">
                    How to Use This Tool →
                </a>
            </footer>

            <ToastContainer />
            <OfflineIndicator />
            <ConfirmModal
                isOpen={showConfirmReset}
                title="Reset All Data?"
                message="This will clear all inputs, settings, and address history. This cannot be undone."
                onConfirm={handleResetAll}
                onCancel={() => setShowConfirmReset(false)}
            />
        </main>
    );
}
