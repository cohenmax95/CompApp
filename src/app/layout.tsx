import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'FL Home Buyers - Comp Calculator',
    description: 'Professional comp analysis tool for FL Home Buyers. Calculate wholesale, wholetail, and flip offers instantly.',
    keywords: ['real estate', 'FL Home Buyers', 'comp calculator', 'wholesale', 'fix and flip', 'wholetail'],
    icons: {
        icon: '/favicon.png',
    },
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
