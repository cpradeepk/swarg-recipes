
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RecipeFormData } from '@/lib/schemas/recipeSchemas';
import { RecipeFormSchema } from '@/lib/schemas/recipeSchemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, PlusCircle, Loader2, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createRecipeAction, updateRecipeAction } from '@/lib/actions/recipeActions';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';


interface RecipeFormProps {
  initialData?: RecipeFormData;
  recipeId?: string; // Added recipeId for updates
  onFormSubmit?: () => void;
}

const defaultFormValues: RecipeFormData = {
  name: '',
  category: '',
  description: '',
  imageUrl: '',
  aiHint: '',
  visibility: true,
  prepTime: '',
  cookTime: '',
  totalTime: '',
  servings: undefined,
  nutritionalInfoPerServing: { calories: undefined, protein: undefined, fat: undefined, carbs: undefined },
  ingredients: [{ name: '', quantity: 0, unit: '', imageUrl: '', aiHint: '' }],
  steps: [{ instruction: '', imageUrl: '', aiHint: '', timerInSeconds: undefined, temperature: '', selectedIngredientIndexes: [] }],
};

export default function RecipeForm({ initialData, recipeId, onFormSubmit }: RecipeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const isEditMode = !!initialData && !!recipeId;

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(RecipeFormSchema),
    defaultValues: initialData || defaultFormValues,
  });

  // Reset form if initialData changes (e.g., navigating from add to edit)
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset(defaultFormValues);
    }
  }, [initialData, form]);


  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: "ingredients",
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  const watchedIngredients = form.watch('ingredients');

  const onSubmit = async (data: RecipeFormData) => {
    setIsSubmitting(true);
    try {
      let result;
      if (isEditMode && recipeId) {
        result = await updateRecipeAction(recipeId, data);
      } else {
        result = await createRecipeAction(data);
      }

      if (result.success) {
        toast({
          title: `Recipe ${isEditMode ? 'Updated' : 'Created'}!`,
          description: `Recipe "${data.name}" has been successfully ${isEditMode ? 'updated' : 'added'}.`,
        });
        if (!isEditMode) {
          form.reset(defaultFormValues);
        }
        if (onFormSubmit) {
          onFormSubmit();
        }
        // Optionally, redirect after successful update/create
        router.push('/admin/recipes'); 
        router.refresh(); // To ensure the table data is up-to-date
      } else {
        toast({
          title: "Error",
          description: result.message || `Failed to ${isEditMode ? 'update' : 'create'} recipe.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Recipe' : 'Add New Recipe'}</CardTitle>
            <CardDescription>
              {isEditMode ? `Editing recipe: ${initialData?.name}` : 'Fill in the details for the new recipe.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name</FormLabel>
                  <FormControl><Input placeholder="e.g., Classic Pasta Carbonara" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl><Input placeholder="e.g., Italian Classics" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="A brief description of the recipe..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Image URL (Optional)</FormLabel>
                  <FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="aiHint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Hint for Main Image (Optional)</FormLabel>
                  <FormControl><Input placeholder="e.g., pasta carbonara" {...field} /></FormControl>
                  <FormDescription>Keywords for image generation services.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Visibility</FormLabel>
                    <FormDescription>Should this recipe be visible to users?</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timings & Servings (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="prepTime" render={({ field }) => (
                  <FormItem><FormLabel>Prep Time</FormLabel><FormControl><Input placeholder="e.g., 15 mins" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField control={form.control} name="cookTime" render={({ field }) => (
                  <FormItem><FormLabel>Cook Time</FormLabel><FormControl><Input placeholder="e.g., 20 mins" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
              <FormField control={form.control} name="totalTime" render={({ field }) => (
                  <FormItem><FormLabel>Total Time</FormLabel><FormControl><Input placeholder="e.g., 35 mins" {...field} /></FormControl><FormMessage /></FormItem>
                )}
              />
            </div>
            <FormField control={form.control} name="servings" render={({ field }) => (
                <FormItem><FormLabel>Servings</FormLabel><FormControl><Input type="number" placeholder="e.g., 4" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
              )}
            />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Nutritional Information (Optional)</CardTitle>
            <CardDescription>Per serving values.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <FormField control={form.control} name="nutritionalInfoPerServing.calories" render={({ field }) => (
                    <FormItem><FormLabel>Calories</FormLabel><FormControl><Input type="number" placeholder="e.g., 350" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name="nutritionalInfoPerServing.protein" render={({ field }) => (
                    <FormItem><FormLabel>Protein (g)</FormLabel><FormControl><Input type="number" placeholder="e.g., 20" {...field} value={field.value ?? ''}  onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}/></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name="nutritionalInfoPerServing.fat" render={({ field }) => (
                    <FormItem><FormLabel>Fat (g)</FormLabel><FormControl><Input type="number" placeholder="e.g., 15" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name="nutritionalInfoPerServing.carbs" render={({ field }) => (
                    <FormItem><FormLabel>Carbs (g)</FormLabel><FormControl><Input type="number" placeholder="e.g., 30" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                  )}
                />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ingredientFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                <h4 className="font-medium text-md">Ingredient {index + 1}</h4>
                <FormField control={form.control} name={`ingredients.${index}.name`} render={({ field: f }) => (
                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g., Spaghetti" {...f} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name={`ingredients.${index}.quantity`} render={({ field: f }) => (
                        <FormItem><FormLabel>Quantity</FormLabel><FormControl><Input type="number" step="any" placeholder="e.g., 200" {...f} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`ingredients.${index}.unit`} render={({ field: f }) => (
                        <FormItem><FormLabel>Unit</FormLabel><FormControl><Input placeholder="e.g., g" {...f} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                </div>
                <FormField control={form.control} name={`ingredients.${index}.imageUrl`} render={({ field: f }) => (
                    <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/ingredient.png" {...f} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name={`ingredients.${index}.aiHint`} render={({ field: f }) => (
                    <FormItem><FormLabel>AI Hint (Optional)</FormLabel><FormControl><Input placeholder="e.g., pasta" {...f} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <Button type="button" variant="destructive" size="sm" onClick={() => removeIngredient(index)} className="absolute top-3 right-3">
                  <Trash2 className="h-4 w-4 mr-1" /> Remove
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendIngredient({ name: '', quantity: 0, unit: '', imageUrl: '', aiHint: '' })}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Ingredient
            </Button>
            <FormMessage>{form.formState.errors.ingredients?.root?.message || form.formState.errors.ingredients?.message}</FormMessage>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipe Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stepFields.map((field, stepIndex) => (
              <div key={field.id} className="p-4 border rounded-md space-y-3 relative">
                <h4 className="font-medium text-md">Step {stepIndex + 1}</h4>
                <FormField control={form.control} name={`steps.${stepIndex}.instruction`} render={({ field: f }) => (
                    <FormItem><FormLabel>Instruction</FormLabel><FormControl><Textarea placeholder="e.g., Boil water for pasta..." {...f} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name={`steps.${stepIndex}.imageUrl`} render={({ field: f }) => (
                    <FormItem><FormLabel>Image URL (Optional)</FormLabel><FormControl><Input placeholder="https://example.com/step_image.png" {...f} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <FormField control={form.control} name={`steps.${stepIndex}.aiHint`} render={({ field: f }) => (
                    <FormItem><FormLabel>AI Hint (Optional)</FormLabel><FormControl><Input placeholder="e.g., boiling water" {...f} /></FormControl><FormMessage /></FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name={`steps.${stepIndex}.timerInSeconds`} render={({ field: f }) => (
                        <FormItem><FormLabel>Timer (seconds, Optional)</FormLabel><FormControl><Input type="number" placeholder="e.g., 600" {...f} value={f.value ?? ''} onChange={e => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                    <FormField control={form.control} name={`steps.${stepIndex}.temperature`} render={({ field: f }) => (
                        <FormItem><FormLabel>Temperature (Optional)</FormLabel><FormControl><Input placeholder="e.g., High heat, 180°C" {...f} /></FormControl><FormMessage /></FormItem>
                      )}
                    />
                </div>
                
                <div>
                  <Label className="mb-2 block text-sm font-medium">Link Ingredients to this Step:</Label>
                  <div className="space-y-2 p-3 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
                    {watchedIngredients.length > 0 ? watchedIngredients.map((ing, ingIndex) => (
                      <FormField
                        key={`${field.id}-ing-${ingIndex}`} 
                        control={form.control}
                        name={`steps.${stepIndex}.selectedIngredientIndexes`}
                        render={({ field: f }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={f.value?.includes(ingIndex)}
                                onCheckedChange={(checked) => {
                                  const currentValue = f.value || [];
                                  return checked
                                    ? f.onChange([...currentValue, ingIndex])
                                    : f.onChange(
                                        currentValue.filter(
                                          (value) => value !== ingIndex
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {ing.name || `Ingredient ${ingIndex + 1}`} ({ing.quantity} {ing.unit})
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    )) : <p className="text-xs text-muted-foreground">Add ingredients to the recipe first to link them here.</p>}
                  </div>
                   <FormMessage>{form.formState.errors.steps?.[stepIndex]?.selectedIngredientIndexes?.message}</FormMessage>
                </div>

                <Button type="button" variant="destructive" size="sm" onClick={() => removeStep(stepIndex)} className="absolute top-3 right-3">
                  <Trash2 className="h-4 w-4 mr-1" /> Remove Step
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendStep({ instruction: '', imageUrl: '', aiHint: '', timerInSeconds: undefined, temperature: '', selectedIngredientIndexes: [] })}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Step
            </Button>
            <FormMessage>{form.formState.errors.steps?.root?.message || form.formState.errors.steps?.message}</FormMessage>
          </CardContent>
        </Card>
        
        <Separator />

        <Button type="submit" disabled={isSubmitting} size="lg" className="w-full md:w-auto">
          {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : (isEditMode ? 'Update Recipe' : 'Create Recipe')}
        </Button>
      </form>
    </Form>
  );
}
