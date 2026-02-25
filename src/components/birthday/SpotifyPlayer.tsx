
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
      {/* Invisible bridge to maintain hover between button and hub */}
      <div className="absolute right-0 top-0 bottom-0 w-[400px] h-full pointer-events-none group-hover/spotify-hub:pointer-events-auto z-40" />

      {/* Animated Spotify Box Hub */}
      <div className="absolute right-[calc(100%-12px)] top-1/2 -translate-y-1/2 w-0 overflow-hidden transition-all duration-500 ease-in-out group-hover/spotify-hub:w-[320px] z-50 pointer-events-none group-hover/spotify-hub:pointer-events-auto">
        <div className="w-[320px] bg-[#191414] rounded-2xl shadow-2xl border border-white/10 overflow-hidden ml-auto relative">
          <div className="h-[80px]">
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
          
          {/* Synced Horizontal Progress Bar inside the box */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-200 linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control Button with Progress Ring */}
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
            "rounded-full w-11 h-11 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-md overflow-hidden relative",
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
