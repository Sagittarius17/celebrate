
"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
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

export interface CelebrationControlsHandle {
  playMusic: () => void;
}

export const CelebrationControls = forwardRef<CelebrationControlsHandle, CelebrationControlsProps>(({ 
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
}, ref) => {
  const isCandle = theme === 'candle-light';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [trackImageUrl, setTrackImageUrl] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<any>(null);
  const minimizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isApiReadyRef = useRef(false);

  const startMinimizeTimer = useCallback(() => {
    if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
    minimizeTimerRef.current = setTimeout(() => {
      setIsMusicExpanded(false);
    }, 6000);
  }, []);

  const clearMinimizeTimer = useCallback(() => {
    if (minimizeTimerRef.current) clearTimeout(minimizeTimerRef.current);
  }, []);

  useImperativeHandle(ref, () => ({
    playMusic: () => {
      if (controllerRef.current && isApiReadyRef.current) {
        controllerRef.current.play();
        setIsMusicExpanded(true);
        startMinimizeTimer();
      }
    }
  }));

  const initSpotify = useCallback((IFrameAPI: any) => {
    if (!embedContainerRef.current || !spotifyTrackId) return;
    
    // Clear previous content to avoid duplicates
    embedContainerRef.current.innerHTML = '';
    
    const options = {
      uri: `spotify:track:${spotifyTrackId}`,
      width: '100%',
      height: '80',
    };
    
    IFrameAPI.createController(embedContainerRef.current, options, (EmbedController: any) => {
      controllerRef.current = EmbedController;
      
      EmbedController.addListener('playback_update', (e: any) => {
        const { position, isPaused } = e.data;
        const startMs = spotifyTrackStartMs;
        const endMs = startMs + spotifyTrackDurationMs;
        
        if (position >= endMs && !isPaused) {
          if (spotifyLoop) {
            EmbedController.seek(startMs / 1000);
            EmbedController.play();
          } else {
            EmbedController.pause();
          }
        }

        // Visual fade hint
        const fadeStartMs = endMs - 3000;
        setIsFading(position >= fadeStartMs && position < endMs);
      });

      EmbedController.addListener('ready', () => {
        isApiReadyRef.current = true;
        if (spotifyTrackStartMs > 0) {
          EmbedController.seek(spotifyTrackStartMs / 1000);
        }
        
        // If we are already revealed by the time API is ready, try to play
        // Note: This might still be blocked by browser if not triggered by the actual click
      });
    });
  }, [spotifyTrackId, spotifyTrackStartMs, spotifyTrackDurationMs, spotifyLoop]);

  useEffect(() => {
    if (!spotifyTrackId) return;

    const loadApi = () => {
      if ((window as any).SpotifyIframeApi) {
        initSpotify((window as any).SpotifyIframeApi);
      } else {
        (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
          initSpotify(IFrameAPI);
        };

        if (!document.getElementById('spotify-iframe-api')) {
          const script = document.createElement('script');
          script.id = 'spotify-iframe-api';
          script.src = "https://open.spotify.com/embed/iframe-api/v1";
          script.async = true;
          document.body.appendChild(script);
        }
      }
    };

    loadApi();

    return () => {
      clearMinimizeTimer();
    };
  }, [spotifyTrackId, initSpotify, clearMinimizeTimer]);

  useEffect(() => {
    if (spotifyTrackId) {
      // Fetch metadata safely, ignoring potential internal Spotify CORS errors
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${spotifyTrackId}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (data.thumbnail_url) setTrackImageUrl(data.thumbnail_url);
        })
        .catch(() => {
          // Fallback if oembed fails
          setTrackImageUrl(null);
        });
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
  
  return (
    <div 
      className="fixed top-4 right-4 sm:top-10 sm:right-10 z-[10000] flex flex-col items-center gap-2 pointer-events-auto"
      onMouseEnter={clearMinimizeTimer}
      onMouseLeave={startMinimizeTimer}
    >
      <audio ref={audioRef} src={voiceNoteUrl || undefined} className="hidden" onEnded={() => setIsPlayingVoice(false)} />

      {spotifyTrackId && (
        <div className={cn(
          "relative flex flex-col items-center transition-all duration-700", 
          !isRevealed ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100"
        )}>
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
              isFading ? "opacity-30" : "opacity-100"
            )}>
              <div ref={embedContainerRef} className="w-full h-full min-h-[80px]" />
            </div>
          </div>
        </div>
      )}

      {onToggleTheme && isRevealed && (
        <Button onClick={onToggleTheme} variant="ghost" className={cn(standardButtonStyle, "bg-white/10 hover:bg-white/20 text-foreground")}>
          {isCandle ? <Sun className="h-10 w-10 text-yellow-400" /> : <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />}
        </Button>
      )}

      {onToggleFireworks && isCandle && isRevealed && (
        <Button onClick={onToggleFireworks} variant="ghost" className={cn(standardButtonStyle, showFireworks ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground hover:bg-white/20")}>
          <Sparkles className={cn("h-10 w-10", showFireworks && "animate-pulse")} />
        </Button>
      )}

      {voiceNoteUrl && isRevealed && (
        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
          <Button onClick={toggleVoiceNote} variant="ghost" className={cn("rounded-full p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-foreground w-9 h-9 sm:w-14 sm:h-14")}>
            {isPlayingVoice ? <div className="flex gap-1.5"><div className="w-2 h-6 bg-current rounded-full" /><div className="w-2 h-6 bg-current rounded-full" /></div> : <Play className="fill-current ml-1 w-6 h-6 sm:w-8 sm:h-8" />}
          </Button>
        </div>
      )}
    </div>
  );
});

CelebrationControls.displayName = 'CelebrationControls';
