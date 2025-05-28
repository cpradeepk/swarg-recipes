
'use server'; // Mark this module as server-only

import type { Recipe, User, Ingredient, RecipeStep, NutritionalInfo } from "@/types";
import pool from './db'; // Import the database pool
import { RowDataPacket, OkPacket } from 'mysql2';

import { randomUUID } from 'crypto'; 

const generateId = (prefix: string = ''): string => {
  const uuid = randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

const mockUsers: User[] = [
  { id: "a1b2c3d4-e5f6-7890-1234-567890abcdef", email: "user@example.com", name: "John Doe", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man portrait", is_admin: false },
  { id: "b2c3d4e5-f6a7-8901-2345-67890abcdef0", email: "admin@swargfood.com", name: "Admin Alice", avatarUrl: "https://placehold.co/100x100.png", aiHint: "woman portrait", is_admin: true },
  { id: "c3d4e5f6-a7b8-9012-3456-7890abcdef01", email: "pradeep@swargfood.com", name: "Pradeep Admin", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man portrait", is_admin: true },
];

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, name, avatar_url, ai_hint, is_admin FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    return null;
  }
  const dbUser = rows[0];
  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    avatarUrl: dbUser.avatar_url,
    aiHint: dbUser.ai_hint,
    is_admin: !!dbUser.is_admin, 
  };
};


const mapDbRowToRecipe = (row: RowDataPacket): Omit<Recipe, 'ingredients' | 'steps'> => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description,
  imageUrl: row.image_url,
  aiHint: row.ai_hint,
  visibility: !!row.visibility, 
  prepTime: row.prep_time,
  cookTime: row.cook_time,
  totalTime: row.total_time,
  servings: row.servings,
  nutritionalInfoPerServing: {
    calories: row.nutritional_calories,
    protein: row.nutritional_protein,
    fat: row.nutritional_fat,
    carbs: row.nutritional_carbs,
  },
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getRecipes = async (): Promise<Recipe[]> => {
  const [recipeRows] = await pool.query<RowDataPacket[]>(`
    SELECT * FROM recipes WHERE visibility = TRUE ORDER BY created_at DESC
  `);
  
  return recipeRows.map(row => ({
      ...mapDbRowToRecipe(row),
      ingredients: [], 
      steps: [],       
  }));
};

export const getAllRecipesForAdmin = async (): Promise<Recipe[]> => {
   const [recipeRows] = await pool.query<RowDataPacket[]>(`
    SELECT id, name, category, visibility, created_at, updated_at FROM recipes ORDER BY created_at DESC
  `);
  return recipeRows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      visibility: !!row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ingredients: [], 
      steps: [],       
  }));
}

export const getRecipeById = async (id: string): Promise<Recipe | undefined> => {
  const [recipeRows] = await pool.query<RowDataPacket[]>('SELECT * FROM recipes WHERE id = ?', [id]);
  if (recipeRows.length === 0) {
    return undefined;
  }
  const recipeData = mapDbRowToRecipe(recipeRows[0]);

  const [ingredientRows] = await pool.query<RowDataPacket[]>('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY item_order ASC', [id]);
  const ingredients: Ingredient[] = ingredientRows.map(row => ({
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    imageUrl: row.image_url,
    aiHint: row.ai_hint,
    item_order: row.item_order,
  }));

  const [stepRows] = await pool.query<RowDataPacket[]>('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC', [id]);
  const steps: RecipeStep[] = [];
  for (const stepRow of stepRows) {
    const [stepIngredientRows] = await pool.query<RowDataPacket[]>(
      'SELECT ingredient_id FROM recipe_step_ingredients WHERE recipe_step_id = ?',
      [stepRow.id]
    );
    const ingredientIds = stepIngredientRows.map(sir => sir.ingredient_id);
    steps.push({
      id: stepRow.id,
      stepNumber: stepRow.step_number,
      instruction: stepRow.instruction,
      imageUrl: stepRow.image_url,
      aiHint: stepRow.ai_hint,
      timerInSeconds: stepRow.timer_in_seconds,
      temperature: stepRow.temperature,
      ingredientIds: ingredientIds,
    });
  }

  return {
    ...recipeData,
    ingredients,
    steps,
  };
};

type RecipeDataForCreation = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ingredients' | 'steps'> & {
  ingredients: Omit<Ingredient, 'id'>[];
  steps: (Omit<RecipeStep, 'id' | 'ingredientIds'> & { selectedIngredientIndexes?: number[] })[];
};

export const addRecipe = async (recipeData: RecipeDataForCreation): Promise<Recipe> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const recipeId = generateId("recipe");
    const recipeDbData = {
      id: recipeId,
      name: recipeData.name,
      category: recipeData.category,
      description: recipeData.description,
      image_url: recipeData.imageUrl,
      ai_hint: recipeData.aiHint,
      visibility: recipeData.visibility,
      prep_time: recipeData.prepTime,
      cook_time: recipeData.cookTime,
      total_time: recipeData.totalTime,
      servings: recipeData.servings,
      nutritional_calories: recipeData.nutritionalInfoPerServing?.calories,
      nutritional_protein: recipeData.nutritionalInfoPerServing?.protein,
      nutritional_fat: recipeData.nutritionalInfoPerServing?.fat,
      nutritional_carbs: recipeData.nutritionalInfoPerServing?.carbs,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await connection.query('INSERT INTO recipes SET ?', recipeDbData);

    const createdIngredientIds: string[] = [];
    for (const [index, ing] of recipeData.ingredients.entries()) {
      const ingredientId = generateId("ing");
      createdIngredientIds.push(ingredientId);
      await connection.query('INSERT INTO ingredients SET ?', {
        id: ingredientId,
        recipe_id: recipeId,
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        image_url: ing.imageUrl,
        ai_hint: ing.aiHint,
        item_order: index,
      });
    }

    for (const step of recipeData.steps) {
      const stepId = generateId("step");
      await connection.query('INSERT INTO recipe_steps SET ?', {
        id: stepId,
        recipe_id: recipeId,
        step_number: step.stepNumber,
        instruction: step.instruction,
        image_url: step.imageUrl,
        ai_hint: step.aiHint,
        timer_in_seconds: step.timerInSeconds,
        temperature: step.temperature,
      });

      if (step.selectedIngredientIndexes && step.selectedIngredientIndexes.length > 0) {
        for (const ingIndex of step.selectedIngredientIndexes) {
          if (createdIngredientIds[ingIndex]) {
            await connection.query('INSERT INTO recipe_step_ingredients SET ?', {
              recipe_step_id: stepId,
              ingredient_id: createdIngredientIds[ingIndex],
            });
          }
        }
      }
    }

    await connection.commit();

    const newRecipe = await getRecipeById(recipeId);
    if (!newRecipe) throw new Error('Failed to fetch newly created recipe');
    return newRecipe;

  } catch (error) {
    await connection.rollback();
    console.error('Error adding recipe to DB:', error);
    throw error; 
  } finally {
    connection.release();
  }
};

export const updateRecipe = async (recipeId: string, updatedData: Partial<RecipeDataForCreation>): Promise<Recipe | null> => {
  console.warn("updateRecipe is not fully implemented for database yet, especially for step-ingredient links.");
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const recipePayload: { [key: string]: any } = {};
    if (updatedData.name !== undefined) recipePayload.name = updatedData.name;
    if (updatedData.category !== undefined) recipePayload.category = updatedData.category;
    // ... (map other recipe fields)
    recipePayload.updated_at = new Date();

    if (Object.keys(recipePayload).length > 1) { //
         await connection.query('UPDATE recipes SET ? WHERE id = ?', [recipePayload, recipeId]);
    }

    const newIngredientIds: string[] = [];
    if (updatedData.ingredients) {
        await connection.query('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
        for (const [index, ing] of updatedData.ingredients.entries()) {
            const ingredientId = generateId("ing-update");
            newIngredientIds.push(ingredientId);
            await connection.query('INSERT INTO ingredients SET ?', {
                id: ingredientId,
                recipe_id: recipeId,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                image_url: ing.imageUrl,
                ai_hint: ing.aiHint,
                item_order: index,
            });
        }
    } else {
      // If not updating ingredients, fetch existing ones to map selectedIngredientIndexes for steps
      const [existingIngredientRows] = await pool.query<RowDataPacket[]>('SELECT id FROM ingredients WHERE recipe_id = ? ORDER BY item_order ASC', [recipeId]);
      existingIngredientRows.forEach(row => newIngredientIds.push(row.id));
    }


    if (updatedData.steps) {
        await connection.query('DELETE FROM recipe_step_ingredients WHERE recipe_step_id IN (SELECT id FROM recipe_steps WHERE recipe_id = ?)', [recipeId]);
        await connection.query('DELETE FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
        for (const step of updatedData.steps) {
            const stepId = generateId("step-update");
            await connection.query('INSERT INTO recipe_steps SET ?', {
                id: stepId,
                recipe_id: recipeId,
                step_number: step.stepNumber,
                instruction: step.instruction,
                image_url: step.imageUrl,
                ai_hint: step.aiHint,
                timer_in_seconds: step.timerInSeconds,
                temperature: step.temperature,
            });

            if (step.selectedIngredientIndexes && step.selectedIngredientIndexes.length > 0) {
              for (const ingIndex of step.selectedIngredientIndexes) {
                  if (newIngredientIds[ingIndex]) { // Use the potentially new IDs
                      await connection.query('INSERT INTO recipe_step_ingredients SET ?', {
                          recipe_step_id: stepId,
                          ingredient_id: newIngredientIds[ingIndex],
                      });
                  }
              }
            }
        }
    }
    
    await connection.commit();
    const freshRecipe = await getRecipeById(recipeId);
    return freshRecipe || null;

  } catch (error) {
      await connection.rollback();
      console.error(`Error updating recipe ${recipeId}:`, error);
      return null;
  } finally {
      connection.release();
  }
};


export const deleteRecipe = async (recipeId: string): Promise<boolean> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Foreign key constraints with ON DELETE CASCADE should handle related tables
    const [result] = await connection.query<OkPacket>('DELETE FROM recipes WHERE id = ?', [recipeId]);
    await connection.commit();
    return result.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    console.error(`Error deleting recipe ${recipeId}:`, error);
    return false;
  } finally {
    connection.release();
  }
};

export const toggleRecipeVisibility = async (recipeId: string, visibility: boolean): Promise<Recipe | null> => {
  const [result] = await pool.query<OkPacket>('UPDATE recipes SET visibility = ?, updated_at = NOW() WHERE id = ?', [visibility, recipeId]);
  if (result.affectedRows > 0) {
    const updatedRecipe = await getRecipeById(recipeId);
    return updatedRecipe || null;
  }
  return null;
};
