
"use client";

import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Flame, Sparkles, Play, Pause, Music, Volume2, VolumeX, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CelebrationControlsProps {
  theme?: 'light' | 'candle-light';
  onToggleTheme?: () => void;
  showFireworks?: boolean;
  onToggleFireworks?: () => void;
  voiceNoteUrl?: string | null;
  spotifyTrackId?: string;
  youtubeVideoId?: string;
  spotifyTrackStartMs?: number;
  spotifyTrackDurationMs?: number;
  spotifyLoop?: boolean;
  isRevealed?: boolean;
  customTrackUrl?: string | null;
  soundtrackSource?: 'spotify' | 'upload' | 'youtube';
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
  youtubeVideoId,
  spotifyTrackStartMs = 0,
  spotifyTrackDurationMs = 300000,
  spotifyLoop = false,
  isRevealed = false,
  customTrackUrl,
  soundtrackSource = 'spotify'
}, ref) => {
  const isCandle = theme === 'candle-light';
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackImageUrl, setTrackImageUrl] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const customTrackAudioRef = useRef<HTMLAudioElement | null>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerContainerRef = useRef<HTMLDivElement>(null);
  
  const spotifyControllerRef = useRef<any>(null);
  const ytPlayerRef = useRef<any>(null);
  
  const minimizeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const musicWasPlayingRef = useRef(false);

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
      if (soundtrackSource === 'upload' && customTrackAudioRef.current) {
        customTrackAudioRef.current.currentTime = spotifyTrackStartMs / 1000;
        customTrackAudioRef.current.play();
        setIsPlaying(true);
        setIsMusicExpanded(true);
        startMinimizeTimer();
      } else if (soundtrackSource === 'spotify' && spotifyControllerRef.current) {
        spotifyControllerRef.current.seek(spotifyTrackStartMs / 1000);
        spotifyControllerRef.current.play();
        setIsMusicExpanded(true);
        setIsPlaying(true);
        startMinimizeTimer();
      } else if (soundtrackSource === 'youtube' && ytPlayerRef.current) {
        ytPlayerRef.current.seekTo(spotifyTrackStartMs / 1000);
        ytPlayerRef.current.playVideo();
        setIsMusicExpanded(true);
        setIsPlaying(true);
        startMinimizeTimer();
      }
    }
  }));

  const initSpotify = useCallback((IFrameAPI: any) => {
    if (!embedContainerRef.current || !spotifyTrackId || soundtrackSource !== 'spotify') return;
    embedContainerRef.current.innerHTML = '';
    const options = { uri: `spotify:track:${spotifyTrackId}`, width: '100%', height: '80' };
    IFrameAPI.createController(embedContainerRef.current, options, (EmbedController: any) => {
      spotifyControllerRef.current = EmbedController;
      EmbedController.addListener('playback_update', (e: any) => {
        const { position, isPaused } = e.data;
        const endMs = spotifyTrackStartMs + spotifyTrackDurationMs;
        setIsPlaying(!isPaused);
        
        if (position >= endMs && !isPaused) {
          if (spotifyLoop) {
            EmbedController.seek(spotifyTrackStartMs / 1000);
            EmbedController.play();
          } else {
            EmbedController.pause();
          }
        }
        setIsFading(position >= endMs - 3000 && position < endMs);
      });
    });
  }, [spotifyTrackId, spotifyTrackStartMs, spotifyTrackDurationMs, spotifyLoop, soundtrackSource]);

  const initYouTube = useCallback(() => {
    if (!ytPlayerContainerRef.current || !youtubeVideoId || soundtrackSource !== 'youtube') return;
    
    if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
      try { ytPlayerRef.current.destroy(); } catch(e) {}
    }

    ytPlayerRef.current = new (window as any).YT.Player(ytPlayerContainerRef.current, {
      height: '80',
      width: '100%',
      videoId: youtubeVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        start: Math.floor(spotifyTrackStartMs / 1000),
      },
      events: {
        onStateChange: (event: any) => {
          if (event.data === (window as any).YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else if (event.data === (window as any).YT.PlayerState.PAUSED || event.data === (window as any).YT.PlayerState.ENDED) {
            setIsPlaying(false);
          }
        },
      }
    });
  }, [youtubeVideoId, soundtrackSource, spotifyTrackStartMs]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPlaying) return;

      if (soundtrackSource === 'youtube' && ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        const positionMs = ytPlayerRef.current.getCurrentTime() * 1000;
        const endMs = spotifyTrackStartMs + spotifyTrackDurationMs;
        
        if (positionMs >= endMs) {
          if (spotifyLoop) {
            ytPlayerRef.current.seekTo(spotifyTrackStartMs / 1000);
          } else {
            ytPlayerRef.current.pauseVideo();
            setIsPlaying(false);
          }
        }
        setIsFading(positionMs >= endMs - 3000 && positionMs < endMs);
      } else if (soundtrackSource === 'upload' && customTrackAudioRef.current) {
        const pos = customTrackAudioRef.current.currentTime * 1000;
        const end = spotifyTrackStartMs + spotifyTrackDurationMs;
        if (pos >= end) {
          if (spotifyLoop) {
            customTrackAudioRef.current.currentTime = spotifyTrackStartMs / 1000;
            customTrackAudioRef.current.play();
          } else {
            customTrackAudioRef.current.pause();
            setIsPlaying(false);
          }
        }
        setIsFading(pos >= end - 3000 && pos < end);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [soundtrackSource, isPlaying, spotifyTrackStartMs, spotifyTrackDurationMs, spotifyLoop]);

  useEffect(() => {
    if (soundtrackSource === 'spotify') {
      if ((window as any).SpotifyIframeApi) {
        initSpotify((window as any).SpotifyIframeApi);
      } else {
        (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => initSpotify(IFrameAPI);
        if (!document.getElementById('spotify-iframe-api')) {
          const s = document.createElement('script');
          s.id = 'spotify-iframe-api';
          s.src = "https://open.spotify.com/embed/iframe-api/v1";
          document.body.appendChild(s);
        }
      }
    } else if (soundtrackSource === 'youtube') {
      if ((window as any).YT && (window as any).YT.Player) {
        initYouTube();
      } else {
        (window as any).onYouTubeIframeAPIReady = initYouTube;
        if (!document.getElementById('youtube-iframe-api')) {
          const s = document.createElement('script');
          s.id = 'youtube-iframe-api';
          s.src = "https://www.youtube.com/iframe_api";
          document.body.appendChild(s);
        }
      }
    }
    return () => clearMinimizeTimer();
  }, [soundtrackSource, initSpotify, initYouTube, clearMinimizeTimer]);

  useEffect(() => {
    if (soundtrackSource === 'spotify' && spotifyTrackId) {
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${spotifyTrackId}`)
        .then(res => res.json()).then(data => setTrackImageUrl(data.thumbnail_url)).catch(() => setTrackImageUrl(null));
    } else if (soundtrackSource === 'youtube' && youtubeVideoId) {
      setTrackImageUrl(`https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`);
    } else {
      setTrackImageUrl(null);
    }
  }, [spotifyTrackId, youtubeVideoId, soundtrackSource]);

  useEffect(() => {
    if (isPlayingVoice) {
      if (isPlaying) {
        musicWasPlayingRef.current = true;
        if (soundtrackSource === 'upload' && customTrackAudioRef.current) customTrackAudioRef.current.pause();
        else if (soundtrackSource === 'spotify' && spotifyControllerRef.current) spotifyControllerRef.current.pause();
        else if (soundtrackSource === 'youtube' && ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
      }
    } else if (musicWasPlayingRef.current) {
      if (soundtrackSource === 'upload' && customTrackAudioRef.current) customTrackAudioRef.current.play();
      else if (soundtrackSource === 'spotify' && spotifyControllerRef.current) spotifyControllerRef.current.play();
      else if (soundtrackSource === 'youtube' && ytPlayerRef.current) ytPlayerRef.current.playVideo();
      musicWasPlayingRef.current = false;
    }
  }, [isPlayingVoice, isPlaying, soundtrackSource]);

  const toggleMusic = () => {
    if (soundtrackSource === 'upload' && customTrackAudioRef.current) {
      isPlaying ? customTrackAudioRef.current.pause() : customTrackAudioRef.current.play();
      setIsPlaying(!isPlaying);
    } else if (soundtrackSource === 'youtube' && ytPlayerRef.current) {
      isPlaying ? ytPlayerRef.current.pauseVideo() : ytPlayerRef.current.playVideo();
      setIsPlaying(!isPlaying);
    } else {
      setIsMusicExpanded(!isMusicExpanded);
      startMinimizeTimer();
    }
  };

  const standardButtonStyle = "rounded-full w-10 h-10 sm:w-14 sm:h-14 p-0 backdrop-blur-md border-none transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center shrink-0";
  const hasSoundtrack = (soundtrackSource === 'spotify' && spotifyTrackId) || (soundtrackSource === 'youtube' && youtubeVideoId) || (soundtrackSource === 'upload' && customTrackUrl);

  return (
    <div className="fixed top-4 right-4 sm:top-10 sm:right-10 z-[10000] flex flex-col items-center gap-4 pointer-events-auto" onMouseEnter={clearMinimizeTimer} onMouseLeave={startMinimizeTimer}>
      <audio ref={audioRef} src={voiceNoteUrl || undefined} className="hidden" onEnded={() => setIsPlayingVoice(false)} />
      {soundtrackSource === 'upload' && <audio ref={customTrackAudioRef} src={customTrackUrl || undefined} className="hidden" />}

      {hasSoundtrack && (
        <div className={cn("relative flex flex-col items-center transition-all duration-700", !isRevealed ? "opacity-0 scale-50 pointer-events-none" : "opacity-100 scale-100")}>
          <button className={cn(
            "relative w-10 h-10 sm:w-14 sm:h-14 rounded-full overflow-hidden shadow-2xl border-2 transition-all duration-300 bg-black shrink-0 flex items-center justify-center cursor-pointer",
            (isMusicExpanded || ((soundtrackSource === 'upload' || soundtrackSource === 'youtube') && isPlaying)) ? "border-primary scale-105" : "border-white/20 hover:scale-105",
            isPlaying && "animate-spin-slow"
          )} onClick={toggleMusic}>
            {trackImageUrl ? <Image src={trackImageUrl} alt="" fill sizes="56px" className="object-cover" /> : <Music className={cn("h-6 w-6 text-primary", isPlaying && "animate-pulse")} />}
            {isPlayingVoice && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><VolumeX className="h-5 w-5 text-white/70" /></div>}
          </button>
          
          <div className={cn(
            "absolute top-0 right-[calc(100%+16px)] sm:right-[calc(100%+24px)] transition-all duration-500 ease-in-out h-20 flex items-center",
            isMusicExpanded ? "w-[240px] sm:w-[350px] opacity-100 scale-100" : "w-[240px] sm:w-[350px] opacity-0 scale-95 pointer-events-none"
          )}>
            <div className={cn("w-full h-full bg-black/80 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md border border-white/10 transition-opacity duration-1000", isFading ? "opacity-30" : "opacity-100")}>
              {soundtrackSource === 'spotify' && <div ref={embedContainerRef} className="w-full h-full min-h-[80px]" />}
              {soundtrackSource === 'youtube' && <div ref={ytPlayerContainerRef} className="w-full h-full min-h-[80px]" />}
            </div>
          </div>
        </div>
      )}

      {onToggleTheme && isRevealed && (
        <Button onClick={onToggleTheme} variant="ghost" className={cn(standardButtonStyle, "bg-white/10 text-foreground")}>
          {isCandle ? <Sun className="h-10 w-10 text-yellow-400" /> : <Flame className="h-10 w-10 text-orange-500 fill-orange-500" />}
        </Button>
      )}

      {onToggleFireworks && isCandle && isRevealed && (
        <Button onClick={onToggleFireworks} variant="ghost" className={cn(standardButtonStyle, showFireworks ? "bg-primary text-primary-foreground" : "bg-white/10 text-foreground hover:bg-white/20")}>
          <Sparkles className={cn("h-10 w-10", showFireworks && "animate-pulse")} />
        </Button>
      )}

      {voiceNoteUrl && isRevealed && (
        <div className="flex flex-col items-center gap-1 group">
          <Button 
            onClick={() => { if (!audioRef.current) return; isPlayingVoice ? audioRef.current.pause() : audioRef.current.play(); setIsPlayingVoice(!isPlayingVoice); }} 
            variant="ghost" 
            className={cn(standardButtonStyle, "bg-white/10 text-foreground hover:bg-white/20")}
          >
            {isPlayingVoice ? <div className="flex gap-1.5"><div className="w-2 h-6 bg-current rounded-full animate-pulse" /><div className="w-2 h-6 bg-current rounded-full animate-pulse" /></div> : <Play className="fill-current ml-1 w-6 h-6 sm:w-8 sm:h-8" />}
          </Button>
          
          <div className="relative flex flex-col items-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-95 group-hover:translate-y-1">
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[5px] border-b-secondary animate-pulse-slow mb-0.5" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground bg-secondary px-4 py-1.5 rounded-full shadow-xl animate-pulse-slow">
              Play Me
            </span>
          </div>
        </div>
      )}

      <style jsx>{`.animate-spin-slow { animation: spin 12s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
});

CelebrationControls.displayName = 'CelebrationControls';
