"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Quote as QuoteIcon, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FinalMessageProps {
  isVisible: boolean;
  recipientName: string;
  quote: string;
  creatorName: string;
}

export function FinalMessage({ isVisible, recipientName, quote, creatorName }: FinalMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center pt-16 relative">
      <div className={cn(
        "relative transition-all duration-1000 transform w-full max-w-2xl flex flex-col items-center px-4",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"
      )}>
        <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-white/95 backdrop-blur-md relative z-20 w-full mb-12">
          <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
          
          <CardContent className="p-8 sm:p-12 text-center space-y-4 sm:space-y-6 pt-12 sm:pt-16">
            <QuoteIcon className="w-10 h-10 sm:w-12 sm:h-12 text-secondary/30 mx-auto mb-2 sm:mb-4" />
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
              To Many More Years of Joy, {recipientName}!
            </h3>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground italic leading-relaxed">
              "{quote}"
            </p>
            <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <span className="text-secondary text-lg">❤️</span>
              <div className="h-px w-12 sm:w-20 bg-secondary/20" />
              <span className="text-secondary text-lg">❤️</span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center pb-8">
          <p className="text-sm font-medium text-muted-foreground/60 flex items-center gap-1.5">
            Created with love by <span className="text-foreground font-bold">{creatorName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}