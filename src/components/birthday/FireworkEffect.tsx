
"use client";

import React, { useEffect, useRef } from 'react';
import { Fireworks } from 'fireworks-js';

interface FireworkEffectProps {
  enabled: boolean;
}

export const FireworkEffect: React.FC<FireworkEffectProps> = ({ enabled }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworksRef = useRef<Fireworks | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize fireworks with more vibrant and widespread settings
    fireworksRef.current = new Fireworks(containerRef.current, {
      autoresize: true,
      opacity: 0.8,
      acceleration: 1.05,
      friction: 0.97,
      gravity: 1.5,
      particles: 100,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 7,
      intensity: 50,
      flicker: 50,
      lineStyle: 'round',
      hue: {
        min: 0,
        max: 360
      },
      delay: {
        min: 15,
        max: 30
      },
      rocketsPoint: {
        min: 0,
        max: 100
      },
      lineWidth: {
        explosion: {
          min: 1,
          max: 4
        },
        trace: {
          min: 1,
          max: 2
        }
      },
      brightness: {
        min: 50,
        max: 90
      },
      decay: {
        min: 0.015,
        max: 0.03
      },
      mouse: {
        click: false,
        move: false,
        max: 1
      }
    });

    return () => {
      fireworksRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      fireworksRef.current?.start();
    } else {
      fireworksRef.current?.stop();
      fireworksRef.current?.clear();
    }
  }, [enabled]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-[60] transition-opacity duration-1000"
      style={{ 
        opacity: enabled ? 1 : 0,
        visibility: enabled ? 'visible' : 'hidden'
      }}
    />
  );
};
