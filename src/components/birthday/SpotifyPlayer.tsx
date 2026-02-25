
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SpotifyPlayerProps {
  trackId: string;
  isEnabled: boolean;
  onToggle: () => void;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ 
  trackId, 
  isEnabled, 
  onToggle 
}) => {
  const [metadata, setMetadata] = useState<{imageUrl: string, title: string} | null>(null);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const radius = 27;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    if (trackId) {
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${trackId}`)
        .then(res => res.json())
        .then(data => {
          setMetadata({
            imageUrl: data.thumbnail_url,
            title: data.title
          });
        })
        .catch(() => setMetadata(null));
    }
  }, [trackId]);

  useEffect(() => {
    if (isEnabled) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => (prev + 0.5) % 100);
      }, 200);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setProgress(0);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isEnabled]);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative group/spotify-hub flex items-center justify-end p-2 -m-2">
      {/* Animated Spotify Box Hub - Slides out from behind the button */}
      <div className="absolute right-[calc(100%-8px)] top-1/2 -translate-y-1/2 w-0 overflow-hidden transition-all duration-500 delay-75 group-hover/spotify-hub:w-[320px] group-hover/spotify-hub:delay-0 pointer-events-none group-hover/spotify-hub:pointer-events-auto z-50">
        <div className="w-[320px] h-[80px] bg-[#191414] rounded-2xl shadow-2xl border border-white/10 overflow-hidden ml-auto">
          {isEnabled && trackId && (
            <iframe 
              src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1`} 
              width="100%" 
              height="80" 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="opacity-100"
            />
          )}
          {!isEnabled && (
            <div className="w-full h-full flex items-center justify-center text-white/40 gap-3 px-4">
              <Music2 className="h-6 w-6" />
              <span className="text-sm font-bold truncate">Click the button to play soundtrack</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative w-14 h-14 flex items-center justify-center z-[60]">
        <svg className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-orange-500/10" />
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: strokeDashoffset, transition: 'stroke-dashoffset 0.2s linear' }}
            strokeLinecap="round"
            className="text-orange-500"
          />
        </svg>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          variant="ghost"
          className={cn(
            "rounded-full w-11 h-11 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-md overflow-hidden relative group",
            !isEnabled && "opacity-80 grayscale-[0.5]"
          )}
          title={isEnabled ? "Mute Soundtrack" : "Play Soundtrack"}
        >
          {metadata?.imageUrl ? (
            <Image 
              src={metadata.imageUrl} 
              alt="Track" 
              fill 
              className={cn("object-cover", isEnabled && "animate-spin-slow")} 
            />
          ) : (
            <Music className={cn("h-5 w-5", isEnabled && "animate-spin-slow")} />
          )}
          {!isEnabled && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Music2 className="h-4 w-4 text-white" />
            </div>
          )}
        </Button>
      </div>
      <style jsx>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
