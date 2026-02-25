"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LayoutTemplate, 
  Quote, 
  Save, 
  Music, 
  Mic, 
  Square, 
  Play, 
  Trash2, 
  Clock, 
  Music2, 
  Settings2,
  ArrowLeft
} from 'lucide-react';
import { DocumentReference, Firestore } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
} from '@/components/ui/sidebar';

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

function TrackMetadataDisplay({ trackId }: { trackId: string }) {
  const [metadata, setMetadata] = useState<{ title: string; artist: string; imageUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trackId && trackId.length === 22) {
      setLoading(true);
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${trackId}`)
        .then(r => r.json())
        .then(data => {
          setMetadata({
            title: data.title,
            artist: data.author_name,
            imageUrl: data.thumbnail_url
          });
        })
        .catch(() => setMetadata(null))
        .finally(() => setLoading(false));
    } else {
      setMetadata(null);
    }
  }, [trackId]);

  if (loading) return <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"><Music2 className="h-3 w-3 animate-pulse" /> Loading info...</div>;
  if (!metadata) return null;

  return (
    <div className="flex items-center gap-3 mt-4 p-2 bg-muted/30 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-2">
      <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted">
        <Image src={metadata.imageUrl} alt="" fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate leading-tight">{metadata.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">{metadata.artist}</p>
      </div>
    </div>
  );
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
    <Sidebar className="border-r">
      <SidebarHeader className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold font-headline">Customize</h2>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 mb-2">Layout & Style</SidebarGroupLabel>
          <SidebarGroupContent className="px-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Choose Layout</Label>
              <Select value={page.layout || 'Timeline'} onValueChange={(val) => handleUpdatePage({ layout: val })}>
                <SelectTrigger className="w-full h-10 rounded-xl"><SelectValue placeholder="Select layout" /></SelectTrigger>
                <SelectContent>{LAYOUTS.map(layout => <SelectItem key={layout} value={layout}>{layout}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Choose Font</Label>
              <Select value={page.font || 'Playfair Display'} onValueChange={(val) => handleUpdatePage({ font: val })}>
                <SelectTrigger className="w-full h-10 rounded-xl"><SelectValue placeholder="Select font" /></SelectTrigger>
                <SelectContent>{FONTS.map(font => <SelectItem key={font} value={font}><span style={{ fontFamily: font }} className="text-sm">{font}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 mb-2">Soundtrack</SidebarGroupLabel>
          <SidebarGroupContent className="px-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Spotify Track ID or URL</Label>
              <Input 
                placeholder="Paste Link or ID here" 
                className="rounded-xl h-10 text-sm"
                value={page.spotifyTrackId || ''} 
                onChange={(e) => handleUpdatePage({ spotifyTrackId: extractSpotifyTrackId(e.target.value) })} 
              />
              <TrackMetadataDisplay trackId={page.spotifyTrackId || ''} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 mb-2">Personal Touch</SidebarGroupLabel>
          <SidebarGroupContent className="px-6 space-y-4">
            <div className="flex flex-col gap-3">
              {!isRecording ? (
                <Button onClick={startRecording} variant="outline" className="w-full rounded-full border-dashed border-orange-200 h-10 text-xs">
                  <Mic className="mr-2 h-3.5 w-3.5 text-orange-500" /> {audioUrl ? "Record New" : "Voice Note"}
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="w-full rounded-full animate-pulse h-10 text-xs">
                  <Square className="mr-2 h-3.5 w-3.5" /> Stop ({formatTime(recordingTime)})
                </Button>
              )}
              {audioUrl && !isRecording && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-2xl border border-dashed">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Play className="h-3 w-3 text-orange-500 shrink-0" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">Message Saved</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={deleteVoiceNote} className="rounded-full h-7 w-7 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 mb-2">Final Quote</SidebarGroupLabel>
          <SidebarGroupContent className="px-6 space-y-4">
            <Textarea 
              placeholder="A final heart-warming message..." 
              value={customQuote} 
              onChange={(e) => setCustomQuote(e.target.value)} 
              className="min-h-[80px] text-sm rounded-xl" 
            />
            <Button variant="secondary" className="w-full rounded-full h-10 text-xs" onClick={onSaveQuote} disabled={isSavingQuote}>
              {isSavingQuote ? "Saving..." : <><Save className="mr-2 h-3.5 w-3.5" /> Save Ending</>}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
