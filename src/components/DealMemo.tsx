'use client';

import { useState } from 'react';

interface DealMemoProps {
    address: string;
    arv: number;
    purchasePrice: number;
    repairEstimate: number;
    totalInvestment: number;
    netProfit: number;
    roi: string;
    holdMonths: number;
    loanPercent: number;
    sqft: number;
}

export default function DealMemo(props: DealMemoProps) {
    const [memo, setMemo] = useState<string | null>(null);
    const [flags, setFlags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generate = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/memo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(props),
            });

            if (!res.ok) throw new Error('Failed to generate');

            const data = await res.json();
            setMemo(data.memo);
            setFlags(data.flags || []);
        } catch {
            setError('Could not generate memo. Try again.');
        } finally {
            setLoading(false);
        }
    };

    const copyMemo = async () => {
        if (!memo) return;
        const fullText = flags.length > 0
            ? `${memo}\n\n⚠️ ${flags.join(' | ')}`
            : memo;
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Not yet generated — show button
    if (!memo && !loading && !error) {
        return (
            <button
                onClick={generate}
                className="w-full py-2.5 rounded-xl text-sm font-medium transition-all bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 flex items-center justify-center gap-2"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Generate AI Deal Memo
            </button>
        );
    }

    return (
        <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-800/30">
            {/* Loading */}
            {loading && (
                <div className="px-4 py-4 flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Analyzing deal...</span>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-red-400">{error}</span>
                    <button onClick={generate} className="text-xs text-slate-400 hover:text-white">
                        Retry
                    </button>
                </div>
            )}

            {/* Memo result */}
            {memo && !loading && (
                <>
                    <div className="px-4 pt-3 pb-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">AI Deal Memo</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={copyMemo}
                                    className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-emerald-400 transition-colors font-medium"
                                >
                                    {copied ? '✓ Copied' : 'Copy'}
                                </button>
                                <button
                                    onClick={generate}
                                    className="text-[10px] uppercase tracking-wider text-slate-500 hover:text-emerald-400 transition-colors font-medium"
                                >
                                    Redo
                                </button>
                            </div>
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">{memo}</p>
                    </div>

                    {/* Risk flags */}
                    {flags.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-700/30 flex flex-wrap gap-1.5">
                            {flags.map((flag, i) => (
                                <span
                                    key={i}
                                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                >
                                    ⚠ {flag}
                                </span>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
