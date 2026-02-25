
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Flame, Sparkles, Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface HeaderProps {
  title?: string;
  occasion?: string;
  theme?: 'light' | 'candle-light';
  onToggleTheme?: () => void;
  showFireworks?: boolean;
  onToggleFireworks?: () => void;
  voiceNoteUrl?: string | null;
  hasMusic?: boolean;
  spotifyTrackId?: string;
  isMusicEnabled?: boolean;
  onToggleMusic?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  occasion = "Celebration", 
  theme, 
  onToggleTheme,
  showFireworks,
  onToggleFireworks,
  voiceNoteUrl,
  hasMusic,
  spotifyTrackId,
  isMusicEnabled,
  onToggleMusic
}) => {
  const isCandle = theme === 'candle-light';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [spotifyMetadata, setSpotifyMetadata] = useState<{imageUrl: string, title: string} | null>(null);
  const [simulatedMusicProgress, setSimulatedMusicProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicProgressInterval = useRef<NodeJS.Timeout | null>(null);

  const scrollToJourney = () => {
    document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleVoiceNote = () => {
    if (!audioRef.current) return;
    if (isPlayingVoice) {
      audioRef.current.pause();
      setIsPlayingVoice(false);
    } else {
      // Pause music if it's currently enabled to let the voice note take center stage
      if (isMusicEnabled && onToggleMusic) {
        onToggleMusic();
      }
      audioRef.current.play();
      setIsPlayingVoice(true);
    }
  };

  const handleMusicToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If turning on music while voice is playing, pause the voice
    if (!isMusicEnabled && isPlayingVoice) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlayingVoice(false);
      }
    }
    if (onToggleMusic) onToggleMusic();
  };

  useEffect(() => {
    if (hasMusic && spotifyTrackId) {
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${spotifyTrackId}`)
        .then(res => res.json())
        .then(data => {
          setSpotifyMetadata({
            imageUrl: data.thumbnail_url,
            title: data.title
          });
        })
        .catch(() => setSpotifyMetadata(null));
    }
  }, [hasMusic, spotifyTrackId]);

  useEffect(() => {
    if (isMusicEnabled) {
      musicProgressInterval.current = setInterval(() => {
        setSimulatedMusicProgress(prev => (prev + 0.5) % 100);
      }, 200);
    } else {
      if (musicProgressInterval.current) clearInterval(musicProgressInterval.current);
      setSimulatedMusicProgress(0);
    }
    return () => {
      if (musicProgressInterval.current) clearInterval(musicProgressInterval.current);
    };
  }, [isMusicEnabled]);

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
  const musicStrokeDashoffset = circumference - (simulatedMusicProgress / 100) * circumference;

  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden z-10">
      <div className="fixed top-8 right-8 z-[100] flex flex-col gap-4 items-center">
        {onToggleTheme && (
          <Button
            onClick={onToggleTheme}
            variant="ghost"
            className="rounded-full w-14 h-14 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-none text-foreground shadow-xl transition-all hover:scale-110 active:scale-90"
            title={isCandle ? "Return to Light Mode" : "Enter Candle-Light Mode"}
          >
            {isCandle ? <Sun className="h-6 w-6 text-yellow-400" /> : <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />}
          </Button>
        )}

        {onToggleFireworks && isCandle && (
          <Button
            onClick={onToggleFireworks}
            variant="ghost"
            className={cn(
              "rounded-full w-14 h-14 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-xl",
              showFireworks 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/10 text-foreground hover:bg-white/20"
            )}
            title={showFireworks ? "Disable Fireworks" : "Enable Fireworks"}
          >
            <Sparkles className={cn("h-6 w-6", showFireworks && "animate-pulse")} />
          </Button>
        )}

        {hasMusic && onToggleMusic && (
          <div className="relative group/spotify-hub flex items-center justify-end">
            {/* Animated Spotify Box Hub */}
            <div className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 w-0 overflow-hidden transition-all duration-500 group-hover/spotify-hub:w-[320px] pointer-events-none group-hover/spotify-hub:pointer-events-auto">
              <div className="w-[320px] h-[80px] bg-[#191414] rounded-2xl shadow-2xl border border-white/10 overflow-hidden transition-all duration-500">
                {isMusicEnabled && spotifyTrackId && (
                  <iframe 
                    src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0&autoplay=1`} 
                    width="100%" 
                    height="80" 
                    frameBorder="0" 
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                    loading="lazy"
                    className="opacity-100"
                  />
                )}
                {!isMusicEnabled && (
                  <div className="w-full h-full flex items-center justify-center text-white/40 gap-3 px-4">
                    <Music2 className="h-6 w-6" />
                    <span className="text-sm font-bold truncate">Click the button to play soundtrack</span>
                  </div>
                )}
              </div>
            </div>

            <div className="relative w-14 h-14 flex items-center justify-center">
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
                  style={{ strokeDashoffset: musicStrokeDashoffset, transition: 'stroke-dashoffset 0.2s linear' }}
                  strokeLinecap="round"
                  className="text-orange-500"
                />
              </svg>
              <Button
                onClick={handleMusicToggleClick}
                variant="ghost"
                className={cn(
                  "rounded-full w-11 h-11 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-md overflow-hidden relative group",
                  !isMusicEnabled && "opacity-80 grayscale-[0.5]"
                )}
                title={isMusicEnabled ? "Mute Soundtrack" : "Play Soundtrack"}
              >
                {spotifyMetadata?.imageUrl ? (
                  <Image 
                    src={spotifyMetadata.imageUrl} 
                    alt="Track" 
                    fill 
                    className={cn("object-cover", isMusicEnabled && "animate-spin-slow")} 
                  />
                ) : (
                  <Music className={cn("h-5 w-5", isMusicEnabled && "animate-spin-slow")} />
                )}
                {!isMusicEnabled && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Music2 className="h-4 w-4 text-white" />
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}

        {voiceNoteUrl && (
          <div className="relative w-14 h-14 flex items-center justify-center">
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
                "rounded-full w-11 h-11 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-sm bg-orange-500/10 text-orange-500 relative z-10",
                isPlayingVoice && "bg-orange-500 text-white"
              )}
              title={isPlayingVoice ? "Pause Message" : "Play Creator Message"}
            >
              {isPlayingVoice ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
        )}
      </div>

      <audio 
        ref={audioRef} 
        src={voiceNoteUrl || undefined} 
        className="hidden"
      />

      <div className="relative z-30 animate-fade-in space-y-6">
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
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  );
};
