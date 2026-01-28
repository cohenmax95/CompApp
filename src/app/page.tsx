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
import { ToastContainer, OfflineIndicator, ConfirmModal, showToast } from '@/components/Toast';

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
    // Also resets repair estimate to avoid stale data from previous properties
    const handleApplyAVMEstimate = (arv: number, asIsValue: number, sqftFromAVM?: number) => {
        setState((s) => ({
            ...s,
            inputs: {
                ...s.inputs,
                arv,
                asIsValue,
                repairEstimate: 0, // Reset to prompt user to select new repair level
            },
            // Always update sqft from AVM data if provided
            sqft: sqftFromAVM || s.sqft,
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

    // Confirm reset modal
    const [showConfirmReset, setShowConfirmReset] = useState(false);

    const handleResetAll = () => {
        setState(DEFAULT_STATE);
        localStorage.removeItem(STORAGE_KEY);
        setShowConfirmReset(false);
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
        const text = `🏠 ${state.address || 'Property'}

📊 Offers Summary:
• 70% MAO: ${formatCurrency(results.cashOffer2.offerPrice)}
• 80% MAO: ${formatCurrency(results.cashOffer3.offerPrice)}
• Wholetail: ${formatCurrency(results.wholetail.offerPrice)}
• Fix & Flip: ${formatCurrency(results.fixAndFlip.offerPrice)}

💰 Best Strategy: ${results.bestStrategy}
🎯 Best Offer: ${formatCurrency(results.bestOffer.offerPrice)}

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
        <main className="min-h-screen bg-gradient-to-br from-[#0a1f0a] via-[#112211] to-[#0a1f0a]">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a1f0a]/90 border-b border-[#2d4a2d]/50">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="FL Home Buyers"
                                className="h-10 sm:h-12 w-auto"
                            />
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            {/* Copy Button */}
                            <button
                                onClick={copyToClipboard}
                                disabled={!hasInputs}
                                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                title="Copy to Clipboard"
                            >
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span className="hidden sm:inline text-sm text-slate-300">Copy</span>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={shareOffer}
                                disabled={!hasInputs}
                                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                title="Share"
                            >
                                <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                <span className="hidden sm:inline text-sm text-slate-300">Share</span>
                            </button>

                            {/* Export PDF Button */}
                            <button
                                onClick={exportToPDF}
                                disabled={!hasInputs}
                                className="hidden sm:flex btn-secondary items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                PDF
                            </button>

                            {/* Reset Button */}
                            <button
                                onClick={() => setShowConfirmReset(true)}
                                className="p-2 rounded-lg hover:bg-[#1a3318]/50 transition-colors group"
                                title="Reset All"
                            >
                                <svg className="w-5 h-5 text-[#88b088] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <AVMPanel
                            address={state.address}
                            onAddressChange={(address) => setState((s) => ({ ...s, address }))}
                            onApplyEstimate={handleApplyAVMEstimate}
                        />

                        <PropertyInput
                            inputs={state.inputs}
                            onInputsChange={(inputs) => setState((s) => ({ ...s, inputs }))}
                            address={state.address}
                            onAddressChange={(address) => setState((s) => ({ ...s, address }))}
                            sqft={state.sqft}
                            onSqftChange={(sqft) => setState((s) => ({ ...s, sqft }))}
                            addressHistory={addressHistory}
                            onSaveToHistory={saveToHistory}
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
            <footer className="mt-12 pb-6 text-center text-sm text-[#557755]">
                <p>FL Home Buyers Comp Calculator • Real-time calculations • Data saved locally</p>
            </footer>

            {/* Toast Notifications */}
            <ToastContainer />

            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Confirm Reset Modal */}
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
