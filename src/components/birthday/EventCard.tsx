
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EventCardProps {
  title: string;
  date: string;
  message: string;
  imageUrl?: string;
  videoUrl?: string;
  icon?: React.ReactNode;
  titleFont?: string;
  messageFont?: string;
  imageZoom?: number;
  imageX?: number;
  imageY?: number;
  mediaRotation?: number;
  cornerStyle?: 'rounded' | 'angled';
  showDate?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  title, 
  date, 
  message, 
  imageUrl,
  videoUrl,
  icon,
  titleFont,
  messageFont,
  imageZoom = 1,
  imageX = 0,
  imageY = 0,
  mediaRotation = 0,
  cornerStyle = 'rounded',
  showDate = true
}) => {
  const isAngled = cornerStyle === 'angled';

  return (
    <Card className={cn(
      "overflow-hidden border border-white/20 shadow-xl dark:shadow-2xl transition-all duration-1000 hover:scale-[1.03] bg-white/70 dark:bg-card/70 candle-light:bg-black/60 candle-light:shadow-[0_10px_40px_rgba(255,215,0,0.15)] backdrop-blur-xl",
      isAngled ? "rounded-none" : "rounded-[2.5rem] sm:rounded-[3rem]"
    )}>
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <div className="relative w-full h-full overflow-hidden">
          {videoUrl ? (
            <video 
              src={videoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover transition-transform duration-300"
              style={{
                transform: `scale(${imageZoom}) translate(${imageX}%, ${imageY}%) rotate(${mediaRotation}deg)`
              }}
            />
          ) : imageUrl ? (
            <Image 
              src={imageUrl} 
              alt={title}
              fill
              className="object-cover transition-transform duration-300"
              style={{
                transform: `scale(${imageZoom}) translate(${imageX}%, ${imageY}%) rotate(${mediaRotation}deg)`
              }}
              data-ai-hint="celebration photo"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
               <span className="text-xs text-muted-foreground">No Media</span>
            </div>
          )}
        </div>
        {showDate && (
          <div className="absolute top-6 left-6">
            <Badge variant="secondary" className="px-5 py-2 text-xs sm:text-sm font-bold backdrop-blur-xl bg-white/50 dark:bg-black/50 border-none rounded-full shadow-lg">
              {date}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-8 sm:p-12">
        <div className="flex items-center gap-4 mb-4 sm:mb-6">
          {icon && (
            <div className="p-3 rounded-2xl bg-primary/20 shrink-0 shadow-inner">
              {icon}
            </div>
          )}
          <h3 
            className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight line-clamp-2"
            style={{ fontFamily: titleFont || 'inherit' }}
          >
            {title}
          </h3>
        </div>
        <div className="relative">
          <p 
            className="text-muted-foreground leading-relaxed text-lg sm:text-xl italic font-medium"
            style={{ fontFamily: messageFont || 'inherit' }}
          >
            "{message}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
