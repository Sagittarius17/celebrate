
"use client";

import React, { useState, use, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Copy, Check, Eye, EyeOff, Settings2, Key, Calendar, Sun, Moon, Plus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { EditorSidebar } from '@/components/dashboard/EditorSidebar';
import { MemoryEditorList } from '@/components/dashboard/MemoryEditorList';
import { LivePreviewFrame } from '@/components/dashboard/LivePreviewFrame';
import { useDashboardTheme } from '../layout';

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export default function SurpriseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useDashboardTheme();
  
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [customQuote, setCustomQuote] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);

  const pageRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'celebrationPages', id);
  }, [db, user, id]);

  const { data: page, isLoading: isPageLoading } = useDoc(pageRef);

  useEffect(() => {
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

  const handleAddEmptyCard = () => {
    if (!user || !db || !page) return;
    
    const eventId = doc(collection(db, 'dummy')).id;
    // Use a high-quality placeholder for the initial empty card
    const placeholderImage = "https://picsum.photos/seed/placeholder/600/400";
    
    const payload = {
      id: eventId,
      celebrationPageId: id,
      title: 'New Memory',
      message: '',
      eventDate: new Date().toISOString().split('T')[0],
      imageUrl: placeholderImage,
      order: (events?.length || 0) + 1,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'celebrationPages', id, 'birthdayEvents'), payload);
    toast({ title: "Card Added", description: "Upload a photo and tell the story." });
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

  const copyShareLink = () => {
    if (!page) return;
    const baseUrl = window.location.origin;
    const nameSlug = slugify(page.recipientName);
    const shareUrl = `${baseUrl}/view/${encodeURIComponent(`${nameSlug}-${page.accessCode}`)}`;
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast({
      title: "Link Copied!",
      description: `Share this personalized link for ${page.recipientName}.`,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isPageLoading) return <div className="p-20 text-center">Loading editor...</div>;
  if (!page) return <div className="p-20 text-center">Surprise not found.</div>;
  if (page.ownerId !== user?.uid) return <div className="p-20 text-center text-destructive">Unauthorized access.</div>;

  const nameSlug = slugify(page.recipientName);
  const livePreviewUrl = `/view/${encodeURIComponent(`${nameSlug}-${page.accessCode}`)}`;

  const headerButtonStyle = "rounded-full h-12 w-12 p-0 flex items-center justify-center border-none bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all shadow-sm";

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost" className="rounded-full hover:bg-secondary/10 px-4 transition-all h-12">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-secondary px-6 h-12 rounded-full border-none shadow-sm" title="Secret Access Code">
              <Key className="h-5 w-5 text-secondary-foreground opacity-60" />
              <span className="text-base font-bold text-secondary-foreground tracking-wider">{page.accessCode}</span>
            </div>

            <Button 
              className={headerButtonStyle}
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-slate-700" />}
            </Button>

            <Button 
              className={headerButtonStyle}
              onClick={copyShareLink} 
              title="Copy Share Link"
            >
              {isCopied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
            </Button>
            
            <Button 
              className={`${headerButtonStyle} ${showLivePreview ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              onClick={() => setShowLivePreview(!showLivePreview)}
              title={showLivePreview ? "Hide Preview" : "Show Preview"}
            >
              {showLivePreview ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-bold">{page.title}</h1>
          <p className="text-muted-foreground italic">Celebrating {page.recipientName} ({page.occasion})</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Settings2 className="h-6 w-6 text-primary" /> Customize
            </h2>
            <EditorSidebar 
              page={page}
              pageRef={pageRef}
              db={db}
              customQuote={customQuote}
              setCustomQuote={setCustomQuote}
              onSaveQuote={handleSaveFinalQuote}
              isSavingQuote={isSavingQuote}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" /> {showLivePreview ? "Miniature Preview" : "Memory Editor"}
                </h2>
                {!isEventsLoading && events && (
                  <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold bg-primary/20 text-primary-foreground border-none">
                    {events.length} {events.length === 1 ? 'Card' : 'Cards'}
                  </Badge>
                )}
              </div>
              {!showLivePreview && (
                <Button 
                  onClick={handleAddEmptyCard} 
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 font-bold"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Card
                </Button>
              )}
            </div>
            
            {showLivePreview ? (
              <LivePreviewFrame url={livePreviewUrl} />
            ) : (
              <MemoryEditorList 
                events={events} 
                isLoading={isEventsLoading} 
                pageId={id} 
                db={db} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
