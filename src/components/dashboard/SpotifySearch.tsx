
"use client";

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Music, Loader2, PlusCircle } from 'lucide-react';
import { searchSpotifyTracks } from '@/ai/flows/search-spotify-tracks-flow';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface SpotifySearchProps {
  onSelect: (track: any) => void;
  trigger?: React.ReactNode;
}

export function SpotifySearch({ onSelect, trigger }: SpotifySearchProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults([]);
    try {
      const { tracks } = await searchSpotifyTracks({ query });
      setResults(tracks);
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Search Failed", 
        description: "AI could not find tracks." 
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (track: any) => {
    onSelect(track);
    setIsOpen(false);
    toast({ 
      title: "Track Selected", 
      description: `${track.title} by ${track.artist}` 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="shrink-0 rounded-xl h-12 w-12">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[2rem]">
        <div className="p-6 pb-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Search for a Song</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mt-4 relative">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Song name or artist..." 
                className="pl-10 h-11 bg-muted/50 border-none rounded-2xl"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching} className="h-11 rounded-2xl px-6">
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] mt-4 px-2 pb-6">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Finding the perfect tracks...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-10" />
              <p className="text-sm">Try searching for your favorite celebration track</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {results.map((track) => (
                <button
                  key={track.trackId}
                  onClick={() => handleSelect(track)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-muted/80 rounded-2xl transition-all text-left group"
                >
                  <div className="w-14 h-14 bg-muted rounded-xl overflow-hidden shrink-0 relative flex items-center justify-center shadow-sm">
                    {track.imageUrl ? (
                      <Image src={track.imageUrl} alt="" fill className="object-cover" />
                    ) : (
                      <Music className="w-6 h-6 opacity-30" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground leading-tight truncate">{track.title}</p>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">Song • {track.artist}</p>
                  </div>
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                    <PlusCircle className="h-6 w-6 text-primary" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
