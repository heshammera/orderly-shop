'use client';

import React, { useEffect } from 'react';

interface ThemeVariablesProps {
    tokens: Record<string, string>;
    isRTL?: boolean;
}

export default function ThemeVariables({ tokens, isRTL = true }: ThemeVariablesProps) {
    useEffect(() => {
        const root = document.documentElement;

        // Apply RTL Direction
        root.setAttribute('dir', isRTL ? 'rtl' : 'ltr');

        // Apply Design Tokens as CSS Variables
        // The keys in tokens should match what tailwind expects, e.g. "primary", "secondary"
        Object.entries(tokens).forEach(([key, value]) => {
            // Assuming tokens are passed as hex or hsl. For tailwind HSL support we need variables like --primary: 222.2 47.4% 11.2%
            // But for simplicity if we pass direct colors or hex we can map them back.
            // If the engine stores hex, we might need a hex-to-hsl converter here.
            // For now, we set the variable directly. Theme registry should store HSL strings.
            root.style.setProperty(`--${key}`, value);
        });

    }, [tokens, isRTL]);

    return null; // This component exclusively manages the DOM <html/> side-effects.
}
