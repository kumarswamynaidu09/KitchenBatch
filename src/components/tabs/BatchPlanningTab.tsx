import React from 'react';
import {
  Utensils,
  Layers,
  Flame,
  Clock,
  RotateCcw,
  Plus,
  Edit2,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { Meal, MealForecast, Ingredient } from '../../types';

interface BatchPlanningTabProps {
  meals: Meal[];
  ingredients: Ingredient[];
  forecasts: MealForecast[];
  onManualOverrideChange: (mealId: string, value: number | undefined) => void;
  onEditRecipe: (meal: Meal) => void;
  onAddNewMeal: () => void;
}

export const BatchPlanningTab: React.FC<BatchPlanningTabProps> = ({
  meals,
  ingredients,
  forecasts,
  onManualOverrideChange,
  onEditRecipe,
  onAddNewMeal,
}) => {
  // Aggregate station workload
  const stationStats: Record<string, { batches: number; portions: number }> = {};
  meals.forEach((meal) => {
    const fc = forecasts.find((f) => f.mealId === meal.id);
    if (!fc) return;
    if (!stationStats[meal.cookingStation]) {
      stationStats[meal.cookingStation] = { batches: 0, portions: 0 };
    }
    stationStats[meal.cookingStation].batches += fc.batchesNeeded;
    stationStats[meal.cookingStation].portions += fc.totalPlannedPortionsFromBatches;
  });

  return (
    <div className="space-y-6">
      {/* Station Capacity & Scheduling Overview */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Kitchen Station Workload & Equipment Allocation
            </h3>
            <p className="text-xs text-slate-500">
              Discreet integer batch loads mapped to commercial kitchen cooking stations.
            </p>
          </div>
          <button
            onClick={onAddNewMeal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Recipe</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(stationStats).map(([station, stat]) => (
            <div key={station} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3">
              <div className="flex items-center gap-1.5 text-slate-600 mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs font-semibold">{station}</span>
              </div>
              <div className="text-xl font-bold font-display text-slate-900 tabular-nums">
                {stat.batches} <span className="text-xs font-normal text-slate-500">batches</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {stat.portions} total portions yield
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meal Production Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meals.map((meal) => {
          const fc = forecasts.find((f) => f.mealId === meal.id);
          if (!fc) return null;

          const isOverridden = fc.manualOverride !== undefined;

          return (
            <div
              key={meal.id}
              className="bg-white rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-slate-100 text-slate-700">
                        {meal.category}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-600" />
                        {meal.cookingStation}
                      </span>
                    </div>
                    <h4 className="text-base font-bold font-display text-slate-900 leading-snug">
                      {meal.name}
                    </h4>
                  </div>

                  <button
                    onClick={() => onEditRecipe(meal)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Recipe & Ingredient Quantities"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Dietary Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {meal.dietary.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Batch Integer Math Box */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/90 mb-4 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-500 font-sans mb-1 text-[11px]">
                    <span>Constrained Integer Batch Calculation:</span>
                    <span className="text-emerald-700 font-semibold font-mono">
                      ⌈ {fc.finalPlannedPortions} / {meal.batchCapacity} ⌉
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500 text-[11px] font-sans block">Production Runs</span>
                      <strong className="text-slate-900 font-bold text-lg font-display">
                        {fc.batchesNeeded} Batches
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] font-sans block">Total Batch Yield</span>
                      <strong className="text-slate-900 font-bold text-lg font-display">
                        {fc.totalPlannedPortionsFromBatches} Portions
                      </strong>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[11px] font-sans block">Portion Buffer</span>
                      <span className="text-emerald-700 font-bold text-base font-display">
                        +{fc.surplusPortions}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Interactive Portion Adjuster */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium">Chef Target Portions:</span>
                    <div className="flex items-center gap-2">
                      {isOverridden && (
                        <button
                          onClick={() => onManualOverrideChange(meal.id, undefined)}
                          className="text-[11px] text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset to Model ({Math.round(fc.blendedForecast)})
                        </button>
                      )}
                      <input
                        type="number"
                        min="10"
                        max="800"
                        step="5"
                        aria-label={`Target Portions for ${meal.name}`}
                        value={fc.finalPlannedPortions}
                        onChange={(e) => onManualOverrideChange(meal.id, Number(e.target.value))}
                        className={`w-16 px-2 py-0.5 text-right font-mono font-bold text-xs rounded border ${
                          isOverridden
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="450"
                    step="5"
                    aria-label={`Target Portions slider for ${meal.name}`}
                    value={fc.finalPlannedPortions}
                    onChange={(e) => onManualOverrideChange(meal.id, Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>

                {/* Recipe Ingredients Mini-List */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Recipe Bill of Materials (Per Batch & Total)
                  </span>
                  <div className="space-y-1 text-xs max-h-32 overflow-y-auto pr-1">
                    {meal.recipe.map((item) => {
                      const ing = ingredients.find((i) => i.id === item.ingredientId);
                      if (!ing) return null;
                      const batchTotal = (item.amountPerPortion * fc.totalPlannedPortionsFromBatches).toFixed(2);
                      return (
                        <div
                          key={item.ingredientId}
                          className="flex items-center justify-between py-0.5 text-[11px] text-slate-600 border-b border-slate-100 last:border-0"
                        >
                          <span className="truncate max-w-[200px]">{ing.name}</span>
                          <span className="font-mono tabular-nums text-slate-800 font-medium">
                            {batchTotal} {ing.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Cost Footer */}
              <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Retail: <strong className="text-slate-800">${meal.basePrice.toFixed(2)}</strong>
                </span>
                <span className="text-slate-500">
                  Batch Prep Cost:{' '}
                  <strong className="text-slate-900 font-mono font-semibold">
                    ${fc.estimatedFoodCost.toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
