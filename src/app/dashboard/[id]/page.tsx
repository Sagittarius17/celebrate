
"use client";

import React, { useState, use } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Calendar, Image as ImageIcon, Quote, Copy, Check, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';

export default function SurpriseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    message: '',
    eventDate: '',
    imageUrl: PlaceHolderImages[0].imageUrl,
  });

  const pageRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid, 'celebrationPages', id);
  }, [db, user, id]);

  const { data: page, isLoading: isPageLoading } = useDoc(pageRef);

  const eventsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'celebrationPages', id, 'birthdayEvents'),
      orderBy('eventDate', 'asc')
    );
  }, [db, user, id]);

  const { data: events, isLoading: isEventsLoading } = useCollection(eventsQuery);

  const handleAddEvent = () => {
    if (!user || !db || !page) return;
    
    const eventId = doc(collection(db, 'dummy')).id;
    const payload = {
      ...newEvent,
      id: eventId,
      celebrationPageId: id,
      order: (events?.length || 0) + 1,
      ownerId: user.uid,
      viewerUids: page.viewerUids || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'users', user.uid, 'celebrationPages', id, 'birthdayEvents'), payload);
    setNewEvent({ title: '', message: '', eventDate: '', imageUrl: PlaceHolderImages[0].imageUrl });
  };

  const handleDeleteEvent = (eventId: string) => {
    if (!user || !db) return;
    const eventRef = doc(db, 'users', user.uid, 'celebrationPages', id, 'birthdayEvents', eventId);
    deleteDocumentNonBlocking(eventRef);
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
    setTimeout(() => setIsCopied(null), 2000);
  };

  if (isPageLoading) return <div className="p-20 text-center">Loading editor...</div>;
  if (!page) return <div className="p-20 text-center">Surprise not found.</div>;

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
          <Card className="lg:col-span-1 h-fit sticky top-8 rounded-3xl shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Add Memory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input 
                  type="date" 
                  value={newEvent.eventDate}
                  onChange={(e) => setNewEvent({...newEvent, eventDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  placeholder="e.g. First Steps" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Memory / Quote</Label>
                <Textarea 
                  placeholder="Tell the story..." 
                  className="min-h-[100px]"
                  value={newEvent.message}
                  onChange={(e) => setNewEvent({...newEvent, message: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Choose an Image</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PlaceHolderImages.slice(0, 6).map((img) => (
                    <button 
                      key={img.id}
                      onClick={() => setNewEvent({...newEvent, imageUrl: img.imageUrl})}
                      className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${newEvent.imageUrl === img.imageUrl ? 'border-primary' : 'border-transparent'}`}
                    >
                      <Image src={img.imageUrl} alt={img.description} fill className="object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <Button 
                className="w-full rounded-full" 
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.eventDate}
              >
                Add to Timeline
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="h-6 w-6" /> Timeline Preview
            </h2>
            
            {isEventsLoading ? (
              <div className="text-center py-10">Loading events...</div>
            ) : events?.length === 0 ? (
              <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed">
                <Quote className="mx-auto h-12 w-12 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground">No events added yet. Start by filling the form on the left.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {events?.map((event) => (
                  <Card key={event.id} className="rounded-3xl overflow-hidden border-none shadow-md group">
                    <div className="flex flex-col md:flex-row">
                      <div className="relative w-full md:w-48 h-48">
                        <Image src={event.imageUrl} alt={event.title} fill className="object-cover" />
                      </div>
                      <CardContent className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-bold text-primary uppercase tracking-widest">
                              {new Date(event.eventDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => handleDeleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                          <p className="text-muted-foreground italic line-clamp-3">"{event.message}"</p>
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
