
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Flame } from 'lucide-react';

interface HeaderProps {
  title?: string;
  occasion?: string;
  theme?: 'light' | 'candle-light';
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, occasion = "Celebration", theme, onToggleTheme }) => {
  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background transition-all duration-1000">
      {onToggleTheme && (
        <div className="absolute top-8 right-8 z-50">
          <Button
            onClick={onToggleTheme}
            variant="ghost"
            className="rounded-full w-14 h-14 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-none text-foreground shadow-xl transition-all hover:scale-110 active:scale-90"
            title={theme === 'light' ? "Enter Candle-Light Mode" : "Return to Light Mode"}
          >
            {theme === 'light' ? <Flame className="h-6 w-6 text-orange-500 fill-orange-500" /> : <Sun className="h-6 w-6 text-yellow-400" />}
          </Button>
        </div>
      )}

      <div className="relative z-10 animate-fade-in space-y-6">
        <div className="inline-block px-6 py-2 rounded-full bg-secondary/20 text-secondary-foreground font-bold tracking-widest uppercase text-xs sm:text-sm mb-4">
          A special {occasion.toLowerCase()} surprise
        </div>
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-extrabold text-foreground leading-tight drop-shadow-sm px-2">
          {title ? (
            <>
              {title.includes(',') ? (
                <>
                  {title.split(',')[0]} <br />
                  <span className="text-primary-foreground drop-shadow-xl">{title.split(',')[1]}</span>
                </>
              ) : title}
            </>
          ) : (
            <>
              Happy <br />
              <span className="text-primary-foreground drop-shadow-xl">{occasion}</span>
            </>
          )}
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4">
          Relive the beautiful moments that shaped an extraordinary life and journey through time together.
        </p>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer">
        <div className="w-8 h-12 border-2 border-primary rounded-full flex justify-center p-1">
          <div className="w-1 h-3 bg-primary rounded-full animate-scroll" />
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
