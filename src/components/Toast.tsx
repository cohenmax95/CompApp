'use client';

import { useState, useEffect, useCallback } from 'react';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

let toastId = 0;
const listeners: ((toasts: Toast[]) => void)[] = [];
let currentToasts: Toast[] = [];

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success') {
    const id = `toast-${++toastId}`;
    const toast: Toast = { id, message, type };
    currentToasts = [...currentToasts, toast];
    listeners.forEach(l => l(currentToasts));

    // Auto-dismiss after 3s
    setTimeout(() => {
        currentToasts = currentToasts.filter(t => t.id !== id);
        listeners.forEach(l => l(currentToasts));
    }, 3000);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        listeners.push(setToasts);
        return () => {
            const idx = listeners.indexOf(setToasts);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] space-y-2">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`px-4 py-3 rounded-xl shadow-lg backdrop-blur-xl animate-fade-in flex items-center gap-2 min-w-[200px] ${toast.type === 'success' ? 'bg-green-600/90 text-white' :
                            toast.type === 'error' ? 'bg-red-600/90 text-white' :
                                'bg-slate-700/90 text-white'
                        }`}
                >
                    {toast.type === 'success' && (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    {toast.type === 'error' && (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    )}
                    {toast.type === 'info' && (
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <span className="text-sm font-medium">{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

export function OfflineIndicator() {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            showToast('Back online!', 'success');
        };
        const handleOffline = () => {
            setIsOnline(false);
            showToast('You are offline', 'error');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-red-600 text-white text-sm font-medium flex items-center gap-2 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
            </svg>
            Offline
        </div>
    );
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#112211] border border-[#2d4a2d] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-[#88b088] mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-xl bg-[#1a3318] text-white font-medium hover:bg-[#2d4a2d] transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </div>
        </div>
    );
}
