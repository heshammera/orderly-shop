"use client";

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, X, Send, Loader2, Store as StoreIcon, User, Mail, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { createClient } from '@supabase/supabase-js';

const supabaseParams = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
};
const supabase = createClient(supabaseParams.url, supabaseParams.key);

interface Store {
    name: string;
    slug: string;
}

interface Conversation {
    id: string;
    store_id: string | null;
    session_id: string | null;
    user_type: 'merchant' | 'guest';
    guest_name: string | null;
    status: 'open' | 'closed';
    unread_admin_count: number;
    updated_at: string;
    stores?: Store;
}

interface SupportMessage {
    id: string;
    conversation_id: string;
    sender_type: 'user' | 'admin';
    content: string;
    message_type?: string;
    image_url?: string;
    is_read: boolean;
    created_at: string;
}

export default function AdminSupportPage() {
    const { language, dir } = useLanguage();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Helper to safely extract localized string
    const getLocalizedText = (data: any, lang: 'en' | 'ar'): string => {
        if (!data) return '';
        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return parsed[lang] || parsed.en || parsed.ar || data;
            } catch {
                return data;
            }
        }
        if (typeof data === 'object') {
            return data[lang] || data.en || data.ar || '';
        }
        return String(data);
    };

    // Image upload states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const fetchConversations = async (isBackground = false) => {
        if (!isBackground) setLoadingConversations(true);
        try {
            const res = await fetch(`/api/admin/support?t=${Date.now()}`, {
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();

                // If we have a selected conversation, ensure its unread count stays 0
                // to prevent polling from flashing an old unread count before DB updates.
                const updatedConversations = (data.conversations || []).map((conv: Conversation) => {
                    if (selectedConv && conv.id === selectedConv.id) {
                        return { ...conv, unread_admin_count: 0 };
                    }
                    return conv;
                });

                setConversations(updatedConversations);
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            if (!isBackground) setLoadingConversations(false);
        }
    };

    const fetchMessages = async (convId: string, isBackground = false) => {
        if (!isBackground) setLoadingMessages(true);
        try {
            const res = await fetch(`/api/admin/support/${convId}?t=${Date.now()}`, {
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            if (!isBackground) setLoadingMessages(false);
        }
    };

    const markAsRead = async (convId: string) => {
        try {
            await fetch(`/api/admin/support/${convId}?t=${Date.now()}`, {
                method: 'PATCH',
                headers: { 'Cache-Control': 'no-cache' }
            });
            setConversations(prev =>
                prev.map(c => c.id === convId ? { ...c, unread_admin_count: 0 } : c)
            );
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Initial load and polling for conversations
    useEffect(() => {
        fetchConversations();

        const triggerBot = async () => {
            try {
                await fetch('/api/cron/bot-apology', { method: 'POST' });
            } catch (e) {
                console.error('Failed to trigger bot', e);
            }
        };

        const interval = setInterval(() => {
            fetchConversations(true);
            triggerBot();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Polling for selected conversation messages
    const selectedConvIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (!selectedConv?.id) {
            selectedConvIdRef.current = null;
            return;
        }

        // Prevent re-running if same conversation
        if (selectedConvIdRef.current === selectedConv.id) return;
        selectedConvIdRef.current = selectedConv.id;

        // Always mark as read when opening a conversation
        markAsRead(selectedConv.id);
        // Clear unread in the conversations list (not selectedConv to avoid loop)
        setConversations(prev =>
            prev.map(c => c.id === selectedConv.id ? { ...c, unread_admin_count: 0 } : c)
        );

        fetchMessages(selectedConv.id);

        const convId = selectedConv.id;
        const interval = setInterval(() => {
            fetchMessages(convId, true);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedConv?.id]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert(language === 'ar' ? 'يرجى اختيار صورة صالحة' : 'Please select a valid image');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert(language === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 5 ميجا بايت' : 'Image size must be less than 5MB');
            return;
        }

        setSelectedImage(file);

        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSend = async (e?: React.FormEvent, type: string = 'text', customContent?: string) => {
        if (e) e.preventDefault();

        const contentToSend = customContent || newMessage.trim();
        if (!contentToSend && type !== 'email_request' && !selectedImage) return;
        if (!selectedConv) return;

        try {
            setSending(true);
            if (!customContent) setNewMessage('');

            let imageUrlToSave: string | null = null;

            // Upload image if selected
            if (selectedImage) {
                setIsUploadingImage(true);
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `admin_${selectedConv.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('support_chat')
                    .upload(filePath, selectedImage);

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    alert(language === 'ar' ? 'فشل رفع الصورة' : 'Failed to upload image');
                    return;
                }

                const { data } = supabase.storage.from('support_chat').getPublicUrl(filePath);
                imageUrlToSave = data.publicUrl;

                setSelectedImage(null);
                setImagePreview(null);
                setIsUploadingImage(false);

                // If it's just an image message and we initially called with type 'text', override it
                if (type === 'text') type = 'image';
            }

            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => [...prev, {
                id: tempId,
                conversation_id: selectedConv.id,
                sender_type: 'admin',
                content: contentToSend || (type === 'email_request' ? (language === 'ar' ? 'يرجى تسجيل بريدك الإلكتروني للتواصل' : 'Please provide your email address') : (language === 'ar' ? 'صورة مرفقة' : 'Image attachment')),
                is_read: true,
                image_url: imageUrlToSave || undefined,
                message_type: type,
                created_at: new Date().toISOString()
            }]);

            await fetch(`/api/admin/support/${selectedConv.id}?t=${Date.now()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    content: contentToSend || undefined,
                    image_url: imageUrlToSave || undefined,
                    message_type: type
                })
            });

            // Re-fetch
            fetchMessages(selectedConv.id, true);
            fetchConversations(true); // update timestamp in list
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const filteredConversations = conversations.filter(c => {
        const storeObj = Array.isArray(c.stores) ? c.stores[0] : c.stores;
        const title = c.user_type === 'merchant' ? getLocalizedText(storeObj?.name, language as 'ar' | 'en') : c.guest_name;
        const displayTitle = String(title || 'Guest');
        return displayTitle.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] border rounded-xl overflow-hidden bg-background" dir={dir}>
            <div className="flex flex-1 overflow-hidden">

                {/* Inbox List (Left Panel) */}
                <div className="w-80 min-w-[300px] border-e flex flex-col bg-muted/30">
                    <div className="p-4 border-b bg-background shrink-0">
                        <h2 className="font-semibold text-lg mb-4">
                            {language === 'ar' ? 'صندوق الوارد (الدعم)' : 'Support Inbox'}
                        </h2>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 left-3 text-muted-foreground" />
                            <Input
                                placeholder={language === 'ar' ? 'ابحث عن متجر أو زائر...' : 'Search store or guest...'}
                                className="pl-9 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingConversations ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground opacity-70">
                                <MessageCircle className="w-12 h-12 mb-3" />
                                <p>{language === 'ar' ? 'لا توجد محادثات' : 'No conversations found'}</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {filteredConversations.map(conv => {
                                    const isMerchant = conv.user_type === 'merchant';
                                    const storeObj = Array.isArray(conv.stores) ? conv.stores[0] : conv.stores;
                                    const titleStr = isMerchant ? getLocalizedText(storeObj?.name, language as 'ar' | 'en') : conv.guest_name;
                                    const title = titleStr || 'Guest';
                                    const isSelected = selectedConv?.id === conv.id;

                                    return (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConv(conv)}
                                            className={cn(
                                                "p-4 cursor-pointer transition-colors hover:bg-muted/80 flex items-start gap-3",
                                                isSelected && "bg-muted border-l-4 border-l-primary"
                                            )}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center shrink-0">
                                                {isMerchant ? <StoreIcon className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-purple-500" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-medium truncate">{title}</h4>
                                                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                        {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs rounded-full px-2 py-0.5 bg-background border text-muted-foreground">
                                                        {isMerchant ? (language === 'ar' ? 'تاجر' : 'Merchant') : (language === 'ar' ? 'زائر' : 'Guest')}
                                                    </span>
                                                    {conv.unread_admin_count > 0 && (
                                                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                            {conv.unread_admin_count} جديد
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel (Right Panel) */}
                <div className="flex-1 flex flex-col bg-background">
                    {selectedConv ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center gap-3 bg-muted/10 shrink-0">
                                <div className="w-10 h-10 rounded-full bg-background border flex items-center justify-center">
                                    {selectedConv.user_type === 'merchant' ? <StoreIcon className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-purple-500" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {selectedConv.user_type === 'merchant'
                                            ? getLocalizedText((Array.isArray(selectedConv.stores) ? selectedConv.stores[0]?.name : selectedConv.stores?.name), language as 'ar' | 'en') || 'Store'
                                            : selectedConv.guest_name || 'Guest'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedConv.user_type === 'merchant'
                                            ? `${language === 'ar' ? 'متجر:' : 'Store:'} ${getLocalizedText((Array.isArray(selectedConv.stores) ? selectedConv.stores[0]?.slug : selectedConv.stores?.slug), language as 'ar' | 'en') || ''}`
                                            : language === 'ar' ? 'زائر للمنصة' : 'Platform Guest'
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                                {loadingMessages ? (
                                    <div className="h-full flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                        <p>{language === 'ar' ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
                                    </div>
                                ) : (
                                    messages.map(msg => {
                                        const isAdmin = msg.sender_type === 'admin';
                                        return (
                                            <div key={msg.id} className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isAdmin ? "ml-auto items-end" : "mr-auto items-start")}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] text-muted-foreground px-1">
                                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                                    </span>
                                                </div>
                                                <div
                                                    className={cn(
                                                        "px-4 py-2.5 rounded-2xl shadow-sm",
                                                        isAdmin
                                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                            : "bg-muted border rounded-tl-sm text-foreground"
                                                    )}
                                                >
                                                    {msg.image_url && (
                                                        <div className="mb-2">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={msg.image_url}
                                                                alt="Attached"
                                                                className="max-w-full rounded-lg max-h-[300px] object-cover"
                                                                loading="lazy"
                                                            />
                                                        </div>
                                                    )}
                                                    {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="bg-muted/10 border-t shrink-0 flex flex-col pt-1">
                                {/* Image Preview Area */}
                                {imagePreview && (
                                    <div className="px-3 pb-2 relative inline-block self-start">
                                        <div className="relative group rounded-md overflow-hidden border">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={imagePreview} alt="Preview" className="h-16 w-auto object-cover" />
                                            <button
                                                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-5 h-5 text-white" />
                                            </button>
                                            {isUploadingImage && (
                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={(e) => handleSend(e)} className="p-3 gap-2 flex">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        disabled={sending || isUploadingImage}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleSend(undefined, 'email_request', '')}
                                        disabled={sending || isUploadingImage}
                                        title={language === 'ar' ? 'طلب بريد إلكتروني' : 'Request Email'}
                                    >
                                        <Mail className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={sending || isUploadingImage}
                                        className="shrink-0"
                                        title={language === 'ar' ? 'إرفاق صورة' : 'Attach Image'}
                                    >
                                        <ImagePlus className="w-4 h-4 text-muted-foreground" />
                                    </Button>
                                    <Input
                                        placeholder={language === 'ar' ? 'اكتب ردك هنا...' : 'Type your reply...'}
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        disabled={sending || isUploadingImage}
                                        className="flex-1 bg-background"
                                    />
                                    <Button type="submit" disabled={sending || isUploadingImage || (!newMessage.trim() && !selectedImage)} className="shrink-0 gap-2">
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        <span className="hidden sm:inline">{language === 'ar' ? 'إرسال' : 'Send'}</span>
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60">
                            <MessageCircle className="w-16 h-16 mb-4" />
                            <p className="text-lg font-medium">{language === 'ar' ? 'اختر محادثة للصندوق' : 'Select a conversation to start'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
