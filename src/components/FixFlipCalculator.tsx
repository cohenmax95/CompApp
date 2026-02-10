'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { formatCurrency } from '@/lib/calculations';
import { getCountyTaxRate } from '@/lib/fl-counties';

interface FixFlipCalculatorProps {
    arv: number;
    repairEstimate: number;
    sqft: number;
    county?: string | null;
}

interface CostAssumptions {
    closingPct: number;       // Acquisition closing %
    hmPoints: number;         // Hard money points %
    hmInterestRate: number;   // Hard money interest rate %
    hmJunkFees: number;       // Hard money junk fees $
    insurancePerSqft: number; // $/sqft/yr
    utilitiesPerMo: number;   // $/mo
    propTaxPct: number;       // Property tax % of ARV
    buyerAgentPct: number;    // Buyer agent commission %
    titlePct: number;         // Title & recording %
    docStampsPct: number;     // FL doc stamps %
}

const DEFAULT_COSTS: CostAssumptions = {
    closingPct: 2,
    hmPoints: 2,
    hmInterestRate: 11,
    hmJunkFees: 1500,
    insurancePerSqft: 2,
    utilitiesPerMo: 200,
    propTaxPct: 1,
    buyerAgentPct: 3,
    titlePct: 0.5,
    docStampsPct: 0.7,
};

// Inline editable value — looks like a label, tap to edit
function EditableValue({
    value,
    onChange,
    suffix = '%',
    prefix = '',
    step = 0.1,
    min = 0,
    max = 100,
}: {
    value: number;
    onChange: (v: number) => void;
    suffix?: string;
    prefix?: string;
    step?: number;
    min?: number;
    max?: number;
}) {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    if (editing) {
        return (
            <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                autoFocus
                className="w-16 px-1 py-0 bg-slate-700/80 border border-emerald-500/50 rounded text-right text-emerald-300 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
        );
    }

    return (
        <button
            onClick={() => setEditing(true)}
            className="text-emerald-400/70 hover:text-emerald-300 border-b border-dashed border-emerald-500/30 hover:border-emerald-400/60 transition-colors cursor-pointer"
            title="Tap to edit"
        >
            {prefix}{value}{suffix}
        </button>
    );
}

// Haptic feedback helper
const haptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(4);
    }
};

export default function FixFlipCalculator({ arv, repairEstimate, sqft, county }: FixFlipCalculatorProps) {
    const [arvPercent, setArvPercent] = useState(70);
    const [holdMonths, setHoldMonths] = useState(5);
    const [loanPercent, setLoanPercent] = useState(90);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [costs, setCosts] = useState<CostAssumptions>(DEFAULT_COSTS);
    const [countyApplied, setCountyApplied] = useState<string | null>(null);

    // Auto-set property tax rate when county is detected
    useEffect(() => {
        if (county && county !== countyApplied) {
            const rate = getCountyTaxRate(county);
            setCosts((c) => ({ ...c, propTaxPct: rate }));
            setCountyApplied(county);
        }
    }, [county, countyApplied]);

    const updateCost = <K extends keyof CostAssumptions>(key: K, value: number) => {
        setCosts((c) => ({ ...c, [key]: value }));
    };

    const toggle = (section: string) => setExpanded((prev) => {
        const next = new Set(prev);
        if (next.has(section)) next.delete(section);
        else next.add(section);
        return next;
    });

    const allSections = ['acq', 'hold', 'resale'];
    const allExpanded = allSections.every((s) => expanded.has(s));
    const toggleAll = () => setExpanded(allExpanded ? new Set() : new Set(allSections));

    // STEP 1: Purchase Price
    const purchasePrice = Math.round(arv * (arvPercent / 100) - repairEstimate);

    // STEP 2: Acquisition Closing Costs
    const acquireClosing = Math.round(purchasePrice * (costs.closingPct / 100));

    // Acquisition total
    const acquisitionTotal = purchasePrice + acquireClosing;

    // STEP 3: Hard Money Costs
    const loanAmount = Math.round(purchasePrice * (loanPercent / 100));
    const downPayment = purchasePrice - loanAmount;
    const hardMoneyPoints = Math.round(loanAmount * (costs.hmPoints / 100));
    const hardMoneyJunkFees = costs.hmJunkFees;
    const hardMoneyInterest = Math.round((loanAmount * (costs.hmInterestRate / 100) / 12) * holdMonths);
    const totalHardMoney = hardMoneyPoints + hardMoneyJunkFees + hardMoneyInterest;

    // STEP 4: Holding Costs
    const insuranceAnnual = sqft * costs.insurancePerSqft;
    const insuranceHolding = Math.round((insuranceAnnual / 12) * holdMonths);
    const utilities = Math.round(costs.utilitiesPerMo * holdMonths);
    const propertyTaxMonthly = Math.round((arv * (costs.propTaxPct / 100)) / 12);
    const propertyTaxHolding = propertyTaxMonthly * holdMonths;
    const totalHolding = insuranceHolding + utilities + propertyTaxHolding;

    // Holding total (hard money + holding + renovation)
    const holdingTotal = totalHardMoney + totalHolding + repairEstimate;

    // STEP 5: Resale Closing Costs
    const buyerAgentComm = Math.round(arv * (costs.buyerAgentPct / 100));
    const titleAndRecording = Math.round(arv * (costs.titlePct / 100));
    const docStamps = Math.round(arv * (costs.docStampsPct / 100));
    const totalResaleClosing = buyerAgentComm + titleAndRecording + docStamps;

    // TOTALS
    const totalInvestment = purchasePrice + acquireClosing + totalHardMoney + totalHolding + repairEstimate;
    const grossProfit = arv - totalResaleClosing - totalInvestment;
    const roi = totalInvestment > 0 ? ((grossProfit / totalInvestment) * 100).toFixed(1) : '0';

    if (arv <= 0) {
        return (
            <div className="glass-card p-6 text-center text-slate-500">
                <p>Enter property details to calculate Fix & Flip profit</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Sliders */}
            <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-slate-500">Purchase % of ARV</label>
                        <span className="text-sm font-bold text-emerald-400">{arvPercent}%</span>
                    </div>
                    <input
                        type="range" min="50" max="85" value={arvPercent}
                        onChange={(e) => { setArvPercent(parseInt(e.target.value)); haptic(); }}
                        className="w-full h-2 rounded-lg cursor-pointer"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-slate-500">Loan Amount</label>
                        <span className="text-sm font-bold text-purple-400">{loanPercent}%</span>
                    </div>
                    <input
                        type="range" min="70" max="100" value={loanPercent}
                        onChange={(e) => { setLoanPercent(parseInt(e.target.value)); haptic(); }}
                        className="w-full h-2 rounded-lg cursor-pointer"
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-slate-500">Hold Time</label>
                        <span className="text-sm font-bold text-cyan-400">{holdMonths} mo</span>
                    </div>
                    <input
                        type="range" min="2" max="12" value={holdMonths}
                        onChange={(e) => { setHoldMonths(parseInt(e.target.value)); haptic(); }}
                        className="w-full h-2 rounded-lg cursor-pointer"
                    />
                </div>
            </div>

            {sqft <= 0 && (
                <p className="text-xs text-amber-400">Holding costs may be inaccurate — square footage is missing.</p>
            )}

            {/* Collapsible cost sections */}
            <div className="space-y-2 text-sm">
                <button onClick={toggleAll} className="w-full text-right text-xs text-slate-500 hover:text-slate-300 transition-colors px-1 pb-1">
                    {allExpanded ? '▼ Collapse All' : '▶ Expand All'}
                </button>
                {/* Acquisition */}
                <button onClick={() => toggle('acq')} className="w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-colors text-left">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <svg className={`w-3 h-3 text-slate-500 transition-transform ${expanded.has('acq') ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M6 6l8 4-8 4V6z" /></svg>
                            <span className="text-slate-400">Acquisition</span>
                        </div>
                        <span className="font-bold text-white">{formatCurrency(acquisitionTotal)}</span>
                    </div>
                </button>
                {expanded.has('acq') && (
                    <div className="ml-5 p-3 rounded-xl bg-slate-900/50 text-xs text-slate-500 space-y-1.5">
                        <div className="flex justify-between items-center">
                            <span>Purchase Price ({arvPercent}% ARV − repairs)</span>
                            <span>{formatCurrency(purchasePrice)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Closing Costs (<EditableValue value={costs.closingPct} onChange={(v) => updateCost('closingPct', v)} />)</span>
                            <span>{formatCurrency(acquireClosing)}</span>
                        </div>
                    </div>
                )}

                {/* Holding & Renovation */}
                <button onClick={() => toggle('hold')} className="w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-colors text-left">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <svg className={`w-3 h-3 text-slate-500 transition-transform ${expanded.has('hold') ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M6 6l8 4-8 4V6z" /></svg>
                            <span className="text-slate-400">Holding & Renovation ({holdMonths} mo)</span>
                        </div>
                        <span className="font-bold text-white">{formatCurrency(holdingTotal)}</span>
                    </div>
                </button>
                {expanded.has('hold') && (
                    <div className="ml-5 p-3 rounded-xl bg-slate-900/50 text-xs text-slate-500 space-y-1.5">
                        <div className="flex justify-between items-center"><span>Hard Money Points (<EditableValue value={costs.hmPoints} onChange={(v) => updateCost('hmPoints', v)} />)</span><span>{formatCurrency(hardMoneyPoints)}</span></div>
                        <div className="flex justify-between items-center"><span>Interest (<EditableValue value={costs.hmInterestRate} onChange={(v) => updateCost('hmInterestRate', v)} />, {holdMonths} mo)</span><span>{formatCurrency(hardMoneyInterest)}</span></div>
                        <div className="flex justify-between items-center"><span>Junk Fees</span><span><EditableValue value={costs.hmJunkFees} onChange={(v) => updateCost('hmJunkFees', v)} prefix="$" suffix="" step={100} max={10000} /></span></div>
                        <div className="flex justify-between items-center"><span>Loan: {formatCurrency(loanAmount)} | Down: {formatCurrency(downPayment)}</span><span></span></div>
                        <div className="border-t border-slate-800 my-1"></div>
                        <div className="flex justify-between items-center"><span>Insurance (<EditableValue value={costs.insurancePerSqft} onChange={(v) => updateCost('insurancePerSqft', v)} prefix="$" suffix="/sqft/yr" step={0.5} max={10} />)</span><span>{formatCurrency(insuranceHolding)}</span></div>
                        <div className="flex justify-between items-center"><span>Utilities (<EditableValue value={costs.utilitiesPerMo} onChange={(v) => updateCost('utilitiesPerMo', v)} prefix="$" suffix="/mo" step={25} max={1000} />)</span><span>{formatCurrency(utilities)}</span></div>
                        <div className="flex justify-between items-center"><span>Property Tax (<EditableValue value={costs.propTaxPct} onChange={(v) => updateCost('propTaxPct', v)} />)</span><span>{formatCurrency(propertyTaxHolding)}</span></div>
                        <div className="border-t border-slate-800 my-1"></div>
                        <div className="flex justify-between items-center"><span>Renovation</span><span>{formatCurrency(repairEstimate)}</span></div>
                    </div>
                )}

                {/* Resale */}
                <button onClick={() => toggle('resale')} className="w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800/70 transition-colors text-left">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <svg className={`w-3 h-3 text-slate-500 transition-transform ${expanded.has('resale') ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 20 20"><path d="M6 6l8 4-8 4V6z" /></svg>
                            <span className="text-slate-400">Resale Costs</span>
                        </div>
                        <span className="font-bold text-white">{formatCurrency(totalResaleClosing)}</span>
                    </div>
                </button>
                {expanded.has('resale') && (
                    <div className="ml-5 p-3 rounded-xl bg-slate-900/50 text-xs text-slate-500 space-y-1.5">
                        <div className="flex justify-between items-center"><span>Buyer&apos;s Agent (<EditableValue value={costs.buyerAgentPct} onChange={(v) => updateCost('buyerAgentPct', v)} />)</span><span>{formatCurrency(buyerAgentComm)}</span></div>
                        <div className="flex justify-between items-center"><span>Title & Recording (<EditableValue value={costs.titlePct} onChange={(v) => updateCost('titlePct', v)} />)</span><span>{formatCurrency(titleAndRecording)}</span></div>
                        <div className="flex justify-between items-center"><span>FL Doc Stamps (<EditableValue value={costs.docStampsPct} onChange={(v) => updateCost('docStampsPct', v)} />)</span><span>{formatCurrency(docStamps)}</span></div>
                    </div>
                )}
            </div>

            {/* Profit Summary — always visible */}
            <div className={`p-4 rounded-xl border-2 ${grossProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Total Investment</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(totalInvestment)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-slate-400 mb-1">Sale Price (ARV)</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(arv)}</p>
                    </div>
                </div>
                <div className="border-t border-slate-700 mt-3 pt-3">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-400">Net Profit</p>
                            <p className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {formatCurrency(grossProfit)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">ROI</p>
                            <p className={`text-2xl font-bold ${parseFloat(roi) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {roi}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
