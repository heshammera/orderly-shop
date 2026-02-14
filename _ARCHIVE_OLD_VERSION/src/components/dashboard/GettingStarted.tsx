import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Circle,
  Package,
  FolderTree,
  Settings,
  Rocket,
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  href: string;
  completed: boolean;
}

interface GettingStartedProps {
  storeId: string;
  hasProducts: boolean;
  hasCategories: boolean;
  storeConfigured: boolean;
}

export function GettingStarted({
  storeId,
  hasProducts,
  hasCategories,
  storeConfigured,
}: GettingStartedProps) {
  const { language } = useLanguage();

  const checklist: ChecklistItem[] = [
    {
      id: 'products',
      titleAr: 'أضف منتجاتك الأولى',
      titleEn: 'Add your first products',
      descriptionAr: 'أضف منتجات لتظهر في متجرك',
      descriptionEn: 'Add products to display in your store',
      href: `/store/${storeId}/products`,
      completed: hasProducts,
    },
    {
      id: 'categories',
      titleAr: 'أنشئ التصنيفات',
      titleEn: 'Create categories',
      descriptionAr: 'نظم منتجاتك في تصنيفات',
      descriptionEn: 'Organize your products into categories',
      href: `/store/${storeId}/categories`,
      completed: hasCategories,
    },
    {
      id: 'settings',
      titleAr: 'أكمل إعدادات المتجر',
      titleEn: 'Complete store settings',
      descriptionAr: 'أضف الشعار ومعلومات التواصل',
      descriptionEn: 'Add logo and contact information',
      href: `/store/${storeId}/settings`,
      completed: storeConfigured,
    },
  ];

  const completedCount = checklist.filter((item) => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  if (completedCount === checklist.length) {
    return null; // Hide when all tasks are complete
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5 text-primary" />
          {language === 'ar' ? 'ابدأ الآن' : 'Getting Started'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {language === 'ar' ? 'التقدم' : 'Progress'}
            </span>
            <span className="font-medium">
              {completedCount}/{checklist.length}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-3">
          {checklist.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;
            return (
              <Link
                key={item.id}
                to={item.href}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-colors',
                  item.completed
                    ? 'bg-muted/50 border-muted'
                    : 'hover:bg-muted/50 border-border'
                )}
              >
                <Icon
                  className={cn(
                    'w-5 h-5 mt-0.5 shrink-0',
                    item.completed ? 'text-green-600' : 'text-muted-foreground'
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-sm',
                      item.completed && 'line-through text-muted-foreground'
                    )}
                  >
                    {language === 'ar' ? item.titleAr : item.titleEn}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {language === 'ar' ? item.descriptionAr : item.descriptionEn}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
