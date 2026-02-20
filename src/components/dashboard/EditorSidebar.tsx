
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutTemplate, Quote, Save } from 'lucide-react';
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
  customQuote: string;
  setCustomQuote: (val: string) => void;
  onSaveQuote: () => void;
  isSavingQuote: boolean;
}

export function EditorSidebar({
  page,
  pageRef,
  db,
  customQuote,
  setCustomQuote,
  onSaveQuote,
  isSavingQuote
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
