
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
      const containerWidth = previewContainerRef.current.offsetWidth;
      const availableWidth = containerWidth - 24;
      const newScale = availableWidth / 1200;
      setPreviewScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const scaledHeight = 800 * previewScale;

  return (
    <div className="w-full flex flex-col items-center">
      <div 
        ref={previewContainerRef}
        className="w-full bg-black rounded-[2.5rem] p-3 shadow-2xl border-[12px] border-primary/20 relative isolate transition-all duration-500 overflow-hidden"
        style={{ 
          height: `${scaledHeight + 24}px`,
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
          maskImage: 'radial-gradient(white, black)'
        }}
      >
        <div 
          className="absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left bg-white rounded-[1.5rem] overflow-hidden shadow-inner"
          style={{ 
            transform: `scale(${previewScale})`,
          }}
        >
          {/* CRITICAL: Explicitly allow autoplay on the preview frame so the soundtrack works in the editor */}
          <iframe 
            src={url} 
            className="w-full h-full border-none"
            title="Live Preview"
            allow="autoplay *; clipboard-write; encrypted-media; fullscreen"
          />
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2 opacity-40">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Desktop Preview Mode</span>
      </div>
    </div>
  );
}
