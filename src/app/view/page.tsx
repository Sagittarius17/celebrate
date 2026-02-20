
"use client";

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Key, Gift, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function SurpriseEntry() {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleVerify = async () => {
    if (!code.trim()) return;
    setIsVerifying(true);

    try {
      const q = query(collection(db, 'celebrationPages'), where('accessCode', '==', code.trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: "We couldn't find a surprise with that code. Please try again.",
        });
        setIsVerifying(false);
        return;
      }

      const page = snap.docs[0].data();
      // Use Surprise ID and Access Code in the URL for direct, reliable lookup
      router.push(`/view/${encodeURIComponent(`${page.id}-${code.trim()}`)}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
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
