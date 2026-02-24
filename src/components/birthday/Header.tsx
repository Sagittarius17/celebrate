
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Flame, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  occasion?: string;
  theme?: 'light' | 'candle-light';
  onToggleTheme?: () => void;
  showFireworks?: boolean;
  onToggleFireworks?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  occasion = "Celebration", 
  theme, 
  onToggleTheme,
  showFireworks,
  onToggleFireworks
}) => {
  const isCandle = theme === 'candle-light';

  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background transition-all duration-1000">
      <div className="absolute top-8 right-8 z-50 flex flex-col gap-4">
        {onToggleTheme && (
          <Button
            onClick={onToggleTheme}
            variant="ghost"
            className="rounded-full w-14 h-14 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-none text-foreground shadow-xl transition-all hover:scale-110 active:scale-90"
            title={isCandle ? "Return to Light Mode" : "Enter Candle-Light Mode"}
          >
            {isCandle ? <Sun className="h-6 w-6 text-yellow-400" /> : <Flame className="h-6 w-6 text-orange-500 fill-orange-500" />}
          </Button>
        )}

        {/* Fireworks button only visible in candle-light theme */}
        {onToggleFireworks && isCandle && (
          <Button
            onClick={onToggleFireworks}
            variant="ghost"
            className={cn(
              "rounded-full w-14 h-14 p-0 backdrop-blur-md border-none transition-all hover:scale-110 active:scale-90 shadow-xl",
              showFireworks 
                ? "bg-primary text-primary-foreground" 
                : "bg-white/10 text-foreground hover:bg-white/20"
            )}
            title={showFireworks ? "Disable Fireworks" : "Enable Fireworks"}
          >
            <Sparkles className={cn("h-6 w-6", showFireworks && "animate-pulse")} />
          </Button>
        )}
      </div>

      <div className="relative z-30 animate-fade-in space-y-6">
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

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce cursor-pointer z-30">
        <div className={cn(
          "w-8 h-12 border-2 rounded-full flex justify-center p-1 transition-colors",
          isCandle ? "border-primary" : "border-primary"
        )}>
          <div className={cn(
            "w-1 h-3 rounded-full animate-scroll transition-colors",
            isCandle ? "bg-primary" : "bg-primary"
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
