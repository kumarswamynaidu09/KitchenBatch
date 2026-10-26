import { Ingredient, Meal, DailyLog, CanteenProfile } from '../types';

export const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing-rice',
    name: 'Long Grain Basmati Rice',
    category: 'Grains & Pasta',
    unit: 'kg',
    unitCost: 1.85,
    packSize: 25,
    packUnit: '25kg sack',
    currentStock: 42,
    minStockAlert: 30,
    shelfLifeDays: 365,
  },
  {
    id: 'ing-chicken',
    name: 'Fresh Boneless Chicken Breast',
    category: 'Proteins',
    unit: 'kg',
    unitCost: 6.8,
    packSize: 10,
    packUnit: '10kg case',
    currentStock: 18,
    minStockAlert: 20,
    shelfLifeDays: 5,
  },
  {
    id: 'ing-beef',
    name: 'Lean Minced Beef (85/15)',
    category: 'Proteins',
    unit: 'kg',
    unitCost: 8.5,
    packSize: 10,
    packUnit: '10kg crate',
    currentStock: 14,
    minStockAlert: 15,
    shelfLifeDays: 4,
  },
  {
    id: 'ing-paneer',
    name: 'Farm Fresh Paneer Block',
    category: 'Dairy & Refrigerated',
    unit: 'kg',
    unitCost: 7.2,
    packSize: 5,
    packUnit: '5kg tub',
    currentStock: 12,
    minStockAlert: 10,
    shelfLifeDays: 14,
  },
  {
    id: 'ing-lentils',
    name: 'Yellow Toor & Moong Lentils',
    category: 'Grains & Pasta',
    unit: 'kg',
    unitCost: 2.4,
    packSize: 15,
    packUnit: '15kg sack',
    currentStock: 28,
    minStockAlert: 20,
    shelfLifeDays: 240,
  },
  {
    id: 'ing-chickpeas',
    name: 'Cooked Chickpeas (Dry equivalent)',
    category: 'Produce',
    unit: 'kg',
    unitCost: 2.1,
    packSize: 10,
    packUnit: '10kg sack',
    currentStock: 22,
    minStockAlert: 15,
    shelfLifeDays: 180,
  },
  {
    id: 'ing-onions',
    name: 'Brown Yellow Onions',
    category: 'Produce',
    unit: 'kg',
    unitCost: 1.2,
    packSize: 20,
    packUnit: '20kg mesh bag',
    currentStock: 35,
    minStockAlert: 25,
    shelfLifeDays: 45,
  },
  {
    id: 'ing-tomatoes',
    name: 'San Marzano Crushed Tomatoes',
    category: 'Produce',
    unit: 'kg',
    unitCost: 1.95,
    packSize: 12,
    packUnit: '12kg carton (4x3kg tins)',
    currentStock: 24,
    minStockAlert: 20,
    shelfLifeDays: 180,
  },
  {
    id: 'ing-potatoes',
    name: 'Yukon Gold Roasting Potatoes',
    category: 'Produce',
    unit: 'kg',
    unitCost: 1.1,
    packSize: 25,
    packUnit: '25kg sack',
    currentStock: 38,
    minStockAlert: 25,
    shelfLifeDays: 40,
  },
  {
    id: 'ing-bell-peppers',
    name: 'Tricolor Bell Peppers',
    category: 'Produce',
    unit: 'kg',
    unitCost: 3.1,
    packSize: 10,
    packUnit: '10kg flat',
    currentStock: 15,
    minStockAlert: 12,
    shelfLifeDays: 8,
  },
  {
    id: 'ing-pasta',
    name: 'Durum Wheat Penne Rigate',
    category: 'Grains & Pasta',
    unit: 'kg',
    unitCost: 1.75,
    packSize: 10,
    packUnit: '10kg box',
    currentStock: 25,
    minStockAlert: 20,
    shelfLifeDays: 360,
  },
  {
    id: 'ing-cream',
    name: 'Heavy Cooking Cream (35%)',
    category: 'Dairy & Refrigerated',
    unit: 'L',
    unitCost: 3.8,
    packSize: 5,
    packUnit: '5L pail',
    currentStock: 9,
    minStockAlert: 8,
    shelfLifeDays: 20,
  },
  {
    id: 'ing-oil',
    name: 'Pure Canola & Olive Blend Cooking Oil',
    category: 'Oils & Sauces',
    unit: 'L',
    unitCost: 3.2,
    packSize: 15,
    packUnit: '15L drum',
    currentStock: 32,
    minStockAlert: 25,
    shelfLifeDays: 300,
  },
  {
    id: 'ing-garlic-ginger',
    name: 'Fresh Garlic & Ginger Paste',
    category: 'Pantry & Spices',
    unit: 'kg',
    unitCost: 4.5,
    packSize: 5,
    packUnit: '5kg tub',
    currentStock: 7,
    minStockAlert: 5,
    shelfLifeDays: 30,
  },
  {
    id: 'ing-spices',
    name: 'Artisan Spice & Herb Blend (Cumin, Coriander, Oregano, Pepper)',
    category: 'Pantry & Spices',
    unit: 'kg',
    unitCost: 12.0,
    packSize: 2,
    packUnit: '2kg vacuum foil',
    currentStock: 4.5,
    minStockAlert: 3,
    shelfLifeDays: 180,
  },
  {
    id: 'ing-tahini',
    name: 'Toasted Sesame Tahini Paste',
    category: 'Oils & Sauces',
    unit: 'kg',
    unitCost: 6.5,
    packSize: 5,
    packUnit: '5kg pail',
    currentStock: 6,
    minStockAlert: 4,
    shelfLifeDays: 90,
  },
];

export const INITIAL_MEALS: Meal[] = [
  {
    id: 'meal-chicken-roast',
    name: 'Lemon Herb Roasted Chicken & Spiced Potatoes',
    category: 'Main',
    basePrice: 10.5,
    targetCost: 3.2,
    batchCapacity: 40, // 40 portions per gastro roasting pan
    cookingStation: 'Combi-Oven',
    dietary: ['High-Protein', 'Gluten-Free', 'Halal'],
    defaultShare: 0.34,
    recipe: [
      { ingredientId: 'ing-chicken', amountPerPortion: 0.22 }, // 220g chicken
      { ingredientId: 'ing-potatoes', amountPerPortion: 0.18 }, // 180g potatoes
      { ingredientId: 'ing-onions', amountPerPortion: 0.05 },
      { ingredientId: 'ing-oil', amountPerPortion: 0.02 }, // 20ml oil
      { ingredientId: 'ing-garlic-ginger', amountPerPortion: 0.015 },
      { ingredientId: 'ing-spices', amountPerPortion: 0.008 },
    ],
  },
  {
    id: 'meal-paneer-tikka',
    name: 'Smoked Paneer Tikka Masala & Jeera Rice',
    category: 'Vegetarian',
    basePrice: 9.8,
    targetCost: 2.85,
    batchCapacity: 45, // 45 portions per large steam kettle
    cookingStation: 'Steam Kettle',
    dietary: ['Vegetarian', 'Gluten-Free'],
    defaultShare: 0.24,
    recipe: [
      { ingredientId: 'ing-paneer', amountPerPortion: 0.14 },
      { ingredientId: 'ing-rice', amountPerPortion: 0.11 }, // dry rice yields ~240g cooked
      { ingredientId: 'ing-tomatoes', amountPerPortion: 0.12 },
      { ingredientId: 'ing-onions', amountPerPortion: 0.07 },
      { ingredientId: 'ing-cream', amountPerPortion: 0.035 },
      { ingredientId: 'ing-oil', amountPerPortion: 0.02 },
      { ingredientId: 'ing-garlic-ginger', amountPerPortion: 0.015 },
      { ingredientId: 'ing-spices', amountPerPortion: 0.01 },
    ],
  },
  {
    id: 'meal-lentil-dal',
    name: 'Tarka Yellow Dal Pilaf Bowl with Crispy Onions',
    category: 'Bowl',
    basePrice: 8.5,
    targetCost: 1.95,
    batchCapacity: 55, // high capacity kettle
    cookingStation: 'Steam Kettle',
    dietary: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free'],
    defaultShare: 0.18,
    recipe: [
      { ingredientId: 'ing-lentils', amountPerPortion: 0.12 },
      { ingredientId: 'ing-rice', amountPerPortion: 0.12 },
      { ingredientId: 'ing-tomatoes', amountPerPortion: 0.06 },
      { ingredientId: 'ing-onions', amountPerPortion: 0.08 },
      { ingredientId: 'ing-oil', amountPerPortion: 0.018 },
      { ingredientId: 'ing-garlic-ginger', amountPerPortion: 0.012 },
      { ingredientId: 'ing-spices', amountPerPortion: 0.009 },
    ],
  },
  {
    id: 'meal-med-falafel',
    name: 'Mediterranean Falafel Bowl & Lemon Tahini',
    category: 'Vegetarian',
    basePrice: 9.2,
    targetCost: 2.2,
    batchCapacity: 35,
    cookingStation: 'Griddle / Sauté',
    dietary: ['Vegetarian', 'Vegan', 'Dairy-Free'],
    defaultShare: 0.12,
    recipe: [
      { ingredientId: 'ing-chickpeas', amountPerPortion: 0.16 },
      { ingredientId: 'ing-bell-peppers', amountPerPortion: 0.09 },
      { ingredientId: 'ing-onions', amountPerPortion: 0.05 },
      { ingredientId: 'ing-tahini', amountPerPortion: 0.03 },
      { ingredientId: 'ing-oil', amountPerPortion: 0.022 },
      { ingredientId: 'ing-garlic-ginger', amountPerPortion: 0.01 },
      { ingredientId: 'ing-spices', amountPerPortion: 0.008 },
    ],
  },
  {
    id: 'meal-beef-ragu',
    name: 'Slow-Simmered Beef & Roasted Pepper Penne Ragu',
    category: 'Main',
    basePrice: 11.2,
    targetCost: 3.65,
    batchCapacity: 40,
    cookingStation: 'Steam Kettle',
    dietary: ['High-Protein'],
    defaultShare: 0.12,
    recipe: [
      { ingredientId: 'ing-beef', amountPerPortion: 0.16 },
      { ingredientId: 'ing-pasta', amountPerPortion: 0.11 },
      { ingredientId: 'ing-tomatoes', amountPerPortion: 0.14 },
      { ingredientId: 'ing-bell-peppers', amountPerPortion: 0.06 },
      { ingredientId: 'ing-onions', amountPerPortion: 0.06 },
      { ingredientId: 'ing-oil', amountPerPortion: 0.015 },
      { ingredientId: 'ing-garlic-ginger', amountPerPortion: 0.01 },
      { ingredientId: 'ing-spices', amountPerPortion: 0.007 },
    ],
  },
];

export const CANTEEN_PROFILES: CanteenProfile[] = [
  {
    id: 'tech-campus',
    name: 'Innovation Tech Campus Cafeteria',
    description: 'Tech HQ dining hall with 480–560 daily lunch diners. High vegetarian & bowl preference.',
    typicalAttendance: 520,
  },
  {
    id: 'university-hall',
    name: 'Metropolitan University Dining Commons',
    description: 'High-volume student and faculty canteen with 900–1,250 daily covers. Peak grain and protein demand.',
    typicalAttendance: 1100,
  },
  {
    id: 'hospital-canteen',
    name: 'Mercy Memorial Staff & Visitor Canteen',
    description: 'Steady 300–400 daily covers across healthcare shifts with balanced comfort dishes.',
    typicalAttendance: 360,
  },
];

// Generate 30 days of synthetic historical records with realistic attendance swings & menu demand
export function generateHistoricalLogs(baseAttendance: number = 520): DailyLog[] {
  const days: DailyLog['dayOfWeek'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const logs: DailyLog[] = [];
  const today = new Date();

  // Day-of-week attendance weight factors
  const dayFactors: Record<DailyLog['dayOfWeek'], number> = {
    Monday: 0.96,
    Tuesday: 1.04,
    Wednesday: 1.08, // hump day peak
    Thursday: 1.02,
    Friday: 0.82, // remote work / early departure
    Saturday: 0.45,
  };

  const weatherOptions: DailyLog['weather'][] = ['Sunny', 'Mild', 'Rainy', 'Cold / Snow', 'Sunny', 'Mild'];

  for (let i = 28; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    // Skip Sundays
    if (d.getDay() === 0) continue;

    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] as DailyLog['dayOfWeek'];
    if (dayName === ('Sunday' as any)) continue;

    const weatherIdx = (i * 7 + 3) % weatherOptions.length;
    const weather = weatherOptions[weatherIdx];
    const weatherFactor = weather === 'Rainy' ? 1.06 : weather === 'Cold / Snow' ? 1.08 : 1.0;
    const eventMultiplier = i === 12 || i === 4 ? 1.15 : 1.0; // special event dates

    // pseudo-random oscillation around trend
    const noise = Math.sin(i * 0.8) * 15 + Math.cos(i * 1.7) * 12;
    const attendance = Math.round(baseAttendance * (dayFactors[dayName] || 1.0) * weatherFactor * eventMultiplier + noise);

    // Meal demand allocation
    const chickenDemand = Math.round(attendance * (0.33 + Math.sin(i * 0.5) * 0.03));
    const paneerDemand = Math.round(attendance * (0.24 + Math.cos(i * 0.6) * 0.02));
    const lentilDemand = Math.round(attendance * (weather === 'Rainy' ? 0.21 : 0.17));
    const falafelDemand = Math.round(attendance * (0.12 - Math.sin(i * 0.4) * 0.02));
    const beefDemand = Math.max(0, attendance - (chickenDemand + paneerDemand + lentilDemand + falafelDemand));

    logs.push({
      id: `log-${i}`,
      date: d.toISOString().split('T')[0],
      dayOfWeek: dayName,
      attendance,
      weather,
      weatherFactor,
      eventMultiplier,
      mealDemand: {
        'meal-chicken-roast': chickenDemand,
        'meal-paneer-tikka': paneerDemand,
        'meal-lentil-dal': lentilDemand,
        'meal-med-falafel': falafelDemand,
        'meal-beef-ragu': beefDemand,
      },
    });
  }

  return logs;
}

export const INITIAL_LOGS: DailyLog[] = generateHistoricalLogs(520);
