'use server';
/**
 * @fileOverview A Genkit flow for searching Spotify tracks by name.
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
  imageUrl: z.string().optional().describe('A URL to the album artwork.'),
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
  prompt: `You are an AI assistant that helps users find Spotify Track IDs for their favorite songs.
User Query: "{{{query}}}"

Please provide a list of up to 5 real, popular songs that match this query. 
For each song, provide the correct Spotify Track ID. You should know these from your training data for common and popular songs.
If the song is very obscure, provide the closest popular match.
Try to include the album artwork URL if you can recall a valid one from Spotify's CDN (e.g., https://i.scdn.co/image/...), or leave it blank.`,
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
