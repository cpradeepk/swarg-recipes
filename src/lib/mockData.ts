
import type { Recipe, User } from "@/types";

export const mockUsers: User[] = [
  { id: "user1", email: "user@example.com", name: "John Doe", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man portrait" },
  { id: "admin1", email: "admin@swargfood.com", name: "Admin Alice", avatarUrl: "https://placehold.co/100x100.png", aiHint: "woman portrait" },
  { id: "admin2", email: "pradeep@swargfood.com", name: "Pradeep Admin", avatarUrl: "https://placehold.co/100x100.png", aiHint: "man portrait" },
];

export const mockRecipes: Recipe[] = [
  {
    id: "pasta-carbonara",
    name: "Classic Pasta Carbonara",
    category: "Italian Classics",
    description: "A creamy and delicious Italian pasta dish made with eggs, cheese, pancetta, and black pepper.",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "pasta carbonara",
    visibility: true,
    prepTime: "15 mins",
    cookTime: "15 mins",
    totalTime: "30 mins",
    servings: 2,
    nutritionalInfoPerServing: {
      calories: 600,
      protein: 25,
      fat: 35,
      carbs: 50,
    },
    ingredients: [
      { id: "i1", name: "Spaghetti", quantity: 200, unit: "g" },
      { id: "i2", name: "Pancetta or Guanciale", quantity: 100, unit: "g", imageUrl: "https://placehold.co/50x50.png", aiHint: "pancetta" },
      { id: "i3", name: "Large Eggs", quantity: 2, unit: "pcs" },
      { id: "i4", name: "Pecorino Romano Cheese", quantity: 50, unit: "g", imageUrl: "https://placehold.co/50x50.png", aiHint: "cheese" },
      { id: "i5", name: "Black Pepper", quantity: 1, unit: "tsp" },
      { id: "i6", name: "Salt", quantity: 1, unit: "tsp" },
    ],
    steps: [
      { id: "s1", stepNumber: 1, instruction: "Boil water for pasta. Add salt. Cook spaghetti according to package directions until al dente.", timerInSeconds: 600, temperature: "High heat" },
      { id: "s2", stepNumber: 2, instruction: "While pasta cooks, cut pancetta into small cubes. Fry in a pan over medium heat until crispy. Remove pancetta, leave fat in pan.", temperature: "Medium heat" },
      { id: "s3", stepNumber: 3, instruction: "In a bowl, whisk eggs and grated Pecorino Romano. Add a generous amount of freshly ground black pepper." },
      { id: "s4", stepNumber: 4, instruction: "Drain pasta, reserving some pasta water. Add pasta to the pan with pancetta fat. Toss to coat." },
      { id: "s5", stepNumber: 5, instruction: "Remove pan from heat. Quickly pour in egg and cheese mixture, stirring rapidly. If too thick, add a little reserved pasta water. Stir in cooked pancetta." , ingredientIds: ["i2"]},
      { id: "s6", stepNumber: 6, instruction: "Serve immediately with more grated cheese and black pepper." },
    ],
    createdAt: new Date("2023-01-15T10:00:00Z"),
    updatedAt: new Date("2023-01-16T12:00:00Z"),
  },
  {
    id: "chicken-stir-fry",
    name: "Quick Chicken Stir-Fry",
    category: "Quick Meals",
    description: "A fast and flavorful chicken stir-fry with fresh vegetables and a savory sauce.",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "chicken stirfry",
    visibility: true,
    prepTime: "20 mins",
    cookTime: "10 mins",
    totalTime: "30 mins",
    servings: 4,
    nutritionalInfoPerServing: {
      calories: 450,
      protein: 30,
      fat: 20,
      carbs: 35,
    },
    ingredients: [
      { id: "i7", name: "Chicken Breast", quantity: 500, unit: "g", imageUrl: "https://placehold.co/50x50.png", aiHint: "chicken breast" },
      { id: "i8", name: "Broccoli Florets", quantity: 1, unit: "head" },
      { id: "i9", name: "Bell Peppers (various colors)", quantity: 2, unit: "pcs" },
      { id: "i10", name: "Soy Sauce", quantity: 4, unit: "tbsp" },
      { id: "i11", name: "Sesame Oil", quantity: 1, unit: "tbsp" },
      { id: "i12", name: "Ginger (minced)", quantity: 1, unit: "tbsp" },
      { id: "i13", name: "Garlic (minced)", quantity: 2, unit: "cloves" },
      { id: "i14", name: "Cornstarch", quantity: 1, unit: "tbsp" },
      { id: "i15", name: "Rice (for serving)", quantity: 2, unit: "cups (cooked)" },
    ],
    steps: [
      { id: "s7", stepNumber: 1, instruction: "Cut chicken into bite-sized pieces. Toss with 1 tbsp soy sauce and cornstarch." },
      { id: "s8", stepNumber: 2, instruction: "Chop broccoli and bell peppers." },
      { id: "s9", stepNumber: 3, instruction: "Heat a wok or large skillet over high heat. Add oil. Stir-fry chicken until browned and cooked through. Remove chicken.", temperature: "High heat" },
      { id: "s10", stepNumber: 4, instruction: "Add garlic and ginger to the wok, stir-fry for 30 seconds. Add broccoli and bell peppers, stir-fry for 3-5 minutes until tender-crisp.", timerInSeconds: 240, temperature: "Medium-high heat" },
      { id: "s11", stepNumber: 5, instruction: "Return chicken to the wok. In a small bowl, mix remaining soy sauce and sesame oil. Pour over stir-fry and toss to combine." },
      { id: "s12", stepNumber: 6, instruction: "Serve hot over rice." },
    ],
    createdAt: new Date("2023-02-10T14:30:00Z"),
    updatedAt: new Date("2023-02-10T14:30:00Z"),
  },
   {
    id: "tomato-soup",
    name: "Creamy Tomato Soup",
    category: "Soups",
    description: "A rich and comforting creamy tomato soup, perfect with grilled cheese.",
    imageUrl: "https://placehold.co/600x400.png",
    aiHint: "tomato soup",
    visibility: true,
    prepTime: "10 mins",
    cookTime: "25 mins",
    totalTime: "35 mins",
    servings: 4,
    ingredients: [
      { id: "ts1", name: "Canned Crushed Tomatoes", quantity: 800, unit: "g" },
      { id: "ts2", name: "Vegetable Broth", quantity: 500, unit: "ml" },
      { id: "ts3", name: "Onion", quantity: 1, unit: "medium" },
      { id: "ts4", name: "Garlic", quantity: 2, unit: "cloves" },
      { id: "ts5", name: "Heavy Cream", quantity: 100, unit: "ml" },
      { id: "ts6", name: "Olive Oil", quantity: 2, unit: "tbsp" },
      { id: "ts7", name: "Basil (fresh)", quantity: 0.25, unit: "cup, chopped" },
      { id: "ts8", name: "Salt and Pepper", quantity: 1, unit: "to taste" },
    ],
    steps: [
      { id: "tss1", stepNumber: 1, instruction: "Dice onion and mince garlic." },
      { id: "tss2", stepNumber: 2, instruction: "Heat olive oil in a large pot over medium heat. Add onion and cook until softened, about 5 minutes.", temperature: "Medium heat", timerInSeconds: 300 },
      { id: "tss3", stepNumber: 3, instruction: "Add garlic and cook for another minute until fragrant." },
      { id: "tss4", stepNumber: 4, instruction: "Pour in crushed tomatoes and vegetable broth. Bring to a simmer, then reduce heat and cook for 15 minutes.", timerInSeconds: 900 },
      { id: "tss5", stepNumber: 5, instruction: "Use an immersion blender to blend the soup until smooth. Alternatively, carefully transfer to a regular blender." },
      { id: "tss6", stepNumber: 6, instruction: "Stir in heavy cream and fresh basil. Season with salt and pepper to taste." },
      { id: "tss7", stepNumber: 7, instruction: "Serve hot, garnished with extra basil or a drizzle of cream." },
    ],
  }
];

// Simulate DB functions
export const getRecipes = async (): Promise<Recipe[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockRecipes.filter(r => r.visibility !== false)), 500));
};

export const getAllRecipesForAdmin = async (): Promise<Recipe[]> => {
  return new Promise(resolve => setTimeout(() => resolve(mockRecipes), 300));
}

export const getRecipeById = async (id: string): Promise<Recipe | undefined> => {
  return new Promise(resolve => setTimeout(() => resolve(mockRecipes.find(r => r.id === id)), 300));
};

