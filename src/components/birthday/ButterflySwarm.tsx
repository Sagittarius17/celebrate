
"use client";

import React, { useEffect, useState } from 'react';
import { ThreeDecoration } from './ThreeDecoration';

const BUTTERFLY_COLORS = ['#FFD1DC', '#E6E6FA', '#B0E0E6', '#FFF0F5', '#F0E68C'];

interface Butterfly {
  id: number;
  type: 'butterfly' | 'candle';
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  color: string;
}

export const ButterflySwarm = ({ theme = 'light' }: { theme?: 'light' | 'candle-light' }) => {
  const [butterflies, setButterflies] = useState<Butterfly[]>([]);

  useEffect(() => {
    const count = 12;
    const initial = Array.from({ length: count }).map((_, i) => ({
      id: i,
      type: i % 3 === 0 && theme === 'candle-light' ? 'candle' : 'butterfly' as 'butterfly' | 'candle',
      x: Math.random() * 100,
      y: Math.random() * 100,
      speedX: (Math.random() - 0.5) * 0.1,
      speedY: (Math.random() - 0.5) * 0.1,
      color: BUTTERFLY_COLORS[i % BUTTERFLY_COLORS.length]
    }));
    setButterflies(initial);

    const interval = setInterval(() => {
      setButterflies(prev => prev.map(b => {
        let newX = b.x + b.speedX;
        let newY = b.y + b.speedY;
        let newSpeedX = b.speedX;
        let newSpeedY = b.speedY;

        if (newX < -10 || newX > 110) newSpeedX *= -1;
        if (newY < -10 || newY > 110) newSpeedY *= -1;

        // Occasional random turn
        if (Math.random() < 0.02) {
          newSpeedX = (Math.random() - 0.5) * 0.1;
          newSpeedY = (Math.random() - 0.5) * 0.1;
        }

        return { ...b, x: newX, y: newY, speedX: newSpeedX, speedY: newSpeedY };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, [theme]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {butterflies.map(b => (
        <div 
          key={b.id}
          className="absolute w-20 h-20 transition-all duration-500 ease-linear"
          style={{ 
            left: `${b.x}%`, 
            top: `${b.y}%`,
            opacity: theme === 'candle-light' ? 0.6 : 0.4
          }}
        >
          <ThreeDecoration 
            type={b.type} 
            color={b.color} 
            className="w-full h-full" 
          />
        </div>
      ))}
    </div>
  );
};
