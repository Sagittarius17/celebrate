
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  occasion?: string;
  theme?: 'light' | 'candle-light';
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  occasion = "Celebration", 
  theme
}) => {
  const isCandle = theme === 'candle-light';

  const scrollToJourney = () => {
    document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="relative min-h-screen flex flex-col z-10 overflow-visible">
      {/* Main Centered Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 overflow-hidden -mt-20">
        <div className="relative z-30 animate-fade-in space-y-8 flex flex-col items-center">
          <div className="space-y-4">
            <div className={cn(
              "inline-block px-6 py-2 rounded-full font-bold tracking-widest uppercase text-xs sm:text-sm mb-4 transition-colors",
              isCandle ? "bg-primary/20 text-foreground border border-primary/30" : "bg-secondary/20 text-secondary-foreground"
            )}>
              A special {occasion.toLowerCase()} surprise
            </div>
            <h1 className={cn(
              "text-5xl sm:text-7xl md:text-9xl font-extrabold leading-tight drop-shadow-sm px-2 transition-all duration-1000",
              isCandle ? "text-foreground drop-shadow-[0_0_40px_rgba(255,215,0,0.6)]" : "text-foreground"
            )}>
              {title ? (
                <>
                  {title.includes(',') ? (
                    <>
                      {title.split(',')[0]} <br />
                      <span className={isCandle ? "text-primary" : "text-primary-foreground"}>
                        {title.split(',')[1]}
                      </span>
                    </>
                  ) : title}
                </>
              ) : (
                <>
                  Happy <br />
                  <span className={isCandle ? "text-primary" : "text-primary-foreground"}>{occasion}</span>
                </>
              )}
            </h1>
            <p className={cn(
              "text-lg sm:text-xl md:text-2xl max-w-2xl mx-auto leading-relaxed px-4 transition-colors",
              isCandle ? "text-foreground/80" : "text-muted-foreground"
            )}>
              Relive the beautiful moments that shaped an extraordinary life and journey through time together.
            </p>
          </div>
        </div>
      </div>

      <div 
        className="absolute left-[-16] bottom-10 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-30"
        onClick={scrollToJourney}
      >
        <div className={cn(
          "w-8 h-12 border-2 rounded-full flex justify-center p-1 transition-colors",
          isCandle ? "border-primary" : "border-muted-foreground/30"
        )}>
          <div className={cn(
            "w-1 h-3 rounded-full animate-scroll transition-colors",
            isCandle ? "bg-primary" : "bg-muted-foreground/40"
          )} />
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(20px); opacity: 0; }
        }
        .animate-scroll {
          animation: scroll 2s infinite;
        }
      `}</style>
    </header>
  );
};
