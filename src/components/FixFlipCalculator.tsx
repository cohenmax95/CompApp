'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/calculations';

interface FixFlipCalculatorProps {
    arv: number;
    repairEstimate: number;
    sqft: number;
}

export default function FixFlipCalculator({ arv, repairEstimate, sqft }: FixFlipCalculatorProps) {
    const [arvPercent, setArvPercent] = useState(70);
    const [holdMonths, setHoldMonths] = useState(5);
    const [loanPercent, setLoanPercent] = useState(90); // 70-100% LTV

    // STEP 1: Purchase Price (based on % of ARV)
    const purchasePrice = Math.round(arv * (arvPercent / 100) - repairEstimate);

    // STEP 2: Acquisition Closing Costs (Florida standard ~2% of purchase)
    const acquireClosing = Math.round(purchasePrice * 0.02);

    // STEP 3: Hard Money Costs (based on loan amount)
    const loanAmount = Math.round(purchasePrice * (loanPercent / 100));
    const downPayment = purchasePrice - loanAmount;
    const hardMoneyPoints = Math.round(loanAmount * 0.02); // 2 points on loan
    const hardMoneyJunkFees = 1500; // Flat junk fees
    const hardMoneyInterest = Math.round((loanAmount * 0.11 / 12) * holdMonths); // 11% annual on loan
    const totalHardMoney = hardMoneyPoints + hardMoneyJunkFees + hardMoneyInterest;

    // STEP 4: Holding Costs
    const insuranceAnnual = sqft * 2; // $2/sqft annually
    const insuranceHolding = Math.round((insuranceAnnual / 12) * holdMonths);
    const utilities = Math.round(200 * holdMonths); // ~$200/mo utilities
    const propertyTaxMonthly = Math.round((arv * 0.01) / 12); // ~1% annual tax
    const propertyTaxHolding = propertyTaxMonthly * holdMonths;
    const totalHolding = insuranceHolding + utilities + propertyTaxHolding;

    // STEP 5: Renovation (using repair estimate passed in)
    const renovationCost = repairEstimate;

    // STEP 6: Resale Closing Costs
    const buyerAgentComm = Math.round(arv * 0.03); // 3% buyer's agent
    const titleAndRecording = Math.round(arv * 0.005); // Title ~0.5%
    const docStamps = Math.round(arv * 0.007); // FL doc stamps 0.7%
    const totalResaleClosing = buyerAgentComm + titleAndRecording + docStamps;

    // TOTALS
    const totalInvestment = purchasePrice + acquireClosing + totalHardMoney + totalHolding + renovationCost;
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
        <div className="glass-card p-5 space-y-5">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Fix & Flip Calculator</h3>
                    <p className="text-xs text-slate-500">Step-by-step profit breakdown</p>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-slate-500 block mb-2">Purchase % of ARV</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="50"
                            max="85"
                            value={arvPercent}
                            onChange={(e) => setArvPercent(parseInt(e.target.value))}
                            className="flex-1 h-2 rounded-lg cursor-pointer"
                        />
                        <span className="text-lg font-bold text-emerald-400 w-12 text-right">{arvPercent}%</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-2">Loan Amount</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="70"
                            max="100"
                            value={loanPercent}
                            onChange={(e) => setLoanPercent(parseInt(e.target.value))}
                            className="flex-1 h-2 rounded-lg cursor-pointer"
                        />
                        <span className="text-lg font-bold text-purple-400 w-12 text-right">{loanPercent}%</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs text-slate-500 block mb-2">Hold Time</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min="2"
                            max="12"
                            value={holdMonths}
                            onChange={(e) => setHoldMonths(parseInt(e.target.value))}
                            className="flex-1 h-2 rounded-lg cursor-pointer"
                        />
                        <span className="text-lg font-bold text-cyan-400 w-12 text-right">{holdMonths}mo</span>
                    </div>
                </div>
            </div>

            {/* Step-by-step breakdown */}
            <div className="space-y-3 text-sm">
                {/* Step 1: Purchase */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400">1. Purchase Price</span>
                        <span className="font-bold text-white">{formatCurrency(purchasePrice)}</span>
                    </div>
                    <p className="text-xs text-slate-600">{arvPercent}% of {formatCurrency(arv)} ARV − {formatCurrency(repairEstimate)} repairs</p>
                </div>

                {/* Step 2: Acquisition Closing */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400">2. Closing Costs (Acquisition)</span>
                        <span className="font-bold text-white">{formatCurrency(acquireClosing)}</span>
                    </div>
                    <p className="text-xs text-slate-600">~2% of purchase (FL standard)</p>
                </div>

                {/* Step 3: Hard Money */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400">3. Hard Money Costs</span>
                        <span className="font-bold text-white">{formatCurrency(totalHardMoney)}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                            <span>Loan Amount ({loanPercent}%)</span>
                            <span>{formatCurrency(loanAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Down Payment ({100 - loanPercent}%)</span>
                            <span>{formatCurrency(downPayment)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>2 Points</span>
                            <span>{formatCurrency(hardMoneyPoints)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>11% Interest ({holdMonths} mo)</span>
                            <span>{formatCurrency(hardMoneyInterest)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Junk Fees</span>
                            <span>{formatCurrency(hardMoneyJunkFees)}</span>
                        </div>
                    </div>
                </div>

                {/* Step 4: Holding Costs */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400">4. Holding Costs ({holdMonths} mo)</span>
                        <span className="font-bold text-white">{formatCurrency(totalHolding)}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                            <span>Insurance ($2/sqft annual)</span>
                            <span>{formatCurrency(insuranceHolding)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Utilities (~$200/mo)</span>
                            <span>{formatCurrency(utilities)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Property Tax (pro-rated)</span>
                            <span>{formatCurrency(propertyTaxHolding)}</span>
                        </div>
                    </div>
                </div>

                {/* Step 5: Renovation */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400">5. Renovation</span>
                        <span className="font-bold text-white">{formatCurrency(renovationCost)}</span>
                    </div>
                    <p className="text-xs text-slate-600">Based on selected repair grade</p>
                </div>

                {/* Step 6: Resale Closing */}
                <div className="p-3 rounded-xl bg-slate-800/50">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-slate-400">6. Resale Closing Costs</span>
                        <span className="font-bold text-white">{formatCurrency(totalResaleClosing)}</span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-0.5">
                        <div className="flex justify-between">
                            <span>Buyer's Agent (3%)</span>
                            <span>{formatCurrency(buyerAgentComm)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Title & Recording</span>
                            <span>{formatCurrency(titleAndRecording)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>FL Doc Stamps (0.7%)</span>
                            <span>{formatCurrency(docStamps)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary */}
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
