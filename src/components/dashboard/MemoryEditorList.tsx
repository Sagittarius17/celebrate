
"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Trash2, Upload, Image as ImageIcon, Settings2, ZoomIn, Move, RotateCcw } from 'lucide-react';
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

function FramingControls({ event, onUpdate }: { event: any, onUpdate: (updates: any) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
          <Settings2 className="h-3 w-3" /> Photo Framing
        </h4>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-[10px] flex items-center gap-1" 
          onClick={() => onUpdate({ imageZoom: 1, imageX: 0, imageY: 0 })}
        >
          <RotateCcw className="h-2.5 w-2.5" /> Reset
        </Button>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold opacity-60">
            <Label className="text-[10px]">Zoom</Label>
            <span>{Math.round((event.imageZoom || 1) * 100)}%</span>
          </div>
          <Slider 
            value={[event.imageZoom || 1]} 
            min={1} 
            max={3} 
            step={0.05} 
            onValueChange={([val]) => onUpdate({ imageZoom: val })} 
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold opacity-60">
            <Label className="text-[10px]">Horizontal Pan</Label>
            <span>{event.imageX || 0}%</span>
          </div>
          <Slider 
            value={[event.imageX || 0]} 
            min={-50} 
            max={50} 
            step={1} 
            onValueChange={([val]) => onUpdate({ imageX: val })} 
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-bold opacity-60">
            <Label className="text-[10px]">Vertical Pan</Label>
            <span>{event.imageY || 0}%</span>
          </div>
          <Slider 
            value={[event.imageY || 0]} 
            min={-50} 
            max={50} 
            step={1} 
            onValueChange={([val]) => onUpdate({ imageY: val })} 
          />
        </div>
      </div>
    </div>
  );
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
  const { toast } = useToast();
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);

  const handleUpdateEvent = (updates: any) => {
    if (!db) return;
    const eventRef = doc(db, 'celebrationPages', pageId, 'birthdayEvents', event.id);
    updateDocumentNonBlocking(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

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

  const isPlaceholder = event.imageUrl?.includes('picsum.photos/seed/placeholder');

  return (
    <Card className="rounded-[1.5rem] overflow-hidden border-none shadow-sm hover:shadow-md transition-all duration-300 group bg-card">
      <div className="flex flex-col md:flex-row h-full">
        {/* Image Section */}
        <div className="relative w-full md:w-48 h-48 md:h-auto overflow-hidden bg-muted">
          <div 
            className="relative w-full h-full cursor-pointer group/img"
            onClick={() => fileInputRef.current?.click()}
          >
            {event.imageUrl ? (
              <div className="relative w-full h-full overflow-hidden">
                <Image 
                  src={event.imageUrl} 
                  alt={event.title} 
                  fill 
                  className="object-cover transition-transform duration-300"
                  style={{
                    transform: `scale(${event.imageZoom || 1}) translate(${event.imageX || 0}%, ${event.imageY || 0}%)`
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <ImageIcon className="h-6 w-6" />
                <span className="text-[9px] font-bold uppercase tracking-widest">No Image</span>
              </div>
            )}
            
            <div className={cn(
              "absolute inset-0 bg-black/40 flex flex-col items-center justify-center transition-opacity",
              isPlaceholder ? "opacity-100" : "opacity-0 group-hover/img:opacity-100"
            )}>
              <Upload className="h-5 w-5 text-white mb-1" />
              <span className="text-white text-[9px] font-bold uppercase tracking-widest">
                {isPlaceholder ? "Upload Photo" : "Change Photo"}
              </span>
            </div>
          </div>

          {/* Edit Photo Trigger - Mobile uses local state toggle, Desktop uses Popover */}
          {event.imageUrl && !isPlaceholder && (
            <>
              {/* Desktop Popover Trigger */}
              <div className="hidden md:block">
                <Popover open={isEditingPhoto} onOpenChange={setIsEditingPhoto}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white text-primary border-none"
                      title="Edit Photo Framing"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingPhoto(true);
                      }}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-4 rounded-2xl shadow-2xl" side="right" align="end">
                    <FramingControls event={event} onUpdate={handleUpdateEvent} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mobile Toggle Trigger */}
              <div className="md:hidden">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className={cn(
                    "absolute bottom-2 right-2 h-8 w-8 rounded-full shadow-lg transition-all border-none",
                    isEditingPhoto ? "bg-primary text-primary-foreground" : "bg-white/90 text-primary"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingPhoto(!isEditingPhoto);
                  }}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        {/* Mobile-Only Framing Area (Shown BELOW photo on mobile) */}
        {isEditingPhoto && (
          <div className="md:hidden p-4 bg-muted/20 border-b animate-in slide-in-from-top-2">
            <FramingControls event={event} onUpdate={handleUpdateEvent} />
          </div>
        )}

        {/* Content Section */}
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
