
"use client";

import React, { useEffect, useState } from 'react';
import { ThreeDecoration } from './ThreeDecoration';

interface Candle {
  id: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
}

export const ButterflySwarm = ({ theme = 'light' }: { theme?: 'light' | 'candle-light' }) => {
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    // Only initialize exactly 12 candles once
    const count = 12;
    const initial = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.05,
      speedY: (Math.random() - 0.5) * 0.05,
    }));
    setCandles(initial);

    const interval = setInterval(() => {
      setCandles(prev => prev.map(b => {
        let newX = b.x + b.speedX;
        let newY = b.y + b.speedY;
        let newSpeedX = b.speedX;
        let newSpeedY = b.speedY;

        // Bounce off edges
        if (newX < -5 || newX > 105) newSpeedX *= -1;
        if (newY < -5 || newY > 105) newSpeedY *= -1;

        // Occasional random turn
        if (Math.random() < 0.01) {
          newSpeedX = (Math.random() - 0.5) * 0.05;
          newSpeedY = (Math.random() - 0.5) * 0.05;
        }

        return { ...b, x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Hide 3D models in light theme per user request
  if (theme !== 'candle-light') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {candles.map(b => (
        <div 
          key={b.id}
          className="absolute w-24 h-24 transition-all duration-500 ease-linear"
          style={{ 
            left: `${b.x}%`, 
            top: `${b.y}%`,
            opacity: 0.8
          }}
        >
          <ThreeDecoration 
            type="candle" 
            className="w-full h-full" 
          />
        </div>
      ))}
    </div>
  );
};
