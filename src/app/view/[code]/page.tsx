
"use client";

import React, { use, useEffect, useState, useRef } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Header } from '@/components/birthday/Header';
import { TimelineLayout } from '@/components/birthday/TimelineLayout';
import { GridLayout } from '@/components/birthday/GridLayout';
import { CarouselLayout } from '@/components/birthday/CarouselLayout';
import { FinalMessage } from '@/components/birthday/FinalMessage';
import { Gift, Loader2, Heart } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const DEFAULT_QUOTES: Record<string, string> = {
  "Birthday": "To many more years of joy, laughter, and beautiful memories! Happy Birthday!",
  "Anniversary": "Here's to a lifetime of love and happiness together. Happy Anniversary!",
  "Graduation": "The future belongs to those if you believe in the beauty of their dreams. Congratulations!",
  "Wedding": "May your journey together be filled with endless love and happiness.",
  "Promotion": "Your hard work and dedication have truly paid off. Onwards and upwards!",
  "New Baby": "A tiny miracle has arrived! Wishing your family all the love in the world.",
  "Retirement": "Cheers to new beginnings and a well-deserved rest. Enjoy every moment!",
  "Other": "Celebrating every beautiful moment of this wonderful journey together."
};

export default function SurpriseView({ params }: { params: Promise<{ code: string }> }) {
  const { code: slug } = use(params);
  const db = useFirestore();
  const [pageId, setPageId] = useState<string | null>(null);
  const [isFindingPage, setIsFindingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const journeyRef = useRef<HTMLDivElement>(null);
  const endTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const findPage = async () => {
      if (!db) return;
      try {
        const decodedSlug = decodeURIComponent(slug);
        const parts = decodedSlug.split('-');
        
        // Use ID-CODE format: ID is the first part, CODE is the last part
        const pageIdFromUrl = parts[0];
        const accessCodeFromUrl = parts[parts.length - 1];

        // 1. Direct fetch by ID (Efficient)
        const docRef = doc(db, 'celebrationPages', pageIdFromUrl);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.accessCode === accessCodeFromUrl) {
            setPageId(pageIdFromUrl);
            setIsFindingPage(false);
            return;
          }
        }

        // 2. Fallback search (For legacy links or direct code entry)
        const q = query(collection(db, 'celebrationPages'), where('accessCode', '==', accessCodeFromUrl));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError("Invalid secret link. Please check with the person who created your surprise!");
        } else {
          setPageId(snap.docs[0].id);
        }
      } catch (err) {
        setError("Something went wrong while loading your surprise.");
      } finally {
        setIsFindingPage(false);
      }
    };
    findPage();
  }, [db, slug]);

  const pageDocRef = useMemoFirebase(() => {
    if (!db || !pageId) return null;
    return doc(db, 'celebrationPages', pageId);
  }, [db, pageId]);

  const { data: page, isLoading: isPageLoading } = useDoc(pageDocRef);

  const eventsColQuery = useMemoFirebase(() => {
    if (!db || !pageId) return null;
    return collection(db, 'celebrationPages', pageId, 'birthdayEvents');
  }, [db, pageId]);

  const { data: rawEvents, isLoading: isEventsLoading } = useCollection(eventsColQuery);

  const events = React.useMemo(() => {
    if (!rawEvents) return [];
    return [...rawEvents].sort((a, b) => {
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateA - dateB;
    });
  }, [rawEvents]);

  useEffect(() => {
    const handleScroll = () => {
      if (!journeyRef.current || !endTriggerRef.current) return;
      
      const journey = journeyRef.current;
      const heartTrigger = endTriggerRef.current;
      
      const journeyRect = journey.getBoundingClientRect();
      const heartRect = heartTrigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const triggerPoint = viewportHeight * 0.7; 
      
      const journeyTop = journeyRect.top;
      const heartTop = heartRect.top + 24; 
      
      const totalHeight = heartTop - journeyTop;
      const currentDistance = triggerPoint - journeyTop;
      
      const progress = (currentDistance / totalHeight) * 100;
      const clampedProgress = Math.min(Math.max(progress, 0), 100);
      
      setScrollProgress(prev => {
        if (prev >= 100) return 100;
        return clampedProgress;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [events.length, page?.layout]);

  useEffect(() => {
    if (events.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });

      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => observer.observe(el));

      return () => observer.disconnect();
    }
  }, [events, page?.layout]);

  if (isFindingPage || isPageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 px-4">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
        <p className="font-headline text-xl sm:text-2xl font-bold text-center">Unwrapping your surprise ...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="rounded-[2rem] p-6 sm:p-8 border-none shadow-2xl bg-white">
            <AlertTitle className="text-xl font-bold mb-2 flex items-center gap-2 text-destructive">
              <Gift className="h-6 w-6" /> Oops!
            </AlertTitle>
            <AlertDescription className="text-base sm:text-lg text-muted-foreground">
              {error || "Surprise not found."}
              <div className="mt-8 space-y-3">
                <button onClick={() => window.location.reload()} className="w-full bg-primary text-primary-foreground py-3 sm:py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all">Refresh Page</button>
                <a href="/view" className="block"><button className="w-full border-2 border-primary text-primary py-3 sm:py-4 rounded-full font-bold active:scale-95 transition-all">Try Another Code</button></a>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const finalQuoteToDisplay = page?.finalQuote || DEFAULT_QUOTES[page?.occasion] || DEFAULT_QUOTES["Other"];
  const globalStyle = { fontFamily: page?.font ? `${page.font}, sans-serif` : 'inherit' };
  const layout = page?.layout || 'Timeline';
  
  const isFullyConnected = scrollProgress >= 100;

  return (
    <main className="min-h-screen bg-background overflow-x-hidden" style={globalStyle}>
      <Header title={page?.title} occasion={page?.occasion} />
       
      <section ref={journeyRef} className="pt-12 pb-0 sm:pt-20 relative">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: page?.font || 'inherit' }}>{page?.title || 'Our Journey'}</h2>
          <div className="w-16 sm:w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4">
          {layout === 'Timeline' ? (
            <div className="relative flex flex-col items-center">
              <div 
                className="absolute left-1/2 transform -translate-x-1/2 w-1.5 z-0 pointer-events-none" 
                style={{ 
                  height: 'calc(100% - 110px)', 
                  top: '10px' 
                }}
              >
                <div className="w-full h-full timeline-line opacity-10" />
                <div 
                  className="absolute top-0 left-0 w-full z-10 timeline-glow-line"
                  style={{ height: `${scrollProgress}%` }}
                />
              </div>
              
              <div className="w-full">
                <TimelineLayout events={events} scrollProgress={scrollProgress} />
              </div>

              <div ref={endTriggerRef} className="flex flex-col items-center pt-24 pb-8 relative z-20">
                <div className={cn(
                  "transition-all duration-1000 transform relative z-20",
                  scrollProgress > 95 ? "opacity-100 scale-100" : "opacity-0 scale-50"
                )}>
                  <div className={cn(
                    "bg-white p-3 sm:p-4 rounded-full shadow-2xl border-4 transition-all duration-700",
                    isFullyConnected ? "animate-rgb-border" : "border-secondary/40"
                  )}>
                    <Heart className={cn(
                      "w-8 h-8 sm:w-10 sm:h-10 text-secondary fill-secondary transition-all",
                      isFullyConnected ? "animate-heartbeat" : "opacity-40 scale-90"
                    )} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {layout === 'Carousel' ? (
                <CarouselLayout events={events} />
              ) : (
                <GridLayout events={events} />
              )}
            </div>
          )}

          <FinalMessage 
            isVisible={layout !== 'Timeline' || isFullyConnected}
            recipientName={page?.recipientName}
            quote={finalQuoteToDisplay}
            creatorName={page?.creatorName}
          />
        </div>
      </section>
    </main>
  );
}
