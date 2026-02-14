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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Languages, Loader2, Sparkles, Copy, Type } from 'lucide-react';
import { toast } from 'sonner';

interface AITranslatorProps {
    onTranslated?: (text: string) => void;
    initialText?: string;
}

export function AITranslator({ onTranslated, initialText = '' }: AITranslatorProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [text, setText] = useState(initialText);
    const [targetLang, setTargetLang] = useState<'ar' | 'en'>('ar');
    const [result, setResult] = useState('');

    const handleTranslate = async () => {
        if (!text.trim()) {
            toast.error('Please enter text to translate');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'translate',
                    text,
                    targetLang,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                if (response.status === 429) {
                    throw new Error('Quota exceeded. Please check your AI plan/billing.');
                }

                throw new Error(errorData.error || 'Failed to translate');
            }

            const data = await response.json();
            if (data.success) {
                setResult(data.data);
                if (onTranslated) onTranslated(data.data);
                toast.success('Translation complete!');
            }
        } catch (error: any) {
            console.error('Translation error:', error);
            toast.error(error.message || 'Translation failed');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(result);
        toast.success('Copied to clipboard');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Languages className="w-4 h-4" />
                    AI Translator
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-600" />
                        Professional AI Translator
                    </DialogTitle>
                    <DialogDescription>
                        Translate content professionally between Arabic and English.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Source Text</Label>
                        <Textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Enter text to translate..."
                            rows={4}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <Label>Target Language:</Label>
                        <Select value={targetLang} onValueChange={(v: 'ar' | 'en') => setTargetLang(v)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ar">Arabic (العربية)</SelectItem>
                                <SelectItem value="en">English (الإنجليزية)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {result && (
                        <div className="grid gap-2 relative">
                            <Label>Translation Result</Label>
                            <div className="relative">
                                <Textarea
                                    value={result}
                                    readOnly
                                    className="bg-muted/50"
                                    rows={4}
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={copyToClipboard}
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleTranslate} disabled={loading} className="gap-2">
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Translating...
                            </>
                        ) : (
                            <>
                                <Languages className="w-4 h-4" />
                                Translate
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
