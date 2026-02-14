"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ImagePlus, Trash, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface ImageUploadProps {
    value: string[];
    onChange: (value: string[]) => void;
    onRemove: (value: string) => void;
    disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    onRemove,
    disabled
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const { language } = useLanguage();
    const supabase = createClient();

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/\s/g, '_')}`; // Sanitize filename
        const filePath = `products/${fileName}`;

        try {
            // Upload the file
            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            onChange([...value, publicUrl]);
            toast.success(language === 'ar' ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully');

        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error(language === 'ar' ? 'فشل رفع الصورة' : 'Image upload failed');
        } finally {
            setIsUploading(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {value.map((url) => (
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden border group">
                        <div className="absolute top-2 right-2 z-10">
                            <Button
                                type="button"
                                onClick={() => onRemove(url)}
                                variant="destructive"
                                size="icon"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            className="object-cover w-full h-full"
                            alt="Image"
                            src={url}
                        />
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-4">
                <Button
                    type="button"
                    variant="secondary"
                    disabled={disabled || isUploading}
                    onClick={() => document.getElementById('image-upload-input')?.click()}
                >
                    {isUploading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {language === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                        </>
                    ) : (
                        <>
                            <ImagePlus className="h-4 w-4 mr-2" />
                            {language === 'ar' ? 'رفع صورة' : 'Upload an Image'}
                        </>
                    )}
                </Button>
                <input
                    id="image-upload-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onUpload}
                    disabled={disabled || isUploading}
                />
            </div>
        </div>
    );
};
