
import { Header } from '@/components/birthday/Header';
import { Timeline } from '@/components/birthday/Timeline';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="py-20">
        <div className="text-center mb-16 px-4">
          <h2 className="font-headline text-5xl font-bold mb-4">Our Journey</h2>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full" />
        </div>
        <Timeline />
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
