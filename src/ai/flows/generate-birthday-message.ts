'use server';
/**
 * @fileOverview A Genkit flow for generating personalized birthday messages.
 *
 * - generateBirthdayMessage - A function that handles the birthday message generation process.
 * - GenerateBirthdayMessageInput - The input type for the generateBirthdayMessage function.
 * - GenerateBirthdayMessageOutput - The return type for the generateBirthdayMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBirthdayMessageInputSchema = z.object({
  eventName: z
    .string()
    .optional()
    .describe('The name of the specific event (e.g., "First Birthday", "High School Graduation").'),
  personName: z.string().describe('The name of the person being celebrated.'),
  eventDescription: z
    .string()
    .optional()
    .describe(
      'A brief description of the event or the person being celebrated, including any key memories or achievements.'
    ),
  tone: z
    .string()
    .optional()
    .describe('The desired tone for the message (e.g., "heartfelt", "funny", "inspirational").'),
});
export type GenerateBirthdayMessageInput = z.infer<typeof GenerateBirthdayMessageInputSchema>;

const GenerateBirthdayMessageOutputSchema = z.object({
  message: z.string().describe('The personalized birthday message.'),
});
export type GenerateBirthdayMessageOutput = z.infer<typeof GenerateBirthdayMessageOutputSchema>;

export async function generateBirthdayMessage(
  input: GenerateBirthdayMessageInput
): Promise<GenerateBirthdayMessageOutput> {
  return generateBirthdayMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBirthdayMessagePrompt',
  input: {schema: GenerateBirthdayMessageInputSchema},
  output: {schema: GenerateBirthdayMessageOutputSchema},
  prompt: `You are an AI assistant specialized in crafting unique and personalized celebratory messages.

Generate a birthday message for {{{personName}}} for the event {{{eventName}}}. Focus on the following details:

Event Description: {{{eventDescription}}}
Desired Tone: {{{tone}}}

Ensure the message is heartfelt and joyful. If an event name or description is not provided, generate a general but warm birthday message for {{{personName}}}.`,
});

const generateBirthdayMessageFlow = ai.defineFlow(
  {
    name: 'generateBirthdayMessageFlow',
    inputSchema: GenerateBirthdayMessageInputSchema,
    outputSchema: GenerateBirthdayMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
