// SummarizeUserPreparation.ts
'use server';
/**
 * @fileOverview Summarizes a user's preparation history for a specific recipe.
 *
 * - summarizeUserPreparation - A function that generates a summary of a user's recipe preparation history.
 * - SummarizeUserPreparationInput - The input type for the summarizeUserPreparation function.
 * - SummarizeUserPreparationOutput - The return type for the summarizeUserPreparation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeUserPreparationInputSchema = z.object({
  userName: z.string().describe('The name of the user.'),
  recipeName: z.string().describe('The name of the recipe.'),
  preparationLogs: z.array(z.object({
    date: z.string(),
    duration: z.string(),
  })).describe('Array of preparation logs with date and duration.'),
});
export type SummarizeUserPreparationInput = z.infer<typeof SummarizeUserPreparationInputSchema>;

const SummarizeUserPreparationOutputSchema = z.object({
  summary: z.string().describe('A summary of the user\s preparation history for the recipe.'),
});
export type SummarizeUserPreparationOutput = z.infer<typeof SummarizeUserPreparationOutputSchema>;

export async function summarizeUserPreparation(input: SummarizeUserPreparationInput): Promise<SummarizeUserPreparationOutput> {
  return summarizeUserPreparationFlow(input);
}

const summarizeUserPreparationPrompt = ai.definePrompt({
  name: 'summarizeUserPreparationPrompt',
  input: {
    schema: SummarizeUserPreparationInputSchema,
  },
  output: {
    schema: SummarizeUserPreparationOutputSchema,
  },
  prompt: `You are an expert at summarizing user data.

  Given the following information about a user's recipe preparation history, create a concise summary.
  Include the total number of times the user has prepared the recipe, and the average preparation time.
  \n  User Name: {{{userName}}}
  Recipe Name: {{{recipeName}}}
  Preparation Logs:
  {{#each preparationLogs}}
  - Date: {{{date}}}, Duration: {{{duration}}}
  {{/each}}
  `,
});

const summarizeUserPreparationFlow = ai.defineFlow(
  {
    name: 'summarizeUserPreparationFlow',
    inputSchema: SummarizeUserPreparationInputSchema,
    outputSchema: SummarizeUserPreparationOutputSchema,
  },
  async input => {
    const {output} = await summarizeUserPreparationPrompt(input);
    return output!;
  }
);
