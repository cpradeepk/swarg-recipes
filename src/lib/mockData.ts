
'use server'; // Mark this module as server-only

import type { Recipe, User, Ingredient, RecipeStep, NutritionalInfo, RecipePreparationLog } from "@/types";
import pool from './db'; // Import the database pool
import { RowDataPacket, OkPacket } from 'mysql2';

import { randomUUID } from 'crypto'; 

const generateId = (prefix: string = ''): string => {
  const uuid = randomUUID();
  return prefix ? `${prefix}-${uuid}` : uuid;
}

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, name, avatar_url, ai_hint, is_admin FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    if (email.toLowerCase().endsWith('@swargfood.com')) {
        console.log(`Admin email ${email} not found, attempting to create user.`);
        try {
            const newAdminId = generateId("user-admin");
            const newAdminUser: User = {
                id: newAdminId,
                email: email,
                name: email.split('@')[0] || "Admin", 
                is_admin: true,
                avatarUrl: 'https://placehold.co/100x100.png', 
                aiHint: 'admin user',
            };
            await pool.query('INSERT INTO users SET ?', {
                id: newAdminUser.id,
                email: newAdminUser.email,
                name: newAdminUser.name,
                avatar_url: newAdminUser.avatarUrl,
                ai_hint: newAdminUser.aiHint,
                is_admin: newAdminUser.is_admin,
                password_hash: 'temp_admin_password_placeholder', 
            });
            console.log(`Admin user ${email} created successfully with ID ${newAdminId}.`);
            return newAdminUser;
        } catch (creationError) {
            console.error(`Failed to create admin user ${email}:`, creationError);
            return null;
        }
    }
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

export const findOrCreateUserByName = async (name: string): Promise<User | null> => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT id, email, name, avatar_url, ai_hint, is_admin FROM users WHERE name = ? AND is_admin = FALSE', [name]);
  if (rows.length > 0) {
    const dbUser = rows[0];
    return {
      id: dbUser.id,
      email: dbUser.email, // Could be null
      name: dbUser.name,
      avatarUrl: dbUser.avatar_url,
      aiHint: dbUser.ai_hint,
      is_admin: !!dbUser.is_admin,
    };
  } else {
    // User not found, create a new one
    try {
      const newUserId = generateId("user-gen");
      const newUser: User = {
        id: newUserId,
        name: name,
        email: null, // General users might not have emails in this system
        is_admin: false,
        avatarUrl: `https://placehold.co/100x100.png?text=${name.substring(0,1)}`, // Simple placeholder
        aiHint: 'user cooking',
      };
      await pool.query('INSERT INTO users SET ?', {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar_url: newUser.avatarUrl,
        ai_hint: newUser.aiHint,
        is_admin: newUser.is_admin,
        password_hash: 'N/A_name_auth', // Not applicable for name-based auth
      });
      console.log(`General user ${name} created successfully with ID ${newUserId}.`);
      return newUser;
    } catch (creationError) {
      console.error(`Failed to create general user ${name}:`, creationError);
      return null;
    }
  }
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
    SELECT * FROM recipes WHERE visibility = TRUE ORDER BY name ASC
  `);
  
  return Promise.all(recipeRows.map(async (row) => {
    const recipeData = mapDbRowToRecipe(row);
    const [ingredientRows] = await pool.query<RowDataPacket[]>('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY item_order ASC', [recipeData.id]);
    const ingredients: Ingredient[] = ingredientRows.map(ingRow => ({
      id: ingRow.id,
      name: ingRow.name,
      quantity: ingRow.quantity,
      unit: ingRow.unit,
      imageUrl: ingRow.image_url,
      aiHint: ingRow.ai_hint,
      item_order: ingRow.item_order,
    }));

    const [stepRows] = await pool.query<RowDataPacket[]>('SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_number ASC', [recipeData.id]);
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
  }));
};

export const getAllRecipesForAdmin = async (): Promise<Recipe[]> => {
   const [recipeRows] = await pool.query<RowDataPacket[]>(`
    SELECT id, name, category, visibility, created_at, updated_at FROM recipes ORDER BY name ASC
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

type RecipeDataForPersistence = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'ingredients' | 'steps'> & {
  ingredients: Omit<Ingredient, 'id'>[];
  steps: (Omit<RecipeStep, 'id' | 'ingredientIds'> & { stepNumber: number, selectedIngredientIndexes?: number[] })[];
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

export const updateRecipe = async (recipeId: string, updatedData: RecipeDataForPersistence): Promise<Recipe | null> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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

    // Clear existing ingredients and steps and their links for simplicity
    // ON DELETE CASCADE for recipe_step_ingredients (when recipe_steps are deleted)
    // and for ingredients referenced by recipe_step_ingredients.
    // Need to delete recipe_step_ingredients explicitly if not handled by cascade from ingredients.
    // Safest: delete recipe_step_ingredients, then ingredients, then steps.
    
    // Fetch old step IDs to delete their specific links first
    const [oldStepRows] = await connection.query<RowDataPacket[]>('SELECT id FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
    for (const oldStep of oldStepRows) {
        await connection.query('DELETE FROM recipe_step_ingredients WHERE recipe_step_id = ?', [oldStep.id]);
    }
    await connection.query('DELETE FROM recipe_steps WHERE recipe_id = ?', [recipeId]);
    await connection.query('DELETE FROM ingredients WHERE recipe_id = ?', [recipeId]);
    
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
          if (newDbIngredientIds[ingIndex]) { 
            await connection.query('INSERT INTO recipe_step_ingredients SET ?', {
              recipe_step_id: stepId,
              ingredient_id: newDbIngredientIds[ingIndex],
            });
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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await pool.query<OkPacket>('UPDATE recipes SET visibility = ?, updated_at = NOW() WHERE id = ?', [visibility, recipeId]);
    
    if (result.affectedRows > 0) {
      await connection.commit();
      const updatedRecipe = await getRecipeById(recipeId); 
      return updatedRecipe || null;
    } else {
      await connection.rollback();
      return null;
    }
  } catch (error) {
    await connection.rollback();
    console.error(`Error toggling visibility for recipe ${recipeId}:`, error);
    return null;
  } finally {
    connection.release();
  }
};


// --- Recipe Preparation Log Functions ---

type CreateLogPayload = {
  userId: string;
  userNameSnapshot: string;
  recipeId: string;
  recipeNameSnapshot: string;
  startTime: Date;
  languageUsed: string;
};

export const createRecipeLogEntry = async (payload: CreateLogPayload): Promise<string | null> => {
  const logId = generateId("log");
  const sql = 'INSERT INTO recipe_preparation_logs (id, user_id, user_name_snapshot, recipe_id, recipe_name, start_time, language_used, completed_all_steps, feedback_is_wasted) VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, FALSE)';
  try {
    const [result] = await pool.query<OkPacket>(sql, [
      logId,
      payload.userId,
      payload.userNameSnapshot,
      payload.recipeId,
      payload.recipeNameSnapshot, // Storing recipe name snapshot
      payload.startTime,
      payload.languageUsed,
    ]);
    return result.affectedRows > 0 ? logId : null;
  } catch (error) {
    console.error("Error creating recipe log entry:", error);
    return null;
  }
};

type UpdateLogPayload = {
  endTime: Date;
  durationSeconds: number;
  completedAllSteps: boolean;
  feedbackPhotoUrl?: string;
  feedbackProductWeight?: string;
  feedbackNumPreps?: number;
  feedbackIsWasted?: boolean;
};

export const updateRecipeLogEntry = async (logId: string, payload: UpdateLogPayload): Promise<boolean> => {
  const sql = `
    UPDATE recipe_preparation_logs 
    SET end_time = ?, duration_seconds = ?, completed_all_steps = ?, 
        feedback_photo_url = ?, feedback_product_weight = ?, 
        feedback_num_preps = ?, feedback_is_wasted = ?
    WHERE id = ?
  `;
  try {
    const [result] = await pool.query<OkPacket>(sql, [
      payload.endTime,
      payload.durationSeconds,
      payload.completedAllSteps,
      payload.feedbackPhotoUrl,
      payload.feedbackProductWeight,
      payload.feedbackNumPreps,
      payload.feedbackIsWasted,
      logId,
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error updating recipe log entry ${logId}:`, error);
    return false;
  }
};

export const getRecipePreparationLogsForAdmin = async (): Promise<RecipePreparationLog[]> => {
  const [logRows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      id, 
      user_id, 
      user_name_snapshot, -- Use the snapshot stored
      recipe_id, 
      recipe_name, -- Use the snapshot stored
      start_time, 
      end_time, 
      duration_seconds, 
      language_used, 
      completed_all_steps,
      feedback_photo_url,
      feedback_product_weight,
      feedback_num_preps,
      feedback_is_wasted,
      created_at
    FROM recipe_preparation_logs 
    ORDER BY start_time DESC
  `);
  
  return logRows.map(row => ({
    id: row.id,
    userId: row.user_id,
    userNameSnapshot: row.user_name_snapshot,
    recipeId: row.recipe_id,
    recipeName: row.recipe_name,
    startTime: new Date(row.start_time),
    endTime: row.end_time ? new Date(row.end_time) : undefined,
    durationSeconds: row.duration_seconds,
    languageUsed: row.language_used,
    completedAllSteps: !!row.completed_all_steps,
    feedbackPhotoUrl: row.feedback_photo_url,
    feedbackProductWeight: row.feedback_product_weight,
    feedbackNumPreps: row.feedback_num_preps,
    feedbackIsWasted: !!row.feedback_is_wasted,
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
    // Formatted duration can be computed on client or here if needed
    duration: row.duration_seconds ? `${Math.floor(row.duration_seconds / 60)}m ${row.duration_seconds % 60}s` : "In Progress",
  }));
};
