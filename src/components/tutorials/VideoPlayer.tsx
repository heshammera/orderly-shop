"use client";

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { APITypes, PlyrProps } from 'plyr-react';
import 'plyr-react/plyr.css';
import { ParsedVideo, parseVideoUrl } from '@/lib/videoUtils';
const CustomPlyr = dynamic<PlyrProps>(() => import('./CustomPlyrPlayer'), { ssr: false });

interface VideoPlayerProps {
    videoUrl?: string;
    videoType?: string;
    videoId?: string;
    thumbnailUrl?: string;
    title?: string;
    className?: string;
}

export function VideoPlayer({
    videoUrl,
    videoType,
    videoId,
    thumbnailUrl,
    title,
    className = ""
}: VideoPlayerProps) {

    // Parse the URL if type/id are not explicitly provided
    let parsed: ParsedVideo | null = null;
    if (videoUrl && (!videoType || !videoId)) {
        parsed = parseVideoUrl(videoUrl);
    }

    const type = videoType || parsed?.platform || 'other';
    const id = videoId || parsed?.id || '';
    const poster = thumbnailUrl || parsed?.thumbnailUrl || '';

    // Plyr Source configuration
    let plyrSource: Plyr.SourceInfo | null = null;

    if (type === 'youtube' && id) {
        plyrSource = {
            type: 'video',
            sources: [
                {
                    src: id,
                    provider: 'youtube',
                },
            ],
            poster: poster
        };
    } else if (type === 'vimeo' && id) {
        plyrSource = {
            type: 'video',
            sources: [
                {
                    src: id,
                    provider: 'vimeo',
                },
            ],
            poster: poster
        };
    } else if (type === 'upload' && id) {
        // Direct HTML5 video from Supabase Storage or direct link
        plyrSource = {
            type: 'video',
            sources: [
                {
                    src: id,
                    type: 'video/mp4',
                },
            ],
            poster: poster,
            title: title
        };
    }

    // Plyr Options
    const plyrOptions: Plyr.Options = {
        controls: [
            'play-large', // The large play button in the center
            'restart', // Restart playback
            'rewind', // Rewind by the seek time (default 10 seconds)
            'play', // Play/pause playback
            'fast-forward', // Fast forward by the seek time (default 10 seconds)
            'progress', // The progress bar and scrubber for playback and buffering
            'current-time', // The current time of playback
            'duration', // The full duration of the media
            'mute', // Toggle mute
            'volume', // Volume control
            'settings', // Settings menu
            'pip', // Picture-in-picture (currently Safari only)
            'fullscreen' // Toggle fullscreen
        ],
        settings: ['quality', 'speed', 'loop'],
        youtube: {
            noCookie: true,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            modestbranding: 1
        },
        vimeo: {
            byline: false,
            portrait: false,
            title: false,
            speed: true,
            transparent: false
        }
    };

    if (!plyrSource) {
        // Fallback for dailymotion or general iframes
        if (type === 'dailymotion' && id) {
            return (
                <div className={`relative aspect-video bg-black rounded-xl overflow-hidden shadow-sm ${className}`}>
                    <iframe
                        src={`https://www.dailymotion.com/embed/video/${id}?ui-logo=false&ui-start-screen-info=false`}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0 absolute inset-0"
                    />
                </div>
            );
        }

        if (videoUrl) {
            return (
                <div className={`relative aspect-video bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center text-white ${className}`}>
                    <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        فتح الفيديو ({videoUrl})
                    </a>
                </div>
            );
        }

        return (
            <div className={`relative aspect-video bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center text-slate-500 ${className}`}>
                لا يوجد فيديو
            </div>
        );
    }

    return (
        <div className={`relative rounded-xl overflow-hidden shadow-sm branded-plyr-container bg-black ${className}`}>
            <CustomPlyr
                source={plyrSource}
                options={plyrOptions}
            />

            {/* Custom CSS overrides to brand the player - colors will use CSS vars from global tailwind config */}
            <style jsx global>{`
                .branded-plyr-container {
                    /* Override Plyr's default --plyr-color-main with our theme's primary color */
                    --plyr-color-main: hsl(var(--primary));
                    --plyr-video-background: #000;
                    --plyr-menu-background: rgba(255,255,255,0.95);
                    --plyr-menu-color: #1e293b;
                    --plyr-control-icon-size: 18px;
                    --plyr-control-spacing: 12px;
                }
                
                /* Slight branding watermark (optional) */
                .branded-plyr-container::after {
                    content: '';
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    width: 40px;
                    height: 40px;
                    background-image: url('/favicon.png'); /* Or any logo path */
                    background-size: contain;
                    background-repeat: no-repeat;
                    opacity: 0.15;
                    pointer-events: none;
                    z-index: 10;
                    transition: opacity 0.3s ease;
                }
                
                .branded-plyr-container:hover::after {
                    opacity: 0.4;
                }
            `}</style>
        </div>
    );
}
