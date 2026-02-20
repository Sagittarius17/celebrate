
"use client";

import React, { useState, use, useRef, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Eye, EyeOff, Settings2, Key, Calendar, Sun, Moon } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingQuote, setIsSavingQuote] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/dashboard">
            <Button variant="ghost" className="rounded-full hover:bg-secondary/10 px-4 transition-all">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-secondary/10 px-3 h-9 rounded-full border border-secondary/20">
              <Key className="h-3 w-3 text-secondary-foreground opacity-70" />
              <span className="text-xs font-bold text-secondary-foreground">{page.accessCode}</span>
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-9 w-9 border-none bg-secondary/10 hover:bg-secondary/20 shrink-0"
              onClick={toggleTheme}
            >
              {isDark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyShareLink} 
              className="group rounded-full h-9 w-9 hover:w-32 px-0 hover:px-4 transition-all duration-300 overflow-hidden flex items-center justify-center whitespace-nowrap border-none bg-secondary/10 hover:bg-secondary/20"
            >
              {isCopied ? <Check className="h-4 w-4 shrink-0 text-green-500" /> : <Copy className="h-4 w-4 shrink-0" />}
              <span className="max-w-0 group-hover:max-w-[100px] opacity-0 group-hover:opacity-100 transition-all duration-300 ml-0 group-hover:ml-2">
                Share Link
              </span>
            </Button>
            
            <Button 
              size="sm" 
              variant={showLivePreview ? "default" : "secondary"} 
              className="group rounded-full h-9 w-9 hover:w-36 px-0 hover:px-4 transition-all duration-300 overflow-hidden flex items-center justify-center whitespace-nowrap"
              onClick={() => setShowLivePreview(!showLivePreview)}
            >
              {showLivePreview ? <EyeOff className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
              <span className="max-w-0 group-hover:max-w-[120px] opacity-0 group-hover:opacity-100 transition-all duration-300 ml-0 group-hover:ml-2">
                {showLivePreview ? "Show Editor" : "Live Preview"}
              </span>
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
              selectedImageUrl={selectedImageUrl}
              onFileClick={() => fileInputRef.current?.click()}
              onAddEvent={handleAddEvent}
              customQuote={customQuote}
              setCustomQuote={setCustomQuote}
              onSaveQuote={handleSaveFinalQuote}
              isSavingQuote={isSavingQuote}
              fileInputRef={fileInputRef}
              onFileChange={handleFileChange}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" /> {showLivePreview ? "Miniature Preview" : "Memory Editor"}
              </h2>
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
