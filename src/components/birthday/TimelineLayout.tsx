
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { EventCard } from './EventCard';
import { Star, Camera, Gift, PartyPopper, Cake, Heart, Sparkles } from 'lucide-react';

interface TimelineLayoutProps {
  events: any[];
  scrollProgress: number;
}

const icons = [<Star />, <Camera />, <Gift />, <PartyPopper />, <Cake />, <Heart />, <Sparkles />];

export function TimelineLayout({ events, scrollProgress }: TimelineLayoutProps) {
  return (
    <div className="relative z-10">
      <div className="space-y-16 sm:space-y-32 relative z-10 pt-10 sm:pt-20">
        {events.map((event, index) => (
          <div 
            key={event.id} 
            className={cn(
              "flex flex-col md:flex-row items-center justify-between group gap-8 md:gap-0 relative",
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            )}
          >
            <div className={cn(
              "w-full md:w-[45%] reveal-on-scroll",
              index % 2 === 0 ? "reveal-left" : "reveal-right"
            )}>
              <EventCard 
                title={event.title}
                date={new Date(event.eventDate).toLocaleDateString()}
                message={event.message}
                imageUrl={event.imageUrl}
                icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" })}
              />
            </div>

            {/* Timeline Dot - Perfectly centered on the same axis */}
            <div className={cn(
              "hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[3px] transition-all duration-500 z-20 bg-background shadow-sm",
              scrollProgress > (index / (events.length + 1)) * 100 ? "border-secondary scale-110 shadow-[0_0_15px_rgba(255,182,193,0.4)]" : "border-primary/40"
            )}> 
              <div className={cn(
                "w-3 h-3 sm:w-5 sm:h-5 rounded-full transition-colors duration-500",
                scrollProgress > (index / (events.length + 1)) * 100 ? "bg-secondary" : "bg-primary/20"
              )} />
            </div>

            <div className="hidden md:block md:w-[45%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
