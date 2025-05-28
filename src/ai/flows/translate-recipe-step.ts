'use server';
/**
 * @fileOverview A translation AI agent.
 *
 * - translateRecipeStep - A function that handles the translation process.
 * - TranslateRecipeStepInput - The input type for the translateRecipeStep function.
 * - TranslateRecipeStepOutput - The return type for the translateRecipeStep function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateRecipeStepInputSchema = z.object({
  step: z.string().describe('The recipe step to translate.'),
  language: z.string().describe('The language to translate the step to.'),
});
export type TranslateRecipeStepInput = z.infer<typeof TranslateRecipeStepInputSchema>;

const TranslateRecipeStepOutputSchema = z.object({
  translatedStep: z.string().describe('The translated recipe step.'),
});
export type TranslateRecipeStepOutput = z.infer<typeof TranslateRecipeStepOutputSchema>;

export async function translateRecipeStep(
  input: TranslateRecipeStepInput
): Promise<TranslateRecipeStepOutput> {
  return translateRecipeStepFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateRecipeStepPrompt',
  input: {schema: TranslateRecipeStepInputSchema},
  output: {schema: TranslateRecipeStepOutputSchema},
  prompt: `Translate the following recipe step to {{language}}:\n\n{{step}}`,
});

const translateRecipeStepFlow = ai.defineFlow(
  {
    name: 'translateRecipeStepFlow',
    inputSchema: TranslateRecipeStepInputSchema,
    outputSchema: TranslateRecipeStepOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
