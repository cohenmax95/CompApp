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
import SettingsPanel from '@/components/SettingsPanel';
import PropertyInput from '@/components/PropertyInput';
import OfferResultsDisplay from '@/components/OfferResults';
import AVMPanel, { AVMPanelRef } from '@/components/AVMPanel';

interface AppState {
    settings: OfferSettings;
    inputs: OfferInputs;
    address: string;
    sqft: number;
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
};

export default function Home() {
    const [state, setState] = useState<AppState>(DEFAULT_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

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
            }
        } catch (e) {
            console.error('Failed to load saved state:', e);
        }
        setIsLoaded(true);
    }, []);

    // Apply AVM estimates to inputs (including sqft from property data)
    const handleApplyAVMEstimate = (arv: number, asIsValue: number, sqftFromAVM?: number) => {
        setState((s) => ({
            ...s,
            inputs: {
                ...s.inputs,
                arv,
                asIsValue,
            },
            // Auto-fill sqft if provided from AVM and not already set
            sqft: sqftFromAVM && s.sqft === 0 ? sqftFromAVM : s.sqft,
        }));
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

    const hasInputs = state.inputs.arv > 0 && state.inputs.asIsValue > 0;

    const resetAll = () => {
        setState(DEFAULT_STATE);
        localStorage.removeItem(STORAGE_KEY);
    };

    const exportToPDF = async () => {
        const jsPDF = (await import('jspdf')).default;
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text('Comp Analysis Report', 20, 20);

        doc.setFontSize(12);
        doc.text(`Property: ${state.address || 'Not specified'}`, 20, 30);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 38);

        // Property Values
        doc.setFontSize(14);
        doc.text('Property Values', 20, 52);
        doc.setFontSize(10);
        doc.text(`ARV: ${formatCurrency(state.inputs.arv)}`, 20, 60);
        doc.text(`As-Is Value: ${formatCurrency(state.inputs.asIsValue)}`, 20, 68);
        doc.text(`Repair Estimate: ${formatCurrency(state.inputs.repairEstimate)}`, 20, 76);
        doc.text(`List Price: ${formatCurrency(state.inputs.listPrice)}`, 20, 84);

        // Offer Summary
        doc.setFontSize(14);
        doc.text('Offer Summary', 20, 98);
        doc.setFontSize(10);

        let y = 106;
        const offers = [
            { name: '60% of ARV (Conservative)', offer: results.cashOffer1 },
            { name: '70% of ARV (Standard)', offer: results.cashOffer2 },
            { name: '80% of ARV (Aggressive)', offer: results.cashOffer3 },
            { name: '85% of ARV (Max Offer)', offer: results.maxWholesale },
            { name: 'Wholetail', offer: results.wholetail },
            { name: 'Fix & Flip', offer: results.fixAndFlip },
        ];

        offers.forEach((item) => {
            const status = item.offer.isViable ? '✓' : '✗';
            doc.text(
                `${status} ${item.name}: ${formatCurrency(item.offer.offerPrice)} (Profit: ${formatCurrency(item.offer.expectedProfit)})`,
                20,
                y
            );
            y += 8;
        });

        // Best Strategy
        doc.setFontSize(12);
        doc.text(`Best Strategy: ${results.bestStrategy}`, 20, y + 10);
        doc.text(`Best Offer: ${formatCurrency(results.bestOffer.offerPrice)}`, 20, y + 18);

        doc.save(`comp-analysis-${Date.now()}.pdf`);
    };

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-slate-400">Loading...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white">CompApp</h1>
                                <p className="text-xs text-slate-400">Real Estate Comp Calculator</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={exportToPDF}
                                disabled={!hasInputs}
                                className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export PDF
                            </button>
                            <button
                                onClick={resetAll}
                                className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors group"
                                title="Reset All"
                            >
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Inputs */}
                    <div className="lg:col-span-1 space-y-6">
                        <PropertyInput
                            inputs={state.inputs}
                            onInputsChange={(inputs) => setState((s) => ({ ...s, inputs }))}
                            address={state.address}
                            onAddressChange={(address) => setState((s) => ({ ...s, address }))}
                            sqft={state.sqft}
                            onSqftChange={(sqft) => setState((s) => ({ ...s, sqft }))}
                        />

                        <AVMPanel
                            address={state.address}
                            onApplyEstimate={handleApplyAVMEstimate}
                        />

                        <SettingsPanel
                            settings={state.settings}
                            onSettingsChange={(settings) => setState((s) => ({ ...s, settings }))}
                        />
                    </div>

                    {/* Right Column - Results */}
                    <div className="lg:col-span-2">
                        <OfferResultsDisplay results={results} hasInputs={hasInputs} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 pb-6 text-center text-sm text-slate-500">
                <p>CompApp v1.0 • Real-time calculations • Data saved locally</p>
            </footer>
        </main>
    );
}
