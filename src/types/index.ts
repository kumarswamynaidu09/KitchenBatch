export type DietaryTag = 'Vegetarian' | 'Vegan' | 'Gluten-Free' | 'Halal' | 'High-Protein' | 'Dairy-Free';

export type IngredientCategory = 'Produce' | 'Proteins' | 'Grains & Pasta' | 'Dairy & Refrigerated' | 'Pantry & Spices' | 'Oils & Sauces';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: 'kg' | 'g' | 'L' | 'ml' | 'units' | 'bunches';
  unitCost: number; // cost per unit in USD
  packSize: number; // minimum procurement order package size (e.g., 5kg, 25kg, 10L)
  packUnit: string; // e.g., '25kg bag', '10kg box', '5L jug'
  currentStock: number;
  minStockAlert: number;
  shelfLifeDays: number;
}

export interface RecipeItem {
  ingredientId: string;
  amountPerPortion: number; // in ingredient's base unit (e.g. 0.15 kg)
}

export interface Meal {
  id: string;
  name: string;
  category: 'Main' | 'Vegetarian' | 'Chef Special' | 'Bowl' | 'Pasta / Grain';
  basePrice: number; // retail price per portion
  targetCost: number; // target food cost per portion
  batchCapacity: number; // portion yield per cooking batch (e.g., 40 portions per steam pan)
  cookingStation: 'Steam Kettle' | 'Combi-Oven' | 'Griddle / Sauté' | 'Cold Larder';
  dietary: DietaryTag[];
  recipe: RecipeItem[];
  defaultShare: number; // typical fraction of total diners (0 to 1)
}

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  attendance: number; // total canteen diners
  weather: 'Sunny' | 'Rainy' | 'Cold / Snow' | 'Mild';
  weatherFactor: number; // multiplier, e.g. 1.05 for cold rainy comfort food
  eventMultiplier: number; // e.g., 1.15 for campus seminar
  mealDemand: Record<string, number>; // mealId -> portions served
}

export type NumericalMethod = 'hybrid' | 'moving_avg' | 'linear_regression' | 'gauss_seidel';

export interface IterationStep {
  iteration: number;
  values: Record<string, number>;
  maxResidual: number;
}

export interface GaussSeidelResult {
  solution: Record<string, number>;
  iterations: number;
  converged: boolean;
  history: IterationStep[];
  matrix: { meals: string[]; A: number[][]; b: number[] };
}

export interface RegressionStats {
  slope: number;
  intercept: number;
  r2: number;
  projected: number;
}

export interface MealForecast {
  mealId: string;
  mealName: string;
  historicalAvg: number;
  linearRegression: number;
  gaussSeidel: number;
  blendedForecast: number;
  manualOverride?: number;
  finalPlannedPortions: number;
  batchesNeeded: number;
  totalPlannedPortionsFromBatches: number; // batches * batchCapacity
  surplusPortions: number;
  estimatedFoodCost: number;
}

export interface ProcurementItem {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  unit: string;
  packUnit: string;
  packSize: number;
  unitCost: number;
  requiredAmount: number;
  currentStock: number;
  netDeficit: number;
  packagesToOrder: number;
  totalOrderAmount: number;
  projectedStockAfterPrep: number;
  totalCost: number;
  status: 'sufficient' | 'low_buffer' | 'critical';
}

export interface CanteenProfile {
  id: string;
  name: string;
  description: string;
  typicalAttendance: number;
}
