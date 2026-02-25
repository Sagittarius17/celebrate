
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
  isRevealed?: boolean;
}

export const CelebrationControls: React.FC<CelebrationControlsProps> = ({ 
  theme, 
  onToggleTheme,
  showFireworks,
  onToggleFireworks,
  voiceNoteUrl,
  spotifyTrackId,
  isRevealed = false
}) => {
  const isCandle = theme === 'candle-light';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceVolume, setVoiceVolume] = useState(0.6); // Default 60%
  const [isHoveringVoice, setIsHoveringVoice] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [trackImageUrl, setTrackImageUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeAreaRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startMinimizeTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsMusicExpanded(false);
    }, 5000);
  };

  const clearMinimizeTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  useEffect(() => {
    if (spotifyTrackId) {
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${spotifyTrackId}`)
        .then(res => res.json())
        .then(data => {
          if (data.thumbnail_url) {
            setTrackImageUrl(data.thumbnail_url);
          }
        })
        .catch(() => {});
    }
  }, [spotifyTrackId]);

  // Non-passive wheel listener to block background scroll and adjust volume
  useEffect(() => {
    const el = volumeAreaRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Always prevent default if hovering to satisfy "background scroll wont work"
      e.preventDefault(); 
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setVoiceVolume(v => {
        const next = Math.min(Math.max(v + delta, 0), 1);
        if (audioRef.current) audioRef.current.volume = next;
        return next;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setVoiceProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleEnded = () => {
      setIsPlayingVoice(false);
      setVoiceProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [voiceNoteUrl]);

  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const voiceStrokeDashoffset = circumference - (voiceProgress / 100) * circumference;

  return (
    <div 
      className="fixed top-6 right-6 sm:right-10 z-[10000] flex flex-col items-end gap-4 pointer-events-auto"
      onMouseEnter={clearMinimizeTimer}
      onMouseLeave={startMinimizeTimer}
    >
      <audio 
        ref={audioRef} 
        src={voiceNoteUrl || undefined} 
        className="hidden"
      />

      {/* Spotify Section */}
      {spotifyTrackId && isRevealed && (
        <div className="flex flex-row items-center gap-4">
          <div className={cn(
            "transition-all duration-500 ease-in-out overflow-hidden flex justify-end",
            isMusicExpanded ? "w-[300px] md:w-[350px] opacity-100" : "w-0 opacity-0 pointer-events-none"
          )}>
            <div className="w-[300px] md:w-[350px] h-20 bg-white/10 dark:bg-black/40 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10">
              <iframe 
                src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0&autoplay=1`} 
                width="100%" 
                height="80" 
                frameBorder="0" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy"
                className="rounded-none border-none"
              />
            </div>
          </div>

          <button 
            className={cn(
              "relative w-14 h-14 rounded-full overflow-hidden shadow-2xl border-2 transition-all duration-300 bg-white dark:bg-black shrink-0 flex items-center justify-center cursor-pointer",
              isMusicExpanded ? "border-primary scale-110" : "border-white/20 hover:scale-110"
            )}
            onClick={() => setIsMusicExpanded(!isMusicExpanded)}
          >
            {trackImageUrl ? (
              <Image src={trackImageUrl} alt="Track Art" fill className="object-cover" />
            ) : (
              <Music className="h-6 w-6 text-primary" />
            )}
          </button>
        </div>
      )}

      {/* Theme Toggle */}
      {onToggleTheme && (
        <Button
          onClick={onToggleTheme}
          variant="ghost"
          className="rounded-full w-14 h-14 p-0 bg-white/20 dark:bg-black/20 hover:bg-white/40 backdrop-blur-md border-none text-foreground shadow-2xl transition-all hover:scale-110 active:scale-90"
          title={isCandle ? "Return to Light Mode" : "Enter Candle-Light Mode"}
        >
          {isCandle ? <Sun className="h-6 w-6 text-yellow-400" /> : <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />}
        </Button>
      )}

      {/* Fireworks */}
      {onToggleFireworks && isCandle && (
        <Button
          onClick={onToggleFireworks}
          variant="ghost"
          className={cn(
            "rounded-full w-14 h-14 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-2xl",
            showFireworks 
              ? "bg-primary text-primary-foreground" 
              : "bg-white/20 dark:bg-black/20 text-foreground hover:bg-white/40"
          )}
          title={showFireworks ? "Disable Fireworks" : "Enable Fireworks"}
        >
          <div className="relative">
            <Sparkles className={cn("h-6 w-6", showFireworks && "animate-pulse")} />
          </div>
        </Button>
      )}

      {/* Voice Note Section - Refined for Scroll Lock & UI */}
      {voiceNoteUrl && (
        <div 
          ref={volumeAreaRef}
          className="relative flex items-center gap-4 group/voice"
          onMouseEnter={() => setIsHoveringVoice(true)}
          onMouseLeave={() => setIsHoveringVoice(false)}
        >
          {/* Vertical Volume Bar - Positioned exactly as in reference */}
          <div className={cn(
            "flex flex-col items-center gap-2 transition-all duration-300 transform",
            isHoveringVoice ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
          )}>
            <div className="h-28 w-2.5 bg-white/10 rounded-full relative overflow-hidden flex flex-col justify-end backdrop-blur-sm shadow-sm border border-white/5">
              <div 
                className="w-full bg-orange-500 transition-all duration-150 rounded-full"
                style={{ height: `${voiceVolume * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-orange-500 drop-shadow-sm">
              {Math.round(voiceVolume * 100)}%
            </span>
          </div>

          {/* Voice Note Play Button with Progress Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-orange-500/10" />
              <circle
                cx="30"
                cy="30"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: voiceStrokeDashoffset, transition: 'stroke-dashoffset 0.1s linear' }}
                strokeLinecap="round"
                className="text-orange-500"
              />
            </svg>
            <Button
              onClick={toggleVoiceNote}
              variant="ghost"
              className={cn(
                "rounded-full w-12 h-12 p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-lg bg-orange-500 text-black font-black flex items-center justify-center relative z-10",
                !isPlayingVoice && "bg-orange-500/90"
              )}
              title={isPlayingVoice ? "Pause Message" : "Play Creator Message"}
            >
              {isPlayingVoice ? (
                <div className="flex gap-1">
                  <div className="w-1.5 h-4 bg-black rounded-full" />
                  <div className="w-1.5 h-4 bg-black rounded-full" />
                </div>
              ) : (
                <Play className="h-5 w-5 fill-black ml-1" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
