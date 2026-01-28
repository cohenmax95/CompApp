'use client';

import { SingleOfferResult, formatCurrency, formatPercent } from '@/lib/calculations';

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
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
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
        <div className={`glass-card p-4 ${getStatusClass()} ${isHighlighted ? 'ring-2 ring-blue-500' : ''} transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center`}>
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                            {title}
                            {isHighlighted && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/20 text-blue-400">
                                    Best
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    </div>
                </div>
                {getStatusBadge()}
            </div>

            {/* Main Value */}
            <div className="flex items-end justify-between">
                <div>
                    <p className="text-2xl font-bold text-white">
                        {formatCurrency(offer.offerPrice)}
                    </p>
                </div>
                <div className="text-right">
                    <p className={`text-sm font-semibold ${offer.expectedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(offer.expectedProfit)}
                    </p>
                    <p className="text-[10px] text-slate-500">profit</p>
                </div>
            </div>
        </div>
    );
}

