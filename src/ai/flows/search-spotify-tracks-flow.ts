
'use server';
/**
 * @fileOverview A Genkit flow for searching Spotify tracks by name, including track duration.
 *
 * - searchSpotifyTracks - A function that returns matching Spotify tracks.
 * - SearchSpotifyTracksInput - The input type for the searchSpotifyTracks function.
 * - SearchSpotifyTracksOutput - The return type for the searchSpotifyTracks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrackSchema = z.object({
  title: z.string().describe('The title of the song.'),
  artist: z.string().describe('The artist of the song.'),
  trackId: z.string().describe('The Spotify Track ID (e.g., "4PTG3C64LUButARq9I9Uf8").'),
  imageUrl: z.string().optional().describe('A URL to the album artwork starting with https://i.scdn.co/image/ or https://image-cdn-ak.spotifycdn.com/image/'),
  durationMs: z.number().optional().describe('The duration of the track in milliseconds.'),
});

const SearchSpotifyTracksInputSchema = z.object({
  query: z.string().describe('The name of the song or artist to search for.'),
});
export type SearchSpotifyTracksInput = z.infer<typeof SearchSpotifyTracksInputSchema>;

const SearchSpotifyTracksOutputSchema = z.object({
  tracks: z.array(TrackSchema).describe('An array of matching Spotify tracks.'),
});
export type SearchSpotifyTracksOutput = z.infer<typeof SearchSpotifyTracksOutputSchema>;

export async function searchSpotifyTracks(
  input: SearchSpotifyTracksInput
): Promise<SearchSpotifyTracksOutput> {
  return searchSpotifyTracksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchSpotifyTracksPrompt',
  input: {schema: SearchSpotifyTracksInputSchema},
  output: {schema: SearchSpotifyTracksOutputSchema},
  prompt: `You are a music search expert with access to a vast database of Spotify metadata.

User Query: "{{{query}}}"

Instructions:
1. Identify up to 5 real songs that best match the query.
2. Provide the EXACT 22-character Spotify Track ID.
3. Provide the correct Album Artwork URL. Use direct CDN links like:
   - https://i.scdn.co/image/<hash>
   - https://image-cdn-ak.spotifycdn.com/image/<hash>
4. Provide the approximate DURATION in milliseconds (durationMs) for each track.
5. If you are unsure of a specific track's ID, prioritize the most popular/original version of the song which has stable metadata.
6. If you cannot find a valid image URL for a song, omit the imageUrl field entirely.`,
});

const searchSpotifyTracksFlow = ai.defineFlow(
  {
    name: 'searchSpotifyTracksFlow',
    inputSchema: SearchSpotifyTracksInputSchema,
    outputSchema: SearchSpotifyTracksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
