"use client";

import React, { useState, use, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Copy, Check, Eye, EyeOff, Key, Calendar, Sun, Moon, Plus, Share2, Menu } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { EditorSidebar } from '@/components/dashboard/EditorSidebar';
import { MemoryEditorList } from '@/components/dashboard/MemoryEditorList';
import { LivePreviewFrame } from '@/components/dashboard/LivePreviewFrame';
import { useDashboardTheme } from '../layout';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function SurpriseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useDashboardTheme();
  
  const [isCopied, setIsCopied] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [customQuote, setCustomQuote] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const pageRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'celebrationPages', id);
  }, [db, user, id]);

  const { data: page, isLoading: isPageLoading } = useDoc(pageRef);

  // Simulated progress loader
  useEffect(() => {
    if (isPageLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isPageLoading]);

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

  const getShareUrl = () => {
    if (!page) return '';
    const baseUrl = window.location.origin;
    const nameSlug = slugify(page.recipientName);
    return `${baseUrl}/surprise/${nameSlug}/${page.accessCode}`;
  };

  const copyShareLink = () => {
    const url = getShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast({
      title: "Link Copied!",
      description: `Share this unique link for ${page?.recipientName}.`,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyAccessCode = () => {
    if (!page) return;
    navigator.clipboard.writeText(page.accessCode);
    setIsCodeCopied(true);
    toast({
      title: "Code Copied!",
      description: "Secret access code copied to clipboard.",
    });
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-6 max-w-sm mx-auto">
        <h2 className="text-2xl font-bold font-headline">Unlocking Editor...</h2>
        <Progress value={loadingProgress} className="h-2 w-full" />
      </div>
    );
  }

  if (!page) return <div className="p-20 text-center">Surprise not found.</div>;
  if (page.ownerId !== user?.uid) return <div className="p-20 text-center text-destructive">Unauthorized access.</div>;

  const livePreviewUrl = getShareUrl();

  const headerButtonStyle = "rounded-full h-10 w-10 p-0 flex items-center justify-center border-none bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all shadow-sm";

  return (
    <SidebarProvider>
      <EditorSidebar 
        page={page}
        pageRef={pageRef}
        db={db}
        customQuote={customQuote}
        setCustomQuote={setCustomQuote}
        onSaveQuote={handleSaveFinalQuote}
        isSavingQuote={isSavingQuote}
      />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          {/* Top Navbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
               <h1 className="text-xl font-bold font-headline truncate max-w-[200px] md:max-w-md">{page.title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 bg-secondary pl-4 pr-1 h-10 rounded-full border-none shadow-sm group" title="Secret Access Code">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-secondary-foreground opacity-60" />
                  <span className="text-sm font-bold text-secondary-foreground tracking-wider">{page.accessCode}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 p-0 rounded-full hover:bg-white/20 ml-1"
                  onClick={copyAccessCode}
                >
                  {isCodeCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>

              <Button 
                className={headerButtonStyle}
                onClick={toggleTheme}
                title={isDark ? "Light Mode" : "Dark Mode"}
              >
                {isDark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </Button>

              <Button 
                className={headerButtonStyle}
                onClick={copyShareLink} 
                title="Copy Link"
              >
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
              </Button>
              
              <Button 
                className={`${headerButtonStyle} ${showLivePreview ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onClick={() => setShowLivePreview(!showLivePreview)}
                title={showLivePreview ? "Editor" : "Preview"}
              >
                {showLivePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 lg:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-primary" /> {showLivePreview ? "Miniature Preview" : "Memory Editor"}
                  </h2>
                  {!isEventsLoading && events && (
                    <Badge variant="secondary" className="rounded-full px-4 py-1.5 font-bold bg-primary text-primary-foreground border-none shadow-sm">
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
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
