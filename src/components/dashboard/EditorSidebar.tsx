
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
  ArrowLeft,
  Type,
  Grid,
  Circle,
  Square as SquareIcon
} from 'lucide-react';
import { DocumentReference, Firestore, doc } from 'firebase/firestore';
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
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SelectionContext } from '@/app/dashboard/[id]/page';

const FONTS = [
  "Playfair Display", "PT Sans", "Montserrat", "Lora", "Quicksand", 
  "Merriweather", "Oswald", "Dancing Script", "Caveat", "Pacifico", 
  "Lobster", "Cinzel", "Comfortaa", "Great Vibes", "Sacramento"
];

const LAYOUTS = ["Timeline", "Carousel", "Grid", "Collage"];

interface EditorSidebarProps {
  page: any;
  pageRef: DocumentReference | null;
  db: Firestore | null;
  customQuote: string;
  setCustomQuote: (val: string) => void;
  onSaveQuote: () => void;
  isSavingQuote: boolean;
  selectionContext: SelectionContext;
  events: any[] | null;
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
      setMetadata(null);
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

  if (loading) return <div className="flex items-center gap-2 mt-2 text-sm text-black dark:text-[#FFD700]"><Music2 className="h-4 w-4 animate-pulse" /> Loading info...</div>;
  if (!metadata) return null;

  return (
    <div className="flex items-center gap-3 mt-4 p-3 bg-muted/30 rounded-2xl border border-dashed border-black/30 dark:border-[#FFD700]/30 animate-in fade-in slide-in-from-top-2">
      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted">
        <Image src={metadata.imageUrl} alt="" fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate leading-tight">{metadata.title}</p>
        <p className="text-xs text-muted-foreground truncate">{metadata.artist}</p>
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
  isSavingQuote,
  selectionContext,
  events
}: EditorSidebarProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(page.voiceNoteDataUri || null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleUpdateEventField = (fieldName: string, value: any) => {
    if (!db || !selectionContext || !selectionContext.eventId) return;
    const eventRef = doc(db, 'celebrationPages', page.id, 'birthdayEvents', selectionContext.eventId);
    
    updateDocumentNonBlocking(eventRef, {
      [fieldName]: value,
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
          handleUpdatePage({ voiceNoteDataUri: base64String, voiceNoteDuration: recordingTime });
          toast({ title: "Voice Note Recorded" });
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      toast({ variant: "destructive", title: "Microphone Error" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const deleteVoiceNote = () => {
    setAudioUrl(null);
    handleUpdatePage({ voiceNoteDataUri: null, voiceNoteDuration: null });
    toast({ title: "Voice Note Removed" });
  };

  const selectedEvent = events?.find(e => e.id === selectionContext?.eventId);
  const currentFont = selectionContext?.field === 'title' 
    ? (selectedEvent?.titleFont || 'inherit') 
    : (selectedEvent?.messageFont || 'inherit');

  const isCollageLayout = page.layout === 'Collage';

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="h-16 flex flex-row items-center justify-between px-4 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-black dark:text-[#FFD700]" />
          <h2 className="text-2xl font-bold font-headline text-black dark:text-[#FFD700]">Customize</h2>
        </div>
        <SidebarTrigger className="-mr-1" />
      </SidebarHeader>
      
      <SidebarContent>
        {selectionContext && selectionContext.field && (
          <SidebarGroup className="animate-in slide-in-from-top-2">
            <SidebarGroupLabel className="px-3 mb-2 flex items-center gap-2 text-black dark:text-[#FFD700] font-bold text-sm">
              <Type className="h-4 w-4" /> Selected Style
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-3 space-y-4">
               <div className="p-4 bg-black/5 dark:bg-[#FFD700]/5 rounded-2xl border border-dashed border-black/30 dark:border-[#FFD700]/30 space-y-4">
                 <p className="text-xs font-bold uppercase tracking-widest opacity-80 text-black dark:text-[#FFD700]">
                   Styling {selectionContext.field === 'title' ? 'Title' : 'Message'}
                 </p>
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-wider font-bold opacity-60">Font Style</Label>
                      <Select value={currentFont} onValueChange={(val) => handleUpdateEventField(selectionContext.field === 'title' ? 'titleFont' : 'messageFont', val)}>
                        <SelectTrigger className="w-full h-12 rounded-full bg-background border-2 border-transparent focus:ring-0 transition-all">
                          <SelectValue placeholder="Inherit Page Font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Use Default Page Font</SelectItem>
                          {FONTS.map(font => (
                            <SelectItem key={font} value={font}>
                              <span style={{ fontFamily: font }} className="text-base">{font}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isCollageLayout && (
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-wider font-bold opacity-60">Frame Corners</Label>
                        <div className="flex bg-muted p-1 rounded-full">
                          <Button 
                            variant={selectedEvent?.cornerStyle !== 'angled' ? 'default' : 'ghost'} 
                            className="flex-1 rounded-full h-9 text-xs"
                            onClick={() => handleUpdateEventField('cornerStyle', 'rounded')}
                          >
                            <Circle className="h-3.5 w-3.5 mr-2" /> Rounded
                          </Button>
                          <Button 
                            variant={selectedEvent?.cornerStyle === 'angled' ? 'default' : 'ghost'} 
                            className="flex-1 rounded-full h-9 text-xs"
                            onClick={() => handleUpdateEventField('cornerStyle', 'angled')}
                          >
                            <SquareIcon className="h-3.5 w-3.5 mr-2" /> Angled
                          </Button>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 font-bold text-black dark:text-[#FFD700] text-sm">Layout & Style</SidebarGroupLabel>
          <SidebarGroupContent className="px-3 space-y-5">
            <div className="space-y-2.5">
              <Label className="text-sm font-medium text-black/70 dark:text-[#FFD700]/70">Choose Layout</Label>
              <Select value={page.layout || 'Timeline'} onValueChange={(val) => handleUpdatePage({ layout: val })}>
                <SelectTrigger className="w-full h-12 rounded-full border-2 border-transparent focus:ring-0 transition-all"><SelectValue placeholder="Select layout" /></SelectTrigger>
                <SelectContent>{LAYOUTS.map(layout => <SelectItem key={layout} value={layout}>{layout}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2.5">
              <Label className="text-sm font-medium text-black/70 dark:text-[#FFD700]/70">Global Font</Label>
              <Select value={page.font || 'Playfair Display'} onValueChange={(val) => handleUpdatePage({ font: val })}>
                <SelectTrigger className="w-full h-12 rounded-full border-2 border-transparent focus:ring-0 transition-all"><SelectValue placeholder="Select font" /></SelectTrigger>
                <SelectContent>{FONTS.map(font => <SelectItem key={font} value={font}><span style={{ fontFamily: font }} className="text-base">{font}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 font-bold text-black dark:text-[#FFD700] text-sm">Soundtrack</SidebarGroupLabel>
          <SidebarGroupContent className="px-3 space-y-4">
            <div className="space-y-2.5">
              <Label className="text-sm font-medium text-black/70 dark:text-[#FFD700]/70">Spotify Track ID or URL</Label>
              <Input 
                placeholder="Paste Link or ID here" 
                className="rounded-full h-12 px-6 bg-muted/30 border-2 border-transparent focus-visible:border-primary focus-visible:ring-0 text-sm transition-all"
                value={page.spotifyTrackId || ''} 
                onChange={(e) => handleUpdatePage({ spotifyTrackId: extractSpotifyTrackId(e.target.value) })} 
              />
              <TrackMetadataDisplay trackId={page.spotifyTrackId || ''} />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 font-bold text-black dark:text-[#FFD700] text-sm">Personal Touch</SidebarGroupLabel>
          <SidebarGroupContent className="px-3 space-y-4">
            <div className="flex flex-col gap-4">
              {!isRecording ? (
                <Button onClick={startRecording} variant="outline" className="w-full rounded-full border-dashed border-black/40 dark:border-[#FFD700]/40 h-12 text-sm">
                  <Mic className="mr-2 h-4 w-4 text-black dark:text-[#FFD700]" /> {audioUrl ? "Record New" : "Voice Note"}
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="w-full rounded-full animate-pulse h-12 text-sm">
                  <Square className="mr-2 h-4 w-4" /> Stop ({formatTime(recordingTime)})
                </Button>
              )}
              {audioUrl && !isRecording && (
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-2xl border border-dashed border-black/30 dark:border-[#FFD700]/30">
                  <Play className="h-4 w-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex-1">Saved Note</span>
                  <Button variant="ghost" size="icon" onClick={deleteVoiceNote} className="rounded-full h-9 w-9 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 mb-2 font-bold text-black dark:text-[#FFD700] text-sm">Final Quote</SidebarGroupLabel>
          <SidebarGroupContent className="px-3">
            <div className="p-3 bg-muted/20 dark:bg-black/20 rounded-2xl border border-dashed border-black/20 dark:border-[#FFD700]/20 space-y-3 animate-in zoom-in-95 duration-300">
              <Textarea 
                placeholder="A final heart-warming message..." 
                value={customQuote} 
                onChange={(e) => setCustomQuote(e.target.value)} 
                className="min-h-[120px] p-5 text-sm rounded-xl bg-white dark:bg-black/40 border-none focus-visible:ring-0 transition-all resize-none shadow-none" 
              />
              <Button 
                variant="secondary" 
                className="w-full rounded-xl h-12 text-sm text-black dark:text-[#FFD700] font-bold shadow-sm" 
                onClick={onSaveQuote} 
                disabled={isSavingQuote}
              >
                {isSavingQuote ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Quote</>}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
