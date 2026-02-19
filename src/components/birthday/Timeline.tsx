
"use client";

import React, { useEffect, useRef } from 'react';
import { EventCard } from './EventCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Star, Heart, Gift, Camera, PartyPopper, Cake } from 'lucide-react';

const timelineData = [
  {
    date: "June 15, 1995",
    title: "A Star is Born",
    message: "The world became a brighter place the moment you arrived. Your first smile lit up every room.",
    image: PlaceHolderImages.find(i => i.id === 'baby')?.imageUrl,
    icon: <Star className="text-yellow-400" />,
  },
  {
    date: "July 1996",
    title: "First Brave Steps",
    message: "One small step for you, one giant leap into a life of adventure and discovery.",
    image: PlaceHolderImages.find(i => i.id === 'toddler')?.imageUrl,
    icon: <Camera className="text-blue-400" />,
  },
  {
    date: "September 2001",
    title: "Learning and Growing",
    message: "Off to school with a backpack full of dreams and a heart full of curiosity.",
    image: PlaceHolderImages.find(i => i.id === 'school')?.imageUrl,
    icon: <Gift className="text-pink-400" />,
  },
  {
    date: "May 2013",
    title: "The Big Milestone",
    message: "Caps in the air! You proved that with dedication, no dream is too big to achieve.",
    image: PlaceHolderImages.find(i => i.id === 'teen')?.imageUrl,
    icon: <PartyPopper className="text-purple-400" />,
  },
  {
    date: "Today",
    title: "Celebrating YOU!",
    message: "Another year of making memories, chasing dreams, and being your amazing self. Happy Birthday!",
    image: PlaceHolderImages.find(i => i.id === 'cake')?.imageUrl,
    icon: <Cake className="text-red-400" />,
  }
];

export const Timeline = () => {
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative max-w-6xl mx-auto px-4 py-20 overflow-hidden">
      {/* Central Timeline Line */}
      <div 
        ref={lineRef}
        className="absolute left-1/2 transform -translate-x-1/2 w-1 timeline-line h-full z-0 opacity-50 hidden md:block"
      />

      <div className="space-y-32 relative z-10">
        {timelineData.map((event, index) => (
          <div 
            key={index} 
            className={`flex flex-col md:flex-row items-center justify-between group reveal-on-scroll ${
              index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
            }`}
          >
            {/* Card Content */}
            <div className="w-full md:w-[45%]">
              <EventCard 
                title={event.title}
                date={event.date}
                message={event.message}
                imageUrl={event.image || ''}
                icon={event.icon}
              />
            </div>

            {/* Timeline Dot */}
            <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center w-12 h-12 rounded-full bg-white border-4 border-primary shadow-xl z-20 transition-all duration-300 group-hover:scale-125 bg-background">
              <div className="w-4 h-4 rounded-full bg-secondary animate-pulse" />
            </div>

            {/* Spacer */}
            <div className="w-full md:w-[45%] flex items-center justify-center p-8">
              <div className="w-full h-48 md:h-64" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
