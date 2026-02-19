
import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Chronos Birthday | A Joyful Timeline',
  description: 'An interactive, animated birthday celebration landing page featuring a scroll-driven timeline.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=PT+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Lora:wght@400;700&family=Quicksand:wght@400;700&family=Merriweather:wght@400;700&family=Oswald:wght@400;700&family=Dancing+Script:wght@400;700&family=Caveat:wght@400;700&family=Pacifico&family=Lobster&family=Cinzel:wght@400;700&family=Comfortaa:wght@400;700&family=Great+Vibes&family=Sacramento&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
