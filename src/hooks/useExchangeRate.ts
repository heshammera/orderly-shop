import { useState, useEffect } from 'react';

interface ExchangeRateData {
    rate: number;
    loading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

/**
 * Hook to fetch and manage real-time exchange rates from USD to target currency
 * Uses exchangerate-api.io for live rates
 */
export function useExchangeRate(targetCurrency: string): ExchangeRateData {
    const [rate, setRate] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchExchangeRate = async () => {
            try {
                setLoading(true);
                setError(null);

                // Using exchangerate-api.io free tier
                const response = await fetch(
                    `https://api.exchangerate-api.com/v4/latest/USD`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch exchange rate');
                }

                const data = await response.json();

                if (isMounted) {
                    const exchangeRate = data.rates[targetCurrency] || 1;
                    setRate(exchangeRate);
                    setLastUpdated(new Date());
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : 'Unknown error');
                    setLoading(false);
                    // Fallback to 1:1 rate on error
                    setRate(1);
                }
            }
        };

        fetchExchangeRate();

        // Refresh rate every 30 minutes
        const interval = setInterval(fetchExchangeRate, 30 * 60 * 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [targetCurrency]);

    return { rate, loading, error, lastUpdated };
}

/**
 * Convert USD amount to target currency
 */
export function convertUsdToTarget(usdAmount: number, rate: number): number {
    return usdAmount * rate;
}
