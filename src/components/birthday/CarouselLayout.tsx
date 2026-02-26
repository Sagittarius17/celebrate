
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
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <Carousel 
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-10">
          {events.map((event, index) => (
            <CarouselItem key={event.id} className="pl-10 md:basis-3/4 lg:basis-1/2 xl:basis-[45%]">
              <div className="py-8">
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
                  icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-6 h-6 text-primary-foreground" })}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-6 mt-4">
          <CarouselPrevious className="static translate-y-0 h-12 w-12 border-none bg-white/20 hover:bg-white/40 backdrop-blur-md" />
          <CarouselNext className="static translate-y-0 h-12 w-12 border-none bg-white/20 hover:bg-white/40 backdrop-blur-md" />
        </div>
      </Carousel>
    </div>
  );
}
