
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Firestore, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Move, ZoomIn, Layers, RotateCw, Trash2, Upload, MousePointer2, ImageIcon, Frame } from 'lucide-react';
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

// Sub-component for individual collage items
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
  const [editMode, setEditMode] = useState<'card' | 'photo'>('card');
  const [isInteracting, setIsInteracting] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (!isSelected) return;
      
      e.preventDefault();
      e.stopPropagation();

      const zoomStep = 0.05;
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;

      if (editMode === 'card') {
        const currentScale = event.canvasScale || 1;
        const newScale = Math.min(Math.max(currentScale + delta, 0.2), 3);
        onUpdate(event.id, { canvasScale: newScale });
      } else {
        const currentZoom = event.imageZoom || 1;
        const newZoom = Math.min(Math.max(currentZoom + delta, 1), 5);
        onUpdate(event.id, { imageZoom: newZoom });
      }
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [event.id, event.canvasScale, event.imageZoom, isSelected, editMode, onUpdate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect(event.id);
    setIsInteracting(true);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: editMode === 'card' ? (event.canvasX || 10) : (event.imageX || 0),
      initialY: editMode === 'card' ? (event.canvasY || 10) : (event.imageY || 0),
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting) return;

    const dx = (e.clientX - dragStartRef.current.x) / scale;
    const dy = (e.clientY - dragStartRef.current.y) / scale;

    if (editMode === 'card') {
      const newX = dragStartRef.current.initialX + (dx / CANVAS_WIDTH * 100);
      const newY = dragStartRef.current.initialY + (dy / CANVAS_HEIGHT * 100);
      onUpdate(event.id, {
        canvasX: Math.min(Math.max(newX, -30), 100),
        canvasY: Math.min(Math.max(newY, -30), 100),
      });
    } else {
      // Image panning sensitivity adjusted by zoom
      const sensitivity = 0.5 / (event.imageZoom || 1);
      const newX = dragStartRef.current.initialX + (dx * sensitivity);
      const newY = dragStartRef.current.initialY + (dy * sensitivity);
      onUpdate(event.id, {
        imageX: Math.min(Math.max(newX, -100), 100),
        imageY: Math.min(Math.max(newY, -100), 100),
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsInteracting(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
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
        "absolute transition-shadow duration-200 cursor-move group touch-none",
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
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="relative aspect-square bg-white p-3 shadow-xl rounded-sm group">
        <div className="relative w-full h-full overflow-hidden bg-muted rounded-sm">
          <Image 
            src={event.imageUrl} 
            alt={event.title} 
            fill 
            className={cn(
              "object-cover pointer-events-none",
              !isInteracting && "transition-transform duration-300"
            )}
            style={{
              transform: `scale(${event.imageZoom || 1}) translate(${event.imageX || 0}%, ${event.imageY || 0}%)`
            }}
          />
        </div>
        
        {/* Selection Toolbar */}
        <div className={cn(
          "absolute -top-16 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-1.5 flex items-center gap-1.5 transition-all duration-300 z-50",
          isSelected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            <Button 
              variant={editMode === 'card' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              onClick={(e) => { e.stopPropagation(); setEditMode('card'); }}
            >
              <Frame className="h-3 w-3 mr-1.5" /> Move
            </Button>
            <Button 
              variant={editMode === 'photo' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider"
              onClick={(e) => { e.stopPropagation(); setEditMode('photo'); }}
            >
              <ImageIcon className="h-3 w-3 mr-1.5" /> Photo
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border mx-1" />

          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Bring to Front" onClick={(e) => { e.stopPropagation(); bringToFront(); }}>
            <Layers className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Rotate" onClick={(e) => { e.stopPropagation(); rotate(); }}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Change Image" onClick={(e) => { e.stopPropagation(); onFileSelect(); }}>
            <Upload className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 px-1 pb-2 select-none">
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
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <MousePointer2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">Click to select & drag</span>
          </div>
          <div className="flex items-center gap-2">
            <ZoomIn className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">Scroll to zoom</span>
          </div>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
      </div>

      <div 
        ref={containerRef}
        className="w-full bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] relative shadow-inner overflow-hidden border-8 border-slate-200 dark:border-slate-800"
        style={{ height: `${CANVAS_HEIGHT * scale}px` }}
        onClick={() => setSelectedId(null)}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

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
