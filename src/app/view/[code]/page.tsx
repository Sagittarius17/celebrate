
"use client";

import React, { use, useEffect, useState, useRef } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, doc } from 'firebase/firestore';
import { Header } from '@/components/birthday/Header';
import { EventCard } from '@/components/birthday/EventCard';
import { Star, Camera, Gift, PartyPopper, Cake, Loader2, Heart, Sparkles, Quote } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const findPage = async () => {
      if (!db) return;
      try {
        const decodedSlug = decodeURIComponent(slug);
        const parts = decodedSlug.split('-');
        const accessCode = parts[parts.length - 1];

        const q = query(collection(db, 'celebrationPages'), where('accessCode', 'in', [decodedSlug, accessCode]));
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
      if (!timelineRef.current) return;
      const element = timelineRef.current;
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      const triggerPoint = viewportHeight * 0.75;
      const start = rect.top;
      const height = rect.height;
      
      const progress = ((triggerPoint - start) / height) * 100;
      const clampedProgress = Math.min(Math.max(progress, 0), 100);
      
      setScrollProgress(prev => Math.max(prev, clampedProgress));
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
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-primary text-primary-foreground py-3 sm:py-4 rounded-full font-bold shadow-lg active:scale-95 transition-all"
                >
                  Refresh Page
                </button>
                <a href="/view" className="block">
                  <button className="w-full border-2 border-primary text-primary py-3 sm:py-4 rounded-full font-bold active:scale-95 transition-all">
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
  const finalQuoteToDisplay = page?.finalQuote || DEFAULT_QUOTES[page?.occasion] || DEFAULT_QUOTES["Other"];
  
  const globalStyle = {
    fontFamily: page?.font ? `${page.font}, sans-serif` : 'inherit'
  };

  const layout = page?.layout || 'Timeline';

  const renderMemories = () => {
    if (layout === 'Carousel') {
      return (
        <div className="max-w-5xl mx-auto px-4 py-20">
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {events.map((event, index) => (
                <CarouselItem key={event.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="p-1">
                    <EventCard 
                      title={event.title}
                      date={new Date(event.eventDate).toLocaleDateString()}
                      message={event.message}
                      imageUrl={event.imageUrl}
                      icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 text-primary-foreground" })}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center gap-4 mt-8">
              <CarouselPrevious className="static translate-y-0" />
              <CarouselNext className="static translate-y-0" />
            </div>
          </Carousel>
        </div>
      );
    }

    if (layout === 'Grid') {
      return (
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div key={event.id} className="reveal-on-scroll opacity-0 transition-all duration-700">
                <EventCard 
                  title={event.title}
                  date={new Date(event.eventDate).toLocaleDateString()}
                  message={event.message}
                  imageUrl={event.imageUrl}
                  icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 text-primary-foreground" })}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={timelineRef} className="relative max-w-6xl mx-auto px-4 pt-10 sm:pt-20">
        <div className="absolute left-1/2 transform -translate-x-1/2 w-1 timeline-line h-full z-0 opacity-20" />
        <div 
          className="absolute left-1/2 transform -translate-x-1/2 w-1.5 z-10 timeline-glow-line"
          style={{ height: `${scrollProgress}%` }}
        />

        <div className="space-y-16 sm:space-y-32 relative z-10">
          {events.map((event, index) => (
            <div 
              key={event.id} 
              className={cn(
                "flex flex-col md:flex-row items-center justify-between group gap-8 md:gap-0 relative",
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              )}
            >
              <div className={cn(
                "w-full md:w-[45%] reveal-on-scroll",
                index % 2 === 0 ? "reveal-left" : "reveal-right"
              )}>
                <EventCard 
                  title={event.title}
                  date={new Date(event.eventDate).toLocaleDateString()}
                  message={event.message}
                  imageUrl={event.imageUrl}
                  icon={React.cloneElement(icons[index % icons.length] as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" })}
                />
              </div>

              <div className={cn(
                "hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full border-[3px] transition-all duration-500 z-20 bg-background shadow-sm",
                scrollProgress > (index / events.length) * 100 ? "border-secondary scale-110 shadow-[0_0_15px_rgba(255,182,193,0.4)]" : "border-primary/40"
              )}> 
                <div className={cn(
                  "w-3 h-3 sm:w-5 sm:h-5 rounded-full transition-colors duration-500",
                  scrollProgress > (index / events.length) * 100 ? "bg-secondary" : "bg-primary/20"
                )} />
              </div>

              <div className="hidden md:block md:w-[45%]" />
            </div>
          ))}
          <div className="h-64" />
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-background overflow-x-hidden" style={globalStyle}>
      <Header title={page?.title} occasion={page?.occasion} />
       
      <section className="py-12 sm:py-20 overflow-hidden">
        <div className="text-center mb-12 sm:mb-16 px-4">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4" style={{ fontFamily: page?.font || 'inherit' }}>{page?.title || 'Our Journey'}</h2>
          <div className="w-16 sm:w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>
        
        {renderMemories()}

        <div className="flex flex-col items-center justify-center pt-20 sm:pt-32 pb-20 relative min-h-[85vh]">
          <div className={cn(
            "relative transition-all duration-1000 transform w-full max-w-2xl flex flex-col items-center px-4",
            (layout !== 'Timeline' || scrollProgress > 95) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20 pointer-events-none"
          )}>
            {layout === 'Timeline' && (
              <div 
                className="absolute -top-32 left-1/2 transform -translate-x-1/2 w-1.5 timeline-glow-line z-10" 
                style={{ height: scrollProgress > 95 ? '128px' : '0' }}
              />
            )}

            <div className="z-30 mb-6 sm:mb-8 bg-white p-3 sm:p-4 rounded-full shadow-2xl border-4 border-secondary">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-secondary fill-secondary" />
            </div>

            <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden bg-white/95 backdrop-blur-md relative z-20 w-full mb-12">
              <div className="h-1.5 sm:h-2 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
              
              <CardContent className="p-8 sm:p-12 text-center space-y-4 sm:space-y-6 pt-12 sm:pt-16">
                <Quote className="w-10 h-10 sm:w-12 sm:h-12 text-secondary/30 mx-auto mb-2 sm:mb-4" />
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                  To Many More Years of Joy, {page?.recipientName}!
                </h3>
                <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground italic leading-relaxed">
                  "{finalQuoteToDisplay}"
                </p>
                <div className="flex items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                  <Sparkles className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
                  <div className="h-px w-12 sm:w-20 bg-secondary/20" />
                  <Sparkles className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </CardContent>
            </Card>

            <div className="z-20">
              <Link href="/">
                <Button size="lg" className="rounded-full px-8 py-7 text-lg font-bold shadow-2xl hover:scale-105 transition-all bg-secondary text-secondary-foreground hover:bg-secondary/90 border-none">
                  <Gift className="mr-2 h-6 w-6" />
                  Create a surprise for your loved one
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="py-8 sm:py-10 text-center bg-primary/5 px-4">
        <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground opacity-50">
            Created with love by {page?.creatorName}
          </p>
        </div>
      </footer>
    </main>
  );
}
