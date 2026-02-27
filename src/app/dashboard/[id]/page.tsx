
"use client";

import React, { useState, use, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Copy, Check, Eye, EyeOff, Key, Calendar, Sun, Moon, Plus, Share2, Menu, Grid } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { EditorSidebar } from '@/components/dashboard/EditorSidebar';
import { MemoryEditorList } from '@/components/dashboard/MemoryEditorList';
import { CollageEditor } from '@/components/dashboard/CollageEditor';
import { LivePreviewFrame } from '@/components/dashboard/LivePreviewFrame';
import { useDashboardTheme } from '../layout';
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export type SelectionContext = {
  eventId: string;
  field: 'title' | 'message' | null;
} | null;

function DashboardEditorContent({ id }: { id: string }) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useDashboardTheme();
  const { state } = useSidebar();
  
  const [isCopied, setIsCopied] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [customQuote, setCustomQuote] = useState('');
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectionContext, setSelectionContext] = useState<SelectionContext>(null);

  const pageRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'celebrationPages', id);
  }, [db, user, id]);

  const { data: page, isLoading: isPageLoading } = useDoc(pageRef);

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
      canvasX: 20 + (Math.random() * 60),
      canvasY: 20 + (Math.random() * 60),
      canvasScale: 1,
      canvasRotation: (Math.random() - 0.5) * 20,
      canvasZIndex: (events?.length || 0) + 1
    };

    addDocumentNonBlocking(collection(db, 'celebrationPages', id, 'birthdayEvents'), payload);
    toast({ title: "Card Added" });
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
      toast({ title: "Final Quote Saved" });
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
    toast({ title: "Link Copied!" });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyAccessCode = () => {
    if (!page) return;
    navigator.clipboard.writeText(page.accessCode);
    setIsCodeCopied(true);
    toast({ title: "Code Copied!" });
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
  const isCollageLayout = page.layout === 'Collage';
  const headerButtonStyle = "rounded-full h-10 w-10 p-0 flex items-center justify-center border-none bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-all shadow-sm";

  return (
    <>
      <EditorSidebar 
        page={page}
        pageRef={pageRef}
        db={db}
        customQuote={customQuote}
        setCustomQuote={setCustomQuote}
        onSaveQuote={handleSaveFinalQuote}
        isSavingQuote={isSavingQuote}
        selectionContext={selectionContext}
        events={events}
      />
      <SidebarInset>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 lg:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-2">
              <SidebarTrigger className={cn("-ml-1 h-10 w-10 rounded-full", state === "expanded" && "md:hidden")} />
              <Link href="/dashboard">
                <Button className={headerButtonStyle} title="Back to Dashboard">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex-1">
               <h1 className="text-xl font-bold font-headline truncate max-w-[150px] md:max-w-md">{page.title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button className={headerButtonStyle} onClick={toggleTheme}>
                {isDark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </Button>
              <Button className={headerButtonStyle} onClick={copyShareLink}>
                {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
              </Button>
              <Button 
                className={`${headerButtonStyle} ${showLivePreview ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                onClick={() => setShowLivePreview(!showLivePreview)}
              >
                {showLivePreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="max-w-[1600px] mx-auto space-y-4">
              {!showLivePreview && (
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      {isCollageLayout ? <Grid className="h-5 w-5 text-primary" /> : <Calendar className="h-5 w-5 text-primary" />}
                      {isCollageLayout ? 'Collage Editor' : 'Memory Editor'}
                    </h2>
                  </div>
                  <Button onClick={handleAddEmptyCard} className="rounded-full bg-primary text-primary-foreground h-8 px-4 text-xs font-bold">
                    <Plus className="mr-1 h-3 w-3" /> Add Card
                  </Button>
                </div>
              )}
              
              {showLivePreview ? (
                <LivePreviewFrame url={livePreviewUrl} />
              ) : isCollageLayout ? (
                <CollageEditor 
                  events={events} 
                  isLoading={isEventsLoading} 
                  pageId={id} 
                  db={db}
                  onFieldFocus={(eventId, field) => setSelectionContext({ eventId, field })}
                />
              ) : (
                <MemoryEditorList 
                  events={events} 
                  isLoading={isEventsLoading} 
                  pageId={id} 
                  db={db}
                  onFieldFocus={(eventId, field) => setSelectionContext({ eventId, field })}
                />
              )}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}

export default function SurpriseEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <SidebarProvider>
      <DashboardEditorContent id={id} />
    </SidebarProvider>
  );
}
