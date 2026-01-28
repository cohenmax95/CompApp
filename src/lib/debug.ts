'use client';

/**
 * App-Wide Debug Utility
 * Provides styled console logging for tracking every user interaction and state change.
 * All logs are prefixed with category and timestamp for easy filtering.
 */

const DEBUG_ENABLED = process.env.NODE_ENV !== 'production' || typeof window !== 'undefined';

// Color-coded log categories
const LOG_STYLES = {
    CLICK: 'background: #10b981; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    INPUT: 'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    STATE: 'background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    API: 'background: #f59e0b; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    NAV: 'background: #ec4899; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    ERROR: 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    HISTORY: 'background: #06b6d4; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    CALC: 'background: #84cc16; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
};

type LogCategory = keyof typeof LOG_STYLES;

interface LogData {
    [key: string]: unknown;
}

function formatTimestamp(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
}

/**
 * Core debug logging function with styled output
 */
export function debug(category: LogCategory, action: string, data?: LogData): void {
    if (!DEBUG_ENABLED) return;

    const timestamp = formatTimestamp();
    const style = LOG_STYLES[category];

    if (data && Object.keys(data).length > 0) {
        console.log(
            `%c${category}%c [${timestamp}] ${action}`,
            style,
            'color: #94a3b8; font-weight: normal;',
            data
        );
    } else {
        console.log(
            `%c${category}%c [${timestamp}] ${action}`,
            style,
            'color: #94a3b8; font-weight: normal;'
        );
    }
}

// Convenience wrappers for common log categories
export const debugClick = (element: string, data?: LogData) => debug('CLICK', `Clicked: ${element}`, data);
export const debugInput = (field: string, value: unknown) => debug('INPUT', `Changed: ${field}`, { value });
export const debugState = (component: string, state: LogData) => debug('STATE', `${component} state update`, state);
export const debugAPI = (endpoint: string, data?: LogData) => debug('API', endpoint, data);
export const debugNav = (action: string, data?: LogData) => debug('NAV', action, data);
export const debugError = (context: string, error: unknown) => debug('ERROR', context, { error: error instanceof Error ? error.message : String(error) });
export const debugHistory = (action: string, data?: LogData) => debug('HISTORY', action, data);
export const debugCalc = (calculation: string, data?: LogData) => debug('CALC', calculation, data);

/**
 * HOC for wrapping click handlers with debug logging
 */
export function withClickDebug<T extends (...args: unknown[]) => unknown>(
    element: string,
    handler: T,
    getData?: () => LogData
): T {
    return ((...args: unknown[]) => {
        debugClick(element, getData?.());
        return handler(...args);
    }) as T;
}

/**
 * Track form field changes
 */
export function debugFormChange(formName: string, fieldName: string, oldValue: unknown, newValue: unknown): void {
    debug('INPUT', `${formName}.${fieldName}`, { from: oldValue, to: newValue });
}

/**
 * Log component mount/unmount for lifecycle debugging
 */
export function debugMount(component: string): void {
    debug('STATE', `${component} mounted`);
}

export function debugUnmount(component: string): void {
    debug('STATE', `${component} unmounted`);
}

/**
 * Performance timing helper
 */
export function debugTiming(label: string): { end: () => void } {
    const start = performance.now();
    debug('STATE', `⏱ Starting: ${label}`);

    return {
        end: () => {
            const duration = (performance.now() - start).toFixed(2);
            debug('STATE', `⏱ Completed: ${label} (${duration}ms)`);
        }
    };
}
