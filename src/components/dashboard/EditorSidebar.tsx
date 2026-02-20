"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, LayoutTemplate, Quote, Upload, Save } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DocumentReference, Firestore } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

const FONTS = [
  "Playfair Display", "PT Sans", "Montserrat", "Lora", "Quicksand", 
  "Merriweather", "Oswald", "Dancing Script", "Caveat", "Pacifico", 
  "Lobster", "Cinzel", "Comfortaa", "Great Vibes", "Sacramento"
];

const LAYOUTS = ["Timeline", "Carousel", "Grid"];

interface EditorSidebarProps {
  page: any;
  pageRef: DocumentReference | null;
  db: Firestore | null;
  selectedImageUrl: string | null;
  onFileClick: () => void;
  onAddEvent: () => void;
  customQuote: string;
  setCustomQuote: (val: string) => void;
  onSaveQuote: () => void;
  isSavingQuote: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function EditorSidebar({
  page,
  pageRef,
  db,
  selectedImageUrl,
  onFileClick,
  onAddEvent,
  customQuote,
  setCustomQuote,
  onSaveQuote,
  isSavingQuote,
  fileInputRef,
  onFileChange
}: EditorSidebarProps) {
  const { toast } = useToast();

  const handleUpdatePage = (updates: any) => {
    if (!db || !pageRef) return;
    updateDocumentNonBlocking(pageRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <ScrollArea className="h-[calc(100vh-320px)] pr-4">
      <div className="space-y-6 pb-6">
        <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-primary/10">
            <CardTitle className="flex items-center gap-2 text-primary-foreground">
              <Plus className="h-5 w-5" /> Add Memory
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-3">
              <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Upload Image</Label>
              <div 
                onClick={onFileClick}
                className={cn(
                  "relative aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-all overflow-hidden",
                  selectedImageUrl && "border-solid border-primary"
                )}
              >
                {selectedImageUrl ? (
                  <>
                    <Image src={selectedImageUrl} alt="Preview" fill className="object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-bold flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Change Photo
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <span className="text-xs font-medium">Choose from device</span>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={onFileChange} 
                />
              </div>
            </div>
            <Button 
              className="w-full rounded-full h-12 shadow-md hover:shadow-lg transition-all" 
              onClick={onAddEvent}
              disabled={!selectedImageUrl}
            >
              <Plus className="mr-2 h-4 w-4" /> Add to Timeline
            </Button>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-accent/10">
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <LayoutTemplate className="h-5 w-5" /> Page Layout & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Choose Layout</Label>
              <select 
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                value={page.layout || 'Timeline'} 
                onChange={(e) => {
                  handleUpdatePage({ layout: e.target.value });
                  toast({ title: "Layout Updated", description: `Switched to ${e.target.value} view.` });
                }}
              >
                {LAYOUTS.map(layout => (
                  <option key={layout} value={layout}>{layout}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Choose Font</Label>
              <select 
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                value={page.font || 'Playfair Display'} 
                onChange={(e) => {
                  handleUpdatePage({ font: e.target.value });
                  toast({ title: "Font Updated", description: `Style changed to ${e.target.value}.` });
                }}
              >
                {FONTS.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-secondary/10">
            <CardTitle className="flex items-center gap-2 text-secondary-foreground">
              <Quote className="h-5 w-5" /> Final Quote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>The Ending Message</Label>
              <Textarea 
                placeholder="A final heart-warming message..." 
                value={customQuote}
                onChange={(e) => setCustomQuote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <Button 
              variant="secondary"
              className="w-full rounded-full" 
              onClick={onSaveQuote}
              disabled={isSavingQuote}
            >
              {isSavingQuote ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Ending</>}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
