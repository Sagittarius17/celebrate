"use client";

import React, { use, useEffect, useState, useRef } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { Header } from '@/components/birthday/Header';
import { TimelineLayout } from '@/components/birthday/TimelineLayout';
import { GridLayout } from '@/components/birthday/GridLayout';
import { CarouselLayout } from '@/components/birthday/CarouselLayout';
import { FinalMessage } from '@/components/birthday/FinalMessage';
import { ButterflySwarm } from '@/components/birthday/ButterflySwarm';
import { FireworkEffect } from '@/components/birthday/FireworkEffect';
import { Gift, PackageOpen, Loader2, Heart, Sparkles } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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

export default function SurpriseView({ params }: { params: Promise<{ name: string; code: string }> }) {
  const { name, code } = use(params);
  const db = useFirestore();
  const [pageId, setPageId] = useState<string | null>(null);
  const [isFindingPage, setIsFindingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [theme, setTheme] = useState<'light' | 'candle-light'>('light');
  const [showFireworks, setShowFireworks] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  const journeyRef = useRef<HTMLDivElement>(null);
  const endTriggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const findPage = async () => {
      if (!db) return;
      try {
        const q = query(collection(db, 'celebrationPages'), where('accessCode', '==', code));
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
  }, [db, code]);

  useEffect(() => {
    if (isFindingPage || !pageId) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 150);
      return () => clearInterval(interval);
    } else {
      setLoadingProgress(100);
    }
  }, [isFindingPage, pageId]);

  useEffect(() => {
    if (theme === 'candle-light') {
      document.body.classList.add('candle-light');
    } else {
      document.body.classList.remove('candle-light');
    }
    
    return () => {
      document.body.classList.remove('candle-light');
    };
  }, [theme]);

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
      // Calculate exactly to the heart's vertical center for better connection
      const heartCenter = heartRect.top + (heartRect.height / 2); 
      
      const totalHeight = heartCenter - journeyTop;
      const currentDistance = triggerPoint - journeyTop;
      
      const progress = (currentDistance / totalHeight) * 100;
      const clampedProgress = Math.min(Math.max(progress, 0), 100);
      
      setScrollProgress(prev => {
        if (prev >= 100 && clampedProgress < 100) return 100;
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

  const handleRevealClick = () => {
    setIsOpening(true);
    setTimeout(() => {
      setIsRevealed(true);
    }, 800);
  };

  if (isFindingPage || isPageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-8 px-4 max-w-sm mx-auto">
        <div className="w-full space-y-4 text-center">
          <p className="font-headline text-2xl font-bold">Unwrapping your surprise ...</p>
          <Progress value={loadingProgress} className="h-2 w-full rounded-full" />
        </div>
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
  const isCandle = theme === 'candle-light';

  return (
    <main className={cn("min-h-screen bg-background overflow-x-hidden transition-all duration-1000", theme)} style={globalStyle}>
      <ButterflySwarm theme={theme} />
      <FireworkEffect enabled={showFireworks} />

      {/* Main Content */}
      <div className={cn("transition-opacity duration-1000", isRevealed ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <Header 
          title={page?.title} 
          occasion={page?.occasion} 
          theme={theme} 
          onToggleTheme={() => setTheme(prev => prev === 'light' ? 'candle-light' : 'light')} 
          showFireworks={showFireworks}
          onToggleFireworks={() => setShowFireworks(prev => !prev)}
          voiceNoteUrl={page?.voiceNoteDataUri}
          spotifyTrackId={page?.spotifyTrackId}
        />
        
        <section id="journey" ref={journeyRef} className="pt-8 pb-0 sm:pt-16 relative z-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12 sm:mb-20 px-4">
              <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: page?.font || 'inherit' }}>{page?.title || 'Our Journey'}</h2>
              <div className="w-16 sm:w-24 h-1 bg-secondary mx-auto rounded-full mb-8" />
            </div>
            
            {layout === 'Timeline' ? (
              <div className="relative flex flex-col items-center">
                {/* Visual Line Container - Connects the spine line to the center of the heart */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-2 z-0 pointer-events-none" 
                  style={{ 
                    height: 'calc(100% - 40px)', 
                    top: '-40px' 
                  }}
                >
                  <div className="w-full h-full timeline-line opacity-10" />
                  <div 
                    className="absolute top-0 left-0 w-full z-10 timeline-glow-line"
                    style={{ height: `${scrollProgress}%` }}
                  />
                </div>
                
                <div className="w-full relative z-10">
                  <TimelineLayout events={events} scrollProgress={scrollProgress} />
                </div>

                {/* Final Heart Trigger */}
                <div ref={endTriggerRef} className="flex flex-col items-center pt-24 pb-8 relative z-20">
                  <div className={cn(
                    "transition-all duration-1000 transform relative z-20",
                    scrollProgress > 95 ? "opacity-100 scale-100" : "opacity-0 scale-50"
                  )}>
                    <div className={cn(
                      "bg-white p-3 sm:p-4 rounded-full shadow-2xl border-4 transition-all duration-700",
                      isFullyConnected && isCandle 
                        ? "animate-rgb-border" 
                        : (isFullyConnected ? "border-secondary" : "border-secondary/40")
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
              <div className="relative z-10">
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
      </div>

      {/* Reveal Overlay */}
      {!isRevealed && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
          <div className="flex flex-col items-center gap-12 animate-fade-in w-full max-w-sm">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <div className="relative bg-white p-10 rounded-[3rem] shadow-2xl border-b-8 border-primary/20 transition-all duration-500 flex items-center justify-center">
                {isOpening ? (
                  <PackageOpen className="h-20 w-20 text-primary animate-in zoom-in-50 duration-300" />
                ) : (
                  <Gift className="h-20 w-20 text-primary animate-bounce" />
                )}
              </div>
            </div>
            
            <Button 
              size="lg" 
              onClick={handleRevealClick}
              disabled={isOpening}
              className="rounded-full px-12 py-8 text-xl font-bold shadow-xl hover:scale-105 transition-all bg-primary text-primary-foreground border-none w-full"
            >
              {isOpening ? <Loader2 className="mr-3 h-6 w-6 animate-spin" /> : <Sparkles className="mr-3 h-6 w-6" />}
              {isOpening ? "Opening Surprise..." : "Reveal My Surprise"}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
