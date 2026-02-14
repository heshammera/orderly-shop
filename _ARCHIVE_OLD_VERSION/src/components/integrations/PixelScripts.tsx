import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';

interface PixelScriptsProps {
    storeId: string;
}

export function PixelScripts({ storeId }: PixelScriptsProps) {
    const { data: integrations = [] } = useQuery({
        queryKey: ['public-integrations', storeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('store_integrations')
                .select('provider, config, is_active')
                .eq('store_id', storeId)
                .eq('is_active', true)
                .in('provider', ['facebook_pixel', 'tiktok_pixel', 'snapchat_pixel']);

            if (error) throw error;
            return data;
        },
        enabled: !!storeId,
    });

    return (
        <Helmet>
            {integrations.flatMap((integration) => {
                const pixelIds = integration.config?.pixel_ids || [];
                if (!Array.isArray(pixelIds) || pixelIds.length === 0) return [];

                return pixelIds.map((pixelId, index) => {
                    if (!pixelId) return null;

                    switch (integration.provider) {
                        case 'facebook_pixel':
                            return (
                                <script key={`fb-pixel-${index}`} type="text/javascript">
                                    {`
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${pixelId}');
                  fbq('track', 'PageView');
                `}
                                </script>
                            );

                        case 'tiktok_pixel':
                            return (
                                <script key={`tt-pixel-${index}`} type="text/javascript">
                                    {`
                  !function (w, d, t) {
                    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
                    ttq.load('${pixelId}');
                    ttq.page();
                  }(window, document, 'ttq');
                `}
                                </script>
                            );

                        case 'snapchat_pixel':
                            return (
                                <script key={`sc-pixel-${index}`} type="text/javascript">
                                    {`
                  (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function()
                  {a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
                  a.queue=[];var s='script';r=t.createElement(s);r.async=!0;
                  r.src=n;var u=t.getElementsByTagName(s)[0];
                  u.parentNode.insertBefore(r,u);})(window,document,
                  'https://sc-static.net/scevent.min.js');
                  snaptr('init', '${pixelId}', {
                    'user_email': '__INSERT_USER_EMAIL__'
                  });
                  snaptr('track', 'PAGE_VIEW');
                `}
                                </script>
                            );

                        default:
                            return null;
                    }
                });
            })}
        </Helmet>
    );
}
