
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Flame, Sparkles, Play, Pause, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CelebrationControlsProps {
  theme?: 'light' | 'candle-light';
  onToggleTheme?: () => void;
  showFireworks?: boolean;
  onToggleFireworks?: () => void;
  voiceNoteUrl?: string | null;
  spotifyTrackId?: string;
  spotifyTrackStartMs?: number;
  spotifyTrackDurationMs?: number;
  spotifyLoop?: boolean;
  isRevealed?: boolean;
}

export const CelebrationControls: React.FC<CelebrationControlsProps> = ({ 
  theme, 
  onToggleTheme,
  showFireworks,
  onToggleFireworks,
  voiceNoteUrl,
  spotifyTrackId,
  spotifyTrackStartMs = 0,
  spotifyTrackDurationMs = 300000,
  spotifyLoop = false,
  isRevealed = false
}) => {
  const isCandle = theme === 'candle-light';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [trackImageUrl, setTrackImageUrl] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [reloader, setReloader] = useState(0); 
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const minimizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const musicDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startMinimizeTimer = () => {
    if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
    minimizeTimerRef.current = setTimeout(() => {
      setIsMusicExpanded(false);
    }, 6000);
  };

  const clearMinimizeTimer = () => {
    if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
  };

  // Automatically expand music when revealed to ensure browser sees it as "visible" and active
  useEffect(() => {
    if (isRevealed && spotifyTrackId) {
      setIsMusicExpanded(true);
      startMinimizeTimer();
    }
  }, [isRevealed, spotifyTrackId]);

  useEffect(() => {
    if (isRevealed && spotifyTrackId) {
      setIsFading(false);
      
      const clearTimers = () => {
        if (musicDurationTimerRef.current) clearTimeout(musicDurationTimerRef.current);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      };

      clearTimers();

      // Only set timers if we have a limited duration (less than 5 mins)
      if (spotifyTrackDurationMs < 300000) {
        const fadeDelay = Math.max(0, spotifyTrackDurationMs - 3000);
        fadeTimerRef.current = setTimeout(() => {
          setIsFading(true);
        }, fadeDelay);

        musicDurationTimerRef.current = setTimeout(() => {
          if (spotifyLoop) {
            setReloader(prev => prev + 1);
            setIsFading(false);
          } else {
            // If not looping, we just let it stay faded
          }
        }, spotifyTrackDurationMs);
      }
    }
    
    return () => {
      if (musicDurationTimerRef.current) clearTimeout(musicDurationTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [isRevealed, spotifyTrackId, spotifyTrackDurationMs, spotifyLoop, reloader]);

  useEffect(() => {
    if (spotifyTrackId) {
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${spotifyTrackId}`)
        .then(res => res.json())
        .then(data => {
          if (data.thumbnail_url) setTrackImageUrl(data.thumbnail_url);
        })
        .catch(() => {});
    }
  }, [spotifyTrackId]);

  const toggleVoiceNote = () => {
    if (!audioRef.current) return;
    if (isPlayingVoice) {
      audioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      audioRef.current.play();
      setIsPlayingVoice(true);
    }
  };

  const standardButtonStyle = "rounded-full w-10 h-10 sm:w-14 sm:h-14 p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center shrink-0";
  
  const startSeconds = Math.floor(spotifyTrackStartMs / 1000);
  
  // CRITICAL: Construct the embed URL only when revealed to force browser to see it as a fresh play attempt
  const spotifyEmbedUrl = (spotifyTrackId && isRevealed)
    ? `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0&autoplay=1${startSeconds > 0 ? `&t=${startSeconds}` : ''}&_r=${reloader}`
    : '';

  return (
    <div 
      className="fixed top-4 right-4 sm:top-10 sm:right-10 z-[10000] flex flex-col items-center gap-2 pointer-events-auto"
      onMouseEnter={clearMinimizeTimer}
      onMouseLeave={startMinimizeTimer}
    >
      <audio ref={audioRef} src={voiceNoteUrl || undefined} className="hidden" onEnded={() => setIsPlayingVoice(false)} />

      {spotifyTrackId && isRevealed && (
        <div className="relative flex flex-col items-center">
          <button 
            className={cn(
              "relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden shadow-2xl border-2 transition-all duration-300 bg-black shrink-0 flex items-center justify-center cursor-pointer",
              isMusicExpanded ? "border-primary scale-105" : "border-white/20 hover:scale-105"
            )}
            onClick={() => {
              setIsMusicExpanded(!isMusicExpanded);
            }}
          >
            {trackImageUrl ? (
              <Image 
                src={trackImageUrl} 
                alt="Track Art" 
                fill 
                sizes="56px"
                className="object-cover" 
              />
            ) : (
              <Music className="h-6 w-6 text-primary" />
            )}
          </button>
          
          <div className={cn(
            "absolute top-0 right-[calc(100%+16px)] sm:right-[calc(100%+24px)] transition-all duration-500 ease-in-out h-20 flex items-center",
            isMusicExpanded 
              ? "w-[240px] sm:w-[350px] opacity-100 scale-100" 
              : "w-[240px] sm:w-[350px] opacity-0 scale-95 pointer-events-none"
          )}>
            <div className={cn(
              "w-full h-full bg-black/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10 transition-opacity duration-1000",
              isFading ? "opacity-0" : "opacity-100"
            )}>
              {/* Force immediate loading and visibility to satisfy autoplay policies */}
              <iframe 
                key={`spotify-player-${reloader}`}
                src={spotifyEmbedUrl} 
                width="100%" 
                height="80" 
                frameBorder="0" 
                allow="autoplay *; clipboard-write; encrypted-media; fullscreen" 
                loading="eager"
                className="rounded-none border-none"
              />
            </div>
          </div>
        </div>
      )}

      {onToggleTheme && (
        <Button onClick={onToggleTheme} variant="ghost" className={cn(standardButtonStyle, "bg-white/10 hover:bg-white/20 text-foreground")}>
          {isCandle ? <Sun className="h-10 w-10 text-yellow-400" /> : <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />}
        </Button>
      )}

      {onToggleFireworks && isCandle && (
        <Button onClick={onToggleFireworks} variant="ghost" className={cn(standardButtonStyle, showFireworks ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground hover:bg-white/20")}>
          <Sparkles className={cn("h-10 w-10", showFireworks && "animate-pulse")} />
        </Button>
      )}

      {voiceNoteUrl && (
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
          <Button onClick={toggleVoiceNote} variant="ghost" className={cn("rounded-full p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-foreground w-9 h-9 sm:w-14 sm:h-14")}>
            {isPlayingVoice ? <div className="flex gap-1.5"><div className="w-2 h-6 bg-current rounded-full" /><div className="w-2 h-6 bg-current rounded-full" /></div> : <Play className="fill-current ml-1 w-6 h-6 sm:w-8 sm:h-8" />}
          </Button>
        </div>
      )}
    </div>
  );
};
