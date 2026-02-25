
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

  useEffect(() => {
    const el = volumeAreaRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!isHoveringVoice) return;
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
  }, [isHoveringVoice]);

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

  const radius = 29; // Slightly larger radius for the progress border
  const circumference = 2 * Math.PI * radius;
  const voiceStrokeDashoffset = circumference - (voiceProgress / 100) * circumference;

  const standardButtonStyle = "rounded-full w-16 h-16 p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center shrink-0";

  return (
    <div 
      className="fixed top-10 right-10 z-[10000] flex flex-col items-center gap-2 pointer-events-auto"
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
        <div className="relative flex flex-col items-center">
          <button 
            className={cn(
              "relative w-16 h-16 rounded-full overflow-hidden shadow-2xl border-2 transition-all duration-300 bg-black shrink-0 flex items-center justify-center cursor-pointer",
              isMusicExpanded ? "border-primary scale-105" : "border-white/20 hover:scale-105"
            )}
            onClick={() => setIsMusicExpanded(!isMusicExpanded)}
          >
            {trackImageUrl ? (
              <Image src={trackImageUrl} alt="Track Art" fill className="object-cover" />
            ) : (
              <Music className="h-6 w-6 text-primary" />
            )}
          </button>
          
          <div className={cn(
            "absolute top-0 right-[calc(100%+24px)] transition-all duration-500 ease-in-out overflow-hidden h-20 flex items-center",
            isMusicExpanded ? "w-[300px] md:w-[350px] opacity-100" : "w-0 opacity-0 pointer-events-none"
          )}>
            <div className="w-full h-full bg-black/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10">
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
        </div>
      )}

      {/* Theme Toggle */}
      {onToggleTheme && (
        <Button
          onClick={onToggleTheme}
          variant="ghost"
          className={cn(standardButtonStyle, "bg-white/10 hover:bg-white/20 text-foreground")}
          title={isCandle ? "Return to Light Mode" : "Enter Candle-Light Mode"}
        >
          {isCandle ? <Sun className="h-7 w-7 text-yellow-400" /> : <Flame className="h-7 w-7 text-orange-500 fill-orange-500" />}
        </Button>
      )}

      {/* Fireworks */}
      {onToggleFireworks && isCandle && (
        <Button
          onClick={onToggleFireworks}
          variant="ghost"
          className={cn(
            standardButtonStyle,
            showFireworks 
              ? "bg-primary text-primary-foreground" 
              : "bg-white/10 text-foreground hover:bg-white/20"
          )}
          title={showFireworks ? "Disable Fireworks" : "Enable Fireworks"}
        >
          <Sparkles className={cn("h-7 w-7", showFireworks && "animate-pulse")} />
        </Button>
      )}

      {/* Voice Note Section */}
      {voiceNoteUrl && (
        <div 
          ref={volumeAreaRef}
          className="relative flex items-center gap-4"
          onMouseEnter={() => setIsHoveringVoice(true)}
          onMouseLeave={() => setIsHoveringVoice(false)}
        >
          <div className={cn(
            "absolute right-[calc(100%+16px)] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 transition-all duration-300 transform",
            isHoveringVoice ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"
          )}>
            <div className="h-28 w-2.5 bg-white/10 rounded-full relative overflow-hidden flex flex-col justify-end backdrop-blur-sm border border-white/5">
              <div 
                className="w-full bg-orange-500 transition-all duration-150 rounded-full"
                style={{ height: `${voiceVolume * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-bold text-orange-500 whitespace-nowrap">
              {Math.round(voiceVolume * 100)}%
            </span>
          </div>

          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none z-20" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-orange-500/10" />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="3"
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
                "rounded-full w-[54px] h-[54px] p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center shrink-0",
                "bg-orange-500 text-black border-none hover:bg-orange-600 z-10",
                !isPlayingVoice && "bg-orange-500"
              )}
              title={isPlayingVoice ? "Pause Message" : "Play Creator Message"}
            >
              {isPlayingVoice ? (
                <div className="flex gap-1.5 items-center justify-center">
                  <div className="w-2.5 h-8 bg-black rounded-full" />
                  <div className="w-2.5 h-8 bg-black rounded-full" />
                </div>
              ) : (
                <Play className="fill-black ml-1" style={{ width: '40px', height: '40px' }} />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
