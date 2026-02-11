import { NextResponse } from 'next/server';

interface DealData {
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

const SYSTEM_PROMPT = `You are a concise real estate investment analyst. You will receive deal numbers from a fix & flip calculator. Your job:

1. MEMO: Write a 2-3 sentence investment summary. Include the key numbers (purchase, ARV, profit, ROI). Be direct and professional.

2. FLAGS: List 0-4 risk flags based ONLY on the numbers provided. Only flag genuine concerns. Use these thresholds:
   - ROI below 15% = thin margins
   - Hold time 8+ months = extended timeline
   - Repair costs > 30% of ARV = heavy rehab
   - Loan-to-value > 95% = high leverage
   - Net profit < $20,000 = low absolute return
   - If everything looks solid, return an empty flags array

Respond in JSON only: { "memo": "...", "flags": ["...", "..."] }
Do NOT invent any data. Only reference the numbers provided to you.`;

export async function POST(request: Request) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const data: DealData = await request.json();

        const userPrompt = `Analyze this fix & flip deal:
- Address: ${data.address || 'Not specified'}
- ARV: $${data.arv.toLocaleString()}
- Purchase Price: $${data.purchasePrice.toLocaleString()}
- Repair Estimate: $${data.repairEstimate.toLocaleString()}
- Total Investment: $${data.totalInvestment.toLocaleString()}
- Net Profit: $${data.netProfit.toLocaleString()}
- ROI: ${data.roi}%
- Hold Time: ${data.holdMonths} months
- Loan: ${data.loanPercent}% LTV
- Sqft: ${data.sqft > 0 ? data.sqft.toLocaleString() : 'Unknown'}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 250,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenAI API error:', errorData);
            return NextResponse.json(
                { error: 'AI service unavailable' },
                { status: 502 }
            );
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
            return NextResponse.json(
                { error: 'No response from AI' },
                { status: 502 }
            );
        }

        const parsed = JSON.parse(content);
        return NextResponse.json({
            memo: parsed.memo || '',
            flags: parsed.flags || [],
        });
    } catch (error) {
        console.error('Deal memo error:', error);
        return NextResponse.json(
            { error: 'Failed to generate memo' },
            { status: 500 }
        );
    }
}
