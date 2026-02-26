
"use client";

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Heart, Star, Sparkles, Gift, Camera } from 'lucide-react';

interface CollageLayoutProps {
  events: any[];
  recipientName?: string;
  creatorName?: string;
  pattern?: string;
}

/**
 * A simplified image component for the collage that respects custom pan/zoom data.
 */
const CollageImage = ({ event, className }: { event: any, className?: string }) => {
  if (!event) return <div className={cn("bg-muted w-full h-full", className)} />;
  
  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-muted", className)}>
      <Image 
        src={event.imageUrl} 
        alt={event.title}
        fill
        className="object-cover"
        style={{
          transform: `scale(${event.imageZoom || 1}) translate(${event.imageX || 0}%, ${event.imageY || 0}%)`
        }}
      />
    </div>
  );
};

/* --- STYLE COMPONENTS BASED ON USER IMAGE --- */

const Style1 = ({ events, name }: { events: any[], name: string }) => (
  <div className="grid grid-cols-2 grid-rows-2 gap-4 aspect-square bg-white p-4 shadow-xl relative rounded-sm">
    <CollageImage event={events[0]} />
    <CollageImage event={events[1]} />
    <CollageImage event={events[2]} />
    <CollageImage event={events[3]} />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white px-6 py-4 shadow-lg border border-muted text-center max-w-[60%]">
        <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 mb-1">Surprise</p>
        <p className="font-headline font-bold text-sm leading-tight">{name}</p>
      </div>
    </div>
  </div>
);

const Style2 = ({ events }: { events: any[] }) => (
  <div className="grid grid-cols-3 grid-rows-3 gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted">
      <p className="font-headline text-xl font-bold leading-none tracking-tighter">LO</p>
      <p className="font-headline text-xl font-bold leading-none tracking-tighter text-primary">VE</p>
    </div>
    {[...Array(Math.min(8, events.length))].map((_, i) => (
      <CollageImage key={i} event={events[i]} />
    ))}
    {events.length < 8 && [...Array(8 - events.length)].map((_, i) => (
      <div key={`empty-${i}`} className="bg-muted/10 w-full h-full" />
    ))}
  </div>
);

const Style3 = ({ events }: { events: any[] }) => (
  <div className="flex flex-col gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <div className="h-12 flex items-center justify-center border-y border-muted">
      <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-60">MEMORY CHAPTER</p>
    </div>
    <CollageImage event={events[0]} className="flex-1" />
  </div>
);

const Style4 = ({ events, name, creator }: { events: any[], name: string, creator: string }) => (
  <div className="grid grid-cols-2 grid-rows-2 gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <CollageImage event={events[0]} />
    <div className="flex items-center justify-center text-center p-2">
      <p className="font-headline text-xs uppercase tracking-widest font-bold">{name}</p>
    </div>
    <div className="flex items-center justify-center text-center p-2">
      <p className="font-headline text-xs uppercase tracking-widest font-bold">{creator}</p>
    </div>
    <CollageImage event={events[1]} />
  </div>
);

const Style5 = ({ events }: { events: any[] }) => (
  <div className="grid grid-cols-3 gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <div className="col-span-2">
      <CollageImage event={events[0]} />
    </div>
    <div className="grid grid-rows-2 gap-4">
      <CollageImage event={events[1]} />
      <CollageImage event={events[2]} />
    </div>
  </div>
);

const Style6 = ({ events, name }: { events: any[], name: string }) => (
  <div className="grid grid-cols-2 gap-4 aspect-square bg-white p-4 shadow-xl relative rounded-sm">
    <CollageImage event={events[0]} />
    <CollageImage event={events[1]} />
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="bg-white p-4 shadow-xl flex flex-col items-center gap-1 border border-muted min-w-[80px]">
        <Heart className="w-6 h-6 text-primary fill-primary" />
        <p className="text-[8px] uppercase font-bold tracking-tighter opacity-60">{name}</p>
      </div>
    </div>
  </div>
);

const Style7 = ({ events }: { events: any[] }) => (
  <div className="grid grid-rows-3 gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <div className="row-span-2">
      <CollageImage event={events[0]} />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <CollageImage event={events[1]} />
      <CollageImage event={events[2]} />
    </div>
  </div>
);

const Style8 = ({ events }: { events: any[] }) => (
  <div className="grid grid-cols-3 gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <div className="col-span-2">
      <CollageImage event={events[0]} />
    </div>
    <div className="grid grid-rows-3 gap-4">
      <CollageImage event={events[1]} />
      <CollageImage event={events[2]} />
      <CollageImage event={events[3]} />
    </div>
  </div>
);

const Style9 = ({ events }: { events: any[] }) => (
  <div className="grid grid-rows-3 gap-4 aspect-square bg-white p-4 shadow-xl rounded-sm">
    <div className="grid grid-cols-2 gap-4 row-span-1">
      <CollageImage event={events[0]} />
      <CollageImage event={events[1]} />
    </div>
    <div className="row-span-2">
      <CollageImage event={events[2]} />
    </div>
  </div>
);

export function CollageLayout({ 
  events, 
  recipientName = "Friend", 
  creatorName = "Loved One",
  pattern = "Adaptive"
}: CollageLayoutProps) {
  // Adaptive chunking based on the selection
  const chunks = React.useMemo(() => {
    const result = [];
    const evts = [...events];
    
    if (pattern !== "Adaptive") {
      // Determine how many images per block for the chosen style
      const counts: Record<string, number> = {
        "Style 1": 4, "Style 2": 8, "Style 3": 1, "Style 4": 2, 
        "Style 5": 3, "Style 6": 2, "Style 7": 3, "Style 8": 4, "Style 9": 3
      };
      const count = counts[pattern] || 1;
      
      for (let i = 0; i < evts.length; i += count) {
        result.push({ type: pattern, data: evts.slice(i, i + count) });
      }
      return result;
    }

    // Default "Adaptive" logic
    let i = 0;
    while (i < evts.length) {
      const remaining = evts.length - i;
      
      if (remaining >= 8) {
        result.push({ type: 'Style 2', data: evts.slice(i, i + 8) });
        i += 8;
      } else if (remaining >= 4) {
        const type = Math.random() > 0.5 ? 'Style 1' : 'Style 8';
        result.push({ type, data: evts.slice(i, i + 4) });
        i += 4;
      } else if (remaining >= 3) {
        const types = ['Style 5', 'Style 7', 'Style 9'];
        const type = types[Math.floor(Math.random() * types.length)];
        result.push({ type, data: evts.slice(i, i + 3) });
        i += 3;
      } else if (remaining >= 2) {
        const type = Math.random() > 0.5 ? 'Style 4' : 'Style 6';
        result.push({ type, data: evts.slice(i, i + 2) });
        i += 2;
      } else {
        result.push({ type: 'Style 3', data: evts.slice(i, i + 1) });
        i += 1;
      }
    }
    return result;
  }, [events, pattern]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16">
        {chunks.map((chunk, idx) => (
          <div key={idx} className="reveal-on-scroll opacity-0 translate-y-10 transition-all duration-1000">
            {chunk.type === 'Style 1' && <Style1 events={chunk.data} name={recipientName} />}
            {chunk.type === 'Style 2' && <Style2 events={chunk.data} />}
            {chunk.type === 'Style 3' && <Style3 events={chunk.data} />}
            {chunk.type === 'Style 4' && <Style4 events={chunk.data} name={recipientName} creator={creatorName} />}
            {chunk.type === 'Style 5' && <Style5 events={chunk.data} />}
            {chunk.type === 'Style 6' && <Style6 events={chunk.data} name={recipientName} />}
            {chunk.type === 'Style 7' && <Style7 events={chunk.data} />}
            {chunk.type === 'Style 8' && <Style8 events={chunk.data} />}
            {chunk.type === 'Style 9' && <Style9 events={chunk.data} />}
          </div>
        ))}
      </div>
    </div>
  );
}
