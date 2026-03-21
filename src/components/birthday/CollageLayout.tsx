
"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Heart, Star, Sparkles, Gift, Camera } from 'lucide-react';

interface CollageLayoutProps {
  events: any[];
  recipientName?: string;
  creatorName?: string;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1600;

export function CollageLayout({ 
  events, 
  recipientName = "Friend", 
  creatorName = "Loved One"
}: CollageLayoutProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div 
        className="w-full relative mx-auto bg-white/50 dark:bg-black/20 rounded-[3rem] shadow-2xl overflow-hidden reveal-on-scroll"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      >
        <div className="absolute top-10 left-10 opacity-20"><Sparkles className="w-10 h-10 text-primary" /></div>
        <div className="absolute bottom-10 right-10 opacity-20"><Heart className="w-10 h-10 text-secondary" /></div>

        {events.map((event) => {
          const currentScale = event.canvasScale || 1;
          const isAngled = event.cornerStyle === 'angled';
          
          return (
            <div
              key={event.id}
              className={cn(
                "absolute shadow-2xl bg-white p-3 transition-transform duration-700 hover:scale-105 hover:z-[100]",
                isAngled ? "rounded-none" : "rounded-sm"
              )}
              style={{
                left: `${event.canvasX || 10}%`,
                top: `${event.canvasY || 10}%`,
                zIndex: event.canvasZIndex || 1,
                width: `${currentScale * 25}%`,
                transform: `rotate(${event.canvasRotation || 0}deg)`,
              }}
            >
              <div className={cn(
                "relative aspect-square overflow-hidden bg-muted",
                isAngled ? "rounded-none" : "rounded-sm"
              )}>
                {event.videoUrl ? (
                  <video 
                    src={event.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{
                      transform: `scale(${event.imageZoom || 1}) translate(${event.imageX || 0}%, ${event.imageY || 0}%)`
                    }}
                  />
                ) : event.imageUrl ? (
                  <Image 
                    src={event.imageUrl} 
                    alt={event.title}
                    fill
                    className="object-cover"
                    style={{
                      transform: `scale(${event.imageZoom || 1}) translate(${event.imageX || 0}%, ${event.imageY || 0}%)`
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">No Media</span>
                  </div>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="font-headline font-bold text-[clamp(8px,1.5vw,14px)] truncate">{event.title}</p>
                <p className="text-[clamp(6px,1vw,10px)] text-muted-foreground italic truncate opacity-60">"{event.message}"</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
