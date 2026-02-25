"use client";

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, User, Key, ArrowRight, Gift, LogOut, Copy, Check, Type, Trash2, Edit2, Sun, Moon, Music, Share2, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDashboardTheme } from './layout';
import { searchSpotifyTracks } from '@/ai/flows/search-spotify-tracks-flow';
import Image from 'next/image';

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "Wedding",
  "Promotion",
  "New Baby",
  "Retirement",
  "Other"
];

const generateUniqueCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useDashboardTheme();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [newSurprise, setNewSurprise] = useState({
    recipientName: '',
    title: '',
    occasion: 'Birthday',
    spotifyTrackId: '',
  });
  const [editingSurprise, setEditingSurprise] = useState<any>(null);

  // Spotify Search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const celebrationPagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'celebrationPages'), where('ownerId', '==', user.uid));
  }, [db, user]);

  const { data: surprises, isLoading } = useCollection(celebrationPagesQuery);

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

  const selectTrack = (track: any, isNew: boolean) => {
    if (isNew) {
      setNewSurprise({ ...newSurprise, spotifyTrackId: track.trackId });
    } else if (editingSurprise) {
      setEditingSurprise({ ...editingSurprise, spotifyTrackId: track.trackId });
    }
    setIsSearchOpen(false);
    toast({ title: "Track Selected", description: `${track.title} by ${track.artist}` });
  };

  const handleCreate = () => {
    if (!user || !db) return;
    
    const pageId = doc(collection(db, 'dummy')).id;
    const accessCode = generateUniqueCode();
    const payload = {
      ...newSurprise,
      id: pageId,
      accessCode: accessCode,
      font: 'Playfair Display',
      creatorName: user.displayName || 'Creator',
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'celebrationPages'), payload);
    setIsCreateOpen(false);
    setNewSurprise({ recipientName: '', title: '', occasion: 'Birthday', spotifyTrackId: '' });
    toast({ title: "Surprise Created", description: "Your unique access code is: " + accessCode });
  };

  const handleOpenEdit = (surprise: any) => {
    setEditingSurprise({ ...surprise });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!db || !editingSurprise) return;
    
    const pageRef = doc(db, 'celebrationPages', editingSurprise.id);
    const { id, ...updateData } = editingSurprise;
    
    updateDocumentNonBlocking(pageRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    
    setIsEditOpen(false);
    setEditingSurprise(null);
    toast({ title: "Surprise Updated", description: "The details have been saved." });
  };

  const handleDelete = (id: string) => {
    if (!db) return;
    const pageRef = doc(db, 'celebrationPages', id);
    deleteDocumentNonBlocking(pageRef);
    toast({
      title: "Surprise Deleted",
      description: "The celebration page has been removed.",
    });
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.push('/');
    });
  };

  const copyAccessCode = (surprise: any) => {
    navigator.clipboard.writeText(surprise.accessCode);
    setCopiedCodeId(surprise.id);
    toast({
      title: "Code Copied!",
      description: "Secret access code copied to clipboard.",
    });
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const copyShareLink = (surprise: any) => {
    const baseUrl = window.location.origin;
    const nameSlug = slugify(surprise.recipientName);
    const shareUrl = `${baseUrl}/surprise/${nameSlug}/${surprise.accessCode}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLinkId(surprise.id);
    toast({
      title: "Link Copied!",
      description: `Share this unique link for ${surprise.recipientName}.`,
    });
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  if (isUserLoading) return <div className="p-20 text-center">Loading...</div>;

  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="max-w-md w-full p-8 text-center space-y-6 rounded-[2rem]">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Account Required</h1>
          <p className="text-muted-foreground">
            To create and manage interactive surprises, you need a registered account.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full rounded-full h-12">Go to Sign Up</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const headerButtonStyle = "rounded-full h-12 w-12 p-0 flex items-center justify-center border-none transition-all shadow-sm";

  const SpotifySearchDialog = ({ isNew }: { isNew: boolean }) => (
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
                    onClick={() => selectTrack(track, isNew)}
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
  );

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold">Your Celebrations</h1>
            <p className="text-muted-foreground">Manage and create interactive surprises</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="destructive"
              className={`${headerButtonStyle} bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20`}
              onClick={handleLogout}
              title="Log Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            <Button 
              className={`${headerButtonStyle} bg-secondary hover:bg-secondary/80 text-secondary-foreground`}
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button 
                  className={`${headerButtonStyle} bg-secondary hover:bg-secondary/80 text-secondary-foreground`}
                  title="New Surprise"
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Surprise Page</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="occasion">Occasion</Label>
                    <Select 
                      value={newSurprise.occasion} 
                      onValueChange={(val) => setNewSurprise({...newSurprise, occasion: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {OCCASIONS.map(occ => (
                          <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recipient">Who is this for?</Label>
                    <Input 
                      id="recipient" 
                      placeholder="e.g. Sarah Jones" 
                      value={newSurprise.recipientName}
                      onChange={(e) => setNewSurprise({...newSurprise, recipientName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Page Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Happy 25th Birthday, Sarah!" 
                      value={newSurprise.title}
                      onChange={(e) => setNewSurprise({...newSurprise, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="spotify-id" className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-primary" /> Spotify Track ID
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        id="spotify-id" 
                        placeholder="e.g. 4PTG3C64LUButARq9I9Uf8" 
                        value={newSurprise.spotifyTrackId}
                        onChange={(e) => setNewSurprise({...newSurprise, spotifyTrackId: e.target.value})}
                      />
                      <SpotifySearchDialog isNew={true} />
                    </div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-xl border border-dashed text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Key className="h-3 w-3" /> A unique 10-character secret code will be generated automatically.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full rounded-full h-12" onClick={handleCreate} disabled={!newSurprise.recipientName || !newSurprise.title}>Create Surprise</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Surprise Details</DialogTitle>
            </DialogHeader>
            {editingSurprise && (
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-occasion">Occasion</Label>
                  <Select 
                    value={editingSurprise.occasion} 
                    onValueChange={(val) => setEditingSurprise({...editingSurprise, occasion: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCASIONS.map(occ => (
                        <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-recipient">Who is this for?</Label>
                  <Input 
                    id="edit-recipient" 
                    value={editingSurprise.recipientName}
                    onChange={(e) => setEditingSurprise({...editingSurprise, recipientName: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-title">Page Title</Label>
                  <Input 
                    id="edit-title" 
                    value={editingSurprise.title}
                    onChange={(e) => setEditingSurprise({...editingSurprise, title: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-spotify" className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-primary" /> Spotify Track ID
                  </Label>
                  <div className="flex gap-2">
                    <Input 
                      id="edit-spotify" 
                      value={editingSurprise.spotifyTrackId || ''}
                      onChange={(e) => setEditingSurprise({...editingSurprise, spotifyTrackId: e.target.value})}
                    />
                    <SpotifySearchDialog isNew={false} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="opacity-60">Secret Access Code (Read-only)</Label>
                  <Input 
                    disabled
                    value={editingSurprise.accessCode}
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button className="w-full rounded-full h-12" onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="text-center py-20">Loading your surprises...</div>
        ) : surprises?.length === 0 ? (
          <Card className="p-12 text-center border-dashed bg-card/50 rounded-[3rem]">
            <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">No surprises yet</h3>
            <p className="text-muted-foreground mb-6">Start by creating your first celebration page.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-full px-8">Create Now</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surprises?.map((surprise) => (
              <Card key={surprise.id} className="group hover:shadow-xl transition-all duration-300 rounded-[2.5rem] overflow-hidden border-none shadow-md relative bg-card">
                <CardHeader className="bg-primary/10">
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-2xl truncate pr-4">{surprise.title}</CardTitle>
                    <div className="bg-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                      {surprise.occasion}
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4" /> For {surprise.recipientName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Key className="h-4 w-4 mr-2" /> Code: <code className="bg-muted px-2 py-0.5 rounded ml-2 font-bold">{surprise.accessCode}</code>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-10 w-10 p-0 rounded-full hover:bg-secondary/20"
                      onClick={() => copyAccessCode(surprise)}
                      title="Copy Secret Code"
                    >
                      {copiedCodeId === surprise.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Type className="h-4 w-4 mr-2" /> Style: <span className="font-medium" style={{ fontFamily: surprise.font || 'inherit' }}>{surprise.font || 'Default'}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/${surprise.id}`} className="flex-1">
                      <Button className="w-full rounded-full h-11 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        Edit Timeline <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full shrink-0 h-11 w-11 border-muted hover:bg-secondary/10 hover:text-secondary"
                      onClick={() => copyShareLink(surprise)}
                      title="Share Surprise (Copy URL)"
                    >
                      {copiedLinkId === surprise.id ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full shrink-0 h-11 w-11 border-muted hover:bg-muted"
                      onClick={() => handleOpenEdit(surprise)}
                      title="Edit Details"
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="rounded-full shrink-0 h-11 w-11 border-muted hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                          title="Delete Surprise"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{surprise.title}" and remove all memory events from the timeline.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(surprise.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
