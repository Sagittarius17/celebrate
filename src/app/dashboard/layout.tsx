"use client";

import React, { useState, createContext, useContext, useEffect } from 'react';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useDashboardTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useDashboardTheme must be used within a DashboardLayout");
  return context;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const toggleTheme = () => setIsDark(!isDark);

  // Protected route logic: ensure user is verified
  useEffect(() => {
    if (!isUserLoading && (!user || (user && !user.isAnonymous && !user.emailVerified))) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Validating session...</p>
      </div>
    );
  }

  // If user is not verified, they shouldn't see the dashboard content
  if (user && !user.isAnonymous && !user.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md w-full text-center space-y-8 p-10 bg-card rounded-[3rem] shadow-2xl border border-dashed">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-headline font-bold">Verification Required</h1>
            <p className="text-muted-foreground leading-relaxed">Your account exists, but we need to confirm your email before you can create surprises.</p>
          </div>
          <Button className="w-full rounded-full h-12" onClick={() => window.location.reload()}>
            <CheckCircle2 className="mr-2 h-4 w-4" /> I've Verified My Email
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? 'dark' : ''}>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
