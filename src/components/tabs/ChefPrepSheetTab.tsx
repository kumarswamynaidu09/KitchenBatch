import React, { useState } from 'react';
import { Printer, CheckSquare, Square, Flame, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Meal, MealForecast, Ingredient, DailyLog } from '../../types';

interface ChefPrepSheetTabProps {
  meals: Meal[];
  ingredients: Ingredient[];
  forecasts: MealForecast[];
  targetDate: string;
  dayOfWeek: string;
  onPrint: () => void;
}

export const ChefPrepSheetTab: React.FC<ChefPrepSheetTabProps> = ({
  meals,
  ingredients,
  forecasts,
  targetDate,
  dayOfWeek,
  onPrint,
}) => {
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Group meals by cooking station
  const stations = ['Combi-Oven', 'Steam Kettle', 'Griddle / Sauté', 'Cold Larder'] as const;

  // Aggregate cold veg prep
  const totalOnions = forecasts.reduce((acc, fc) => {
    const meal = meals.find((m) => m.id === fc.mealId);
    const item = meal?.recipe.find((r) => r.ingredientId === 'ing-onions');
    return acc + (item ? item.amountPerPortion * fc.totalPlannedPortionsFromBatches : 0);
  }, 0);

  const totalGarlicGinger = forecasts.reduce((acc, fc) => {
    const meal = meals.find((m) => m.id === fc.mealId);
    const item = meal?.recipe.find((r) => r.ingredientId === 'ing-garlic-ginger');
    return acc + (item ? item.amountPerPortion * fc.totalPlannedPortionsFromBatches : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Print Trigger Action Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Kitchen Production & Mise-en-Place Sheet
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Station checklists for line cooks with scaled ingredient quantities based on today's integer batch runs.
            </p>
          </div>

          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Kitchen Production Sheet</span>
          </button>
        </div>
      </div>

      {/* Production Document (Print Friendly) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-xs print-only-section">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
              KitchenBatch Production Directive
            </div>
            <h2 className="text-2xl font-black font-display text-slate-900 mt-1">
              DAILY CHEF PREPARATION ROSTER
            </h2>
            <div className="text-xs text-slate-600 mt-1 font-mono">
              Target Service: <strong>{dayOfWeek}, {targetDate}</strong> | Shift: <strong>Lunch Service (11:30 - 14:00)</strong>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-mono text-slate-500">Total Planned Portions</div>
            <div className="text-2xl font-bold font-display text-slate-900">
              {forecasts.reduce((a, b) => a + b.totalPlannedPortionsFromBatches, 0)} Pax
            </div>
          </div>
        </div>

        {/* Global Vegetable & Aromatics Prep Table */}
        <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Central Mise-En-Place (Cold Prep Station)
            </span>
            <span className="text-[11px] font-mono text-slate-500">Prep by 09:30 AM</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Diced Onions</span>
              <strong className="text-slate-900 font-mono text-sm">{totalOnions.toFixed(1)} kg</strong>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Garlic-Ginger Paste</span>
              <strong className="text-slate-900 font-mono text-sm">{totalGarlicGinger.toFixed(2)} kg</strong>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Penne Pasta (Dry)</span>
              <strong className="text-slate-900 font-mono text-sm">
                {ingredients.find((i) => i.id === 'ing-pasta')?.currentStock || 0} kg stock
              </strong>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-slate-500 text-[11px] block">Basmati Rice (Dry)</span>
              <strong className="text-slate-900 font-mono text-sm">
                {ingredients.find((i) => i.id === 'ing-rice')?.currentStock || 0} kg stock
              </strong>
            </div>
          </div>
        </div>

        {/* Stations Breakdown */}
        <div className="space-y-6">
          {stations.map((stationName) => {
            const stationMeals = meals.filter((m) => m.cookingStation === stationName);
            if (stationMeals.length === 0) return null;

            return (
              <div key={stationName} className="border border-slate-200 rounded-lg p-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Station: {stationName}
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-500">
                    {stationMeals.length} Dishes Assigned
                  </span>
                </div>

                <div className="space-y-4">
                  {stationMeals.map((meal) => {
                    const fc = forecasts.find((f) => f.mealId === meal.id);
                    if (!fc) return null;

                    const taskId = `task-${meal.id}`;
                    const isDone = !!completedTasks[taskId];

                    return (
                      <div
                        key={meal.id}
                        className={`p-3.5 rounded-lg border transition-colors ${
                          isDone ? 'bg-emerald-50/40 border-emerald-200 text-slate-500' : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-start gap-2.5">
                            <button
                              onClick={() => toggleTask(taskId)}
                              className="mt-0.5 text-slate-400 hover:text-emerald-700 cursor-pointer no-print"
                            >
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                            <div>
                              <h5 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {meal.name}
                              </h5>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span>Batch Capacity: {meal.batchCapacity} pax/run</span>
                                <span>•</span>
                                <span className="font-semibold text-slate-700">
                                  {fc.batchesNeeded} Total Batches ({fc.totalPlannedPortionsFromBatches} Portions)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-900 text-white">
                              {fc.batchesNeeded} BATCHES
                            </span>
                          </div>
                        </div>

                        {/* Scaled Ingredients Grid */}
                        <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                            Recipe Scale for {fc.totalPlannedPortionsFromBatches} Portions:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                            {meal.recipe.map((r) => {
                              const ing = ingredients.find((i) => i.id === r.ingredientId);
                              if (!ing) return null;
                              const scaledQty = (r.amountPerPortion * fc.totalPlannedPortionsFromBatches).toFixed(2);
                              return (
                                <div key={r.ingredientId} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
                                  <span className="text-slate-700 truncate pr-1">{ing.name}</span>
                                  <strong className="font-mono text-slate-900 shrink-0">
                                    {scaledQty} {ing.unit}
                                  </strong>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sign-off strip for kitchen quality check */}
        <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block">Head Chef Sign-Off:</span>
            <div className="h-8 border-b border-dashed border-slate-400 mt-1"></div>
          </div>
          <div>
            <span className="text-slate-400 block">Core Temp Logged (&gt;75°C):</span>
            <div className="h-8 border-b border-dashed border-slate-400 mt-1"></div>
          </div>
          <div>
            <span className="text-slate-400 block">Sample Portions Tested:</span>
            <div className="h-8 border-b border-dashed border-slate-400 mt-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
