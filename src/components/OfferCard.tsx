'use client';

import { SingleOfferResult, formatCurrency, formatPercent, formatDate } from '@/lib/calculations';

interface OfferCardProps {
    title: string;
    subtitle: string;
    offer: SingleOfferResult;
    colorClass: string;
    icon: React.ReactNode;
    isHighlighted?: boolean;
}

export default function OfferCard({
    title,
    subtitle,
    offer,
    colorClass,
    icon,
    isHighlighted = false
}: OfferCardProps) {
    const getStatusClass = () => {
        if (!offer.isViable) return 'status-not-viable';
        if (offer.marginPercent >= 15) return 'status-viable';
        return 'status-marginal';
    };

    const getStatusBadge = () => {
        if (!offer.isViable) {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                    Not Viable
                </span>
            );
        }
        if (offer.marginPercent >= 15) {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 viable-glow">
                    Viable
                </span>
            );
        }
        return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
                Marginal
            </span>
        );
    };

    return (
        <div className={`glass-card p-5 ${getStatusClass()} ${isHighlighted ? 'ring-2 ring-blue-500' : ''} transition-all duration-200 hover:shadow-xl hover:-translate-y-1`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            {title}
                            {isHighlighted && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 best-indicator">
                                    Best
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-slate-400">{subtitle}</p>
                    </div>
                </div>
                {getStatusBadge()}
            </div>

            {/* Main Value */}
            <div className="mb-4">
                <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(offer.offerPrice)}
                </p>
                <p className="text-sm text-slate-400">Offer Price</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                    <p className="text-xs text-slate-500">Profit</p>
                    <p className={`text-sm font-semibold ${offer.expectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(offer.expectedProfit)}
                    </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                    <p className="text-xs text-slate-500">Margin</p>
                    <p className={`text-sm font-semibold ${offer.marginPercent >= 15 ? 'text-emerald-400' : offer.marginPercent >= 10 ? 'text-amber-400' : 'text-red-400'}`}>
                        {formatPercent(offer.marginPercent)}
                    </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-800/50 text-center">
                    <p className="text-xs text-slate-500">Days</p>
                    <p className="text-sm font-semibold text-slate-300">
                        ~{offer.daysToClose}
                    </p>
                </div>
            </div>

            {/* Closing Date */}
            <div className="mb-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-slate-400">Est. Close:</span>
                    <span className="text-sm font-medium text-white">{formatDate(offer.closingDate)}</span>
                </div>
            </div>

            {/* Terms */}
            {offer.terms && (
                <p className="text-xs text-slate-500 leading-relaxed">
                    {offer.terms}
                </p>
            )}
        </div>
    );
}
