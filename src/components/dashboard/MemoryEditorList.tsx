"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Trash2 } from 'lucide-react';
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

export function MemoryEditorList({ events, isLoading, pageId, db }: MemoryEditorListProps) {
  const { toast } = useToast();

  const handleUpdateEvent = (eventId: string, updates: any) => {
    if (!db) return;
    const eventRef = doc(db, 'celebrationPages', pageId, 'birthdayEvents', eventId);
    updateDocumentNonBlocking(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!db) return;
    const eventRef = doc(db, 'celebrationPages', pageId, 'birthdayEvents', eventId);
    deleteDocumentNonBlocking(eventRef);
    toast({ title: "Memory Removed", description: "The memory has been deleted." });
  };

  if (isLoading) return <div className="text-center py-10">Loading events...</div>;
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-muted">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
        <p className="text-muted-foreground">Your timeline is empty. Upload a photo from the left panel!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-320px)] pr-4">
      <div className="space-y-6 pb-6">
        {events.map((event) => (
          <Card key={event.id} className="rounded-[2rem] overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow group bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row">
              <div className="relative w-full md:w-56 h-56 md:h-auto">
                <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
              </div>
              <CardContent className="p-8 flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 w-full mr-4">
                    <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Date of Memory</Label>
                    <input 
                      type="date" 
                      className="w-full border-none bg-transparent p-0 h-auto font-bold text-primary text-sm focus-visible:ring-0 shadow-none cursor-pointer outline-none"
                      value={event.eventDate}
                      onChange={(e) => handleUpdateEvent(event.id, { eventDate: e.target.value })}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Memory Title</Label>
                  <Input 
                    placeholder="e.g. First Steps" 
                    className="border-none bg-transparent p-0 h-auto text-2xl font-headline font-bold focus-visible:ring-0 shadow-none"
                    value={event.title}
                    onChange={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">The Story</Label>
                  <Textarea 
                    placeholder="Tell the story of this moment..." 
                    className="border-none bg-transparent p-0 h-auto min-h-[60px] italic text-muted-foreground focus-visible:ring-0 shadow-none resize-none leading-relaxed"
                    value={event.message}
                    onChange={(e) => handleUpdateEvent(event.id, { message: e.target.value })}
                  />
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}