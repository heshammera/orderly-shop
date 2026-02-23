"use client";

import Script from 'next/script';

interface TrackingPixelsProps {
    integrations: {
        facebook_pixels?: string[];
        tiktok_pixels?: string[];
        snapchat_pixels?: string[];
        google_analytics_ids?: string[];
    };
}

export function TrackingPixels({ integrations }: TrackingPixelsProps) {
    const {
        facebook_pixels = [],
        tiktok_pixels = [],
        snapchat_pixels = [],
        google_analytics_ids = [],
    } = integrations;

    const hasFb = facebook_pixels.length > 0;
    const hasTt = tiktok_pixels.length > 0;
    const hasSc = snapchat_pixels.length > 0;
    const hasGa = google_analytics_ids.length > 0;

    return (
        <>
            {/* Facebook Pixels */}
            {hasFb && (
                <Script
                    id="facebook-pixel-base"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
${facebook_pixels.map(id => `fbq('init', '${id}');`).join('\n')}
fbq('track', 'PageView');
                        `,
                    }}
                />
            )}

            {/* TikTok Pixels */}
            {hasTt && (
                <Script
                    id="tiktok-pixel-base"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ${tiktok_pixels.map(id => `ttq.load('${id}');`).join('\\n  ')}
}(window, document, 'ttq');
ttq.page();
                        `,
                    }}
                />
            )}

            {/* Snapchat Pixels */}
            {hasSc && (
                <Script
                    id="snapchat-pixel-base"
                    strategy="afterInteractive"
                    dangerouslySetInnerHTML={{
                        __html: `
(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
{a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
r.src=n;var u=t.getElementsByTagName(s)[0];
u.parentNode.insertBefore(r,u);})(window,document,
'https://sc-static.net/scevent.min.js');
${snapchat_pixels.map(id => `snaptr('init', '${id}', {});`).join('\n')}
snaptr('track', 'PAGE_VIEW');
                        `,
                    }}
                />
            )}

            {/* Google Analytics */}
            {hasGa && (
                <>
                    {/* Load the gtag script for the first ID (it supports multiple IDs once loaded) */}
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${google_analytics_ids[0]}`}
                        strategy="afterInteractive"
                    />
                    <Script
                        id="google-analytics-base"
                        strategy="afterInteractive"
                        dangerouslySetInnerHTML={{
                            __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${google_analytics_ids.map(id => `gtag('config', '${id}');`).join('\n')}
                            `,
                        }}
                    />
                </>
            )}
        </>
    );
}

