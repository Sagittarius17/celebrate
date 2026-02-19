
"use client";

import { Header } from '@/components/birthday/Header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { useAuth } from '@/firebase';
import { Sparkles, Gift } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="font-headline text-5xl font-bold">Create Magic Today</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Design a beautiful, interactive timeline of memories for someone special. 
              Secure it with a secret code only they know.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {!user ? (
              <Button 
                size="lg" 
                className="rounded-full px-8 py-6 text-lg font-bold shadow-xl hover:scale-105 transition-transform"
                onClick={() => initiateAnonymousSignIn(auth)}
                disabled={isUserLoading}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating
              </Button>
            ) : (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg font-bold shadow-xl hover:scale-105 transition-transform">
                  <Sparkles className="mr-2 h-5 w-5" />
                  My Dashboard
                </Button>
              </Link>
            )}
            
            <Link href="/view">
              <Button variant="outline" size="lg" className="rounded-full px-8 py-6 text-lg font-bold shadow-md hover:bg-secondary/10">
                <Gift className="mr-2 h-5 w-5" />
                Open a Surprise
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <footer className="py-20 text-center bg-primary/5">
        <div className="max-w-2xl mx-auto px-4 space-y-6">
          <h3 className="font-headline text-3xl font-bold">To Many More Years...</h3>
          <p className="font-body text-muted-foreground italic">
            "The best is yet to come."
          </p>
          <div className="flex justify-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">✨</div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">🎂</div>
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">💖</div>
          </div>
        </div>
      </footer>
    </main>
  );
}
