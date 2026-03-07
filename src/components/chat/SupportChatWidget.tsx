"use client";

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, Info, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Message {
    id: string;
    sender_type: 'user' | 'admin';
    content: string;
    message_type?: string;
    image_url?: string;
    created_at: string;
}

export function SupportChatWidget() {
    const { language, dir } = useLanguage();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [guestName, setGuestName] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showNameInput, setShowNameInput] = useState(false);
    const [showTooltip, setShowTooltip] = useState(true);
    const [latestAdminMsg, setLatestAdminMsg] = useState<string | null>(null);
    const [showNewMsgPopup, setShowNewMsgPopup] = useState(false);
    const isOpenRef = useRef(false);

    // Image upload states
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Email support flags
    const [guestEmail, setGuestEmail] = useState('');
    const [submittingEmail, setSubmittingEmail] = useState(false);
    const [emailSubmittedMap, setEmailSubmittedMap] = useState<Record<string, boolean>>({});

    // Initialize session ID
    useEffect(() => {
        let storedId = localStorage.getItem('support_session_id');
        if (!storedId) {
            storedId = uuidv4();
            localStorage.setItem('support_session_id', storedId);
        }
        setSessionId(storedId);

        let storedName = localStorage.getItem('support_guest_name');
        if (storedName) {
            setGuestName(storedName);
        } else {
            setShowNameInput(true);
        }
    }, []);

    const [conversationId, setConversationId] = useState<string | null>(null);

    const fetchChat = async (isBackground = false) => {
        if (!sessionId) return;
        if (!isBackground) setLoading(true);

        try {
            const res = await fetch(`/api/chat?t=${Date.now()}`, {
                headers: {
                    'x-session-id': sessionId,
                    'Cache-Control': 'no-cache'
                },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                const newMessages: Message[] = data.messages || [];

                // Detect new admin messages for popup (only during background polling)
                if (isBackground && !isOpenRef.current && newMessages.length > 0) {
                    setMessages(prev => {
                        const prevIds = new Set(prev.map(m => m.id));
                        const brandNewAdminMsgs = newMessages.filter(
                            m => m.sender_type === 'admin' && !prevIds.has(m.id)
                        );
                        if (brandNewAdminMsgs.length > 0) {
                            const latest = brandNewAdminMsgs[brandNewAdminMsgs.length - 1];
                            setLatestAdminMsg(latest.content || (language === 'ar' ? 'صورة مرفقة' : 'Image attachment'));
                            setShowNewMsgPopup(true);
                            setShowTooltip(false);
                            setTimeout(() => setShowNewMsgPopup(false), 8000);
                        }
                        return newMessages;
                    });
                } else {
                    setMessages(newMessages);
                }

                // Only update unread count if chat is closed
                if (!isOpenRef.current) {
                    setUnreadCount(data.unreadCount || 0);
                }

                if (data.conversationId) setConversationId(data.conversationId);
            }
        } catch (error) {
            console.error('Error fetching chat:', error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // Load initial chat and start polling
    useEffect(() => {
        if (!sessionId) return;

        fetchChat();

        const interval = setInterval(() => {
            fetchChat(true);
        }, 5000); // Poll every 5 seconds as fallback

        return () => clearInterval(interval);
    }, [sessionId]);

    // Setup Realtime Subscription
    useEffect(() => {
        if (!conversationId) return;

        const supabase = createClient();
        const subscription = supabase
            .channel(`support-chat-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // Prevent duplicates if optimistic update already added it
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id || (m.content === newMsg.content && m.sender_type === newMsg.sender_type && Date.now() - new Date(m.created_at).getTime() < 5000))) {
                            return prev;
                        }

                        // If it's from admin and chat is closed, increase unread and show popup
                        if (newMsg.sender_type === 'admin' && !isOpenRef.current) {
                            setUnreadCount(count => count + 1);
                            setLatestAdminMsg(newMsg.content || (language === 'ar' ? 'صورة مرفقة' : 'Image attachment'));
                            setShowNewMsgPopup(true);
                            setShowTooltip(false);
                            // Auto-hide after 8 seconds
                            setTimeout(() => setShowNewMsgPopup(false), 8000);
                        }
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [conversationId]);

    // Keep isOpenRef in sync
    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    // Mark as read when opened
    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            markAsRead();
        }
    }, [isOpen, unreadCount]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const markAsRead = async () => {
        try {
            setUnreadCount(0);
            await fetch(`/api/chat?t=${Date.now()}`, {
                method: 'PATCH',
                headers: {
                    'x-session-id': sessionId,
                    'Cache-Control': 'no-cache'
                }
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert(language === 'ar' ? 'يرجى اختيار صورة صالحة' : 'Please select a valid image');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert(language === 'ar' ? 'حجم الصورة يجب ألا يتجاوز 5 ميجا بايت' : 'Image size must be less than 5MB');
            return;
        }

        setSelectedImage(file);

        // Create local preview
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newMessage.trim();
        if (!trimmed && !selectedImage) return;

        if (showNameInput && guestName.trim()) {
            localStorage.setItem('support_guest_name', guestName.trim());
            setShowNameInput(false);
        }

        try {
            setSending(true);
            setNewMessage('');

            let imageUrlToSave = null;

            // Upload image if selected
            if (selectedImage) {
                setIsUploadingImage(true);
                const supabase = createClient();
                const fileExt = selectedImage.name.split('.').pop();
                const fileName = `${uuidv4()}.${fileExt}`;
                const filePath = `${sessionId}/${fileName}`;

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
            }

            // Optimistic update
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => [...prev, {
                id: tempId,
                sender_type: 'user',
                content: trimmed,
                image_url: imageUrlToSave || undefined,
                message_type: imageUrlToSave ? 'image' : 'text',
                created_at: new Date().toISOString()
            }]);

            await fetch(`/api/chat?t=${Date.now()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    content: trimmed || (language === 'ar' ? 'صورة مرفقة' : 'Image attachment'),
                    guestName: guestName.trim() || undefined,
                    image_url: imageUrlToSave || undefined,
                    message_type: imageUrlToSave ? 'image' : 'text'
                })
            });

            // Re-fetch to get actual DB record
            fetchChat(true);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleSubmitEmail = async (messageId: string) => {
        const trimmedEmail = guestEmail.trim();
        if (!trimmedEmail) return;

        try {
            setSubmittingEmail(true);

            // Send via API (we can reuse POST /chat, or make a new one, but let's just send a message for now that looks like an email submit)
            // Or better yet, we can send it differently, but for simplicity we'll send it as a message to store it in history
            const tempId = `temp-email-${Date.now()}`;
            setMessages(prev => [...prev, {
                id: tempId,
                sender_type: 'user',
                content: `${language === 'ar' ? 'تم تقديم البريد الإلكتروني:' : 'Email Submitted:'} ${trimmedEmail}`,
                created_at: new Date().toISOString()
            }]);

            // Save to localStorage so they don't have to enter it again across reloads easily
            localStorage.setItem('support_guest_email', trimmedEmail);

            await fetch(`/api/chat?t=${Date.now()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-session-id': sessionId,
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({
                    content: `${language === 'ar' ? 'تم تقديم البريد الإلكتروني:' : 'Email Submitted:'} ${trimmedEmail}`,
                    guestName: guestName.trim() || undefined,
                    guestEmail: trimmedEmail
                })
            });

            setEmailSubmittedMap(prev => ({ ...prev, [messageId]: true }));
            setGuestEmail('');
            fetchChat(true);

        } catch (error) {
            console.error('Error submitting email:', error);
        } finally {
            setSubmittingEmail(false);
        }
    };

    // Determine if user is a merchant (logged in) by checking pathname
    const isMerchant = pathname?.startsWith('/dashboard');

    if (pathname?.startsWith('/s/') || pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-50" dir={dir}>
            {/* Chat Window */}
            <div
                className={cn(
                    "absolute bottom-20 right-0 w-80 sm:w-96 bg-background border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right",
                    isOpen ? "scale-100 opacity-100 h-[500px] max-h-[80vh]" : "scale-50 opacity-0 h-0 pointer-events-none"
                )}
            >
                {/* Header */}
                <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="font-bold flex items-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            {language === 'ar' ? 'الدعم الفني' : 'Live Support'}
                        </h3>
                        <p className="text-primary-foreground/80 text-xs mt-1">
                            {language === 'ar' ? 'نحن هنا لمساعدتك!' : 'We are here to help you!'}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20 rounded-full" onClick={() => setIsOpen(false)}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10">
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <MessageCircle className="w-6 h-6 text-primary" />
                            </div>
                            <p className="text-sm">
                                {language === 'ar'
                                    ? 'كيف يمكننا مساعدتك اليوم؟'
                                    : 'How can we help you today?'}
                            </p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isUser = msg.sender_type === 'user';
                            return (
                                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", isUser ? "ml-auto items-end" : "mr-auto items-start")}>
                                    <div
                                        className={cn(
                                            "px-4 py-2 rounded-2xl",
                                            isUser
                                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                : "bg-muted text-foreground rounded-tl-sm"
                                        )}
                                    >
                                        {msg.image_url && (
                                            <div className="mb-2">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={msg.image_url}
                                                    alt="Attached"
                                                    className="max-w-full rounded-lg max-h-[200px] object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                        {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}

                                        {/* Render Email Request Form */}
                                        {msg.message_type === 'email_request' && !isUser && (
                                            <div className="mt-2 pt-2 border-t border-border/50">
                                                {emailSubmittedMap[msg.id] || localStorage.getItem('support_guest_email') ? (
                                                    <p className="text-xs text-green-600 font-medium">
                                                        {language === 'ar' ? 'تم استلام بريدك بنجاح، شكراً لك.' : 'Email received successfully, thank you.'}
                                                    </p>
                                                ) : (
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        <Input
                                                            type="email"
                                                            placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                                                            className="h-8 text-xs w-full bg-background"
                                                            value={guestEmail}
                                                            onChange={(e) => setGuestEmail(e.target.value)}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            className="h-8 w-full text-xs"
                                                            disabled={submittingEmail || !guestEmail.includes('@')}
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                handleSubmitEmail(msg.id);
                                                            }}
                                                        >
                                                            {submittingEmail ? <Loader2 className="w-3 h-3 animate-spin" /> : (language === 'ar' ? 'إرسال' : 'Submit')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: language === 'ar' ? ar : enUS })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Name Input if guest and first message */}
                {showNameInput && messages.length === 0 && (
                    <div className="p-3 bg-muted/30 border-t shrink-0">
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                            <Info className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'فضلاً أدخل اسمك لنتعرف عليك' : 'Please enter your name to assist you better'}
                        </div>
                        <Input
                            placeholder={language === 'ar' ? 'الاسم الكريم...' : 'Your name...'}
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="h-9 text-sm"
                            maxLength={50}
                        />
                    </div>
                )}

                {/* Input Area */}
                <div className="bg-background border-t shrink-0 flex flex-col pt-1">
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

                    <form onSubmit={handleSend} className="p-3 flex gap-2">
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
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending || isUploadingImage}
                            className="shrink-0"
                            title={language === 'ar' ? 'إرفاق صورة' : 'Attach Image'}
                        >
                            <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Input
                            placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type a message...'}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={sending || isUploadingImage}
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" disabled={sending || isUploadingImage || (!newMessage.trim() && !selectedImage) || (showNameInput && messages.length === 0 && !guestName.trim())}>
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Toggle Button Container */}
            <div className="relative">
                {/* New Message Popup */}
                {!isOpen && showNewMsgPopup && latestAdminMsg && (
                    <div className="absolute bottom-[70px] right-0 w-[280px] mb-2 bg-background border rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500 z-10">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted border hover:bg-destructive hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowNewMsgPopup(false);
                            }}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                        <div className="text-xs text-muted-foreground mb-1 font-medium">
                            {language === 'ar' ? '💬 رسالة جديدة من الدعم' : '💬 New message from support'}
                        </div>
                        <div className="text-sm pr-4 line-clamp-3">
                            {latestAdminMsg}
                        </div>
                        {/* Triangle pointer */}
                        <div className="absolute -bottom-2 right-5 w-4 h-4 bg-background border-b border-r transform rotate-45" />
                    </div>
                )}

                {/* Welcome Tooltip - only before first message */}
                {!isOpen && showTooltip && !showNewMsgPopup && messages.length === 0 && (
                    <div className="absolute bottom-[70px] right-0 w-[280px] mb-2 bg-background border rounded-2xl p-3 shadow-xl animate-in fade-in slide-in-from-bottom-5 duration-500">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-muted border hover:bg-destructive hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowTooltip(false);
                            }}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                        <div className="text-sm font-medium pr-4">
                            {language === 'ar' ? 'مرحباً، كيف يمكننا مساعدتك اليوم؟ 👋' : 'Hello! How can we help you today? 👋'}
                        </div>
                        {/* Triangle pointer */}
                        <div className="absolute -bottom-2 right-5 w-4 h-4 bg-background border-b border-r transform rotate-45" />
                    </div>
                )}

                <Button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setShowTooltip(false);
                        setShowNewMsgPopup(false);
                    }}
                    size="icon"
                    className="w-14 h-14 rounded-full shadow-lg relative bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                    {!isOpen && unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-xl border-2 border-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
