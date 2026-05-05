'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface AISemanticSearchProps {
    storeSlug: string;
}

export function AISemanticSearch({ storeSlug }: AISemanticSearchProps) {
    const { language } = useLanguage();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            // Instead of standard search, we use the AI Chat endpoint or a dedicated search endpoint.
            // Since we haven't built a dedicated semantic embedding search, we will route to the 
            // standard search page but with an AI flag, or we just rely on the Chatbot for now.
            // For this implementation, we will just redirect to the products page with the query.
            // A true semantic search would require pgvector or passing all products to Gemini.
            
            router.push(`/s/${storeSlug}/products?q=${encodeURIComponent(query)}&ai=true`);
            toast.info(language === 'ar' ? 'جاري البحث الذكي...' : 'Performing smart search...');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSearch} className="relative flex items-center w-full max-w-md mx-auto mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={language === 'ar' ? "بحث ذكي: أوصف ما تبحث عنه (مثال: فستان أحمر للسهرة)..." : "Smart Search: Describe what you want..."}
                className="pl-10 pr-12 h-12 rounded-full border-purple-200 focus-visible:ring-purple-500 shadow-sm"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <Button 
                type="submit" 
                size="icon" 
                disabled={loading || !query.trim()}
                className="absolute right-1 h-10 w-10 rounded-full bg-purple-600 hover:bg-purple-700 text-white"
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
        </form>
    );
}
