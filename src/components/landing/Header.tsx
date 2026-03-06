"use client";

import { useState, useEffect } from 'react';
import { Menu, X, Globe, LayoutDashboard, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t, dir } = useLanguage();
  const { user, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    setIsMenuOpen(false);
  };

  const isDarkText = !isScrolled;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled ? "glass border-b border-border/50 py-3 shadow-soft" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group z-50">
            <Image src="/logo.png" alt="Orderly Logo" width={40} height={40} className="w-10 h-10 object-contain rounded-md" />
            <span className={cn(
              "text-2xl font-black tracking-tight transition-colors duration-300",
              isScrolled ? "text-foreground" : "text-foreground"
            )}>
              Orderly
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/#features" className={cn("text-sm font-medium transition-colors hover:text-primary", isScrolled ? "text-muted-foreground" : "text-foreground/80")}>
              {t.nav.features}
            </Link>
            <Link href="/#how-it-works" className={cn("text-sm font-medium transition-colors hover:text-primary", isScrolled ? "text-muted-foreground" : "text-foreground/80")}>
              {language === 'ar' ? 'كيف يعمل' : 'How it works'}
            </Link>
            <Link href="/tutorials" className={cn("text-sm font-medium transition-colors hover:text-primary", isScrolled ? "text-muted-foreground" : "text-foreground/80")}>
              {language === 'ar' ? 'الشروحات' : 'Tutorials'}
            </Link>
            <Link href="/#pricing" className={cn("text-sm font-medium transition-colors hover:text-primary", isScrolled ? "text-muted-foreground" : "text-foreground/80")}>
              {t.nav.pricing}
            </Link>
            <Link href="/#faq" className={cn("text-sm font-medium transition-colors hover:text-primary", isScrolled ? "text-muted-foreground" : "text-foreground/80")}>
              {language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className={cn("gap-2", isScrolled ? "text-muted-foreground hover:text-foreground" : "text-foreground/80 hover:text-foreground")}
            >
              <Globe className="h-4 w-4" />
              <span className="font-medium text-xs uppercase">{language === 'ar' ? 'EN' : 'AR'}</span>
            </Button>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard">
                  <Button className="gradient-primary text-white shadow-glow hover:opacity-90 transition-all gap-2 rounded-full px-6">
                    <LayoutDashboard className="w-4 h-4" />
                    {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  title={t.nav.logout}
                  className="text-destructive hover:bg-destructive/10 rounded-full"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" className={cn("font-medium", isScrolled ? "" : "text-foreground")}>
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="gradient-primary text-white shadow-glow hover:opacity-90 hover:scale-[1.02] transition-all rounded-full px-6">
                    {t.nav.signup}
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className={cn(isScrolled ? "" : "text-foreground")}
            >
              <Globe className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(isScrolled ? "" : "text-foreground")}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: '100vh' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 top-0 left-0 right-0 bg-background/95 backdrop-blur-xl z-40 lg:hidden flex flex-col pt-24 px-6 overflow-y-auto"
          >
            <nav className="flex flex-col gap-6 text-lg font-medium">
              <Link
                href="/#features"
                className="flex items-center justify-between border-b border-border pb-4 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.features}
                <ChevronRight className={cn("h-5 w-5 text-muted-foreground", dir === 'rtl' && "rotate-180")} />
              </Link>
              <Link
                href="/#how-it-works"
                className="flex items-center justify-between border-b border-border pb-4 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {language === 'ar' ? 'كيف يعمل' : 'How it works'}
                <ChevronRight className={cn("h-5 w-5 text-muted-foreground", dir === 'rtl' && "rotate-180")} />
              </Link>
              <Link
                href="/#pricing"
                className="flex items-center justify-between border-b border-border pb-4 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t.nav.pricing}
                <ChevronRight className={cn("h-5 w-5 text-muted-foreground", dir === 'rtl' && "rotate-180")} />
              </Link>
              <Link
                href="/#faq"
                className="flex items-center justify-between border-b border-border pb-4 hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {language === 'ar' ? 'الأسئلة الشائعة' : 'FAQ'}
                <ChevronRight className={cn("h-5 w-5 text-muted-foreground", dir === 'rtl' && "rotate-180")} />
              </Link>
            </nav>

            <div className="mt-8 flex flex-col gap-4 pb-12">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button size="lg" className="w-full gradient-primary gap-2 rounded-xl text-white">
                      <LayoutDashboard className="w-5 h-5" />
                      {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-5 h-5" />
                    {t.nav.logout}
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button size="lg" className="w-full gradient-primary rounded-xl text-white shadow-glow">{t.nav.signup}</Button>
                  </Link>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" size="lg" className="w-full rounded-xl">{t.nav.login}</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
