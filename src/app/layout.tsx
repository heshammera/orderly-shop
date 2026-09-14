import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { SupportChatWidget } from "@/components/chat/SupportChatWidget";
import { MarketingTracker } from '@/components/landing/MarketingTracker';
import { PlatformTracker } from "@/components/tracking/PlatformTracker";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["200", "300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://orderlyshops.com"),
  title: "أوردرلي - Orderly",
  description: "أوردرلي لإنشاء المتاجر الإلكترونية وإدارة المنتجات والطلبات",
  manifest: "/manifest.json",
  appleWebApp: {
    statusBarStyle: "default",
    title: "Orderly",
  },
  openGraph: {
    title: "أوردرلي - Orderly | منصة التجارة الإلكترونية العصرية",
    description: "أنشئ متجرك الإلكتروني في دقائق بدون حاجة لكتابة كود برمجي. خيارات منتجات وسلة وطلب مباشر وإدارة واضحة.",
    url: "https://orderlyshops.com", // Replace appropriately
    siteName: "Orderly",
    locale: "ar",
    type: "website",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  width: "device-width",
  initialScale: 1,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className={`${tajawal.className} font-sans`}>
        <Providers>
          {children}
          <Toaster />
          <Sonner />
          <SupportChatWidget />
          <PlatformTracker />
          <MarketingTracker />
          <InstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
