'use client';

import Link from 'next/link';

const steps = [
    {
        number: '01',
        title: 'Enter a Property',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        content: [
            {
                subtitle: 'AVM Lookup (Recommended)',
                text: 'Type a Florida address in the search bar. Google autocomplete will suggest matches. Select one and hit "Fetch AVM" to pull automated property values from multiple data sources. The app scrapes real-time estimates and presents Low / Mid / High values.',
            },
            {
                subtitle: 'Manual Entry',
                text: 'If you already know the ARV, switch to the "Manual Entry" tab and type it directly. The As-Is value auto-derives at 90% of your ARV. Use the $ formatted input — commas are added automatically.',
            },
        ],
    },
    {
        number: '02',
        title: 'Set Repair Estimate',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
        ),
        content: [
            {
                subtitle: 'Quick Presets',
                text: 'Enter the property\'s square footage, then choose LOW, MID, or HIGH repair level. These are calculated based on $/sqft ranges that account for cosmetic vs. full gut rehabs.',
            },
            {
                subtitle: 'Custom Amount',
                text: 'Have your own contractor bid? Type any custom dollar amount directly into the "Custom Rehab Amount" field below the presets. This overrides the calculated estimate.',
            },
        ],
    },
    {
        number: '03',
        title: 'Analyze Fix & Flip',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        content: [
            {
                subtitle: 'Three Sliders',
                text: 'Purchase % of ARV — what percentage of the after-repair value you\'re buying at (default 70%). Loan Amount — hard money loan-to-value (default 90%). Hold Time — how many months you\'ll hold the property (default 5 months).',
            },
            {
                subtitle: 'Detailed Cost Breakdown',
                text: 'Costs are split into three collapsible sections: Acquisition (purchase price + closing costs), Holding & Renovation (hard money, insurance, utilities, property tax, rehab), and Resale (agent commission, title, doc stamps). Click "Expand All" to see everything at once.',
            },
            {
                subtitle: 'Profit Summary',
                text: 'At the bottom, you\'ll see Total Investment vs. Sale Price (ARV), plus your Net Profit and ROI percentage. Green means you\'re making money; red means the deal doesn\'t work at those assumptions.',
            },
        ],
    },
    {
        number: '04',
        title: 'Edit Cost Assumptions',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
        content: [
            {
                subtitle: 'Tap to Edit',
                text: 'Every percentage and rate in the breakdown is editable. Look for values with a subtle dashed underline — like "2%" next to Closing Costs or "11%" next to Interest. Tap the value to open an inline input, type your number, and press Enter or tap away to save.',
            },
            {
                subtitle: 'What You Can Edit',
                text: 'Closing costs %, hard money points %, interest rate %, junk fees $, insurance $/sqft, utilities $/month, property tax %, buyer\'s agent %, title & recording %, and FL doc stamps %. All calculations update instantly.',
            },
            {
                subtitle: 'County Tax Auto-Detection',
                text: 'When you enter an address, the app automatically detects the FL county and sets the correct property tax rate (e.g., Tampa → Hillsborough → 1.06%). You can always override it by tapping the percentage.',
            },
        ],
    },
    {
        number: '05',
        title: 'Compare Wholesale & Wholetail',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
        content: [
            {
                subtitle: 'Switch Tabs',
                text: 'Toggle from "Fix & Flip" to "Wholesale / Wholetail" to see those strategies. The app calculates your Max Allowable Offer (MAO) based on a configurable percentage of ARV minus repairs.',
            },
            {
                subtitle: 'MAO Slider',
                text: 'Adjust the MAO percentage slider (50%–85%) to see how different offer levels impact your assignment fee.',
            },
            {
                subtitle: 'Wholetail Viability',
                text: 'The Wholetail card shows whether flipping the property without major repairs is viable. It factors in As-Is value, closing costs, and your minimum profit threshold from Settings.',
            },
        ],
    },
    {
        number: '06',
        title: 'Export & Share',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        content: [
            {
                subtitle: 'PDF Report',
                text: 'Tap the download icon (📄) in the top-right header to generate a detailed PDF report. It includes property values, full Fix & Flip breakdown with line items, wholesale/wholetail offers, and the best strategy recommendation.',
            },
            {
                subtitle: 'Copy to Clipboard',
                text: 'Tap the copy icon (📋) to copy a text summary of all offers to your clipboard — useful for pasting into texts or emails.',
            },
            {
                subtitle: 'Share',
                text: 'On mobile, tap the share icon to use your device\'s native share sheet (iMessage, WhatsApp, email, etc.).',
            },
        ],
    },
    {
        number: '07',
        title: 'Adjust Global Settings',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        content: [
            {
                subtitle: 'Settings Panel',
                text: 'Scroll to the bottom of the calculator and expand the Settings accordion. Here you can adjust global parameters like minimum profit margins, default agent commission rates, and other baseline assumptions that affect all strategies.',
            },
            {
                subtitle: 'Persistence',
                text: 'All your inputs, settings, and adjustments are automatically saved to your device. When you return to the app, everything is exactly where you left it. Use the reset button (↺ icon in the header) to start fresh.',
            },
        ],
    },
];

const tips = [
    { emoji: '💡', text: 'Dashed underlines = editable. If you see a dashed line under a number, tap it to change it.' },
    { emoji: '📱', text: 'Works offline. Once loaded, the calculator works without internet. Only AVM lookups need a connection.' },
    { emoji: '🔄', text: 'All data auto-saves. Close the app and come back — your numbers will still be there.' },
    { emoji: '🎯', text: 'Use the 70% rule as a starting point, then adjust the Purchase % slider based on market conditions.' },
    { emoji: '📊', text: 'Expand All lets you screenshot the entire cost breakdown for your records or to share with partners.' },
    { emoji: '🏠', text: 'County tax rates auto-detect for all 67 FL counties. Override if you know the exact millage.' },
];

export default function TutorialPage() {
    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a1210 0%, #141a1f 40%, #0f1a14 100%)' }}>
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-slate-800/50" style={{ backgroundColor: 'rgba(20, 26, 31, 0.85)' }}>
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back to Calculator</span>
                    </Link>
                    <span className="text-xs text-slate-500">v1.0</span>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-8">
                {/* Title */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        TUTORIAL
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">How to Use the Comp Calculator</h1>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        A step-by-step guide to analyzing deals, adjusting assumptions, and making confident offers.
                    </p>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                    {steps.map((step, i) => (
                        <div key={i} className="relative">
                            {/* Connector line */}
                            {i < steps.length - 1 && (
                                <div className="absolute left-5 top-14 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 to-transparent" />
                            )}

                            <div className="flex gap-4">
                                {/* Step number */}
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                                    {step.icon}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-[10px] text-emerald-500/60 font-mono">{step.number}</span>
                                        <h2 className="text-lg font-bold text-white">{step.title}</h2>
                                    </div>

                                    <div className="space-y-3 pb-6">
                                        {step.content.map((item, j) => (
                                            <div key={j} className="rounded-xl bg-slate-800/40 p-3.5 border border-slate-700/30">
                                                <h3 className="text-sm font-semibold text-emerald-400 mb-1">{item.subtitle}</h3>
                                                <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pro Tips */}
                <div className="mt-10 mb-8">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-amber-400">⚡</span>
                        Pro Tips
                    </h2>
                    <div className="space-y-2">
                        {tips.map((tip, i) => (
                            <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                <span className="text-lg flex-shrink-0">{tip.emoji}</span>
                                <p className="text-xs text-slate-400 leading-relaxed">{tip.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center pb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Open Calculator
                    </Link>
                </div>
            </main>
        </div>
    );
}
