
"use client";

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, Key, ArrowRight, Gift, LogOut, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Graduation",
  "Wedding",
  "Promotion",
  "New Baby",
  "Retirement",
  "Other"
];

export default function Dashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newSurprise, setNewSurprise] = useState({
    recipientName: '',
    title: '',
    occasion: 'Birthday',
    accessCode: '',
  });

  const celebrationPagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    // Query top-level collection filtered by ownerId
    return query(collection(db, 'celebrationPages'), where('ownerId', '==', user.uid));
  }, [db, user]);

  const { data: surprises, isLoading } = useCollection(celebrationPagesQuery);

  const handleCreate = () => {
    if (!user || !db) return;
    
    const pageId = doc(collection(db, 'dummy')).id;
    const payload = {
      ...newSurprise,
      id: pageId,
      creatorName: user.displayName || 'Creator',
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'celebrationPages'), payload);
    setIsCreateOpen(false);
    setNewSurprise({ recipientName: '', title: '', occasion: 'Birthday', accessCode: '' });
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.push('/');
    });
  };

  const copyShareLink = (code: string, id: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/view/${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedId(id);
    toast({
      title: "Link Copied!",
      description: "Share this link and the code with your recipient.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isUserLoading) return <div className="p-20 text-center">Loading...</div>;

  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
        <Card className="max-w-md w-full p-8 text-center space-y-6 rounded-[2rem]">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Account Required</h1>
          <p className="text-muted-foreground">
            To create and manage interactive surprises, you need a registered account.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/">
              <Button className="w-full rounded-full">Go to Sign Up</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold">Your Celebrations</h1>
            <p className="text-muted-foreground">Manage and create interactive surprises</p>
          </div>
          
          <div className="flex gap-4">
            <Button variant="ghost" className="rounded-full" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log Out
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full shadow-lg h-12 px-6">
                  <Plus className="mr-2 h-5 w-5" /> New Surprise
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a New Surprise Page</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="occasion">What's the occasion?</Label>
                    <Select 
                      value={newSurprise.occasion} 
                      onValueChange={(val) => setNewSurprise({...newSurprise, occasion: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select occasion" />
                      </SelectTrigger>
                      <SelectContent>
                        {OCCASIONS.map(occ => (
                          <SelectItem key={occ} value={occ}>{occ}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="recipient">Who is this for?</Label>
                    <Input 
                      id="recipient" 
                      placeholder="e.g. Sarah Jones" 
                      value={newSurprise.recipientName}
                      onChange={(e) => setNewSurprise({...newSurprise, recipientName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Page Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Happy 25th Birthday, Sarah!" 
                      value={newSurprise.title}
                      onChange={(e) => setNewSurprise({...newSurprise, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="code">Secret Access Code</Label>
                    <Input 
                      id="code" 
                      placeholder="e.g. CELEBRATE-2024" 
                      value={newSurprise.accessCode}
                      onChange={(e) => setNewSurprise({...newSurprise, accessCode: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground italic">The recipient will need this to view their surprise.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button className="w-full" onClick={handleCreate} disabled={!newSurprise.recipientName || !newSurprise.accessCode}>Create Surprise</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-20">Loading your surprises...</div>
        ) : surprises?.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold">No surprises yet</h3>
            <p className="text-muted-foreground mb-6">Start by creating your first celebration page.</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">Create Now</Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surprises?.map((surprise) => (
              <Card key={surprise.id} className="group hover:shadow-xl transition-all duration-300 rounded-[2rem] overflow-hidden border-none shadow-md">
                <CardHeader className="bg-primary/10">
                  <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-2xl truncate pr-4">{surprise.title}</CardTitle>
                    <div className="bg-white/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                      {surprise.occasion}
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <User className="h-4 w-4" /> For {surprise.recipientName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Key className="h-4 w-4 mr-2" /> Code: <code className="bg-muted px-2 py-0.5 rounded ml-2 font-bold">{surprise.accessCode}</code>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2"
                      onClick={() => copyShareLink(surprise.accessCode, surprise.id)}
                    >
                      {copiedId === surprise.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" /> Created: {new Date(surprise.createdAt).toLocaleDateString()}
                  </div>
                  <Link href={`/dashboard/${surprise.id}`} className="block pt-2">
                    <Button className="w-full rounded-full group-hover:bg-primary group-hover:text-primary-foreground">
                      Edit Timeline <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
