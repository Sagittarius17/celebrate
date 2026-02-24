
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
  const [candles, setCandles] = useState<Candle[]>(() => {
    const count = 10;
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.04,
      speedY: (Math.random() - 0.5) * 0.04,
    }));
  });

  useEffect(() => {
    if (theme !== 'candle-light') return;

    const interval = setInterval(() => {
      setCandles(prev => prev.map(b => {
        let newX = b.x + b.speedX;
        let newY = b.y + b.speedY;
        let newSpeedX = b.speedX;
        let newSpeedY = b.speedY;

        if (newX < -10 || newX > 110) newSpeedX *= -1;
        if (newY < -10 || newY > 110) newSpeedY *= -1;

        if (Math.random() < 0.01) {
          newSpeedX = (Math.random() - 0.5) * 0.04;
          newSpeedY = (Math.random() - 0.5) * 0.04;
        }

        return { ...b, x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme !== 'candle-light') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-20">
      {candles.map(c => (
        <div 
          key={c.id}
          className="absolute w-20 h-20 transition-all duration-500 ease-linear"
          style={{ 
            left: `${c.x}%`, 
            top: `${c.y}%`,
            opacity: 0.9
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
