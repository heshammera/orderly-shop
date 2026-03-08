"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
    storeId: string;
    storeSlug: string;
    placeholder?: string;
    onSearch?: (query: string) => void;
}

export function SearchBar({ storeId, storeSlug, placeholder, onSearch }: SearchBarProps) {
    const { language } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Controlled input state
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const debouncedQuery = useDebounce(query, 300);

    // Click outside to close suggestions
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.trim().length < 2) {
                setSuggestions([]);
                setIsOpen(false);
                return;
            }

            setLoading(true);
            try {
                // Fetch just 5 results for autocomplete
                const res = await fetch(`/api/store/search?storeId=${storeId}&q=${encodeURIComponent(debouncedQuery)}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.products || []);
                    setIsOpen(true);
                }
            } catch (error) {
                console.error("Failed to fetch suggestions:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery, storeId]);

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsOpen(false);

        if (onSearch) {
            onSearch(query);
            return;
        }

        // Default behavior: update URL params
        const params = new URLSearchParams(searchParams.toString());
        if (query.trim()) {
            params.set('q', query.trim());
        } else {
            params.delete('q');
        }

        // Always reset pagination on new search
        params.delete('page');

        router.push(`${pathname}?${params.toString()}`);
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setIsOpen(false);
        if (onSearch) {
            onSearch('');
        } else {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('q');
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    return (
        <div ref={wrapperRef} className="relative w-full z-30">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder={placeholder || (language === 'ar' ? 'ابحث عن منتج...' : 'Search for a product...')}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => {
                        if (query.trim().length >= 2 && suggestions.length > 0) {
                            setIsOpen(true);
                        }
                    }}
                    className="w-full ps-10 pe-10 bg-white/80 backdrop-blur-sm border-gray-200 focus:border-primary transition-all duration-300 rounded-full shadow-sm hover:shadow-md"
                />

                {query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </form>

            {/* Suggestions Dropdown */}
            {isOpen && (loading || suggestions.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    {loading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                    ) : (
                        <ul className="py-2">
                            {suggestions.map((product) => (
                                <li key={product.id}>
                                    <button
                                        onClick={() => {
                                            router.push(`/s/${storeSlug}/p/${product.id}`);
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-start"
                                    >
                                        <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Search className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate text-gray-800">
                                                {product.name[language] || product.name.ar}
                                            </p>
                                        </div>
                                    </button>
                                </li>
                            ))}
                            <li className="border-t border-gray-100 mt-1 pt-1">
                                <button
                                    onClick={handleSearchSubmit}
                                    className="w-full text-center px-4 py-2 text-sm text-primary hover:bg-primary/5 transition-colors font-medium"
                                >
                                    {language === 'ar' ? `عرض كل النتائج لـ "${query}"` : `See all results for "${query}"`}
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
