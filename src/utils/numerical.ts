import { DailyLog, Meal, Ingredient, MealForecast, ProcurementItem, RegressionStats, IterationStep, GaussSeidelResult } from '../types';

/**
 * Computes Least-Squares Linear Regression for a series of numbers
 * Returns slope, intercept, R-squared, and projected next value
 */
export function calculateLinearRegression(values: number[]): RegressionStats {
  const n = values.length;
  if (n === 0) {
    return { slope: 0, intercept: 0, r2: 0, projected: 0 };
  }
  if (n === 1) {
    return { slope: 0, intercept: values[0], r2: 1, projected: values[0] };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = values[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-9) {
    const avg = sumY / n;
    return { slope: 0, intercept: avg, r2: 0, projected: avg };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared (Coefficient of Determination)
  const yMean = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const x = i + 1;
    const y = values[i];
    const yPred = slope * x + intercept;
    ssTot += Math.pow(y - yMean, 2);
    ssRes += Math.pow(y - yPred, 2);
  }

  const r2 = ssTot === 0 ? 1 : Math.max(0, Math.min(1, 1 - ssRes / ssTot));
  const projected = Math.max(0, slope * (n + 1) + intercept);

  return { slope, intercept, r2, projected };
}

/**
 * Historical Moving Average with Day-of-Week Seasonality Weighting
 */
export function calculateSeasonalMovingAverage(
  logs: DailyLog[],
  targetMealId: string,
  targetDayOfWeek: DailyLog['dayOfWeek'],
  windowDays: number = 14
): number {
  if (logs.length === 0) return 0;

  // Recent window
  const recentLogs = logs.slice(-windowDays);
  const recentMealDemands = recentLogs.map((l) => l.mealDemand[targetMealId] || 0);
  const simpleAvg = recentMealDemands.reduce((a, b) => a + b, 0) / (recentMealDemands.length || 1);

  // Day-of-week specific average
  const sameDayLogs = logs.filter((l) => l.dayOfWeek === targetDayOfWeek);
  if (sameDayLogs.length === 0) {
    return simpleAvg;
  }

  const sameDayMealDemands = sameDayLogs.map((l) => l.mealDemand[targetMealId] || 0);
  const sameDayAvg = sameDayMealDemands.reduce((a, b) => a + b, 0) / sameDayMealDemands.length;

  // Weighted blend: 60% same-day pattern, 40% recent 14-day trend
  return simpleAvg * 0.4 + sameDayAvg * 0.6;
}

/**
 * Gauss-Seidel Iterative Solver for coupled meal substitution equilibrium
 *
 * System of equations: A * x = b
 * Where:
 * - b = unconstrained baseline demand vector (from regression & attendance)
 * - A = cross-coupling substitution matrix (strictly diagonally dominant)
 * - A[i][i] = 1.0 (self-demand)
 * - A[i][j] = -c_ij (cross-substitution damping: diner spillover between dishes)
 *
 * Gauss-Seidel formula:
 * x_i^(k+1) = (b_i - sum_{j < i} A_ij * x_j^(k+1) - sum_{j > i} A_ij * x_j^(k)) / A_ii
 */
export function solveGaussSeidelEquilibrium(
  meals: Meal[],
  baseDemandMap: Record<string, number>,
  totalTargetAttendance: number,
  relaxationOmega: number = 1.0,
  maxIterations: number = 50,
  tolerance: number = 1e-4
): GaussSeidelResult {
  const n = meals.length;
  const mealIds = meals.map((m) => m.id);

  // Construct strictly diagonally dominant matrix A
  // Off-diagonals represent subtle menu substitution interactions (e.g. +3% to -5% substitution pull)
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < n; i++) {
    A[i] = [];
    const baseDemand = baseDemandMap[mealIds[i]] || 0;
    b[i] = baseDemand;

    for (let j = 0; j < n; j++) {
      if (i === j) {
        A[i][j] = 1.0; // Normalized diagonal
      } else {
        // Realistic cross-substitution coefficient
        // Diagonally dominant because sum(|A_ij|) for j!=i is ~ 0.20 < 1.0
        const categoryMatch = meals[i].category === meals[j].category;
        const coef = categoryMatch ? 0.05 : 0.025;
        A[i][j] = coef;
      }
    }
  }

  // Initial guess x^(0) = b
  let currentX: number[] = [...b];
  const history: IterationStep[] = [];

  // Initial step
  const initialValuesMap: Record<string, number> = {};
  mealIds.forEach((id, idx) => {
    initialValuesMap[id] = Math.round(currentX[idx]);
  });
  history.push({
    iteration: 0,
    values: initialValuesMap,
    maxResidual: 1.0,
  });

  let converged = false;
  let iter = 0;

  for (iter = 1; iter <= maxIterations; iter++) {
    const nextX = [...currentX];
    let maxResidual = 0;

    for (let i = 0; i < n; i++) {
      let sum = 0;
      // Using updated values for j < i
      for (let j = 0; j < i; j++) {
        sum += A[i][j] * nextX[j];
      }
      // Using previous values for j > i
      for (let j = i + 1; j < n; j++) {
        sum += A[i][j] * currentX[j];
      }

      const calculated = (b[i] - sum) / A[i][i];
      // Successive Over-Relaxation (SOR) step
      const relaxed = (1 - relaxationOmega) * currentX[i] + relaxationOmega * calculated;

      const residual = Math.abs(relaxed - currentX[i]);
      if (residual > maxResidual) {
        maxResidual = residual;
      }
      nextX[i] = Math.max(0, relaxed);
    }

    currentX = nextX;

    const stepValues: Record<string, number> = {};
    mealIds.forEach((id, idx) => {
      stepValues[id] = Math.round(currentX[idx]);
    });
    history.push({
      iteration: iter,
      values: stepValues,
      maxResidual,
    });

    if (maxResidual < tolerance) {
      converged = true;
      break;
    }
  }

  // Normalize solution so sum equals totalTargetAttendance if specified
  const sumSolution = currentX.reduce((acc, val) => acc + val, 0);
  const normalizedX = sumSolution > 0 && totalTargetAttendance > 0
    ? currentX.map((val) => (val / sumSolution) * totalTargetAttendance)
    : currentX;

  const solutionMap: Record<string, number> = {};
  mealIds.forEach((id, idx) => {
    solutionMap[id] = Math.max(0, normalizedX[idx]);
  });

  return {
    solution: solutionMap,
    iterations: iter > maxIterations ? maxIterations : iter,
    converged,
    history,
    matrix: { meals: meals.map((m) => m.name), A, b },
  };
}

/**
 * Generate full forecasting breakdown across all methods and batches
 */
export function generateForecastBreakdown(
  meals: Meal[],
  ingredients: Ingredient[],
  logs: DailyLog[],
  targetDayOfWeek: DailyLog['dayOfWeek'],
  attendanceAdjustmentPct: number = 0, // e.g. +5% or -10%
  weatherFactor: number = 1.0,
  bufferMarginPct: number = 0.08, // 8% kitchen safety buffer
  manualOverrides: Record<string, number> = {}
): {
  forecasts: MealForecast[];
  totalDiners: number;
  totalFoodCost: number;
  gaussSeidelLog: GaussSeidelResult;
} {
  // Step 1: Base attendance projection using Linear Regression on recent logs
  const attendanceHistory = logs.map((l) => l.attendance);
  const attendanceReg = calculateLinearRegression(attendanceHistory);
  const baseAttendance = Math.max(100, Math.round(attendanceReg.projected * (1 + attendanceAdjustmentPct / 100) * weatherFactor));

  // Step 2: Calculate regressions & moving averages per meal
  const regDemandMap: Record<string, number> = {};
  const movingAvgMap: Record<string, number> = {};

  meals.forEach((meal) => {
    const mealHistory = logs.map((l) => l.mealDemand[meal.id] || 0);
    const reg = calculateLinearRegression(mealHistory);
    regDemandMap[meal.id] = Math.max(10, reg.projected);

    const movAvg = calculateSeasonalMovingAverage(logs, meal.id, targetDayOfWeek);
    movingAvgMap[meal.id] = Math.max(10, movAvg);
  });

  // Step 3: Run Gauss-Seidel solver on regression baselines
  const gsResult = solveGaussSeidelEquilibrium(meals, regDemandMap, baseAttendance);

  // Step 4: Blend numerical methods and calculate integer batch allocation
  let totalDiners = 0;
  let totalFoodCost = 0;

  const forecasts: MealForecast[] = meals.map((meal) => {
    const hist = Math.round(movingAvgMap[meal.id]);
    const reg = Math.round(regDemandMap[meal.id]);
    const gs = Math.round(gsResult.solution[meal.id] || hist);

    // Blended forecast: 35% Moving Avg, 35% Linear Reg, 30% Gauss-Seidel multi-dish equilibrium
    const blended = Math.round(hist * 0.35 + reg * 0.35 + gs * 0.3);

    // Apply manual override if user tweaked it
    const finalPlannedBeforeBatches = manualOverrides[meal.id] !== undefined
      ? manualOverrides[meal.id]
      : Math.round(blended * (1 + bufferMarginPct));

    // Integer batch allocation: ceil(portions / batchCapacity)
    const batchesNeeded = Math.ceil(finalPlannedBeforeBatches / meal.batchCapacity);
    const totalPlannedPortionsFromBatches = batchesNeeded * meal.batchCapacity;
    const surplusPortions = totalPlannedPortionsFromBatches - finalPlannedBeforeBatches;

    // Calculate recipe food cost per portion
    let portionCost = 0;
    meal.recipe.forEach((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (ing) {
        portionCost += item.amountPerPortion * ing.unitCost;
      }
    });
    const estimatedFoodCost = totalPlannedPortionsFromBatches * (portionCost || meal.targetCost);

    totalDiners += finalPlannedBeforeBatches;
    totalFoodCost += estimatedFoodCost;

    return {
      mealId: meal.id,
      mealName: meal.name,
      historicalAvg: hist,
      linearRegression: reg,
      gaussSeidel: gs,
      blendedForecast: blended,
      manualOverride: manualOverrides[meal.id],
      finalPlannedPortions: finalPlannedBeforeBatches,
      batchesNeeded,
      totalPlannedPortionsFromBatches,
      surplusPortions,
      estimatedFoodCost,
    };
  });

  return {
    forecasts,
    totalDiners,
    totalFoodCost,
    gaussSeidelLog: gsResult,
  };
}

/**
 * Constrained Integer Ingredient Allocation & Procurement Calculation
 * Aggregates all recipes across prepared batches and rounds up to vendor pack sizes
 */
export function calculateIngredientProcurement(
  meals: Meal[],
  ingredients: Ingredient[],
  forecasts: MealForecast[]
): ProcurementItem[] {
  // Map ingredientId -> total amount required
  const requiredAmounts: Record<string, number> = {};
  ingredients.forEach((ing) => {
    requiredAmounts[ing.id] = 0;
  });

  forecasts.forEach((fc) => {
    const meal = meals.find((m) => m.id === fc.mealId);
    if (!meal) return;

    // We prep totalPlannedPortionsFromBatches
    const portions = fc.totalPlannedPortionsFromBatches;

    meal.recipe.forEach((item) => {
      requiredAmounts[item.ingredientId] = (requiredAmounts[item.ingredientId] || 0) + item.amountPerPortion * portions;
    });
  });

  // Calculate integer packages and cost
  return ingredients.map((ing) => {
    const required = Number((requiredAmounts[ing.id] || 0).toFixed(2));
    const current = ing.currentStock;
    const netDeficit = Math.max(0, Number((required - current).toFixed(2)));

    // Integer pack rounding
    const packagesToOrder = netDeficit > 0 ? Math.ceil(netDeficit / ing.packSize) : 0;
    const totalOrderAmount = packagesToOrder * ing.packSize;
    const projectedStockAfterPrep = Number((current + totalOrderAmount - required).toFixed(2));
    const totalCost = Number((totalOrderAmount * ing.unitCost).toFixed(2));

    let status: ProcurementItem['status'] = 'sufficient';
    if (current < required && packagesToOrder > 0) {
      status = 'critical';
    } else if (projectedStockAfterPrep < ing.minStockAlert) {
      status = 'low_buffer';
    }

    return {
      ingredientId: ing.id,
      name: ing.name,
      category: ing.category,
      unit: ing.unit,
      packUnit: ing.packUnit,
      packSize: ing.packSize,
      unitCost: ing.unitCost,
      requiredAmount: required,
      currentStock: current,
      netDeficit,
      packagesToOrder,
      totalOrderAmount,
      projectedStockAfterPrep,
      totalCost,
      status,
    };
  });
}
