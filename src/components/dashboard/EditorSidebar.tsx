
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Save, 
  Music, 
  Mic, 
  Square, 
  Play, 
  Trash2, 
  Music2, 
  Settings2,
  Type,
  Circle,
  Square as SquareIcon,
  Timer,
  Repeat,
  Upload,
  CloudUpload,
  FileAudio,
  Youtube,
  Search
} from 'lucide-react';
import { DocumentReference, Firestore, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SelectionContext } from '@/app/dashboard/[id]/page';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpotifySearch } from './SpotifySearch';
import { YouTubeSearch } from './YouTubeSearch';

const FONTS = [
  "Playfair Display", "PT Sans", "Montserrat", "Lora", "Quicksand", 
  "Merriweather", "Oswald", "Dancing Script", "Caveat", "Pacifico", 
  "Lobster", "Cinzel", "Comfortaa", "Great Vibes", "Sacramento"
];

const LAYOUTS = ["Timeline", "Carousel", "Grid", "Collage"];

const DURATIONS = [
  { label: "15 Seconds", value: 15000 },
  { label: "30 Seconds", value: 30000 },
  { label: "1 Minute", value: 60000 },
  { label: "Full Song", value: 300000 }
];

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

const extractYouTubeVideoId = (input: string) => {
  if (!input) return '';
  const urlMatch = input.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  return input.trim();
};

function SoundtrackMetadataDisplay({ trackId, source }: { trackId: string; source: string }) {
  const [metadata, setMetadata] = useState<{ title: string; artist: string; imageUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!trackId) {
      setMetadata(null);
      return;
    }

    if (source === 'spotify' && trackId.length === 22) {
      setLoading(true);
      fetch(`https://open.spotify.com/oembed?url=spotify:track:${trackId}`)
        .then(r => r.json())
        .then(data => {
          setMetadata({ title: data.title, artist: data.author_name, imageUrl: data.thumbnail_url });
        })
        .catch(() => setMetadata(null))
        .finally(() => setLoading(false));
    } else if (source === 'youtube') {
      setLoading(true);
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${trackId}&format=json`)
        .then(r => r.json())
        .then(data => {
          setMetadata({ title: data.title, artist: data.author_name, imageUrl: data.thumbnail_url });
        })
        .catch(() => setMetadata(null))
        .finally(() => setLoading(false));
    }
  }, [trackId, source]);

  if (loading) return <div className="flex items-center gap-2 mt-1 text-xs"><Music2 className="h-3 w-3 animate-pulse" /> Loading info...</div>;
  if (!metadata) return null;

  return (
    <div className="flex items-center gap-3 mt-4 p-2 bg-muted/30 rounded-xl border border-dashed animate-in fade-in slide-in-from-top-1">
      <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-muted">
        <Image src={metadata.imageUrl} alt="" fill className="object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate leading-tight">{metadata.title}</p>
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
  isSavingQuote,
  selectionContext,
  events
}: EditorSidebarProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(page.voiceNoteDataUri || null);
  const [isUploadingTrack, setIsUploadingTrack] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const trackUploadRef = useRef<HTMLInputElement>(null);

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

  const handleTrackUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File too large", description: "Audio must be under 10MB." });
        return;
      }
      setIsUploadingTrack(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        handleUpdatePage({ customTrackDataUri: base64 });
        setIsUploadingTrack(false);
        toast({ title: "Track Uploaded" });
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedEvent = events?.find(e => e.id === selectionContext?.eventId);
  const currentFont = selectionContext?.field === 'title' 
    ? (selectedEvent?.titleFont || 'inherit') 
    : (selectedEvent?.messageFont || 'inherit');

  const isCollageLayout = page.layout === 'Collage';
  const soundtrackSource = page.soundtrackSource || 'spotify';

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="h-14 flex flex-row items-center justify-between px-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-black dark:text-[#FFD700]" />
          <h2 className="text-xl font-bold font-headline text-black dark:text-[#FFD700]">Customize</h2>
        </div>
        <SidebarTrigger className="-mr-1" />
      </SidebarHeader>
      
      <SidebarContent className="gap-0">
        {selectionContext && selectionContext.field && (
          <SidebarGroup className="py-2 animate-in slide-in-from-top-1">
            <SidebarGroupLabel className="px-2 mb-1 flex items-center gap-1.5 text-black dark:text-[#FFD700] font-bold text-[11px] uppercase tracking-wider">
              <Type className="h-3.5 w-3.5" /> Selected Style
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2 space-y-2">
               <div className="p-3 bg-black/5 dark:bg-[#FFD700]/5 rounded-xl border border-dashed border-black/30 dark:border-[#FFD700]/30 space-y-3">
                 <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 text-black dark:text-[#FFD700]">
                   Styling {selectionContext.field === 'title' ? 'Title' : 'Message'}
                 </p>
                 <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] uppercase tracking-wider font-bold opacity-60">Font Style</Label>
                      <Select value={currentFont} onValueChange={(val) => handleUpdateEventField(selectionContext.field === 'title' ? 'titleFont' : 'messageFont', val)}>
                        <SelectTrigger className="w-full h-9 rounded-lg bg-background border border-input focus:ring-0 transition-all text-xs">
                          <SelectValue placeholder="Inherit Page Font" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inherit">Use Default Page Font</SelectItem>
                          {FONTS.map(font => (
                            <SelectItem key={font} value={font}>
                              <span style={{ fontFamily: font }} className="text-sm">{font}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isCollageLayout && (
                      <div className="space-y-1.5">
                        <Label className="text-[9px] uppercase tracking-wider font-bold opacity-60">Frame Corners</Label>
                        <div className="flex bg-muted p-0.5 rounded-lg">
                          <Button 
                            variant={selectedEvent?.cornerStyle !== 'angled' ? 'default' : 'ghost'} 
                            className="flex-1 rounded-md h-7 text-[10px] px-0"
                            onClick={() => handleUpdateEventField('cornerStyle', 'rounded')}
                          >
                            <Circle className="h-3 w-3 mr-1" /> Rounded
                          </Button>
                          <Button 
                            variant={selectedEvent?.cornerStyle === 'angled' ? 'default' : 'ghost'} 
                            className="flex-1 rounded-md h-7 text-[10px] px-0"
                            onClick={() => handleUpdateEventField('cornerStyle', 'angled')}
                          >
                            <SquareIcon className="h-3 w-3 mr-1" /> Angled
                          </Button>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 mb-1 font-bold text-black dark:text-[#FFD700] text-[11px] uppercase tracking-wider">Layout & Style</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-black/60 dark:text-[#FFD700]/60 uppercase tracking-tight">Choose Layout</Label>
              <Select value={page.layout || 'Timeline'} onValueChange={(val) => handleUpdatePage({ layout: val })}>
                <SelectTrigger className="w-full h-9 rounded-lg border border-input focus:ring-0 text-xs transition-all"><SelectValue placeholder="Select layout" /></SelectTrigger>
                <SelectContent>{LAYOUTS.map(layout => <SelectItem key={layout} value={layout} className="text-xs">{layout}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-black/60 dark:text-[#FFD700]/60 uppercase tracking-tight">Global Font</Label>
              <Select value={page.font || 'Playfair Display'} onValueChange={(val) => handleUpdatePage({ font: val })}>
                <SelectTrigger className="w-full h-9 rounded-lg border border-input focus:ring-0 text-xs transition-all"><SelectValue placeholder="Select font" /></SelectTrigger>
                <SelectContent>{FONTS.map(font => <SelectItem key={font} value={font} className="text-xs"><span style={{ fontFamily: font }} className="text-sm">{font}</span></SelectItem>)}</SelectContent>
              </Select>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="px-2 mb-2 font-bold text-black dark:text-[#FFD700] text-[11px] uppercase tracking-wider">Soundtrack</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="p-4 bg-black/5 dark:bg-[#FFD700]/5 rounded-[2rem] border-2 border-dashed border-black/20 dark:border-[#FFD700]/20 space-y-4">
              <Tabs value={soundtrackSource} onValueChange={(val) => handleUpdatePage({ soundtrackSource: val })} className="w-full">
                <TabsList className="grid w-full grid-cols-3 rounded-full h-10 p-1 bg-muted/50">
                  <TabsTrigger value="spotify" className="rounded-full text-[9px] uppercase font-bold tracking-tight">Spotify</TabsTrigger>
                  <TabsTrigger value="youtube" className="rounded-full text-[9px] uppercase font-bold tracking-tight">YT Music</TabsTrigger>
                  <TabsTrigger value="upload" className="rounded-full text-[9px] uppercase font-bold tracking-tight">Upload</TabsTrigger>
                </TabsList>
              </Tabs>

              {soundtrackSource === 'spotify' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-bold opacity-60 uppercase tracking-tight">Spotify Track</Label>
                    <SpotifySearch onSelect={(track) => handleUpdatePage({ spotifyTrackId: track.trackId })} trigger={
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><Search className="h-3 w-3" /></Button>
                    } />
                  </div>
                  <Input 
                    placeholder="Paste Link or ID here" 
                    className="rounded-full h-10 px-4 bg-background border border-input text-xs transition-all"
                    value={page.spotifyTrackId || ''} 
                    onChange={(e) => handleUpdatePage({ spotifyTrackId: extractSpotifyTrackId(e.target.value) })} 
                  />
                  <SoundtrackMetadataDisplay trackId={page.spotifyTrackId || ''} source="spotify" />
                </div>
              ) : soundtrackSource === 'youtube' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-bold opacity-60 uppercase tracking-tight">YouTube Track</Label>
                    <YouTubeSearch onSelect={(track) => handleUpdatePage({ youtubeVideoId: track.videoId })} trigger={
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><Search className="h-3 w-3 text-red-500" /></Button>
                    } />
                  </div>
                  <Input 
                    placeholder="Paste Link or Video ID" 
                    className="rounded-full h-10 px-4 bg-background border border-input text-xs transition-all"
                    value={page.youtubeVideoId || ''} 
                    onChange={(e) => handleUpdatePage({ youtubeVideoId: extractYouTubeVideoId(e.target.value) })} 
                  />
                  <SoundtrackMetadataDisplay trackId={page.youtubeVideoId || ''} source="youtube" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold opacity-60 uppercase tracking-tight px-1">Upload Audio File</Label>
                  <input type="file" ref={trackUploadRef} className="hidden" accept="audio/*" onChange={handleTrackUpload} />
                  <Button 
                    onClick={() => trackUploadRef.current?.click()}
                    variant="outline" 
                    className="w-full h-10 rounded-full border-dashed border-black/30 dark:border-[#FFD700]/30 text-xs gap-2"
                    disabled={isUploadingTrack}
                  >
                    {isUploadingTrack ? <CloudUpload className="h-4 w-4 animate-bounce" /> : <Upload className="h-4 w-4" />}
                    {page.customTrackDataUri ? "Change Audio" : "Choose MP3/WAV"}
                  </Button>
                  {page.customTrackDataUri && (
                    <div className="flex items-center gap-2 p-2 bg-background/50 rounded-xl border border-dashed border-green-500/20 text-green-600">
                      <FileAudio className="h-4 w-4 shrink-0" />
                      <span className="text-[10px] font-bold uppercase truncate flex-1">Audio Ready</span>
                      <Button variant="ghost" size="icon" onClick={() => handleUpdatePage({ customTrackDataUri: null })} className="h-6 w-6 rounded-full">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold opacity-60 uppercase tracking-tight px-1 flex items-center gap-1.5">
                    <Music className="h-3 w-3" /> Clip Duration
                  </Label>
                  <Select 
                    value={(page.spotifyTrackDurationMs || 30000).toString()} 
                    onValueChange={(val) => handleUpdatePage({ spotifyTrackDurationMs: parseInt(val) })}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-full px-4"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => <SelectItem key={d.value} value={d.value.toString()} className="text-xs">{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold opacity-60 uppercase tracking-tight px-1 flex items-center gap-1.5">
                    <Timer className="h-3 w-3" /> Start At (seconds)
                  </Label>
                  <Input 
                    type="number"
                    min="0"
                    placeholder="e.g. 0"
                    className="h-9 text-xs rounded-full px-4"
                    value={Math.floor((page.spotifyTrackStartMs || 0) / 1000)}
                    onChange={(e) => handleUpdatePage({ spotifyTrackStartMs: (parseInt(e.target.value) || 0) * 1000 })}
                  />
                </div>

                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-bold opacity-60 uppercase tracking-tight flex items-center gap-1.5">
                    <Repeat className="h-3 w-3" /> Loop Track
                  </Label>
                  <Switch 
                    checked={page.spotifyLoop || false} 
                    onCheckedChange={(val) => handleUpdatePage({ spotifyLoop: val })}
                  />
                </div>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 mb-1 font-bold text-black dark:text-[#FFD700] text-[11px] uppercase tracking-wider">Personal Touch</SidebarGroupLabel>
          <SidebarGroupContent className="px-2 space-y-3">
            <div className="flex flex-col gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} variant="outline" className="w-full rounded-lg border-dashed border-black/30 dark:border-[#FFD700]/30 h-9 text-xs">
                  <Mic className="mr-1.5 h-3.5 w-3.5 text-black dark:text-[#FFD700]" /> {audioUrl ? "Record New" : "Voice Note"}
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="w-full rounded-lg animate-pulse h-9 text-xs">
                  <Square className="mr-1.5 h-3.5 w-3.5" /> Stop ({formatTime(recordingTime)})
                </Button>
              )}
              {audioUrl && !isRecording && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border border-dashed border-black/20 dark:border-[#FFD700]/20">
                  <Play className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex-1">Saved Note</span>
                  <Button variant="ghost" size="icon" onClick={deleteVoiceNote} className="rounded-md h-7 w-7 shrink-0"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-2 mb-1 font-bold text-black dark:text-[#FFD700] text-[11px] uppercase tracking-wider">Final Quote</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <div className="p-2 bg-black/5 dark:bg-[#FFD700]/5 rounded-xl border border-dashed border-black/30 dark:border-[#FFD700]/30 space-y-2 animate-in zoom-in-95 duration-300">
              <Textarea 
                placeholder="A final heart-warming message..." 
                value={customQuote} 
                onChange={(e) => setCustomQuote(e.target.value)} 
                rows={8}
                className="min-h-[160px] p-3 text-xs rounded-lg bg-background border-none focus-visible:ring-0 transition-all resize-none shadow-none" 
              />
              <Button 
                variant="outline" 
                className="w-full rounded-lg h-9 text-xs text-black dark:text-[#FFD700] font-bold shadow-sm bg-background border-none hover:bg-background/80" 
                onClick={onSaveQuote} 
                disabled={isSavingQuote}
              >
                {isSavingQuote ? "Saving..." : <><Save className="mr-1.5 h-3.5 w-3.5" /> Save Quote</>}
              </Button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
