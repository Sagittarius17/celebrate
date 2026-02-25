
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, Music2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SpotifyPlayerProps {
  trackId: string;
  durationMs?: number;
  isEnabled: boolean;
  onToggle: () => void;
}

export const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ 
  trackId, 
  durationMs = 180000, 
  isEnabled, 
  onToggle 
}) => {
  const [metadata, setMetadata] = useState<{imageUrl: string, title: string, artist: string} | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
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
            title: data.title,
            artist: data.author_name || 'Spotify Artist'
          });
        })
        .catch(() => setMetadata(null));
    }
  }, [trackId]);

  useEffect(() => {
    if (isEnabled) {
      const stepMs = 500;
      progressInterval.current = setInterval(() => {
        setCurrentTimeMs(prev => {
          const next = prev + stepMs;
          if (next >= durationMs) return 0;
          return next;
        });
      }, stepMs);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
      setCurrentTimeMs(0);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isEnabled, durationMs]);

  useEffect(() => {
    const p = (currentTimeMs / durationMs) * 100;
    setProgress(p);
  }, [currentTimeMs, durationMs]);

  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const timeRemaining = durationMs - currentTimeMs;

  return (
    <div className="relative group/spotify-hub flex items-center justify-end p-2 -m-2">
      <div className="absolute right-0 top-0 bottom-0 w-[400px] h-full pointer-events-none group-hover/spotify-hub:pointer-events-auto z-40" />

      <div className="absolute right-[calc(100%-12px)] top-1/2 -translate-y-1/2 w-0 overflow-hidden transition-all duration-500 ease-in-out group-hover/spotify-hub:w-[320px] z-50 pointer-events-none group-hover/spotify-hub:pointer-events-auto">
        <div className="w-[320px] bg-[#191414] rounded-2xl shadow-2xl border border-white/10 overflow-hidden ml-auto relative">
          <div className="h-[80px] relative">
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
              <div className="w-full h-full flex flex-col justify-center gap-1 px-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold truncate">{metadata?.title || 'Celebration Track'}</span>
                    <span className="text-xs text-white/40 truncate">{metadata?.artist || 'Spotify Artist'}</span>
                  </div>
                  <Music2 className="h-5 w-5 text-orange-500 opacity-60" />
                </div>
              </div>
            )}
            
            <div className="absolute bottom-1 left-4 right-4 z-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-orange-500 font-bold">{formatTime(currentTimeMs)}</span>
                <div className="h-0.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300" 
                    style={{ width: `${progress}%` }} 
                  />
                </div>
                <span className="text-[10px] font-mono text-white/40">-{formatTime(timeRemaining)}</span>
              </div>
            </div>
          </div>
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
            style={{ strokeDashoffset: strokeDashoffset, transition: 'stroke-dashoffset 0.5s linear' }}
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
          animation: spin 12s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
