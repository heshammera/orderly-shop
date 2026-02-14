import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store, ArrowLeft, ArrowRight, Check } from 'lucide-react';

const createStoreSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  currency: z.string().default('SAR'),
});

type CreateStoreForm = z.infer<typeof createStoreSchema>;

const steps = ['info', 'contact', 'settings'] as const;

export default function CreateStore() {
  const { t, language, dir } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<CreateStoreForm>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      nameAr: '',
      nameEn: '',
      slug: '',
      descriptionAr: '',
      descriptionEn: '',
      contactEmail: '',
      contactPhone: '',
      currency: 'SAR',
    },
  });

  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;
  const ArrowForward = language === 'ar' ? ArrowLeft : ArrowRight;

  const onSubmit = async (data: CreateStoreForm) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      // Check if slug is available (Double check)
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', data.slug)
        .maybeSingle();

      if (existingStore) {
        toast({
          title: t.storeWizard.slugTaken,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      // Create the store
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .insert({
          owner_id: user.id,
          name: { ar: data.nameAr, en: data.nameEn || '' },
          slug: data.slug,
          description: { ar: data.descriptionAr || '', en: data.descriptionEn || '' },
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          currency: data.currency,
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // Add owner as store member
      const { error: memberError } = await supabase
        .from('store_members')
        .insert({
          store_id: store.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) throw memberError;

      toast({
        title: t.storeWizard.success,
      });
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Create store error:', error);
      toast({
        title: t.storeWizard.error,
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateStoreForm)[] = [];
    
    if (currentStep === 0) {
      fieldsToValidate = ['nameAr', 'slug', 'nameEn'];
    } else if (currentStep === 1) {
      fieldsToValidate = ['contactEmail', 'contactPhone', 'descriptionAr', 'descriptionEn'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    
    if (!isValid) return;

    // Check slug availability on step 0
    if (currentStep === 0) {
      const slug = form.getValues('slug');
      if (slug) {
        setLoading(true);
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        setLoading(false);

        if (data) {
          form.setError('slug', {
            type: 'manual',
            message: t.storeWizard.slugTaken || 'unavailable',
          });
          return;
        }
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
    
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate('/login');
    return null;
  }

  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">{t.storeWizard.title}</CardTitle>
          <CardDescription>{t.storeWizard.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    index <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 1: Store Info */}
              {currentStep === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="nameAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.storeNameAr}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.storeWizard.storeNameArPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.storeNameEn}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.storeWizard.storeNameEnPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.storeSlug}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.storeWizard.storeSlugPlaceholder}
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          {t.storeWizard.storeSlugHint}
                          <span className="font-mono">{field.value || 'my-store'}.matjari.com</span>
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 2: Contact Info */}
              {currentStep === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="descriptionAr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.descriptionAr}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.storeWizard.descriptionArPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.contactEmail}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t.storeWizard.contactEmailPlaceholder}
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.contactPhone}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t.storeWizard.contactPhonePlaceholder}
                            dir="ltr"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Step 3: Settings */}
              {currentStep === 2 && (
                <>
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.storeWizard.currency}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SAR">{t.storeWizard.currencies.SAR}</SelectItem>
                            <SelectItem value="AED">{t.storeWizard.currencies.AED}</SelectItem>
                            <SelectItem value="KWD">{t.storeWizard.currencies.KWD}</SelectItem>
                            <SelectItem value="EGP">{t.storeWizard.currencies.EGP}</SelectItem>
                            <SelectItem value="USD">{t.storeWizard.currencies.USD}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {currentStep > 0 && (
                  <Button type="button" variant="outline" onClick={prevStep} className="flex-1">
                    <ArrowBack className="w-4 h-4" />
                    {t.storeWizard.previous}
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button type="button" onClick={nextStep} className="flex-1">
                    {t.storeWizard.next}
                    <ArrowForward className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t.storeWizard.creating}
                      </>
                    ) : (
                      t.storeWizard.create
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
