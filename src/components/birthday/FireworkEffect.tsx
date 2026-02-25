
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

    fireworksRef.current = new Fireworks(containerRef.current, {
      autoresize: true,
      opacity: 0.5,
      acceleration: 1.00,
      friction: 0.97,
      gravity: 1.5,
      particles: 50,
      traceLength: 7,
      traceSpeed: 6,
      explosion: 7,
      intensity: 15,
      flickering: 50,
      lineStyle: 'round',
      hue: {
        min: 0,
        max: 360
      },
      delay: {
        min: 25,
        max: 30
      },
      rocketsPoint: {
        min: 50,
        max: 50
      },
      lineWidth: {
        explosion: {
          min: 2,
          max: 4
        },
        trace: {
          min: 1,
          max: 4
        }
      },
      brightness: {
        min: 50,
        max: 95
      },
      decay: {
        min: 0.015,
        max: 0.03
      },
      mouse: {
        click: true,
        move: false,
        max: 1
      },
      sound: {
        enabled: true,
        volume: {
          min: 10,
          max: 20
        }
      }
    });

    return () => {
      if (fireworksRef.current) {
        fireworksRef.current.stop();
        fireworksRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!fireworksRef.current) return;

    if (enabled) {
      fireworksRef.current.start();
    } else {
      fireworksRef.current.stop();
      fireworksRef.current.clear();
    }
  }, [enabled]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none z-[70] transition-opacity duration-1000"
      style={{ 
        opacity: enabled ? 1 : 0,
        visibility: enabled ? 'visible' : 'hidden',
        width: '100vw',
        height: '100vh',
        background: 'transparent'
      }}
    />
  );
};
