"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Store, ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface StoreSwitcherProps {
    currentStoreId: string;
    isCollapsed?: boolean;
}

export function StoreSwitcher({ currentStoreId, isCollapsed = false }: StoreSwitcherProps) {
    const router = useRouter();
    const supabase = createClient();
    const { language } = useLanguage();
    const [stores, setStores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStores = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data } = await supabase
                .from('store_members')
                .select('store_id, stores(id, name, slug, logo_url)')
                .eq('user_id', user.id);

            if (data) {
                const storeList = data.map((sm: any) => sm.stores).filter(Boolean);
                setStores(storeList);
            }
            setLoading(false);
        };

        fetchStores();
    }, [supabase]);

    const currentStore = stores.find(s => s.id === currentStoreId);

    const getStoreName = (store: any) => {
        if (!store) return '';
        const name = typeof store.name === 'string' ? JSON.parse(store.name) : store.name;
        return name?.[language] || name?.en || name?.ar || 'Unnamed Store';
    };

    if (loading) return <div className="h-10 w-full animate-pulse bg-muted rounded-md" />;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full flex items-center gap-2 px-2 hover:bg-muted transition-all",
                        isCollapsed ? "justify-center" : "justify-between"
                    )}
                >
                    <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            {currentStore?.logo_url ? (
                                <img src={currentStore.logo_url} alt="" className="w-full h-full object-cover rounded" />
                            ) : (
                                <Store className="w-3 h-3 text-primary" />
                            )}
                        </div>
                        {!isCollapsed && (
                            <span className="font-medium truncate text-sm">
                                {getStoreName(currentStore)}
                            </span>
                        )}
                    </div>
                    {!isCollapsed && <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>
                    {language === 'ar' ? 'متاجري' : 'My Stores'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {stores.map((store) => (
                    <DropdownMenuItem
                        key={store.id}
                        className="flex items-center justify-between cursor-pointer"
                        onSelect={() => router.push(`/dashboard/${store.id}`)}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
                                {store.logo_url ? (
                                    <img src={store.logo_url} alt="" className="w-full h-full object-cover rounded" />
                                ) : (
                                    <Store className="w-3 h-3 text-muted-foreground" />
                                )}
                            </div>
                            <span className="truncate">{getStoreName(store)}</span>
                        </div>
                        {store.id === currentStoreId && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-muted-foreground focus:text-primary"
                    onSelect={() => router.push('/dashboard?showAll=true')}
                >
                    <Store className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إدارة جميع المتاجر' : 'Manage All Stores'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-primary focus:text-primary"
                    onSelect={() => router.push('/dashboard/new-store')}
                >
                    <Plus className="w-4 h-4" />
                    <span>{language === 'ar' ? 'إنشاء متجر جديد' : 'Create New Store'}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
