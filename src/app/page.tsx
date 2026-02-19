
"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Sparkles, Gift } from 'lucide-react';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#F8F8FF] p-4">
      <div className="text-center space-y-16 animate-fade-in">
        <div className="space-y-4">
          <h1 className="font-headline text-6xl md:text-8xl font-bold tracking-tight text-[#1A1A3A]">
            Chronos <span className="text-[#6C63FF]">Birthday</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto italic font-body">
            "Capturing the magic of your most beautiful milestones."
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          {!user ? (
            <Button 
              size="lg" 
              className="rounded-full px-10 py-8 text-xl font-bold shadow-xl hover:scale-105 transition-all bg-[#E6E6FA] text-[#2D2D5F] border-none hover:bg-[#D8D8F0]"
              onClick={() => initiateAnonymousSignIn(auth)}
              disabled={isUserLoading}
            >
              <Sparkles className="mr-3 h-6 w-6" />
              Start Creating
            </Button>
          ) : (
            <Link href="/dashboard">
              <Button size="lg" className="rounded-full px-10 py-8 text-xl font-bold shadow-xl hover:scale-105 transition-all bg-[#E6E6FA] text-[#2D2D5F] border-none hover:bg-[#D8D8F0]">
                <Sparkles className="mr-3 h-6 w-6" />
                My Dashboard
              </Button>
            </Link>
          )}
          
          <Link href="/view">
            <Button variant="outline" size="lg" className="rounded-full px-10 py-8 text-xl font-bold shadow-lg hover:scale-105 transition-all bg-white hover:bg-slate-50 border-none text-slate-900">
              <Gift className="mr-3 h-6 w-6" />
              Open a Surprise
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="absolute bottom-12 text-slate-400 text-sm font-medium tracking-[0.3em] uppercase">
        Create • Surprise • Celebrate
      </div>
    </main>
  );
}
