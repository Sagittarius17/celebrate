"use client";

import React, { useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import { Firestore, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

interface MemoryEditorListProps {
  events: any[] | null;
  isLoading: boolean;
  pageId: string;
  db: Firestore | null;
}

function MemoryItemEditor({ event, pageId, db }: { event: any, pageId: string, db: Firestore | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  return (
    <Card className="rounded-[2rem] overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow group bg-card">
      <div className="flex flex-col md:flex-row">
        <div 
          className="relative w-full md:w-56 h-56 md:h-auto group cursor-pointer overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
          title="Click to change photo"
        >
          <Image src={event.imageUrl} alt={event.title} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="h-6 w-6 text-white mb-2" />
            <span className="text-white text-[10px] font-bold uppercase tracking-widest">Change Photo</span>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>
        <CardContent className="p-8 flex-1 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1 w-full mr-4">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Date of Memory</Label>
              <input 
                type="date" 
                className="w-full border-none bg-transparent p-0 h-auto font-bold text-foreground text-sm focus-visible:ring-0 shadow-none cursor-pointer outline-none block"
                value={event.eventDate}
                onChange={(e) => handleUpdateEvent({ eventDate: e.target.value })}
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
              onClick={handleDeleteEvent}
              title="Delete Memory"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Memory Title</Label>
            <Input 
              placeholder="e.g. First Steps" 
              className="border-none bg-transparent p-0 h-auto text-2xl font-headline font-bold focus-visible:ring-0 shadow-none"
              value={event.title}
              onChange={(e) => handleUpdateEvent({ title: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">The Story</Label>
            <Textarea 
              placeholder="Tell the story of this moment..." 
              className="border-none bg-transparent p-0 h-auto min-h-[60px] italic text-muted-foreground focus-visible:ring-0 shadow-none resize-none leading-relaxed"
              value={event.message}
              onChange={(e) => handleUpdateEvent({ message: e.target.value })}
            />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export function MemoryEditorList({ events, isLoading, pageId, db }: MemoryEditorListProps) {
  if (isLoading) return <div className="text-center py-10">Loading events...</div>;
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-20 bg-card/50 rounded-[3rem] border-2 border-dashed border-muted">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
        <p className="text-muted-foreground">Your timeline is empty. Upload a photo from the left panel!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-320px)] pr-4">
      <div className="space-y-6 pb-6">
        {events.map((event) => (
          <MemoryItemEditor key={event.id} event={event} pageId={pageId} db={db} />
        ))}
      </div>
    </ScrollArea>
  );
}