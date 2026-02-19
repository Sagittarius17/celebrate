'use server';
/**
 * @fileOverview An AI agent that suggests suitable animated 3D models and their ideal placement for a given timeline event.
 *
 * - suggestTimelineVisuals - A function that handles the suggestion process.
 * - SuggestTimelineVisualsInput - The input type for the suggestTimelineVisuals function.
 * - SuggestTimelineVisualsOutput - The return type for the suggestTimelineVisuals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTimelineVisualsInputSchema = z.object({
  eventDescription: z
    .string()
    .describe('A description of the timeline event, including its context and emotional tone.'),
});
export type SuggestTimelineVisualsInput = z.infer<typeof SuggestTimelineVisualsInputSchema>;

const SuggestedModelSchema = z.object({
  modelName: z
    .string()
    .describe('The name of the suggested 3D model (e.g., flower, heart, cute teddy, party balloon).'),
  placementDescription: z
    .string()
    .describe('A description of the ideal placement for the 3D model relative to the timeline event card (e.g., "floating above the card", "at the bottom left corner").'),
});

const SuggestTimelineVisualsOutputSchema = z.object({
  suggestions: z.array(SuggestedModelSchema).describe('An array of suggested 3D models and their placements.'),
});
export type SuggestTimelineVisualsOutput = z.infer<typeof SuggestTimelineVisualsOutputSchema>;

export async function suggestTimelineVisuals(
  input: SuggestTimelineVisualsInput
): Promise<SuggestTimelineVisualsOutput> {
  return suggestTimelineVisualsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTimelineVisualsPrompt',
  input: {schema: SuggestTimelineVisualsInputSchema},
  output: {schema: SuggestTimelineVisualsOutputSchema},
  prompt: `You are an expert visual designer for interactive, animated birthday celebration landing pages.
Your goal is to suggest suitable animated 3D models (e.g., flowers, hearts, cute teddy, cartoons, party balloons, cake slices, gifts) and their ideal placement for a given timeline event.
The overall aesthetic uses a cheerful pastel color scheme.

Analyze the following event description and provide suggestions for 3D models and their placement that enhance the visual timeline experience.

Event Description: {{{eventDescription}}}
`,
});

const suggestTimelineVisualsFlow = ai.defineFlow(
  {
    name: 'suggestTimelineVisualsFlow',
    inputSchema: SuggestTimelineVisualsInputSchema,
    outputSchema: SuggestTimelineVisualsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
