
"use client";

import React, { useState, useRef, useEffect } from 'react';
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
import { LayoutTemplate, Quote, Save, Music, Mic, Square, Play, Trash2, Clock } from 'lucide-react';
import { DocumentReference, Firestore } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { SpotifySearch } from '@/components/dashboard/SpotifySearch';

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

const extractSpotifyTrackId = (input: string) => {
  if (!input) return '';
  const urlMatch = input.match(/\/track\/([a-zA-Z0-9]{22})/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  const uriMatch = input.match(/spotify:track:([a-zA-Z0-9]{22})/);
  if (uriMatch && uriMatch[1]) return uriMatch[1];
  return input.trim();
};

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
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(page.voiceNoteDataUri || null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
          const finalDuration = recordingTimeRef.current;
          setRecordedDuration(finalDuration);
          handleUpdatePage({ 
            voiceNoteDataUri: base64String,
            voiceNoteDuration: finalDuration
          });
          toast({ title: "Voice Note Recorded" });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0;
      setRecordedDuration(null);
      timerRef.current = setInterval(() => {
        recordingTimeRef.current += 1;
        setRecordingTime(recordingTimeRef.current);
      }, 1000);
    } catch (err) {
      toast({ 
        variant: "destructive", 
        title: "Microphone Error", 
        description: "Could not access microphone." 
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteVoiceNote = () => {
    setAudioUrl(null);
    setRecordedDuration(null);
    handleUpdatePage({ voiceNoteDataUri: null, voiceNoteDuration: null });
    toast({ title: "Voice Note Removed" });
  };

  const displayDuration = recordedDuration !== null ? recordedDuration : page.voiceNoteDuration;

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
              <Select value={page.layout || 'Timeline'} onValueChange={(val) => handleUpdatePage({ layout: val })}>
                <SelectTrigger className="w-full h-10 rounded-xl"><SelectValue placeholder="Select layout" /></SelectTrigger>
                <SelectContent>{LAYOUTS.map(layout => <SelectItem key={layout} value={layout}>{layout}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Choose Font</Label>
              <Select value={page.font || 'Playfair Display'} onValueChange={(val) => handleUpdatePage({ font: val })}>
                <SelectTrigger className="w-full h-10 rounded-xl"><SelectValue placeholder="Select font" /></SelectTrigger>
                <SelectContent>{FONTS.map(font => <SelectItem key={font} value={font}><span style={{ fontFamily: font }} className="text-lg">{font}</span></SelectItem>)}</SelectContent>
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
              <Label>Spotify Track ID or URL</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. Track ID or Spotify Link" value={page.spotifyTrackId || ''} onChange={(e) => handleUpdatePage({ spotifyTrackId: extractSpotifyTrackId(e.target.value) })} />
                <SpotifySearch onSelect={(track) => handleUpdatePage({ spotifyTrackId: track.trackId })} />
              </div>
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
                <Button onClick={startRecording} variant="outline" className="w-full rounded-full border-dashed border-orange-200 h-12">
                  <Mic className="mr-2 h-4 w-4 text-orange-500" /> {audioUrl ? "Record New Message" : "Record Voice Note"}
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="w-full rounded-full animate-pulse h-12">
                  <Square className="mr-2 h-4 w-4" /> Stop Recording ({formatTime(recordingTime)})
                </Button>
              )}
              {audioUrl && !isRecording && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-2xl border border-dashed">
                  <div className="flex-1 flex flex-col gap-1 pl-1">
                    <div className="flex items-center gap-2">
                      <Play className="h-3 w-3 text-orange-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Saved</span>
                      {displayDuration != null && (
                        <span className="text-[10px] flex items-center gap-1 bg-orange-500/10 text-orange-600 font-bold px-2 py-0.5 rounded-full">
                          <Clock className="h-3 w-3" /> {formatTime(displayDuration)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={deleteVoiceNote} className="rounded-full h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
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
            <Textarea placeholder="A final heart-warming message..." value={customQuote} onChange={(e) => setCustomQuote(e.target.value)} className="min-h-[80px]" />
            <Button variant="secondary" className="w-full rounded-full" onClick={onSaveQuote} disabled={isSavingQuote}>{isSavingQuote ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Ending</>}</Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
