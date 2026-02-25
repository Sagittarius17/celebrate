
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Flame, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  occasion?: string;
  theme?: 'light' | 'candle-light';
  onToggleTheme?: () => void;
  showFireworks?: boolean;
  onToggleFireworks?: () => void;
  voiceNoteUrl?: string | null;
  spotifyTrackId?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  occasion = "Celebration", 
  theme, 
  onToggleTheme,
  showFireworks,
  onToggleFireworks,
  voiceNoteUrl,
  spotifyTrackId
}) => {
  const isCandle = theme === 'candle-light';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToJourney = () => {
    document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' });
  };

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
    <header className="relative min-h-screen flex flex-col z-10">
      {/* Fixed Controls Bar (Top Right) */}
      <div className="fixed top-4 right-4 sm:right-8 z-[150] flex flex-row items-start gap-3 pointer-events-none">
        {/* Spotify Box */}
        {spotifyTrackId && (
          <div className="hidden sm:block w-[300px] md:w-[350px] bg-white/10 dark:bg-black/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-500 animate-in fade-in slide-in-from-top-4 pointer-events-auto">
            <iframe 
              src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`} 
              width="100%" 
              height="80" 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="rounded-none border-none"
            />
          </div>
        )}

        {/* Buttons Group */}
        <div className="flex flex-col gap-3 pointer-events-auto pt-1">
          {onToggleTheme && (
            <Button
              onClick={onToggleTheme}
              variant="ghost"
              className="rounded-full w-12 h-12 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-none text-foreground shadow-xl transition-all hover:scale-110 active:scale-90"
              title={isCandle ? "Return to Light Mode" : "Enter Candle-Light Mode"}
            >
              {isCandle ? <Sun className="h-5 w-5 text-yellow-400" /> : <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />}
            </Button>
          )}

          {onToggleFireworks && isCandle && (
            <Button
              onClick={onToggleFireworks}
              variant="ghost"
              className={cn(
                "rounded-full w-12 h-12 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-xl",
                showFireworks 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-white/10 text-foreground hover:bg-white/20"
              )}
              title={showFireworks ? "Disable Fireworks" : "Enable Fireworks"}
            >
              <Sparkles className={cn("h-5 w-5", showFireworks && "animate-pulse")} />
            </Button>
          )}

          {voiceNoteUrl && (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform pointer-events-none" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r={radius} stroke="currentColor" strokeWidth="3" fill="transparent" className="text-orange-500/20" />
                <circle
                  cx="30"
                  cy="30"
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
                  "rounded-full w-9 h-9 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-sm bg-orange-500/10 text-orange-500 relative z-10",
                  isPlayingVoice && "bg-orange-500 text-white"
                )}
                title={isPlayingVoice ? "Pause Message" : "Play Creator Message"}
              >
                {isPlayingVoice ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={voiceNoteUrl || undefined} 
        className="hidden"
      />

      {/* Main Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 overflow-hidden -mt-20">
        <div className="relative z-30 animate-fade-in space-y-8 flex flex-col items-center">
          <div className="space-y-4">
            <div className={cn(
              "inline-block px-6 py-2 rounded-full font-bold tracking-widest uppercase text-xs sm:text-sm mb-4 transition-colors",
              isCandle ? "bg-primary/20 text-foreground border border-primary/30" : "bg-secondary/20 text-secondary-foreground"
            )}>
              A special {occasion.toLowerCase()} surprise
            </div>
            <h1 className={cn(
              "text-5xl sm:text-7xl md:text-9xl font-extrabold leading-tight drop-shadow-sm px-2 transition-all duration-1000",
              isCandle ? "text-foreground drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]" : "text-foreground"
            )}>
              {title ? (
                <>
                  {title.includes(',') ? (
                    <>
                      {title.split(',')[0]} <br />
                      <span className={isCandle ? "text-primary" : "text-primary-foreground"}>
                        {title.split(',')[1]}
                      </span>
                    </>
                  ) : title}
                </>
              ) : (
                <>
                  Happy <br />
                  <span className={isCandle ? "text-primary" : "text-primary-foreground"}>{occasion}</span>
                </>
              )}
            </h1>
            <p className={cn(
              "text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed px-4 transition-colors",
              isCandle ? "text-foreground/80" : "text-muted-foreground"
            )}>
              Relive the beautiful moments that shaped an extraordinary life and journey through time together.
            </p>
          </div>
        </div>
      </div>

      <div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-30"
        onClick={scrollToJourney}
      >
        <div className={cn(
          "w-8 h-12 border-2 rounded-full flex justify-center p-1 transition-colors",
          isCandle ? "border-primary" : "border-muted-foreground/30"
        )}>
          <div className={cn(
            "w-1 h-3 rounded-full animate-scroll transition-colors",
            isCandle ? "bg-primary" : "bg-muted-foreground/40"
          )} />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        .animate-scroll {
          animation: scroll 2s infinite;
        }
      `}</style>
    </header>
  );
};
