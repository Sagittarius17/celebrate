"use client";

import React from 'react';
import { ThreeDecoration } from './ThreeDecoration';

interface HeaderProps {
  title?: string;
  occasion?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, occasion = "Celebration" }) => {
  return (
    <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 w-32 h-32 opacity-30 animate-float">
        <ThreeDecoration type="heart" className="w-full h-full" color="#FFD1DC" />
      </div>
      <div className="absolute bottom-20 right-10 w-40 h-40 opacity-30 animate-float delay-1000">
        <ThreeDecoration type="heart" className="w-full h-full" color="#E6E6FA" />
      </div>
      
      <div className="relative z-10 animate-fade-in space-y-6">
        <div className="inline-block px-6 py-2 rounded-full bg-secondary/20 text-secondary-foreground font-bold tracking-widest uppercase text-sm mb-4">
          A special {occasion.toLowerCase()} surprise
        </div>
        <h1 className="font-headline text-7xl md:text-9xl font-extrabold text-foreground leading-tight drop-shadow-sm">
          {title ? (
            <>
              {title.split(',')[0]} <br />
              <span className="text-primary-foreground drop-shadow-xl">{title.split(',')[1] || ''}</span>
            </>
          ) : (
            <>
              Happy <br />
              <span className="text-primary-foreground drop-shadow-xl">{occasion}</span>
            </>
          )}
        </h1>
        <p className="font-body text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
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
