
"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Trash2, Upload, Image as ImageIcon, Move, ZoomIn, Square, Circle } from 'lucide-react';
import Image from 'next/image';
import { Firestore, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MemoryEditorListProps {
  events: any[] | null;
  isLoading: boolean;
  pageId: string;
  db: Firestore | null;
  onFieldFocus?: (eventId: string, field: 'title' | 'message') => void;
}

function MemoryItemEditor({ 
  event, 
  index,
  pageId, 
  db, 
  onFieldFocus 
}: { 
  event: any, 
  index: number,
  pageId: string, 
  db: Firestore | null,
  onFieldFocus?: (eventId: string, field: 'title' | 'message') => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [localFraming, setLocalFraming] = useState({
    zoom: event.imageZoom || 1,
    x: event.imageX || 0,
    y: event.imageY || 0
  });

  const [isInteracting, setIsInteracting] = useState(false);
  const interactionRef = useRef({ 
    lastX: 0, 
    lastY: 0, 
    lastDist: 0,
    isPinching: false 
  });

  useEffect(() => {
    setLocalFraming({
      zoom: event.imageZoom || 1,
      x: event.imageX || 0,
      y: event.imageY || 0
    });
  }, [event.imageZoom, event.imageX, event.imageY]);

  const handleUpdateEvent = useCallback((updates: any) => {
    if (!db) return;
    const eventRef = doc(db, 'celebrationPages', pageId, 'birthdayEvents', event.id);
    updateDocumentNonBlocking(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }, [db, pageId, event.id]);

  const isPlaceholder = event.imageUrl?.includes('picsum.photos/seed/placeholder');

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isPlaceholder) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomStep = 0.1;
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;
      
      setLocalFraming(prev => {
        const nextZoom = Math.min(Math.max(prev.zoom + delta, 1), 5);
        return { ...prev, zoom: nextZoom };
      });
    };

    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [isPlaceholder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localFraming.zoom !== event.imageZoom) {
        handleUpdateEvent({ imageZoom: localFraming.zoom });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localFraming.zoom, event.imageZoom, handleUpdateEvent]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please choose an image under 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleUpdateEvent({ imageUrl: reader.result as string });
        toast({ title: "Image Updated", description: "The memory photo has been changed." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteEvent = () => {
    if (!db) return;
    const eventRef = doc(db, 'celebrationPages', pageId, 'birthdayEvents', event.id);
    deleteDocumentNonBlocking(eventRef);
    toast({ title: "Memory Removed", description: "The memory has been deleted." });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPlaceholder) return;
    setIsInteracting(true);
    interactionRef.current.lastX = e.clientX;
    interactionRef.current.lastY = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteracting || interactionRef.current.isPinching) return;
    
    const dx = e.clientX - interactionRef.current.lastX;
    const dy = e.clientY - interactionRef.current.lastY;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const sensitivity = 1 / (localFraming.zoom || 1);
      const pctX = (dx / rect.width) * 100 * sensitivity;
      const pctY = (dy / rect.height) * 100 * sensitivity;
      
      setLocalFraming(prev => ({
        ...prev,
        x: Math.min(Math.max(prev.x + pctX, -100), 100),
        y: Math.min(Math.max(prev.y + pctY, -100), 100)
      }));
    }
    
    interactionRef.current.lastX = e.clientX;
    interactionRef.current.lastY = e.clientY;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isInteracting) return;
    setIsInteracting(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    handleUpdateEvent({ 
      imageX: localFraming.x, 
      imageY: localFraming.y,
      imageZoom: localFraming.zoom 
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      interactionRef.current.isPinching = true;
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      
      if (interactionRef.current.lastDist > 0) {
        const delta = (dist - interactionRef.current.lastDist) / 100;
        const nextZoom = Math.min(Math.max(localFraming.zoom + delta, 1), 5);
        setLocalFraming(prev => ({ ...prev, zoom: nextZoom }));
      }
      interactionRef.current.lastDist = dist;
    }
  };

  const handleTouchEnd = () => {
    if (interactionRef.current.isPinching) {
      interactionRef.current.isPinching = false;
      interactionRef.current.lastDist = 0;
      handleUpdateEvent({ imageZoom: localFraming.zoom });
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (isPlaceholder) {
      fileInputRef.current?.click();
    }
  };

  const toggleCornerStyle = () => {
    const nextStyle = event.cornerStyle === 'angled' ? 'rounded' : 'angled';
    handleUpdateEvent({ cornerStyle: nextStyle });
  };

  return (
    <Card className="rounded-[1.5rem] overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-card">
      <div className="flex flex-col md:flex-row h-full">
        <div 
          ref={containerRef}
          className={cn(
            "relative w-full md:w-48 h-48 md:h-auto overflow-hidden bg-muted touch-none select-none",
            isPlaceholder ? "cursor-pointer" : "cursor-move"
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleContainerClick}
        >
          <div className="relative w-full h-full overflow-hidden pointer-events-none">
            {event.imageUrl ? (
              <Image 
                src={event.imageUrl} 
                alt={event.title} 
                fill 
                className={cn(
                  "object-cover",
                  !isInteracting && "transition-transform duration-300"
                )}
                style={{
                  transform: `scale(${localFraming.zoom}) translate(${localFraming.x}%, ${localFraming.y}%)`
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImageIcon className="h-6 w-6" />
                <span className="text-[9px] font-bold uppercase tracking-widest">No Image</span>
              </div>
            )}
          </div>

          <div className={cn(
            "absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity pointer-events-none",
            isPlaceholder ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <div className="flex flex-col items-center gap-2 text-white">
              {isPlaceholder ? (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Click to Upload</span>
                </>
              ) : (
                <>
                  <div className="flex gap-4">
                    <Move className="h-5 w-5 opacity-80" />
                    <ZoomIn className="h-5 w-5 opacity-80" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Drag to Pan • Scroll to Zoom</span>
                </>
              )}
            </div>
          </div>

          {!isPlaceholder && (
             <Button 
                variant="outline" 
                size="sm" 
                className="absolute top-2 right-2 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black hover:bg-white/90 hover:text-black text-[10px] font-bold pointer-events-auto shadow-sm border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
             >
               Change Photo
             </Button>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        <CardContent className="p-4 md:p-5 flex-1 space-y-3 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
                Memory #{index + 1}
               </span>
               <div className="space-y-0">
                <div className="relative flex items-center">
                  <input 
                    type="date" 
                    className="border-none bg-transparent p-0 h-auto font-bold text-foreground text-xs focus-visible:ring-0 shadow-none cursor-pointer outline-none block dark:text-white"
                    value={event.eventDate}
                    onChange={(e) => handleUpdateEvent({ eventDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 transition-colors",
                  event.cornerStyle === 'angled' ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
                onClick={toggleCornerStyle}
                title={event.cornerStyle === 'angled' ? "Switch to Rounded Corners" : "Switch to Angled Corners"}
              >
                {event.cornerStyle === 'angled' ? <Square className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-destructive transition-colors h-7 w-7"
                onClick={handleDeleteEvent}
                title="Delete Memory"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-40">Memory Title</Label>
            <Input 
              placeholder="e.g. First Steps" 
              style={{ fontFamily: event.titleFont || 'inherit' }}
              className="border-none bg-transparent p-0 h-auto text-xl font-headline font-bold focus-visible:ring-0 shadow-none"
              value={event.title}
              onFocus={() => onFieldFocus?.(event.id, 'title')}
              onChange={(e) => handleUpdateEvent({ title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-40">The Story</Label>
            <Textarea 
              placeholder="Tell the story of this moment..." 
              style={{ fontFamily: event.messageFont || 'inherit' }}
              className="border-none bg-transparent p-0 h-auto min-h-[40px] italic text-muted-foreground focus-visible:ring-0 shadow-none resize-none leading-relaxed text-sm"
              value={event.message}
              onFocus={() => onFieldFocus?.(event.id, 'message')}
              onChange={(e) => handleUpdateEvent({ message: e.target.value })}
            />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function MemoryEditorList({ events, isLoading, pageId, db, onFieldFocus }: MemoryEditorListProps) {
  if (isLoading) return <div className="text-center py-10">Loading events...</div>;
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-20 bg-card/50 rounded-[3rem] border-2 border-dashed border-muted">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
        <p className="text-muted-foreground">Your timeline is empty. Click "Add Card" to begin!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-140px)] -mx-4 px-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 py-2 px-2">
        {events.map((event, index) => (
          <MemoryItemEditor 
            key={event.id} 
            index={index}
            event={event} 
            pageId={pageId} 
            db={db} 
            onFieldFocus={onFieldFocus}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
