
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
        className="w-full relative mx-auto bg-transparent reveal-on-scroll"
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
      >
        <div className="absolute top-10 left-10 opacity-20 pointer-events-none"><Sparkles className="w-10 h-10 text-primary" /></div>
        <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none"><Heart className="w-10 h-10 text-secondary" /></div>

        {events.map((event) => {
          const currentScale = event.canvasScale || 1;
          const isAngled = event.cornerStyle === 'angled';
          const isFit = event.mediaFit === 'contain';
          
          return (
            <div
              key={event.id}
              className={cn(
                "absolute shadow-2xl bg-white p-2 transition-transform duration-700 hover:scale-105 hover:z-[100]",
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
                {/* Blurred Background for 'Fit' mode */}
                {isFit && (event.imageUrl || event.videoUrl) && (
                  <div 
                    className="absolute inset-0 scale-110 blur-xl opacity-40"
                    style={{ 
                      backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : 'none',
                      backgroundColor: 'black',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                )}

                {event.videoUrl ? (
                  <video 
                    src={event.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={cn(
                      "w-full h-full relative z-10",
                      isFit ? "object-contain" : "object-cover"
                    )}
                    style={{
                      transform: `scale(${isFit ? 1 : (event.imageZoom || 1)}) translate(${isFit ? 0 : (event.imageX || 0)}%, ${isFit ? 0 : (event.imageY || 0)}%) rotate(${event.mediaRotation || 0}deg)`
                    }}
                  />
                ) : event.imageUrl ? (
                  <Image 
                    src={event.imageUrl} 
                    alt={event.title}
                    fill
                    className={cn(
                      "relative z-10",
                      isFit ? "object-contain" : "object-cover"
                    )}
                    style={{
                      transform: `scale(${isFit ? 1 : (event.imageZoom || 1)}) translate(${isFit ? 0 : (event.imageX || 0)}%, ${isFit ? 0 : (event.imageY || 0)}%) rotate(${event.mediaRotation || 0}deg)`
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">No Media</span>
                  </div>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="font-headline font-bold text-[clamp(8px,1.5vw,14px)] truncate text-black">{event.title}</p>
                <p className="text-[clamp(6px,1vw,10px)] text-muted-foreground italic truncate opacity-60">"{event.message}"</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
