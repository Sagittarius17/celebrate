
"use client";

import React, { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Key, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export default function SurpriseEntry() {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!code.trim()) return;
    setIsVerifying(true);

    try {
      // 1. Ensure user is signed in (anonymously or otherwise)
      let currentUser = user;
      if (!currentUser) {
        initiateAnonymousSignIn(auth);
        // Wait briefly for auth to trigger (in a real app, this should be more robust)
        await new Promise(r => setTimeout(r, 2000));
      }

      // 2. Search for the page with this access code
      // Note: In production, this logic would be in a Cloud Function for security.
      // For this MVP, we search across all users' celebrationPages collections.
      // However, Firestore doesn't support searching subcollections easily without Collection Groups.
      // We will assume the code verification happens against a collection of surprise IDs or similar.
      // For now, we'll demonstrate the intent by showing the "view" logic.
      
      // MOCK: In a real implementation, you'd have a top-level `publicSurprises` map
      // or use a Cloud Function to handle the "viewerUids" logic.
      
      // Let's assume for this prototype we look for it in a way that respects the structure
      // we've been given, but since we can't query across unknown user IDs easily without 
      // Collection Group indexes, we'll redirect to a simplified dynamic surprise page.
      
      // For this demo, we'll search for the page by its access code. 
      // This is a placeholder for the Cloud Function logic.
      
      router.push(`/view/${encodeURIComponent(code)}`);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
        <div className="h-4 w-full bg-gradient-to-r from-primary via-secondary to-primary" />
        <CardHeader className="text-center pt-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl font-bold">A Surprise Awaits!</CardTitle>
          <CardDescription className="text-lg">Enter your secret code to reveal your birthday journey.</CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-4 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-base font-semibold ml-2">Secret Code</Label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                id="code"
                placeholder="Type your code here..." 
                className="pl-12 py-6 rounded-2xl text-lg font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>
          </div>

          <Button 
            className="w-full py-8 rounded-2xl text-xl font-bold shadow-xl transition-all active:scale-95"
            onClick={handleVerify}
            disabled={isVerifying || !code.trim()}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Verifying...
              </>
            ) : (
              "Reveal My Surprise"
            )}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <AlertCircle className="h-4 w-4" />
            <span>Codes are case-sensitive</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
