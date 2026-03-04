'use client';

import React, { useState, useEffect, useRef } from 'react';

interface InlineEditableTextProps {
    sectionId: string;
    settingId: string;
    value: string;
    className?: string;
    as?: keyof JSX.IntrinsicElements;
}

export default function InlineEditableText({
    sectionId,
    settingId,
    value,
    className = '',
    as: Component = 'span'
}: InlineEditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [localValue, setLocalValue] = useState(value);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const elementRef = useRef<HTMLElement>(null);

    // Check if we are in the Theme Customizer Iframe
    useEffect(() => {
        const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
        setIsPreviewMode(isPreview);
    }, []);

    // Update local value if parent value changes (from sidebar)
    useEffect(() => {
        if (!isEditing) {
            setLocalValue(value);
        }
    }, [value, isEditing]);

    // Handle when user double clicks to edit inline
    const handleDoubleClick = () => {
        if (!isPreviewMode) return;
        setIsEditing(true);
        // Focus after state update
        setTimeout(() => {
            if (elementRef.current) {
                elementRef.current.focus();
                // Move cursor to end
                const range = document.createRange();
                const sel = window.getSelection();
                range.selectNodeContents(elementRef.current);
                range.collapse(false);
                sel?.removeAllRanges();
                sel?.addRange(range);
            }
        }, 0);
    };

    const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
        if (!isEditing) return;
        setIsEditing(false);

        const newValue = e.currentTarget.innerText;
        setLocalValue(newValue);

        // Send update up to the Theme Customizer parent
        window.parent.postMessage({
            type: 'UPDATE_SECTION_SETTING',
            sectionId,
            settings: { [settingId]: newValue }
        }, '*');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            elementRef.current?.blur();
        }
    };

    // If we are in preview mode, we show visual cues
    const interactiveClasses = isPreviewMode
        ? `cursor-text hover:ring-2 hover:ring-primary/50 transition-all rounded px-1 -mx-1 ${isEditing ? 'ring-2 ring-primary outline-none bg-primary/10' : ''}`
        : '';

    return React.createElement(
        Component as any,
        {
            ref: elementRef,
            className: `${className} ${interactiveClasses}`.trim(),
            contentEditable: isEditing,
            suppressContentEditableWarning: true,
            onDoubleClick: handleDoubleClick,
            onBlur: handleBlur,
            onKeyDown: handleKeyDown,
            title: isPreviewMode ? 'انقر نقراً مزدوجاً للتعديل المباشر' : undefined,
        },
        localValue
    );
}
