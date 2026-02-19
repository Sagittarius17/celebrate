
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
}

export const EventCard: React.FC<EventCardProps> = ({ title, date, message, imageUrl, icon }) => {
  return (
    <Card className="overflow-hidden border-none shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/20 bg-white/80 backdrop-blur-sm rounded-[2rem]">
      <div className="relative h-64 w-full">
        <Image 
          src={imageUrl} 
          alt={title}
          fill
          className="object-cover"
          data-ai-hint="celebration photo"
        />
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="px-4 py-1 text-sm font-semibold backdrop-blur-md bg-white/40 border-none">
            {date}
          </Badge>
        </div>
      </div>
      <CardContent className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-primary/20">
            {icon}
          </div>
          <h3 className="font-headline text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h3>
        </div>
        <p className="text-muted-foreground leading-relaxed text-lg font-body italic">
          "{message}"
        </p>
      </CardContent>
    </Card>
  );
};
