import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface StoreData {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  slug: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  currency: string;
  timezone: string;
  settings: any;
}

interface RegionalTabProps {
  store: StoreData;
  onSave: (data: Partial<StoreData>) => Promise<void>;
}

const currencies = [
  { value: 'SAR', labelAr: 'ريال سعودي (SAR)', labelEn: 'Saudi Riyal (SAR)' },
  { value: 'AED', labelAr: 'درهم إماراتي (AED)', labelEn: 'UAE Dirham (AED)' },
  { value: 'KWD', labelAr: 'دينار كويتي (KWD)', labelEn: 'Kuwaiti Dinar (KWD)' },
  { value: 'BHD', labelAr: 'دينار بحريني (BHD)', labelEn: 'Bahraini Dinar (BHD)' },
  { value: 'OMR', labelAr: 'ريال عماني (OMR)', labelEn: 'Omani Rial (OMR)' },
  { value: 'QAR', labelAr: 'ريال قطري (QAR)', labelEn: 'Qatari Riyal (QAR)' },
  { value: 'EGP', labelAr: 'جنيه مصري (EGP)', labelEn: 'Egyptian Pound (EGP)' },
  { value: 'JOD', labelAr: 'دينار أردني (JOD)', labelEn: 'Jordanian Dinar (JOD)' },
  { value: 'USD', labelAr: 'دولار أمريكي (USD)', labelEn: 'US Dollar (USD)' },
  { value: 'EUR', labelAr: 'يورو (EUR)', labelEn: 'Euro (EUR)' },
];

const timezones = [
  { value: 'Asia/Riyadh', labelAr: 'الرياض (UTC+3)', labelEn: 'Riyadh (UTC+3)' },
  { value: 'Asia/Dubai', labelAr: 'دبي (UTC+4)', labelEn: 'Dubai (UTC+4)' },
  { value: 'Asia/Kuwait', labelAr: 'الكويت (UTC+3)', labelEn: 'Kuwait (UTC+3)' },
  { value: 'Asia/Bahrain', labelAr: 'البحرين (UTC+3)', labelEn: 'Bahrain (UTC+3)' },
  { value: 'Asia/Muscat', labelAr: 'مسقط (UTC+4)', labelEn: 'Muscat (UTC+4)' },
  { value: 'Asia/Qatar', labelAr: 'قطر (UTC+3)', labelEn: 'Qatar (UTC+3)' },
  { value: 'Africa/Cairo', labelAr: 'القاهرة (UTC+2)', labelEn: 'Cairo (UTC+2)' },
  { value: 'Asia/Amman', labelAr: 'عمّان (UTC+3)', labelEn: 'Amman (UTC+3)' },
  { value: 'Europe/London', labelAr: 'لندن (UTC+0)', labelEn: 'London (UTC+0)' },
  { value: 'America/New_York', labelAr: 'نيويورك (UTC-5)', labelEn: 'New York (UTC-5)' },
];

export function RegionalTab({ store, onSave }: RegionalTabProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currency: store.currency || 'SAR',
    timezone: store.timezone || 'Asia/Riyadh',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        currency: formData.currency,
        timezone: formData.timezone,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Currency */}
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'العملة' : 'Currency'}</Label>
          <Select
            value={formData.currency}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, currency: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {language === 'ar' ? currency.labelAr : currency.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'العملة المستخدمة في عرض الأسعار والفواتير'
              : 'Currency used for displaying prices and invoices'}
          </p>
        </div>

        {/* Timezone */}
        <div className="space-y-2">
          <Label>{language === 'ar' ? 'المنطقة الزمنية' : 'Timezone'}</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, timezone: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {language === 'ar' ? tz.labelAr : tz.labelEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {language === 'ar'
              ? 'المنطقة الزمنية لعرض التواريخ والأوقات'
              : 'Timezone for displaying dates and times'}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 animate-spin me-2" />}
          {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
