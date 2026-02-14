"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AIProductGeneratorProps {
    onGenerated: (data: {
        title_ar: string;
        title_en: string;
        description_ar: string;
        description_en: string;
        seo_keywords: string[];
    }) => void;
}

export function AIProductGenerator({ onGenerated }: AIProductGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('professional');
    const [category, setCategory] = useState('');

    const handleGenerate = async () => {
        if (!productName.trim()) {
            toast.error('Please enter a product name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/ai', { // Updated endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-product', // Added action
                    productName,
                    keywords,
                    tone,
                    category,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                if (response.status === 429) {
                    throw new Error('Quota exceeded. Please check your AI plan/billing.');
                }

                throw new Error(errorData.error || 'Failed to generate content');
            }

            const result = await response.json();

            if (result.success && result.data) {
                onGenerated(result.data);
                setOpen(false);
                setProductName('');
                setKeywords('');
                setCategory('');
                toast.success('Product content generated successfully! ✨');
            }
        } catch (error: any) {
            console.error('Generation error:', error);
            toast.error(error.message || 'Failed to generate content');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Magic Writer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        AI Product Content Generator
                    </DialogTitle>
                    <DialogDescription>
                        Let AI create professional, SEO-optimized product content in seconds.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="productName">Product Name *</Label>
                        <Input
                            id="productName"
                            placeholder="e.g., فستان صيفي قطني"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Category (Optional)</Label>
                        <Input
                            id="category"
                            placeholder="e.g., Fashion, Electronics"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="keywords">SEO Keywords (Optional)</Label>
                        <Input
                            id="keywords"
                            placeholder="e.g., فستان, صيف, قطن"
                            value={keywords}
                            onChange={(e) => setKeywords(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tone">Writing Tone</Label>
                        <Select value={tone} onValueChange={setTone} disabled={loading}>
                            <SelectTrigger id="tone">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly & Casual</SelectItem>
                                <SelectItem value="luxury">Luxury & Premium</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating Magic...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate Content
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
