
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
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { LayoutTemplate, Quote, Save, Music, Mic, Square, Play, Trash2, Search, Loader2, Clock } from 'lucide-react';
import { DocumentReference, Firestore } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { searchSpotifyTracks } from '@/ai/flows/search-spotify-tracks-flow';
import Image from 'next/image';

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
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(page.voiceNoteDataUri || null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Spotify Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const handleSpotifySearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { tracks } = await searchSpotifyTracks({ query: searchQuery });
      setSearchResults(tracks);
    } catch (error) {
      toast({ variant: "destructive", title: "Search Failed", description: "AI could not find tracks." });
    } finally {
      setIsSearching(false);
    }
  };

  const selectTrack = (track: any) => {
    handleUpdatePage({ spotifyTrackId: track.trackId });
    setIsSearchOpen(false);
    toast({ title: "Track Selected", description: `${track.title} by ${track.artist}` });
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
      setRecordingTime(0);
      setRecordedDuration(null);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordedDuration(recordingTime);
    }
  };

  const deleteVoiceNote = () => {
    setAudioUrl(null);
    setRecordedDuration(null);
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
              <40Select 
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
              <div className="flex gap-2">
                <Input 
                  id="spotify"
                  placeholder="e.g. 4PTG3C64LUButARq9I9Uf8" 
                  value={page.spotifyTrackId || ''}
                  onChange={(e) => handleUpdatePage({ spotifyTrackId: e.target.value })}
                />
                <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 rounded-xl">
                      <Search className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Search for a Song</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Song name or artist..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSpotifySearch()}
                        />
                        <Button onClick={handleSpotifySearch} disabled={isSearching}>
                          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                      </div>
                      <ScrollArea className="h-[300px] rounded-xl border p-2">
                        {searchResults.length === 0 && !isSearching ? (
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            Try searching for your favorite track
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {searchResults.map((track) => (
                              <button
                                key={track.trackId}
                                onClick={() => selectTrack(track)}
                                className="w-full flex items-center gap-3 p-2 hover:bg-accent rounded-xl transition-colors text-left group"
                              >
                                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden shrink-0 relative">
                                  {track.imageUrl ? (
                                    <Image src={track.imageUrl} alt={track.title} fill className="object-cover" />
                                  ) : (
                                    <Music className="w-full h-full p-3 opacity-20" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold truncate text-sm">{track.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                Tip: Search for a song or paste a Spotify Track ID.
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
                  className="w-full rounded-full border-dashed border-orange-200 hover:bg-orange-50 hover:border-orange-300 h-12"
                >
                  <Mic className="mr-2 h-4 w-4 text-orange-500" /> 
                  {audioUrl ? "Record New Message" : "Record Voice Note"}
                </Button>
              ) : (
                <Button 
                  onClick={stopRecording} 
                  variant="destructive" 
                  className="w-full rounded-full animate-pulse h-12 relative overflow-hidden"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Square className="h-4 w-4" /> 
                    <span>Stop Recording</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                </Button>
              )}

              {audioUrl && !isRecording && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-2xl border border-dashed">
                  <div className="flex-1 flex items-center gap-2 pl-2">
                    <Play className="h-4 w-4 text-orange-500" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message Saved</span>
                      {recordedDuration !== null && (
                        <span className="text-[10px] flex items-center gap-1 text-orange-600 font-medium">
                          <Clock className="h-3 w-3" /> {formatTime(recordedDuration)}
                        </span>
                      )}
                    </div>
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
