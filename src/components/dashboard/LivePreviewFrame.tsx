
"use client";

import React, { useRef, useState, useEffect } from 'react';

interface LivePreviewFrameProps {
  url: string;
}

export function LivePreviewFrame({ url }: LivePreviewFrameProps) {
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return;
      // Get the full container width
      const containerWidth = previewContainerRef.current.offsetWidth;
      // Subtract padding (p-3 is 12px on each side = 24px total)
      const availableWidth = containerWidth - 24;
      // Base simulation width is 1200px
      const newScale = availableWidth / 1200;
      setPreviewScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Calculate scaled height to maintain the 16:10 aspect ratio of the simulation
  const scaledHeight = 800 * previewScale;

  return (
    <div className="w-full flex flex-col items-center">
      {/* Simulation Container with "Extra Display Border" */}
      <div 
        ref={previewContainerRef}
        className="w-full bg-black rounded-[2.5rem] p-3 shadow-2xl border-[12px] border-primary/20 relative isolate transition-all duration-500 overflow-hidden"
        style={{ 
          height: `${scaledHeight + 24}px`, // Adjusted for the 12px border on top and bottom
          // Critical fix for Webkit clipping bug with scaled content in rounded containers
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          maskImage: 'radial-gradient(white, black)'
        }}
      >
        <div 
          className="absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left bg-white rounded-[1.5rem] overflow-hidden shadow-inner"
          style={{ 
            transform: `scale(${previewScale})`,
            // Since it is absolute top-0 left-0 inside a container with p-3,
            // it starts exactly at the inner edge of the black padding.
          }}
        >
          <iframe 
            src={url} 
            className="w-full h-full border-none"
            title="Live Preview"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen"
          />
        </div>
      </div>
      
      {/* Small indicator label */}
      <div className="mt-4 flex items-center gap-2 opacity-40">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Desktop Preview Mode</span>
      </div>
    </div>
  );
}
