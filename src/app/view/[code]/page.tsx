
"use client";

import React, { use, useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { collectionGroup, query, where, getDocs, collection, orderBy } from 'firebase/firestore';
import { Header } from '@/components/birthday/Header';
import { EventCard } from '@/components/birthday/EventCard';
import { ThreeDecoration } from '@/components/birthday/ThreeDecoration';
import { Star, Camera, Gift, PartyPopper, Cake, Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function SurpriseView({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const db = useFirestore();
  const [page, setPage] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSurprise = async () => {
      if (!db) return;
      setIsLoading(true);
      setError(null);

      try {
        // Find the page with matching access code using a collection group query
        // This requires a collectionGroup index for 'celebrationPages' on 'accessCode'
        const pagesQuery = query(
          collectionGroup(db, 'celebrationPages'),
          where('accessCode', '==', code)
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

        // Load events for this page
        // Since we have the path from the pageDoc, we can directly access its subcollection
        const eventsRef = collection(pageDoc.ref, 'birthdayEvents');
        const eventsQuery = query(eventsRef, orderBy('eventDate', 'asc'));
        const eventsSnap = await getDocs(eventsQuery);
        
        setEvents(eventsSnap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      } catch (err: any) {
        console.error(err);
        setError("Something went wrong while loading your surprise.");
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
        <p className="font-headline text-2xl font-bold">Unwrapping your surprise...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md rounded-3xl p-8">
          <AlertTitle className="text-xl font-bold mb-2">Oops!</AlertTitle>
          <AlertDescription className="text-lg">
            {error}
            <div className="mt-6">
              <a href="/view">
                <button className="bg-white text-destructive px-6 py-2 rounded-full font-bold shadow-sm">
                  Try Another Code
                </button>
              </a>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const icons = [<Star />, <Camera />, <Gift />, <PartyPopper />, <Cake />];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20">
        <div className="text-center mb-16 px-4">
          <h2 className="font-headline text-5xl font-bold mb-4">{page?.title || 'Our Journey'}</h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>
        
        <div className="relative max-w-6xl mx-auto px-4 py-20 overflow-hidden">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 timeline-line h-full z-0 opacity-50 hidden md:block" />

          <div className="space-y-32 relative z-10">
            {events.map((event, index) => (
              <div 
                key={event.id} 
                className={`flex flex-col md:flex-row items-center justify-between group reveal-on-scroll visible ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
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

                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 items-center justify-center w-12 h-12 rounded-full bg-white border-4 border-primary shadow-xl z-20 transition-all duration-300 group-hover:scale-125 bg-background">
                  <div className="w-4 h-4 rounded-full bg-secondary animate-pulse" />
                </div>

                <div className="w-full md:w-[45%] flex items-center justify-center p-8">
                  <div className="relative w-full h-48 md:h-64 flex items-center justify-center">
                    <ThreeDecoration 
                      type={index % 2 === 0 ? 'heart' : 'cube'}
                      className="w-48 h-48 animate-float"
                      color={index % 2 === 0 ? '#FFD1DC' : '#E6E6FA'}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="py-20 text-center bg-primary/5">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <h3 className="font-headline text-3xl font-bold">To Many More Years, {page?.recipientName}!</h3>
          <p className="font-body text-muted-foreground italic">
            "The best is yet to come."
          </p>
        </div>
      </footer>
    </main>
  );
}
