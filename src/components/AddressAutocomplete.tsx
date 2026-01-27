'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    placeholder?: string;
    className?: string;
}

interface Prediction {
    description: string;
    placeId: string;
}

export default function AddressAutocomplete({ value, onChange, placeholder, className }: AddressAutocompleteProps) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Fetch address predictions via our API proxy
    const fetchPredictions = useCallback(async (input: string) => {
        if (input.length < 3) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
            const data = await response.json();

            if (data.predictions && data.predictions.length > 0) {
                setPredictions(data.predictions);
                setIsOpen(true);
            } else {
                setPredictions([]);
            }
        } catch (error) {
            console.log('Autocomplete error:', error);
            setPredictions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced input handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            fetchPredictions(newValue);
        }, 300);
    };

    // Select a prediction
    const selectPrediction = (prediction: Prediction) => {
        onChange(prediction.description);
        setPredictions([]);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onFocus={() => predictions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder || "Start typing an address..."}
                    className={className || "input-field"}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-slate-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Predictions dropdown */}
            {isOpen && predictions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-64 overflow-y-auto">
                    {predictions.map((prediction, index) => (
                        <button
                            key={prediction.placeId}
                            onClick={() => selectPrediction(prediction)}
                            className={`w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors flex items-center gap-3
                ${index !== predictions.length - 1 ? 'border-b border-slate-700' : ''}`}
                        >
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{prediction.description}</span>
                        </button>
                    ))}
                    <div className="px-4 py-2 text-xs text-slate-500 bg-slate-900/50 flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        </svg>
                        Powered by Google
                    </div>
                </div>
            )}
        </div>
    );
}
