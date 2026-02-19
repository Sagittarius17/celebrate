"use client";

import React, { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, Key, ArrowRight, Gift, PartyPopper } from 'lucide-react';
import Link from 'next/link';

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
  const db = useFirestore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSurprise, setNewSurprise] = useState({
    recipientName: '',
    title: '',
    occasion: 'Birthday',
    accessCode: '',
  });

  const celebrationPagesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'celebrationPages');
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
      viewerUids: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addDocumentNonBlocking(collection(db, 'users', user.uid, 'celebrationPages'), payload);
    setIsCreateOpen(false);
    setNewSurprise({ recipientName: '', title: '', occasion: 'Birthday', accessCode: '' });
  };

  if (isUserLoading) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <div className="p-20 text-center">Please sign in to create surprises.</div>;

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-headline font-bold">Your Celebrations</h1>
            <p className="text-muted-foreground">Manage and create interactive surprises</p>
          </div>
          
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
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Key className="h-4 w-4 mr-2" /> Code: <code className="bg-muted px-2 py-0.5 rounded ml-2 font-bold">{surprise.accessCode}</code>
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
