import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'CompApp - Real Estate Comp Calculator',
    description: 'Professional comp analysis tool for real estate investors. Calculate wholesale, novation, wholetail, and flip offers instantly.',
    keywords: ['real estate', 'comp calculator', 'wholesale', 'novation', 'fix and flip', 'wholetail'],
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
