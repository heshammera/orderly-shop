import React from 'react';
import { StoreData } from './StoreSettingsForm';
import { StoreProfileTab } from './StoreProfileTab';
import { ContactTab } from './ContactTab';
import { RegionalTab } from './RegionalTab';
import { Separator } from '@/components/ui/separator';

interface GeneralTabProps {
    store: StoreData;
    onSave: (data: Partial<StoreData>) => Promise<void>;
}

export function GeneralTab({ store, onSave }: GeneralTabProps) {
    return (
        <div className="space-y-8">
            {/* Store Profile Section */}
            <div>
                <StoreProfileTab store={store} onSave={onSave} hideHeader />
            </div>

            <Separator />

            {/* Contact Information Section */}
            <div>
                <ContactTab store={store} onSave={onSave} hideHeader />
            </div>

            <Separator />

            {/* Regional Settings Section */}
            <div>
                <RegionalTab store={store} onSave={onSave} hideHeader />
            </div>
        </div>
    );
}
