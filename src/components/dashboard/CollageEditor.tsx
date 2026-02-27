
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Firestore, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Move, ZoomIn, Layers, RotateCw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CollageEditorProps {
  events: any[] | null;
  isLoading: boolean;
  pageId: string;
  db: Firestore | null;
  onFieldFocus?: (eventId: string, field: 'title' | 'message') => void;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1600;

// Sub-component for individual collage items to handle non-passive wheel events
function CollageItem({ 
  event, 
  scale, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onFileSelect 
}: { 
  event: any; 
  scale: number; 
  isSelected: boolean; 
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: any) => void;
  onFileSelect: () => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    // Use a native listener with passive: false to ensure e.preventDefault() works
    // to stop the main page from scrolling while zooming cards.
    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomStep = 0.05;
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      const currentScale = event.canvasScale || 1;
      const newScale = Math.min(Math.max(currentScale + delta, 0.2), 3);
      
      onUpdate(event.id, { canvasScale: newScale });
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [event.id, event.canvasScale, onUpdate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(event.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialCanvasX = event.canvasX || 10;
    const initialCanvasY = event.canvasY || 10;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      
      const newX = (initialCanvasX * CANVAS_WIDTH / 100 + dx) / CANVAS_WIDTH * 100;
      const newY = (initialCanvasY * CANVAS_HEIGHT / 100 + dy) / CANVAS_HEIGHT * 100;

      onUpdate(event.id, {
        canvasX: Math.min(Math.max(newX, -20), 100),
        canvasY: Math.min(Math.max(newY, -20), 100),
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const bringToFront = () => {
    onUpdate(event.id, { isBringingToFront: true });
  };

  const rotate = () => {
    const newRot = ((event.canvasRotation || 0) + 5) % 360;
    onUpdate(event.id, { canvasRotation: newRot });
  };

  const left = (event.canvasX || 10) * scale * CANVAS_WIDTH / 100;
  const top = (event.canvasY || 10) * scale * CANVAS_HEIGHT / 100;
  const baseSize = 300 * scale;
  const currentScale = event.canvasScale || 1;

  return (
    <div
      ref={itemRef}
      className={cn(
        "absolute transition-shadow duration-200 cursor-move group",
        isSelected && "z-[9999!important] ring-4 ring-primary ring-offset-4 rounded-xl"
      )}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        zIndex: event.canvasZIndex || 1,
        width: `${baseSize * currentScale}px`,
        transform: `rotate(${event.canvasRotation || 0}deg)`,
      }}
      onPointerDown={handlePointerDown}
    >
      <div className="relative aspect-square bg-white p-3 shadow-xl rounded-sm group">
        <div className="relative w-full h-full overflow-hidden bg-muted">
          <Image 
            src={event.imageUrl} 
            alt={event.title} 
            fill 
            className="object-cover pointer-events-none"
            style={{
              transform: `scale(${event.imageZoom || 1}) translate(${event.imageX || 0}%, ${event.imageY || 0}%)`
            }}
          />
        </div>
        
        {/* Edit Controls */}
        <div className={cn(
          "absolute -top-12 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-2xl rounded-full px-2 py-1 flex items-center gap-1 transition-all duration-300",
          isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); bringToFront(); }}>
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); rotate(); }}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); onFileSelect(); }}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 px-1 pb-2">
          <h4 className="font-bold text-xs truncate font-headline">{event.title}</h4>
          <p className="text-[10px] text-muted-foreground truncate italic opacity-60">"{event.message}"</p>
        </div>
      </div>
    </div>
  );
}

export function CollageEditor({ events, isLoading, pageId, db, onFieldFocus }: CollageEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth;
      setScale(availableWidth / CANVAS_WIDTH);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleUpdateEvent = useCallback((eventId: string, updates: any) => {
    if (!db) return;

    // Handle bringing to front logic
    if (updates.isBringingToFront) {
      delete updates.isBringingToFront;
      const maxZ = Math.max(...(events?.map(e => e.canvasZIndex || 1) || [1]));
      updates.canvasZIndex = maxZ + 1;
    }

    const eventRef = doc(db, 'celebrationPages', pageId, 'birthdayEvents', eventId);
    updateDocumentNonBlocking(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }, [db, pageId, events]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedId) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Please choose an image under 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateEvent(selectedId, { imageUrl: reader.result as string });
        toast({ title: "Image Updated" });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) return <div className="text-center py-20">Loading canvas...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Move className="h-3 w-3" /> Drag to move</span>
          <span className="flex items-center gap-1"><ZoomIn className="h-3 w-3" /> Scroll to resize card</span>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      <div 
        ref={containerRef}
        className="w-full bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] relative shadow-inner overflow-hidden border-8 border-slate-200 dark:border-slate-800"
        style={{ height: `${CANVAS_HEIGHT * scale}px` }}
        onClick={() => setSelectedId(null)}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        {events?.map((event) => (
          <CollageItem 
            key={event.id}
            event={event}
            scale={scale}
            isSelected={selectedId === event.id}
            onSelect={setSelectedId}
            onUpdate={handleUpdateEvent}
            onFileSelect={() => fileInputRef.current?.click()}
          />
        ))}
      </div>
    </div>
  );
}
