
"use client";

import React, { use, useEffect, useState, useRef } from 'react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Header } from '@/components/birthday/Header';
import { EventCard } from '@/components/birthday/EventCard';
import { Star, Camera, Gift, PartyPopper, Cake, Loader2, Heart, Sparkles } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from '@/lib/utils';

export default function SurpriseView({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const db = useFirestore();
  const [page, setPage] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      const element = timelineRef.current;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      // We trigger the "completion" of the line when the element reaches the center of the screen
      const triggerPoint = viewportHeight * 0.6;
      const start = rect.top;
      const height = rect.height;
      
      const progress = ((triggerPoint - start) / height) * 100;
      setScrollProgress(Math.min(Math.max(progress, 0), 100));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadSurprise = async () => {
      if (!db) return;
      setIsLoading(true);
      setError(null);

      try {
        const decodedCode = decodeURIComponent(code);
        
        const pagesQuery = query(
          collection(db, 'celebrationPages'),
          where('accessCode', '==', decodedCode)
        );
         
        const pageSnap = await getDocs(pagesQuery);
        
        if (pageSnap.empty) {
          setError("Invalid secret code. Please check with the person who created your surprise!");
          setIsLoading(false);
          return;
        }

        const pageDoc = pageSnap.docs[0];
        const pageData = { ...pageDoc.data(), id: pageDoc.id };
        setPage(pageData);

        const eventsQuery = query(
          collection(db, 'celebrationPages', pageData.id, 'birthdayEvents')
        );
        const eventsSnap = await getDocs(eventsQuery);
        
        const fetchedEvents = eventsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        fetchedEvents.sort((a, b) => {
          const dateA = new Date(a.eventDate).getTime();
          const dateB = new Date(b.eventDate).getTime();
          return dateA - dateB;
        });

        setEvents(fetchedEvents);
      } catch (err: any) {
        if (err.code === 'permission-denied' || err.message?.toLowerCase().includes('permissions')) {
          const permissionError = new FirestorePermissionError({
            path: 'celebrationPages',
            operation: 'list',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError("Something went wrong while loading your surprise. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadSurprise();
  }, [db, code]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-headline text-2xl font-bold">Unwrapping your surprise ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="rounded-3xl p-8 border-none shadow-2xl bg-white">
            <AlertTitle className="text-xl font-bold mb-2 flex items-center gap-2 text-destructive">
              <Gift className="h-6 w-6" /> Oops!
            </AlertTitle>
            <AlertDescription className="text-lg text-muted-foreground">
              {error}
              <div className="mt-8">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all mb-3"
                >
                  Refresh Page
                </button>
                <a href="/view">
                  <button className="w-full border-2 border-primary text-primary py-4 rounded-full font-bold active:scale-95 transition-all">
                    Try Another Code
                  </button>
                </a>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const icons = [<Star />, <Camera />, <Gift />, <PartyPopper />, <Cake />, <Heart />, <Sparkles />];

  return (
    <main className="min-h-screen bg-background">
      <Header title={page?.title} occasion={page?.occasion} />
       
      <section className="py-20">
        <div className="text-center mb-16 px-4">
          <h2 className="font-headline text-5xl font-bold mb-4">{page?.title || 'Our Journey'}</h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>
        
        <div ref={timelineRef} className="relative max-w-6xl mx-auto px-4 py-20 overflow-hidden">
          {/* Base Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 timeline-line h-full z-0 opacity-20 hidden md:block" />
          
          {/* Glowing Progress Line */}
          <div 
            className="absolute left-1/2 transform -translate-x-1/2 w-1.5 z-10 hidden md:block timeline-glow-line"
            style={{ height: `${scrollProgress}%` }}
          />

          <div className="space-y-32 relative z-10">
            {events.map((event, index) => {
              const eventProgress = (index / (events.length - 1)) * 100;
              const isActive = scrollProgress >= eventProgress;

              return (
                <div 
                  key={event.id} 
                  className={cn(
                    "flex flex-col md:flex-row items-center justify-between group reveal-on-scroll visible",
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  )}
                >
                  <div className="w-full md:w-[45%]">
                    <EventCard 
                      title={event.title}
                      date={new Date(event.eventDate).toLocaleDateString()}
                      message={event.message}
                      imageUrl={event.imageUrl}
                      icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-6 h-6 text-primary-foreground" })}
                    />
                  </div>

                  {/* Timeline Dot */}
                  <div className={cn(
                    "hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center w-14 h-14 rounded-full border-4 transition-all duration-500 z-20 bg-background",
                    isActive ? "border-secondary scale-110 shadow-[0_0_20px_rgba(255,182,193,0.6)]" : "border-primary opacity-50"
                  )}> 
                    <div className={cn(
                      "w-4 h-4 rounded-full transition-colors duration-500",
                      isActive ? "bg-secondary animate-pulse" : "bg-primary"
                    )} />
                  </div>

                  <div className="w-full md:w-[45%] flex items-center justify-center p-8">
                    <div className="w-full h-48 md:h-64" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      <footer className="py-20 text-center bg-primary/5">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <h3 className="font-headline text-3xl font-bold">To Many More Years of Joy, {page?.recipientName}!</h3>
          <p className="font-body text-muted-foreground italic">
            "Every moment together is a treasure."
          </p>
        </div>
      </footer>
    </main>
  );
}
