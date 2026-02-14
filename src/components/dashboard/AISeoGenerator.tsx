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
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface AISeoGeneratorProps {
    onGenerated: (data: {
        metaTitle: string;
        metaDescription: string;
        tags: string[];
    }) => void;
    initialProductName?: string;
    initialDescription?: string;
}

export function AISeoGenerator({ onGenerated, initialProductName = '', initialDescription = '' }: AISeoGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [productName, setProductName] = useState(initialProductName);
    const [description, setDescription] = useState(initialDescription);

    const handleGenerate = async () => {
        if (!productName.trim()) {
            toast.error('Please enter a product name');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'generate-seo',
                    name: productName,
                    description,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                if (response.status === 429) {
                    throw new Error('Quota exceeded. Please check your AI plan/billing.');
                }

                throw new Error(errorData.error || 'Failed to generate SEO data');
            }

            const result = await response.json();

            if (result.success && result.data) {
                onGenerated(result.data);
                setOpen(false);
                toast.success('SEO metadata generated! 🚀');
            }
        } catch (error: any) {
            console.error('SEO Generation error:', error);
            toast.error('Failed to generate SEO data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Search className="w-4 h-4" />
                    AI SEO Optimizer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        AI SEO Optimizer
                    </DialogTitle>
                    <DialogDescription>
                        Generate optimized meta titles, descriptions, and tags for better search ranking.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="seoProductName">Product Name</Label>
                        <Input
                            id="seoProductName"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="Product Name"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="seoDescription">Product Description (Context)</Label>
                        <Textarea
                            id="seoDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Paste product description here for better context..."
                            rows={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} disabled={loading} className="gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generate SEO Data
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
