"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser, useAuth } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, resendVerificationEmail } from '@/firebase/non-blocking-login';
import { Sparkles, Gift, Loader2, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    initiateEmailSignUp(auth, email, password)
      .then(() => {
        setIsSubmitting(false);
        setVerificationSent(true);
        toast({
          title: "Verification Sent",
          description: "Please check your email to verify your account.",
        });
      })
      .catch((error: any) => {
        setIsSubmitting(false);
        if (error.code === 'auth/email-already-in-use') {
          toast({
            variant: "destructive",
            title: "Account exists",
            description: "This email is already registered. Please log in instead.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Sign up failed",
            description: error.message || "Please use a valid email address.",
          });
        }
      });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsSubmitting(true);
    initiateEmailSignIn(auth, email, password)
      .then((credential) => {
        setIsSubmitting(false);
        if (!credential.user.emailVerified) {
          setVerificationSent(true);
          toast({
            variant: "default",
            title: "Email Not Verified",
            description: "Please verify your email to access the dashboard.",
          });
        } else {
          router.push('/dashboard');
        }
      })
      .catch((error: any) => {
        setIsSubmitting(false);
        // Firebase error codes for non-existent users or bad passwords
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "No account found with this email. Please sign up first.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Login failed",
            description: "Invalid email or password. Please try again.",
          });
        }
      });
  };

  const handleResend = () => {
    if (auth.currentUser) {
      resendVerificationEmail(auth.currentUser).then(() => {
        toast({ title: "Email Resent", description: "Check your inbox for the new link." });
      });
    }
  };

  // Only allow dashboard access if the user is signed in, NOT anonymous, and VERIFIED
  const isFullyAuthenticated = user && !user.isAnonymous && user.emailVerified;

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F8FF] p-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {isUserLoading ? (
          <Button disabled size="lg" className="rounded-full px-10 py-8 text-xl font-bold shadow-xl bg-[#E6E6FA] text-[#2D2D5F]">
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Loading...
          </Button>
        ) : isFullyAuthenticated ? (
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full px-10 py-8 text-xl font-bold shadow-xl hover:scale-105 transition-all bg-[#E6E6FA] text-[#2D2D5F] border-none hover:bg-[#D8D8F0]">
              <Sparkles className="mr-3 h-6 w-6" />
              Manage Surprises
            </Button>
          </Link>
        ) : (
          <Dialog onOpenChange={(open) => !open && setVerificationSent(false)}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full px-10 py-8 text-xl font-bold shadow-xl hover:scale-105 transition-all bg-[#E6E6FA] text-[#2D2D5F] border-none hover:bg-[#D8D8F0]"
              >
                <Sparkles className="mr-3 h-6 w-6" />
                Create a Surprise
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-[2rem] overflow-hidden">
              {verificationSent ? (
                <div className="py-10 px-4 flex flex-col items-center text-center space-y-6 animate-in fade-in zoom-in-95">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Mail className="h-10 w-10 text-primary animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-headline font-bold">Verify Your Email</h2>
                    <p className="text-muted-foreground">We sent a secure verification link to <strong>{email}</strong>. Please check your inbox.</p>
                  </div>
                  <div className="w-full space-y-3">
                    <Button variant="outline" className="w-full rounded-full h-12" onClick={() => window.location.reload()}>
                      <CheckCircle2 className="mr-2 h-4 w-4" /> I've Verified My Email
                    </Button>
                    <Button variant="ghost" className="w-full text-xs underline" onClick={handleResend}>
                      Didn't get an email? Resend link
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-headline text-center">Start Your Surprise</DialogTitle>
                  </DialogHeader>
                  <Tabs defaultValue="signup" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-full mb-6">
                      <TabsTrigger value="signup" className="rounded-full">Sign Up</TabsTrigger>
                      <TabsTrigger value="login" className="rounded-full">Log In</TabsTrigger>
                    </TabsList>
                    <TabsContent value="signup" className="space-y-4">
                      <form onSubmit={handleSignUp} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="s-email">Email</Label>
                          <Input id="s-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="s-password">Password</Label>
                          <Input id="s-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground border border-dashed">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <p>We'll send a verification link to ensure this is a real email address.</p>
                        </div>
                        <Button type="submit" className="w-full rounded-full h-12 text-lg" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                        </Button>
                      </form>
                    </TabsContent>
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleSignIn} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="l-email">Email</Label>
                          <Input id="l-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="l-password">Password</Label>
                          <Input id="l-password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full rounded-full h-12 text-lg" disabled={isSubmitting}>
                          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}
        
        <Link href="/view">
          <Button variant="outline" size="lg" className="rounded-full px-10 py-8 text-xl font-bold shadow-lg hover:scale-105 transition-all bg-white hover:bg-slate-50 border-none text-slate-900">
            <Gift className="mr-3 h-6 w-6" />
            Open a Surprise
          </Button>
        </Link>
      </div>
    </main>
  );
}
