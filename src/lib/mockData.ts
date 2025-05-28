
'use server'; // Mark this module as server-only

import type { Recipe, User, Ingredient, RecipeStep, NutritionalInfo } from "@/types";
import pool from './db'; // Import the database pool
import { RowDataPacket, OkPacket } from 'mysql2';

import { randomUUID } from 'crypto'; 

const generateId = (prefix: string = ''): string => {
  const uuid = randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

// mockUsers is no longer exported as per previous fix
// const mockUsers: User[] = [ ... ];

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
  
  // For listing on the main page, we might not need full ingredients/steps details yet
  // But for consistency or future use, we can map them as empty or fetch summaries
  return recipeRows.map(row => ({
      ...mapDbRowToRecipe(row),
      ingredients: [], // Placeholder, or fetch simplified version if needed
      steps: [],       // Placeholder
  }));
};

export const getAllRecipesForAdmin = async (): Promise<Recipe[]> => {
   const [recipeRows] = await pool.query<RowDataPacket[]>(`
    SELECT id, name, category, visibility, created_at, updated_at FROM recipes ORDER BY created_at DESC
  `);
  // This is for the admin table, so full details aren't needed here, just what the table displays.
  return recipeRows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      visibility: !!row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // These are not strictly needed for the table view but are part of Recipe type
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

type RecipeDataForPersistence = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ingredients' | 'steps'> & {
  ingredients: Omit<Ingredient, 'id'>[];
  steps: (Omit<RecipeStep, 'id' | 'ingredientIds'> & { selectedIngredientIndexes?: number[] })[];
};

export const addRecipe = async (recipeData: RecipeDataForPersistence): Promise<Recipe> => {
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
        item_order: index, // Save the order
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
          if (createdIngredientIds[ingIndex]) { // Ensure index is valid
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

export const updateRecipe = async (recipeId: string, updatedData: RecipeDataForPersistence): Promise<Recipe | null> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update the main recipe details
    const recipeDbPayload = {
      name: updatedData.name,
      category: updatedData.category,
      description: updatedData.description,
      image_url: updatedData.imageUrl,
      ai_hint: updatedData.aiHint,
      visibility: updatedData.visibility,
      prep_time: updatedData.prepTime,
      cook_time: updatedData.cookTime,
      total_time: updatedData.totalTime,
      servings: updatedData.servings,
      nutritional_calories: updatedData.nutritionalInfoPerServing?.calories,
      nutritional_protein: updatedData.nutritionalInfoPerServing?.protein,
      nutritional_fat: updatedData.nutritionalInfoPerServing?.fat,
      nutritional_carbs: updatedData.nutritionalInfoPerServing?.carbs,
      updated_at: new Date(),
    };
    await connection.query('UPDATE recipes SET ? WHERE id = ?', [recipeDbPayload, recipeId]);

    // 2. Delete old ingredients (cascade delete should handle recipe_step_ingredients for these)
    await connection.query('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
    // Note: recipe_step_ingredients linked to these ingredients will be auto-deleted by FK ON DELETE CASCADE
    // if they were linked to steps that are NOT being re-added. If steps are also re-added, new links will be made.

    // 3. Insert new ingredients and collect their new IDs
    const newDbIngredientIds: string[] = [];
    for (const [index, ingData] of updatedData.ingredients.entries()) {
      const ingredientId = generateId("ing-upd");
      newDbIngredientIds.push(ingredientId);
      await connection.query('INSERT INTO ingredients SET ?', {
        id: ingredientId,
        recipe_id: recipeId,
        name: ingData.name,
        quantity: ingData.quantity,
        unit: ingData.unit,
        image_url: ingData.imageUrl,
        ai_hint: ingData.aiHint,
        item_order: index,
      });
    }
    
    // 4. Delete old steps (this will also delete their links from recipe_step_ingredients due to ON DELETE CASCADE)
    await connection.query('DELETE FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
    
    // 5. Insert new steps and their ingredient links
    for (const stepData of updatedData.steps) {
      const stepId = generateId("step-upd");
      await connection.query('INSERT INTO recipe_steps SET ?', {
        id: stepId,
        recipe_id: recipeId,
        step_number: stepData.stepNumber,
        instruction: stepData.instruction,
        image_url: stepData.imageUrl,
        ai_hint: stepData.aiHint,
        timer_in_seconds: stepData.timerInSeconds,
        temperature: stepData.temperature,
      });

      if (stepData.selectedIngredientIndexes && stepData.selectedIngredientIndexes.length > 0) {
        for (const ingIndex of stepData.selectedIngredientIndexes) {
          if (newDbIngredientIds[ingIndex]) { // Use the new ingredient IDs
            await connection.query('INSERT INTO recipe_step_ingredients SET ?', {
              recipe_step_id: stepId,
              ingredient_id: newDbIngredientIds[ingIndex],
            });
          }
        }
      }
    }
    
    await connection.commit();
    const freshRecipe = await getRecipeById(recipeId); // Fetch the fully updated recipe
    return freshRecipe || null;

  } catch (error) {
      await connection.rollback();
      console.error(`Error updating recipe ${recipeId}:`, error);
      return null; // Or throw error
  } finally {
      connection.release();
  }
};


export const deleteRecipe = async (recipeId: string): Promise<boolean> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // Foreign key constraints with ON DELETE CASCADE should handle related tables
    // (ingredients, recipe_steps, and then recipe_step_ingredients)
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
    const updatedRecipe = await getRecipeById(recipeId); // Fetch full recipe to reflect change
    return updatedRecipe || null;
  }
  return null;
};
