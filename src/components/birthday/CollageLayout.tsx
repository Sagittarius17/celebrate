
"use client";

import React from 'react';
import { EventCard } from './EventCard';
import { Star, Camera, Gift, PartyPopper, Cake, Heart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollageLayoutProps {
  events: any[];
}

const icons = [<Star />, <Camera />, <Gift />, <PartyPopper />, <Cake />, <Heart />, <Sparkles />];

export function CollageLayout({ events }: CollageLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {events.map((event, index) => (
          <div 
            key={event.id} 
            className={cn(
              "break-inside-avoid reveal-on-scroll opacity-0 transition-all duration-1000",
              index % 2 === 0 ? "md:rotate-1" : "md:-rotate-1",
              "hover:rotate-0 hover:scale-[1.02] transition-transform"
            )}
          >
            <EventCard 
              title={event.title}
              date={new Date(event.eventDate).toLocaleDateString()}
              message={event.message}
              imageUrl={event.imageUrl}
              titleFont={event.titleFont}
              messageFont={event.messageFont}
              imageZoom={event.imageZoom}
              imageX={event.imageX}
              imageY={event.imageY}
              icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 text-primary-foreground" })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
