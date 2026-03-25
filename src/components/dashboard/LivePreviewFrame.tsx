"use client";

import React, { useRef, useState, useEffect } from 'react';

interface LivePreviewFrameProps {
  url: string;
}

export function LivePreviewFrame({ url }: LivePreviewFrameProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const [dimensions, setLocalDimensions] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      
      const containerWidth = previewContainerRef.current.offsetWidth;
      const containerHeight = window.innerHeight - 220; // Estimate available height after header/padding
      
      const widthScale = (containerWidth - 48) / 1200;
      const heightScale = containerHeight / 800;
      
      // Fit to screen: Choose the smaller scale to ensure it's fully visible
      const newScale = Math.min(widthScale, heightScale, 1.2);
      setPreviewScale(newScale > 0.3 ? newScale : 0.3); // Don't go too small
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const scaledHeight = 800 * previewScale;
  const scaledWidth = 1200 * previewScale;

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[400px]">
      <div 
        ref={previewContainerRef}
        className="w-full bg-black/90 dark:bg-black rounded-[3rem] p-4 shadow-2xl border-[12px] border-primary/10 relative isolate transition-all duration-500 overflow-hidden flex items-center justify-center"
        style={{ 
          height: `${scaledHeight + 48}px`,
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          maskImage: 'radial-gradient(white, black)'
        }}
      >
        <div 
          className="absolute origin-center bg-white rounded-2xl overflow-hidden shadow-2xl"
          style={{ 
            width: '1200px',
            height: '800px',
            transform: `scale(${previewScale})`,
          }}
        >
          <iframe 
            src={url} 
            className="w-full h-full border-none"
            title="Live Preview"
            allow="autoplay; encrypted-media"
          />
        </div>
      </div>
      
      <div className="mt-6 flex items-center gap-3 opacity-50 bg-secondary/10 px-4 py-1.5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Smart-Fit Preview Enabled</span>
      </div>
    </div>
  );
}
