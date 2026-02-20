"use client";

import React from 'react';
import { EventCard } from './EventCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star, Camera, Gift, PartyPopper, Cake, Heart, Sparkles } from 'lucide-react';

interface CarouselLayoutProps {
  events: any[];
}

const icons = [<Star />, <Camera />, <Gift />, <PartyPopper />, <Cake />, <Heart />, <Sparkles />];

export function CarouselLayout({ events }: CarouselLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Carousel className="w-full">
        <CarouselContent className="-ml-4">
          {events.map((event, index) => (
            <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <EventCard 
                  title={event.title}
                  date={new Date(event.eventDate).toLocaleDateString()}
                  message={event.message}
                  imageUrl={event.imageUrl}
                  icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 text-primary-foreground" })}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-4 mt-8">
          <CarouselPrevious className="static translate-y-0" />
          <CarouselNext className="static translate-y-0" />
        </div>
      </Carousel>
    </div>
  );
}