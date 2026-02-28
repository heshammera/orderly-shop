"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Play, Store, ShoppingBag, TrendingUp, LayoutDashboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export function Hero() {
  const { t, dir, language } = useLanguage();
  const { user } = useAuth();
  const Arrow = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const closeVideo = useCallback(() => {
    setIsVideoOpen(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  const openVideo = useCallback(() => {
    setIsVideoOpen(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoOpen) {
        closeVideo();
      }
    };
    if (isVideoOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isVideoOpen, closeVideo]);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-slate-50">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute top-0 w-full h-full bg-slate-50 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,transparent_20%,#f8fafc_100%)]" />
          <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 end-1/4 w-[30rem] h-[30rem] bg-teal-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-start animate-fade-in-up">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                {t.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
                {t.hero.subtitle}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                {user ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="gradient-primary text-lg px-8 hover:opacity-90 transition-opacity group gap-2">
                      <LayoutDashboard className="h-5 w-5" />
                      {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="gradient-primary text-lg px-8 hover:opacity-90 transition-opacity group">
                      {t.hero.cta}
                      <Arrow className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                    </Button>
                  </Link>
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 group"
                  onClick={openVideo}
                >
                  <Play className="h-5 w-5 me-2 transition-transform group-hover:scale-110" />
                  {t.hero.secondaryCta}
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-3 rtl:space-x-reverse">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                      {i * 2}K
                    </div>
                  ))}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">+2,500</span> {t.hero.merchants}
                </div>
              </div>
            </div>

            {/* Visual */}
            <div className="relative animate-fade-in hidden lg:block">
              <div className="relative z-10">
                {/* Main card */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-6 animate-float relative z-20">
                  <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center">
                      <Store className="h-6 w-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">متجر أوردرلي</h3>
                      <p className="text-sm text-teal-600 font-medium">نشط وموثق</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100/50">
                      <p className="text-2xl font-bold text-slate-800">156</p>
                      <p className="text-xs text-slate-500 mt-1">منتج</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100/50">
                      <p className="text-2xl font-bold text-slate-800">89</p>
                      <p className="text-xs text-slate-500 mt-1">طلب</p>
                    </div>
                    <div className="bg-teal-50 rounded-xl p-4 text-center border border-teal-100/50">
                      <p className="text-2xl font-bold text-teal-700">12K</p>
                      <p className="text-xs text-teal-600/80 mt-1">مبيعات</p>
                    </div>
                  </div>

                  {/* Faux Chart */}
                  <div className="h-24 w-full flex items-end gap-2 justify-between pt-4 border-t border-slate-50">
                    {[40, 30, 60, 50, 80, 70, 100].map((h, i) => (
                      <div key={i} className="w-full bg-teal-100 rounded-t-sm relative group cursor-pointer transition-all duration-300 hover:bg-teal-200" style={{ height: `${h}%` }}>
                        {i === 6 && <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-teal-500 ring-4 ring-teal-50" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-8 -start-8 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-4 animate-float z-30" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-lg text-green-600">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">طلب جديد! <span className="text-green-600 font-medium">#1024</span></span>
                  </div>
                </div>

                <div className="absolute -bottom-4 -end-4 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-4 animate-float z-30" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-50 p-2 rounded-lg text-teal-600">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">النمو الأسبوعي</span>
                      <span className="text-sm font-bold text-slate-800">+24.5%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {isVideoOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          onClick={closeVideo}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            style={{
              animation: 'videoFadeIn 0.3s ease-out forwards',
            }}
          />

          {/* Modal Content */}
          <div
            className="relative z-10 w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'videoScaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            }}
          >
            {/* Close Button */}
            <button
              onClick={closeVideo}
              className="absolute -top-12 end-0 sm:-top-14 sm:-end-2 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
            >
              <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </span>
              <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all border border-white/20">
                <X className="h-5 w-5" />
              </div>
            </button>

            {/* Video Container */}
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl opacity-60 -z-10" />

              <video
                ref={videoRef}
                src="/videos/demo2.mp4"
                controls
                autoPlay
                playsInline
                className="w-full aspect-video"
                style={{ display: 'block' }}
              />
            </div>

            {/* Caption */}
            <p className="text-center text-white/60 text-sm mt-4 font-medium">
              {language === 'ar' ? 'شاهد كيف يمكنك إنشاء متجرك في دقائق' : 'See how you can create your store in minutes'}
            </p>
          </div>
        </div>
      )}

      {/* Modal Animations */}
      <style jsx global>{`
        @keyframes videoFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes videoScaleIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
