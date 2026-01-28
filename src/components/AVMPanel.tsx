'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { AVMResult, AVMFetchResult, formatAVMCurrency, PropertyData } from '@/lib/avm';

interface AVMPanelProps {
    address: string;
    onApplyEstimate: (arv: number, asIsValue: number, sqft?: number) => void;
}

export interface AVMPanelRef {
    fetchAVMs: () => void;
}

const AVMPanel = forwardRef<AVMPanelRef, AVMPanelProps>(({ address, onApplyEstimate }, ref) => {
    const [results, setResults] = useState<AVMResult[]>([]);
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Animate loading progress
    useEffect(() => {
        if (isLoading) {
            setLoadingProgress(0);
            const interval = setInterval(() => {
                setLoadingProgress(prev => {
                    // Progress accelerates then slows near end (never quite reaches 100 until done)
                    if (prev < 30) return prev + 8;
                    if (prev < 60) return prev + 5;
                    if (prev < 85) return prev + 2;
                    if (prev < 95) return prev + 0.5;
                    return prev;
                });
            }, 100);
            return () => clearInterval(interval);
        } else {
            setLoadingProgress(100);
            // Reset after animation completes
            const timeout = setTimeout(() => setLoadingProgress(0), 500);
            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    // Expose fetchAVMs to parent via ref
    useImperativeHandle(ref, () => ({
        fetchAVMs
    }));

    const fetchAVMs = async () => {
        if (!address.trim()) {
            setError('Please enter a property address first');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/avm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch AVMs');
            }

            const data: AVMFetchResult = await response.json();
            setResults(data.results);
            setPropertyData(data.propertyData);

            if (data.errors.length > 0) {
                console.log('AVM notes:', data.errors);
            }

            // Auto-apply estimates after successful fetch
            if (data.results.length > 0) {
                const sorted = [...data.results].sort((a, b) => a.estimate - b.estimate);
                const estimates = sorted.map(r => r.estimate);

                // Calculate median
                const mid = Math.floor(estimates.length / 2);
                const median = estimates.length % 2 === 0
                    ? Math.round((estimates[mid - 1] + estimates[mid]) / 2)
                    : estimates[mid];

                // Calculate trimmed mean for 5+ results
                let bestEstimate = median;
                if (estimates.length > 4) {
                    const trimCount = Math.max(1, Math.floor(estimates.length * 0.125));
                    const trimmed = estimates.slice(trimCount, estimates.length - trimCount);
                    const trimmedMean = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
                    bestEstimate = Math.min(median, trimmedMean);
                }

                // Auto-apply: ARV = bestEstimate, As-Is = 90% of ARV, Sqft from property data
                onApplyEstimate(bestEstimate, Math.round(bestEstimate * 0.9), data.propertyData?.sqft);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch AVM data');
            setResults([]);
            setPropertyData(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate estimates using spreadsheet methodology:
    // Remove highest and lowest values (outliers), then average the middle values
    const calculateEstimates = () => {
        if (results.length === 0) return { bestEstimate: 0, median: 0 };

        const sorted = [...results].sort((a, b) => a.estimate - b.estimate);
        const estimates = sorted.map(r => r.estimate);

        // Median
        const mid = Math.floor(estimates.length / 2);
        const median = estimates.length % 2 === 0
            ? Math.round((estimates[mid - 1] + estimates[mid]) / 2)
            : estimates[mid];

        // Trimmed mean: exclude top and bottom ~12.5% (like spreadsheet)
        if (estimates.length <= 4) {
            return { bestEstimate: median, median };
        }

        const trimCount = Math.max(1, Math.floor(estimates.length * 0.125));
        const trimmed = estimates.slice(trimCount, estimates.length - trimCount);
        const trimmedMean = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);

        // Use the lesser of median and trimmed mean (conservative, like spreadsheet)
        const bestEstimate = Math.min(median, trimmedMean);

        return { bestEstimate, median };
    };

    const applyEstimate = () => {
        const { bestEstimate } = calculateEstimates();
        if (bestEstimate > 0) {
            onApplyEstimate(bestEstimate, Math.round(bestEstimate * 0.9), propertyData?.sqft);
        }
    };

    const { bestEstimate, median } = calculateEstimates();
    const hasResults = results.length > 0;

    return (
        <div className="glass-card p-5">
            {/* Header - Always Visible */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">AVM Estimates</h3>
                        <p className="text-sm text-slate-400">
                            {hasResults ? `${results.length} sources` : 'Fetch property values'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={fetchAVMs}
                    disabled={isLoading || !address.trim()}
                    className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2 w-full sm:w-auto"
                >
                    {isLoading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Fetching...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Fetch AVMs
                        </>
                    )}
                </button>
            </div>

            {/* Loading Progress Bar */}
            {isLoading && (
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Fetching from 7 sources...</span>
                        <span>{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100 ease-out"
                            style={{ width: `${loadingProgress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* No address warning */}
            {!address.trim() && !error && !hasResults && !isLoading && (
                <div className="mt-4 p-4 rounded-lg bg-slate-800/50 text-center text-slate-400 text-sm">
                    Enter a property address above to fetch AVM estimates
                </div>
            )}

            {/* Results Summary - Always visible when we have results */}
            {hasResults && (
                <div className="mt-4 space-y-3">
                    {/* Property Data Summary */}
                    {propertyData && (
                        <div className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between text-sm">
                            <span className="text-slate-400">Property Info:</span>
                            <span className="text-white font-medium">
                                {propertyData.sqft.toLocaleString()} sqft • {propertyData.beds} bed • {propertyData.baths} bath • Built {propertyData.yearBuilt}
                            </span>
                        </div>
                    )}

                    {/* Best Estimate + Apply Button - Main Action Area */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-blue-300 mb-1">Best Estimate (Trimmed Mean)</p>
                                <p className="text-2xl font-bold text-white">{formatAVMCurrency(bestEstimate)}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Lesser of median ({formatAVMCurrency(median)}) & trimmed avg
                                </p>
                            </div>
                            <button
                                onClick={applyEstimate}
                                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-105 shadow-lg"
                            >
                                Use as ARV
                            </button>
                        </div>
                    </div>

                    {/* Expand/Collapse Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                Hide all sources
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                                Show all {results.length} sources
                            </>
                        )}
                    </button>

                    {/* Expanded Sources List */}
                    {isExpanded && (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 animate-fade-in">
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50 transition-colors flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-white">{result.source}</p>
                                            {result.url && (
                                                <a
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-300"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            Range: {formatAVMCurrency(result.low)} - {formatAVMCurrency(result.high)}
                                        </p>
                                    </div>
                                    <p className="text-lg font-semibold text-emerald-400">{formatAVMCurrency(result.estimate)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

AVMPanel.displayName = 'AVMPanel';
export default AVMPanel;
