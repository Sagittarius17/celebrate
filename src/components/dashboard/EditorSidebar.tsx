
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
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
    <ScrollArea className="h-[calc(100vh-320px)] -mx-4 px-4">
      <div className="space-y-8 py-8 px-4">
        <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-accent/10">
            <CardTitle className="flex items-center gap-2 text-accent-foreground">
              <LayoutTemplate className="h-5 w-5" /> Page Layout & Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label>Choose Layout</Label>
              <Select 
                value={page.layout || 'Timeline'} 
                onValueChange={(val) => {
                  handleUpdatePage({ layout: val });
                  toast({ title: "Layout Updated", description: `Switched to ${val} view.` });
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border border-input bg-background">
                  <SelectValue placeholder="Select layout" />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUTS.map(layout => (
                    <SelectItem key={layout} value={layout}>{layout}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Choose Font</Label>
              <Select 
                value={page.font || 'Playfair Display'} 
                onValueChange={(val) => {
                  handleUpdatePage({ font: val });
                  toast({ title: "Font Updated", description: `Style changed to ${val}.` });
                }}
              >
                <SelectTrigger className="w-full h-10 rounded-xl border border-input bg-background">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map(font => (
                    <SelectItem key={font} value={font}>
                      <span style={{ fontFamily: font }} className="text-lg">{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
