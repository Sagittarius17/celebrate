
"use client";

import React from 'react';
import { EventCard } from './EventCard';
import { Star, Camera, Gift, PartyPopper, Cake, Heart, Sparkles } from 'lucide-react';

interface GridLayoutProps {
  events: any[];
}

const icons = [<Star />, <Camera />, <Gift />, <PartyPopper />, <Cake />, <Heart />, <Sparkles />];

export function GridLayout({ events }: GridLayoutProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event, index) => (
          <div key={event.id} className="reveal-on-scroll opacity-0 transition-all duration-700">
            <EventCard 
              title={event.title}
              date={new Date(event.eventDate).toLocaleDateString()}
              message={event.message}
              imageUrl={event.imageUrl}
              titleFont={event.titleFont}
              messageFont={event.messageFont}
              icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 text-primary-foreground" })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
