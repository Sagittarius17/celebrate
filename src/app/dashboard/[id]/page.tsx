
"use client";

import React, { useState, use, useRef } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Calendar, Quote, Copy, Check, ExternalLink, Save, ImageIcon, Upload, Type, LayoutTemplate } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const FONTS = [
  "Playfair Display",
  "PT Sans",
  "Montserrat",
  "Lora",
  "Quicksand",
  "Merriweather",
  "Oswald",
  "Dancing Script",
  "Caveat",
  "Pacifico",
  "Lobster",
  "Cinzel",
  "Comfortaa",
  "Great Vibes",
  "Sacramento"
];

const LAYOUTS = ["Timeline", "Carousel", "Grid"];

export default function SurpriseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [customQuote, setCustomQuote] = useState('');

  const pageRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'celebrationPages', id);
  }, [db, user, id]);

  const { data: page, isLoading: isPageLoading } = useDoc(pageRef);

  React.useEffect(() => {
    if (page?.finalQuote) {
      setCustomQuote(page.finalQuote);
    }
  }, [page]);

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'celebrationPages', id, 'birthdayEvents'),
      orderBy('eventDate', 'asc')
    );
  }, [db, user, id]);

  const { data: events, isLoading: isEventsLoading } = useCollection(eventsQuery);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please choose an image under 2MB for the best experience.",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddEvent = () => {
    if (!user || !db || !page) return;
    if (!selectedImageUrl) {
      toast({
        variant: "destructive",
        title: "No image selected",
        description: "Please upload an image first to add a memory.",
      });
      return;
    }
    
    const eventId = doc(collection(db, 'dummy')).id;
    const payload = {
      id: eventId,
      celebrationPageId: id,
      title: 'New Memory',
      message: '',
      eventDate: new Date().toISOString().split('T')[0],
      imageUrl: selectedImageUrl,
      order: (events?.length || 0) + 1,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'celebrationPages', id, 'birthdayEvents'), payload);
    setSelectedImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast({ title: "Memory Added", description: "Edit the details directly in the timeline." });
  };

  const handleUpdateEvent = (eventId: string, updates: any) => {
    if (!db) return;
    const eventRef = doc(db, 'celebrationPages', id, 'birthdayEvents', eventId);
    updateDocumentNonBlocking(eventRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveFinalQuote = () => {
    if (!db || !pageRef) return;
    setIsSavingQuote(true);
    updateDocumentNonBlocking(pageRef, {
      finalQuote: customQuote,
      updatedAt: new Date().toISOString(),
    });
    setTimeout(() => {
      setIsSavingQuote(false);
      toast({ title: "Final Quote Saved", description: "The ending message has been updated." });
    }, 500);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!user || !db) return;
    const eventRef = doc(db, 'celebrationPages', id, 'birthdayEvents', eventId);
    deleteDocumentNonBlocking(eventRef);
    toast({ title: "Memory Removed", description: "The memory has been deleted." });
  };

  const copyShareLink = () => {
    if (!page) return;
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/view/${encodeURIComponent(page.accessCode)}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast({
      title: "Link Copied!",
      description: "You can now share this surprise link with your recipient.",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isPageLoading) return <div className="p-20 text-center">Loading editor...</div>;
  if (!page) return <div className="p-20 text-center">Surprise not found.</div>;
  if (page.ownerId !== user?.uid) return <div className="p-20 text-center text-destructive">Unauthorized access.</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
          </Link>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyShareLink} className="rounded-full">
              {isCopied ? <Check className="h-4 w-4 mr-2 text-green-500" /> : <Copy className="h-4 w-4 mr-2" />}
              Copy Share Link
            </Button>
            <Link href={`/view/${encodeURIComponent(page.accessCode)}`} target="_blank">
              <Button size="sm" variant="secondary" className="rounded-full">
                <ExternalLink className="h-4 w-4 mr-2" /> View Live
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-2 w-full md:w-2/3">
            <h1 className="text-4xl font-headline font-bold">{page.title}</h1>
            <p className="text-muted-foreground italic">Celebrating {page.recipientName} ({page.occasion})</p>
          </div>
          
          <Card className="w-full md:w-1/3 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Access Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Secret Code:</span>
                <code className="bg-secondary/20 text-secondary-foreground px-3 py-1 rounded-full font-bold">
                  {page.accessCode}
                </code>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6 lg:col-span-1">
            <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden">
              <CardHeader className="bg-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <Plus className="h-5 w-5" /> Add Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Upload Image</Label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-all overflow-hidden",
                      selectedImageUrl && "border-solid border-primary"
                    )}
                  >
                    {selectedImageUrl ? (
                      <>
                        <Image src={selectedImageUrl} alt="Preview" fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-bold flex items-center gap-1">
                            <Upload className="h-3 w-3" /> Change Photo
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Upload className="h-8 w-8" />
                        <span className="text-xs font-medium">Choose from device</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange} 
                    />
                  </div>
                </div>

                <Button 
                  className="w-full rounded-full h-12 shadow-md hover:shadow-lg transition-all" 
                  onClick={handleAddEvent}
                  disabled={!selectedImageUrl}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add to Timeline
                </Button>
              </CardContent>
            </Card>

            <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden">
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
                      if (db && pageRef) {
                        updateDocumentNonBlocking(pageRef, { layout: val, updatedAt: new Date().toISOString() });
                        toast({ title: "Layout Updated", description: `Switched to ${val} view.` });
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
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
                      if (db && pageRef) {
                        updateDocumentNonBlocking(pageRef, { font: val, updatedAt: new Date().toISOString() });
                        toast({ title: "Font Updated", description: `Style changed to ${val}.` });
                      }
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map(font => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          <span style={{ fontFamily: font }}>{font}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="h-fit rounded-3xl shadow-lg border-none overflow-hidden">
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
                  onClick={handleSaveFinalQuote}
                  disabled={isSavingQuote}
                >
                  {isSavingQuote ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Ending</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" /> Memory Preview
              </h2>
              <Link href={`/view/${encodeURIComponent(page.accessCode)}`} target="_blank">
                <Button variant="outline" size="sm" className="rounded-full">
                  <ExternalLink className="h-3 w-3 mr-2" /> Live Preview
                </Button>
              </Link>
            </div>
            
            {isEventsLoading ? (
              <div className="text-center py-10">Loading events...</div>
            ) : events?.length === 0 ? (
              <div className="text-center py-20 bg-white/50 rounded-[3rem] border-2 border-dashed border-muted">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">Your timeline is empty. Upload a photo from the left panel!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {events?.map((event) => (
                  <Card key={event.id} className="rounded-[2rem] overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow group bg-white/80 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative w-full md:w-56 h-56 md:h-auto">
                        <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                      </div>
                      <CardContent className="p-8 flex-1 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 w-full mr-4">
                            <Label className="text-[10px] font-bold text-primary uppercase tracking-widest">Date of Memory</Label>
                            <Input 
                              type="date" 
                              className="border-none bg-transparent p-0 h-auto font-bold text-primary text-sm focus-visible:ring-0 shadow-none cursor-pointer"
                              value={event.eventDate}
                              onChange={(e) => handleUpdateEvent(event.id, { eventDate: e.target.value })}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            onClick={() => handleDeleteEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Memory Title</Label>
                          <Input 
                            placeholder="e.g. First Steps" 
                            className="border-none bg-transparent p-0 h-auto text-2xl font-headline font-bold focus-visible:ring-0 shadow-none"
                            value={event.title}
                            onChange={(e) => handleUpdateEvent(event.id, { title: e.target.value })}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">The Story</Label>
                          <Textarea 
                            placeholder="Tell the story of this moment..." 
                            className="border-none bg-transparent p-0 h-auto min-h-[60px] italic text-muted-foreground focus-visible:ring-0 shadow-none resize-none leading-relaxed"
                            value={event.message}
                            onChange={(e) => handleUpdateEvent(event.id, { message: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
