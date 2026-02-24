
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { LayoutTemplate, Quote, Save, Music, Mic, Square, Play, Trash2 } from 'lucide-react';
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
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(page.voiceNoteDataUri || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleUpdatePage = (updates: any) => {
    if (!db || !pageRef) return;
    updateDocumentNonBlocking(pageRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAudioUrl(base64String);
          handleUpdatePage({ voiceNoteDataUri: base64String });
          toast({ title: "Voice Note Recorded", description: "Your message has been saved." });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Microphone Error", 
        description: "Could not access your microphone. Please check permissions." 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const deleteVoiceNote = () => {
    setAudioUrl(null);
    handleUpdatePage({ voiceNoteDataUri: null });
    toast({ title: "Voice Note Removed" });
  };

  return (
    <ScrollArea className="h-[calc(100vh-320px)] -mx-4 px-4">
      <div className="space-y-6 py-4 px-4">
        <Card className="rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-accent/10 py-4">
            <CardTitle className="flex items-center gap-2 text-accent-foreground text-lg">
              <LayoutTemplate className="h-5 w-5" /> Layout & Style
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

        <Card className="rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-primary/10 py-4">
            <CardTitle className="flex items-center gap-2 text-primary-foreground text-lg">
              <Music className="h-5 w-5" /> Spotify Soundtrack
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="spotify">Spotify Track ID</Label>
              <Input 
                id="spotify"
                placeholder="e.g. 4PTG3C64LUButARq9I9Uf8" 
                defaultValue={page.spotifyTrackId || ''}
                onBlur={(e) => {
                  if (e.target.value !== page.spotifyTrackId) {
                    handleUpdatePage({ spotifyTrackId: e.target.value });
                    toast({ title: "Track Updated", description: "Spotify song has been set." });
                  }
                }}
              />
              <p className="text-[10px] text-muted-foreground italic">
                Tip: Copy the track ID from a Spotify Share link.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-orange-500/10 py-4">
            <CardTitle className="flex items-center gap-2 text-orange-600 text-lg">
              <Mic className="h-5 w-5" /> Personal Voice Note
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-3">
              {!isRecording ? (
                <Button 
                  onClick={startRecording} 
                  variant="outline" 
                  className="w-full rounded-full border-dashed border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                >
                  <Mic className="mr-2 h-4 w-4 text-orange-500" /> 
                  {audioUrl ? "Record New Message" : "Record Voice Note"}
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording} 
                  variant="destructive" 
                  className="w-full rounded-full animate-pulse"
                >
                  <Square className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
              )}

              {audioUrl && !isRecording && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-2xl border border-dashed">
                  <div className="flex-1 flex items-center gap-2 pl-2">
                    <Play className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Message Saved</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={deleteVoiceNote}
                    className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-lg border-none overflow-hidden bg-card">
          <CardHeader className="bg-secondary/10 py-4">
            <CardTitle className="flex items-center gap-2 text-secondary-foreground text-lg">
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
