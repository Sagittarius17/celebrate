
"use client";

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  title: string;
  date: string;
  message: string;
  imageUrl: string;
  icon?: React.ReactNode;
  titleFont?: string;
  messageFont?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ 
  title, 
  date, 
  message, 
  imageUrl, 
  icon,
  titleFont,
  messageFont
}) => {
  return (
    <Card className="overflow-hidden border-none shadow-2xl transition-all duration-1000 hover:scale-[1.02] bg-white/80 dark:bg-card/80 candle-light:bg-black/60 candle-light:shadow-[0_0_40px_rgba(255,215,0,0.15)] backdrop-blur-md rounded-[1.5rem] sm:rounded-[2rem]">
      <div className="relative h-48 sm:h-64 w-full">
        <Image 
          src={imageUrl} 
          alt={title}
          fill
          className="object-cover"
          data-ai-hint="celebration photo"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="px-3 sm:px-4 py-1 text-xs sm:text-sm font-semibold backdrop-blur-md bg-white/40 dark:bg-black/40 border-none">
            {date}
          </Badge>
        </div>
      </div>
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          {icon && (
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/20 shrink-0">
              {icon}
            </div>
          )}
          <h3 
            className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight line-clamp-2"
            style={{ fontFamily: titleFont || 'inherit' }}
          >
            {title}
          </h3>
        </div>
        <p 
          className="text-muted-foreground leading-relaxed text-base sm:text-lg italic"
          style={{ fontFamily: messageFont || 'inherit' }}
        >
          "{message}"
        </p>
      </CardContent>
    </Card>
  );
};
