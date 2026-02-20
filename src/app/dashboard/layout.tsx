
"use client";

import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <div className="fixed top-6 right-6 z-[100]">
          <Button 
            variant="secondary" 
            size="icon" 
            className="rounded-full shadow-lg h-12 w-12 border-none bg-background/80 backdrop-blur-md hover:bg-background"
            onClick={() => setIsDark(!isDark)}
          >
            {isDark ? <Sun className="h-6 w-6 text-yellow-400" /> : <Moon className="h-6 w-6 text-slate-700" />}
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
