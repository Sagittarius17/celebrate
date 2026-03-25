
'use server';
/**
 * @fileOverview A Genkit flow for searching YouTube Music tracks.
 *
 * - searchYouTubeTracks - A function that returns matching YouTube Music tracks.
 * - SearchYouTubeTracksInput - The input type for the searchYouTubeTracks function.
 * - SearchYouTubeTracksOutput - The return type for the searchYouTubeTracks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import YTMusic from 'ytmusic-api';

const TrackSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist or channel name.'),
  videoId: z.string().describe('The YouTube Video ID.'),
  imageUrl: z.string().optional().describe('A URL to the thumbnail image.'),
  durationMs: z.number().describe('The duration of the track in milliseconds.'),
});

const SearchYouTubeTracksInputSchema = z.object({
  query: z.string().describe('The search query for the song or artist.'),
});
export type SearchYouTubeTracksInput = z.infer<typeof SearchYouTubeTracksInputSchema>;

const SearchYouTubeTracksOutputSchema = z.object({
  tracks: z.array(TrackSchema).describe('An array of matching YouTube Music tracks.'),
});
export type SearchYouTubeTracksOutput = z.infer<typeof SearchYouTubeTracksOutputSchema>;

export async function searchYouTubeTracks(
  input: SearchYouTubeTracksInput
): Promise<SearchYouTubeTracksOutput> {
  return searchYouTubeTracksFlow(input);
}

const searchYouTubeTracksFlow = ai.defineFlow(
  {
    name: 'searchYouTubeTracksFlow',
    inputSchema: SearchYouTubeTracksInputSchema,
    outputSchema: SearchYouTubeTracksOutputSchema,
  },
  async input => {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();
    
    // We use the 'song' filter to get high-quality audio results
    const results = await ytmusic.searchSongs(input.query);
    
    const tracks = results.slice(0, 5).map(song => ({
      title: song.name,
      artist: song.artists[0]?.name || 'Unknown Artist',
      videoId: song.videoId,
      imageUrl: song.thumbnails[song.thumbnails.length - 1]?.url,
      durationMs: (song.duration || 0) * 1000,
    }));

    return { tracks };
  }
);
