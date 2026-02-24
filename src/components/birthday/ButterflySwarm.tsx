
"use client";

import React, { useEffect, useState } from 'react';
import { ThreeDecoration } from './ThreeDecoration';

interface Candle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
}

export const ButterflySwarm = ({ theme = 'light' }: { theme?: 'light' | 'candle-light' }) => {
  const [candles, setCandles] = useState<Candle[]>(() => {
    // 3 XL, 3 Large, 2 Medium, 2 Small = 10 total
    const configs = [
      { s: 220, speed: 0.02 }, { s: 220, speed: 0.02 }, { s: 220, speed: 0.02 }, // XL
      { s: 150, speed: 0.035 }, { s: 150, speed: 0.035 }, { s: 150, speed: 0.035 }, // Large
      { s: 90, speed: 0.05 }, { s: 90, speed: 0.05 },   // Medium
      { s: 50, speed: 0.07 }, { s: 50, speed: 0.07 }    // Small
    ];
    
    return configs.map((cfg, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: cfg.s,
      speedX: (Math.random() - 0.5) * cfg.speed,
      speedY: (Math.random() - 0.5) * cfg.speed,
    }));
  });

  useEffect(() => {
    if (theme !== 'candle-light') return;

    const interval = setInterval(() => {
      setCandles(prev => prev.map(c => {
        let newX = c.x + c.speedX;
        let newY = c.y + c.speedY;
        let newSpeedX = c.speedX;
        let newSpeedY = c.speedY;

        // Bounce off edges
        if (newX < -15 || newX > 115) newSpeedX *= -1;
        if (newY < -15 || newY > 115) newSpeedY *= -1;

        // Randomly change direction slightly
        if (Math.random() < 0.015) {
          const baseSpeed = c.size > 150 ? 0.02 : c.size > 100 ? 0.035 : 0.06;
          newSpeedX = (Math.random() - 0.5) * baseSpeed;
          newSpeedY = (Math.random() - 0.5) * baseSpeed;
        }

        return { ...c, x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [theme]);

  if (theme !== 'candle-light') return null;

  return (
    // Set z-index to 0 to stay behind all other content
    <div className="fixed inset-0 pointer-events-none z-0">
      {candles.map(c => (
        <div 
          key={c.id}
          className="absolute transition-all duration-500 ease-linear"
          style={{ 
            left: `${c.x}%`, 
            top: `${c.y}%`,
            width: `${c.size}px`,
            height: `${c.size}px`,
            opacity: 0.95
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
