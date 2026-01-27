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
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="theme-color" content="#0f172a" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/favicon.png" />
            </head>
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
