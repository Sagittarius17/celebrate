
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
      // Use 1200 as base width for the preview
      const newScale = containerWidth / 1200;
      setPreviewScale(newScale);
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Calculate scaled height to prevent extra white space
  const scaledHeight = 800 * previewScale;

  return (
    <div 
      ref={previewContainerRef}
      className="w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-primary/20 relative"
      style={{ height: `${scaledHeight}px` }}
    >
      <div 
        className="absolute top-0 left-0 w-[1200px] h-[800px] origin-top-left"
        style={{ 
          transform: `scale(${previewScale})`,
        }}
      >
        <iframe 
          src={url} 
          className="w-full h-full border-none"
          title="Live Preview"
        />
      </div>
    </div>
  );
}
