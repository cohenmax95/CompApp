'use client';

import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { AVMResult, AVMFetchResult, formatAVMCurrency, PropertyData } from '@/lib/avm';
import { debugClick, debugAPI, debugHistory, debugError } from '@/lib/debug';
import AddressAutocomplete from './AddressAutocomplete';

interface AVMPanelProps {
    address: string;
    onAddressChange: (address: string) => void;
    onApplyEstimate: (arv: number, asIsValue: number, sqft?: number) => void;
}

export interface AVMPanelRef {
    fetchAVMs: () => void;
}

// Comp History Entry - saved to localStorage
interface CompHistoryEntry {
    id: string;
    address: string;
    timestamp: string;
    results: AVMResult[];
    propertyData: PropertyData | null;
    medianEstimate: number;
}

const HISTORY_STORAGE_KEY = 'compapp_avm_history';
const MAX_HISTORY_ENTRIES = 50;

// Helper to format relative time
function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

// All AVM sources we fetch from (with address verification for accuracy)
const AVM_SOURCES = [
    { id: 'rentcast', name: 'RentCast', icon: 'RC' },
    { id: 'zillow', name: 'Zillow', icon: 'Z' },
    { id: 'redfin', name: 'Redfin', icon: 'R' },
    { id: 'realtor', name: 'Realtor', icon: 'R' },
    { id: 'trulia', name: 'Trulia', icon: 'T' },
    { id: 'comehome', name: 'ComeHome', icon: 'C' },
    { id: 'bofa', name: 'BofA', icon: 'B' },
    { id: 'xome', name: 'Xome', icon: 'X' },
];

type SourceStatus = 'pending' | 'fetching' | 'found' | 'not_found';

interface SourceState {
    status: SourceStatus;
    value?: number;
}

const AVMPanel = forwardRef<AVMPanelRef, AVMPanelProps>(({ address, onAddressChange, onApplyEstimate }, ref) => {
    const [results, setResults] = useState<AVMResult[]>([]);
    const [propertyData, setPropertyData] = useState<PropertyData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [sourceStates, setSourceStates] = useState<Record<string, SourceState>>({});

    // Manual ARV override state
    const [manualARV, setManualARV] = useState<string>('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    // Manual mode property fields
    const [manualSqft, setManualSqft] = useState<string>('');
    const [manualBeds, setManualBeds] = useState<string>('');
    const [manualBaths, setManualBaths] = useState<string>('');

    // History state
    const [history, setHistory] = useState<CompHistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // Load history from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as CompHistoryEntry[];
                setHistory(parsed);
                console.log('[CompHistory] Loaded', parsed.length, 'history entries');
            }
        } catch (e) {
            console.error('[CompHistory] Failed to load history:', e);
        }
    }, []);

    // Save history to localStorage whenever it changes
    const saveHistory = useCallback((entries: CompHistoryEntry[]) => {
        try {
            const trimmed = entries.slice(0, MAX_HISTORY_ENTRIES);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
            setHistory(trimmed);
            console.log('[CompHistory] Saved', trimmed.length, 'entries');
        } catch (e) {
            console.error('[CompHistory] Failed to save history:', e);
        }
    }, []);

    // Add a new entry to history (called after successful fetch)
    const addToHistory = useCallback((addr: string, res: AVMResult[], propData: PropertyData | null) => {
        if (res.length === 0) return;

        const estimates = res.map(r => r.estimate).sort((a, b) => a - b);
        const median = estimates[Math.floor(estimates.length / 2)];

        const newEntry: CompHistoryEntry = {
            id: Date.now().toString(),
            address: addr,
            timestamp: new Date().toISOString(),
            results: res,
            propertyData: propData,
            medianEstimate: median,
        };

        // Remove any existing entry for same address, add new one at top
        const filtered = history.filter(h => h.address.toLowerCase() !== addr.toLowerCase());
        saveHistory([newEntry, ...filtered]);
    }, [history, saveHistory]);

    // Load a history entry
    const loadFromHistory = useCallback((entry: CompHistoryEntry) => {
        debugHistory('Loading history entry', { address: entry.address, sources: entry.results.length });
        onAddressChange(entry.address);
        setResults(entry.results);
        setPropertyData(entry.propertyData);
        setShowHistory(false);

        // Update source states
        const newStates: Record<string, SourceState> = {};
        AVM_SOURCES.forEach(s => {
            const result = entry.results.find(r =>
                r.source.toLowerCase().includes(s.id) ||
                s.name.toLowerCase().includes(r.source.toLowerCase().split(' ')[0])
            );
            if (result) {
                newStates[s.id] = { status: 'found', value: result.estimate };
            } else {
                newStates[s.id] = { status: 'not_found' };
            }
        });
        setSourceStates(newStates);
    }, [onAddressChange]);

    // Initialize source states
    useEffect(() => {
        const initial: Record<string, SourceState> = {};
        AVM_SOURCES.forEach(s => {
            initial[s.id] = { status: 'pending' };
        });
        setSourceStates(initial);
    }, []);

    // Animate loading progress and simulate source updates
    useEffect(() => {
        if (isLoading) {
            setLoadingProgress(0);
            // Set all sources to fetching
            const fetching: Record<string, SourceState> = {};
            AVM_SOURCES.forEach(s => {
                fetching[s.id] = { status: 'fetching' };
            });
            setSourceStates(fetching);

            const interval = setInterval(() => {
                setLoadingProgress(prev => {
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
            const timeout = setTimeout(() => setLoadingProgress(0), 500);
            return () => clearTimeout(timeout);
        }
    }, [isLoading]);

    // Update source states when results change
    useEffect(() => {
        if (results.length > 0 && !isLoading) {
            const newStates: Record<string, SourceState> = {};
            AVM_SOURCES.forEach(s => {
                const result = results.find(r =>
                    r.source.toLowerCase().includes(s.id) ||
                    s.name.toLowerCase().includes(r.source.toLowerCase().split(' ')[0])
                );
                if (result) {
                    newStates[s.id] = { status: 'found', value: result.estimate };
                } else {
                    newStates[s.id] = { status: 'not_found' };
                }
            });
            setSourceStates(newStates);
        }
    }, [results, isLoading]);

    useImperativeHandle(ref, () => ({
        fetchAVMs
    }));

    const fetchAVMs = async () => {
        if (!address.trim()) {
            debugError('AVMPanel', 'No address provided');
            setError('Please enter a property address first');
            return;
        }

        debugAPI('AVM Fetch Started', { address });

        setIsLoading(true);
        setError(null);
        setResults([]);
        setPropertyData(null);

        // Initialize all sources to 'checking' state
        const initialStates: Record<string, SourceState> = {};
        AVM_SOURCES.forEach(s => {
            initialStates[s.id] = { status: 'fetching' };
        });
        setSourceStates(initialStates);

        try {
            // Use streaming endpoint for real-time source updates
            const eventSource = new EventSource(`/api/avm/stream?address=${encodeURIComponent(address)}`);
            const collectedResults: AVMResult[] = [];
            let collectedPropertyData: PropertyData | null = null;

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    debugAPI('Stream event', { source: data.source, status: data.status });

                    // Handle completion signal
                    if (data.source === '_complete') {
                        debugAPI('Stream complete', { totalResults: collectedResults.length });
                        eventSource.close();
                        setIsLoading(false);
                        // Save to history
                        if (collectedResults.length > 0) {
                            debugHistory('Saving search', { address, count: collectedResults.length });
                            addToHistory(address, collectedResults, collectedPropertyData);
                        }
                        return;
                    }

                    // Map source name to ID
                    const sourceId = data.source.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
                    const matchedSource = AVM_SOURCES.find(s =>
                        s.name.toLowerCase().includes(data.source.toLowerCase().split(' ')[0]) ||
                        data.source.toLowerCase().includes(s.id)
                    );

                    if (matchedSource) {
                        // Update source state
                        setSourceStates(prev => ({
                            ...prev,
                            [matchedSource.id]: {
                                status: data.status === 'found' ? 'found' :
                                    data.status === 'error' ? 'not_found' :
                                        data.status,
                                value: data.estimate || undefined,
                            }
                        }));

                        // Collect result if found
                        if (data.status === 'found' && data.estimate) {
                            collectedResults.push({
                                source: data.source,
                                estimate: data.estimate,
                                low: data.low || Math.round(data.estimate * 0.95),
                                high: data.high || Math.round(data.estimate * 1.05),
                                lastUpdated: new Date().toISOString(),
                                url: data.url || '',
                            });
                            setResults([...collectedResults]);

                            // Update property data if provided
                            if (data.propertyData && data.propertyData.sqft > 0) {
                                collectedPropertyData = {
                                    sqft: data.propertyData.sqft || 0,
                                    beds: data.propertyData.beds || 0,
                                    baths: data.propertyData.baths || 0,
                                    yearBuilt: data.propertyData.yearBuilt || 0,
                                    lotSize: data.propertyData.lotSize || 0,
                                    propertyType: data.propertyData.propertyType,
                                    lastSaleDate: data.propertyData.lastSaleDate,
                                    lastSalePrice: data.propertyData.lastSalePrice,
                                };
                                setPropertyData(collectedPropertyData);
                            }
                        }
                    }
                } catch (e) {
                    console.error('Error parsing stream event:', e);
                }
            };

            eventSource.onerror = (e) => {
                console.error('EventSource error:', e);
                eventSource.close();
                setIsLoading(false);

                // If no results collected, fall back to regular API
                if (collectedResults.length === 0) {
                    fetchAVMsFallback();
                }
            };

        } catch (err) {
            console.error('Fetch error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsLoading(false);
        }
    };

    // Fallback to regular POST API if streaming fails
    const fetchAVMsFallback = async () => {
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

            // Update source states based on results
            const newStates: Record<string, SourceState> = {};
            AVM_SOURCES.forEach(s => {
                const result = data.results.find(r =>
                    r.source.toLowerCase().includes(s.id) ||
                    s.name.toLowerCase().includes(r.source.toLowerCase().split(' ')[0])
                );
                newStates[s.id] = result
                    ? { status: 'found', value: result.estimate }
                    : { status: 'not_found' };
            });
            setSourceStates(newStates);
        } catch (err) {
            console.error('Fallback fetch error:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const calculateEstimates = () => {
        if (results.length === 0) return { bestEstimate: 0, median: 0 };

        const sorted = [...results].sort((a, b) => a.estimate - b.estimate);
        const estimates = sorted.map(r => r.estimate);

        const mid = Math.floor(estimates.length / 2);
        const median = estimates.length % 2 === 0
            ? Math.round((estimates[mid - 1] + estimates[mid]) / 2)
            : estimates[mid];

        if (estimates.length <= 4) {
            return { bestEstimate: median, median };
        }

        const trimCount = Math.max(1, Math.floor(estimates.length * 0.125));
        const trimmed = estimates.slice(trimCount, estimates.length - trimCount);
        const trimmedMean = Math.round(trimmed.reduce((a, b) => a + b, 0) / trimmed.length);
        const bestEstimate = Math.min(median, trimmedMean);

        return { bestEstimate, median };
    };

    const applyEstimate = () => {
        const { bestEstimate } = calculateEstimates();
        if (bestEstimate > 0) {
            onApplyEstimate(bestEstimate, Math.round(bestEstimate * 0.9), propertyData?.sqft);
        }
    };

    // Apply manual ARV override
    const applyManualARV = () => {
        const value = parseInt(manualARV.replace(/[^0-9]/g, ''));
        if (value > 0) {
            const sqft = manualSqft ? parseInt(manualSqft.replace(/[^0-9]/g, '')) : propertyData?.sqft;
            onApplyEstimate(value, Math.round(value * 0.9), sqft);
            if (!isManualMode) {
                setManualARV('');
                setShowManualEntry(false);
            }
        }
    };

    const { bestEstimate, median } = calculateEstimates();
    const hasResults = results.length > 0;
    const foundCount = Object.values(sourceStates).filter(s => s.status === 'found').length;

    // Status indicator component
    const StatusIcon = ({ status }: { status: SourceStatus }) => {
        switch (status) {
            case 'fetching':
                return (
                    <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                );
            case 'found':
                return (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                );
            case 'not_found':
                return (
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                );
            default:
                return <div className="w-2 h-2 rounded-full bg-slate-600" />;
        }
    };

    return (
        <div className="glass-card p-5 border border-slate-700 bg-slate-900/80">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white text-base">Property Value Lookup</h3>
                    <p className="text-xs text-slate-500 truncate">
                        {isManualMode ? 'Manual entry' : hasResults ? `${foundCount} sources found` : 'Enter address'}
                    </p>
                </div>
                {/* Mode Toggle */}
                <div className="flex items-center">
                    <button
                        onClick={() => setIsManualMode(false)}
                        className={`px-3 py-1.5 rounded-l text-xs font-medium transition-all ${!isManualMode
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Auto
                    </button>
                    <button
                        onClick={() => setIsManualMode(true)}
                        className={`px-3 py-1.5 rounded-r text-xs font-medium transition-all ${isManualMode
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        Manual
                    </button>
                </div>
                {/* History Button */}
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-1.5 rounded transition-all relative ${showHistory
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                    title={`History (${history.length})`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {history.length > 0 && !showHistory && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-slate-500 rounded-full text-[10px] flex items-center justify-center text-white">
                            {history.length > 9 ? '9' : history.length}
                        </span>
                    )}
                </button>
            </div>

            {/* History Dropdown */}
            {showHistory && history.length > 0 && (
                <div className="mb-4 bg-slate-800/80 rounded-xl border border-slate-600/50 overflow-hidden">
                    <div className="px-3 py-2 bg-slate-700/50 border-b border-slate-600/50 flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-300">Search History</span>
                        <span className="text-xs text-slate-500">{history.length} saved</span>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {history.map((entry) => {
                            const date = new Date(entry.timestamp);
                            const timeAgo = getTimeAgo(date);
                            return (
                                <div
                                    key={entry.id}
                                    className="px-3 py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/50 transition-colors cursor-pointer group"
                                    onClick={() => loadFromHistory(entry)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white truncate">{entry.address}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-emerald-400 font-medium">
                                                    ${entry.medianEstimate.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-slate-500">•</span>
                                                <span className="text-xs text-slate-500">{timeAgo}</span>
                                                <span className="text-xs text-slate-500">•</span>
                                                <span className="text-xs text-slate-500">{entry.results.length} sources</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAddressChange(entry.address);
                                                setShowHistory(false);
                                                // Re-fetch fresh data
                                                setTimeout(() => fetchAVMs(), 100);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 transition-all text-xs"
                                            title="Refresh"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            {showHistory && history.length === 0 && (
                <div className="mb-4 p-4 bg-slate-800/60 rounded-xl text-center">
                    <p className="text-sm text-slate-400">No search history yet</p>
                    <p className="text-xs text-slate-500 mt-1">Searches are automatically saved</p>
                </div>
            )}

            {/* Address Input with Autocomplete */}
            <div className="mb-4">
                <AddressAutocomplete
                    value={address}
                    onChange={onAddressChange}
                    onEnter={!isManualMode ? fetchAVMs : undefined}
                    placeholder="Enter property address..."
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-600/50 text-white placeholder-slate-500 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 focus:outline-none transition-all text-base"
                />
            </div>

            {/* Manual Mode Form */}
            {isManualMode ? (
                <div className="mb-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                    {/* Simple 2x2 Grid - Works great on all screen sizes */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* ARV */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">ARV</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                <input
                                    type="text"
                                    value={manualARV}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setManualARV(val ? parseInt(val).toLocaleString() : '');
                                    }}
                                    placeholder="480,000"
                                    className="w-full pl-7 pr-2 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white font-medium placeholder-slate-600 focus:border-slate-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                        {/* Sq Ft */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Sq Ft</label>
                            <input
                                type="text"
                                value={manualSqft}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/[^0-9]/g, '');
                                    setManualSqft(val ? parseInt(val).toLocaleString() : '');
                                }}
                                placeholder="1,850"
                                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder-slate-600 focus:border-slate-500 focus:outline-none transition-all"
                            />
                        </div>
                        {/* Beds */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Beds</label>
                            <input
                                type="text"
                                value={manualBeds}
                                onChange={(e) => setManualBeds(e.target.value.replace(/[^0-9]/g, ''))}
                                placeholder="3"
                                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder-slate-600 focus:border-slate-500 focus:outline-none transition-all"
                            />
                        </div>
                        {/* Baths */}
                        <div>
                            <label className="block text-xs text-slate-400 mb-1.5">Baths</label>
                            <input
                                type="text"
                                value={manualBaths}
                                onChange={(e) => setManualBaths(e.target.value.replace(/[^0-9.]/g, ''))}
                                placeholder="2"
                                className="w-full px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-600 text-white placeholder-slate-600 focus:border-slate-500 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    {/* Apply Button */}
                    <button
                        onClick={applyManualARV}
                        disabled={!manualARV}
                        className="w-full mt-3 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium transition-all"
                    >
                        Apply
                    </button>
                </div>
            ) : (
                <>
                    {/* Fetch Button - Prominent (Auto Mode) */}
                    <button
                        onClick={fetchAVMs}
                        disabled={isLoading || !address.trim()}
                        className="w-full py-3 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold flex items-center justify-center gap-2 mb-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isLoading ? (
                            <>
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Fetching Property Values...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Fetch Property Values
                            </>
                        )}
                    </button>

                    {/* Loading Progress */}
                    {isLoading && (
                        <div className="mb-4">
                            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-slate-500 transition-all duration-100"
                                    style={{ width: `${loadingProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Manual ARV Entry Section (collapsible in Auto mode) */}
                    <div className="mb-4">
                        <button
                            onClick={() => setShowManualEntry(!showManualEntry)}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span className="text-slate-400">Manual Override</span>
                            </div>
                            <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showManualEntry ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {showManualEntry && (
                            <div className="mt-2 p-3 rounded bg-slate-800 border border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">Enter custom ARV</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                        <input
                                            type="text"
                                            value={manualARV}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '');
                                                if (val) {
                                                    setManualARV(parseInt(val).toLocaleString());
                                                } else {
                                                    setManualARV('');
                                                }
                                            }}
                                            placeholder="Amount"
                                            className="w-full pl-6 pr-2 py-2 rounded bg-slate-900 border border-slate-700 text-white placeholder-slate-600 focus:border-slate-500 focus:outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={applyManualARV}
                                        disabled={!manualARV}
                                        className="px-3 py-2 rounded bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-medium transition-all"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Simple Source Status */}
            {isLoading && (
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                    <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    <span>Checking {AVM_SOURCES.length} sources...</span>
                </div>
            )}
            {!isLoading && foundCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{foundCount} sources found</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                    {error}
                </div>
            )}

            {/* No address hint */}
            {!address.trim() && !hasResults && !isLoading && (
                <div className="p-4 rounded-lg bg-slate-800/50 text-center text-slate-400 text-sm">
                    <svg className="w-8 h-8 mx-auto mb-2 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Enter an address above to fetch property values
                </div>
            )}

            {/* Results Summary */}
            {hasResults && (
                <div className="space-y-3">
                    {/* Property Data */}
                    {propertyData && (
                        <div className="p-3 rounded-lg bg-slate-800/50 flex items-center justify-between text-sm">
                            <span className="text-slate-400">Property:</span>
                            <span className="text-white font-medium">
                                {propertyData.sqft.toLocaleString()} sf • {propertyData.beds}bd/{propertyData.baths}ba • {propertyData.yearBuilt}
                            </span>
                        </div>
                    )}

                    {/* Best Estimate Card */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs text-emerald-300 mb-1">Best Estimate</p>
                                <p className="text-3xl font-bold text-white">{formatAVMCurrency(bestEstimate)}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                    From {foundCount} sources • Median: {formatAVMCurrency(median)}
                                </p>
                            </div>
                            <button
                                onClick={applyEstimate}
                                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all hover:scale-105 shadow-lg"
                            >
                                Use as ARV
                            </button>
                        </div>
                    </div>

                    {/* Sources List - Always Visible */}
                    <div className="space-y-2 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-300">All Sources</p>
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-xs text-slate-500 hover:text-white transition-colors"
                            >
                                {isExpanded ? 'Collapse' : 'Expand'}
                            </button>
                        </div>
                        {isExpanded && (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 animate-fade-in">
                                {results.map((result, index) => (
                                    <div
                                        key={index}
                                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{result.source}</p>
                                            <p className="text-xs text-slate-500">
                                                Range: {formatAVMCurrency(result.low)} - {formatAVMCurrency(result.high)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-lg font-semibold text-emerald-400">{formatAVMCurrency(result.estimate)}</p>
                                            {result.url && (
                                                <a
                                                    href={result.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors flex items-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Google Street View */}
            {address.trim() && hasResults && (
                <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm text-slate-400">Street View</span>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800/50">
                        <img
                            src={`https://maps.googleapis.com/maps/api/streetview?size=600x300&location=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dQQyYQ1ECZF7Pg'}`}
                            alt={`Street view of ${address}`}
                            className="w-full h-[200px] object-cover"
                            onError={(e) => {
                                // Hide image on error
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
});

AVMPanel.displayName = 'AVMPanel';
export default AVMPanel;
