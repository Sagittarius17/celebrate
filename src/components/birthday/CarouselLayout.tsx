
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
    <div className="max-w-[1600px] mx-auto px-6 py-20">
      <Carousel 
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-8 sm:-ml-10">
          {events.map((event, index) => (
            <CarouselItem key={event.id} className="pl-8 sm:pl-10 basis-full md:basis-1/2 lg:basis-1/3">
              <div className="py-12 px-2">
                <EventCard 
                  title={event.title}
                  date={new Date(event.eventDate).toLocaleDateString()}
                  showDate={event.showDate}
                  message={event.message}
                  imageUrl={event.imageUrl}
                  videoUrl={event.videoUrl}
                  titleFont={event.titleFont}
                  messageFont={event.messageFont}
                  imageZoom={event.imageZoom}
                  imageX={event.imageX}
                  imageY={event.imageY}
                  mediaRotation={event.mediaRotation}
                  cornerStyle="rounded"
                  icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-6 h-6 text-primary-foreground candle-light:text-primary" })}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-6 mt-12">
          <CarouselPrevious className="static translate-y-0 h-12 w-12 border-none bg-white/20 hover:bg-white/40 backdrop-blur-md shadow-lg" />
          <CarouselNext className="static translate-y-0 h-12 w-12 border-none bg-white/20 hover:bg-white/40 backdrop-blur-md shadow-lg" />
        </div>
      </Carousel>
    </div>
  );
}
