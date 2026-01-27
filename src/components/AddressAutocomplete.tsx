'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string) => void;
    onEnter?: () => void;  // Callback when Enter is pressed
    placeholder?: string;
    className?: string;
}

interface Prediction {
    description: string;
    placeId: string;
}

export default function AddressAutocomplete({
    value,
    onChange,
    onEnter,
    placeholder,
    className
}: AddressAutocompleteProps) {
    const [predictions, setPredictions] = useState<Prediction[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const fetchPredictions = useCallback(async (input: string) => {
        if (input.length < 3) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/places?input=${encodeURIComponent(input)}`);
            const data = await response.json();

            if (data.predictions?.length > 0) {
                setPredictions(data.predictions);
                setIsOpen(true);
                setSelectedIndex(-1);
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

    const selectPrediction = (prediction: Prediction) => {
        onChange(prediction.description);
        setPredictions([]);
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, predictions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && predictions[selectedIndex]) {
                selectPrediction(predictions[selectedIndex]);
            } else if (value.trim() && onEnter) {
                setIsOpen(false);
                onEnter();
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => predictions.length > 0 && setIsOpen(true)}
                    placeholder={placeholder || "Enter address, press Enter to fetch..."}
                    className={`${className || "input-field"} pl-14 pr-10`}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-5 h-5 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}
                {!isLoading && value.trim() && (
                    <button
                        onClick={() => { onChange(''); inputRef.current?.focus(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-700 transition-colors"
                        title="Clear address"
                        type="button"
                    >
                        <svg className="w-4 h-4 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {isOpen && predictions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
                    {predictions.map((prediction, index) => (
                        <button
                            key={prediction.placeId}
                            onClick={() => selectPrediction(prediction)}
                            className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3
                ${index === selectedIndex ? 'bg-blue-600/30 text-white' : 'text-slate-300 hover:bg-slate-700/50'}
                ${index !== predictions.length - 1 ? 'border-b border-slate-700/50' : ''}`}
                        >
                            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate">{prediction.description}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
