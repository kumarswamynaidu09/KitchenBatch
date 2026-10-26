import React from 'react';
import { Users, UtensilsCrossed, DollarSign, Scale, Cpu, ArrowUpRight } from 'lucide-react';
import { MealForecast, ProcurementItem, GaussSeidelResult } from '../types';

interface KPISummaryProps {
  forecasts: MealForecast[];
  totalDiners: number;
  totalFoodCost: number;
  procurementItems: ProcurementItem[];
  gaussSeidelResult: GaussSeidelResult;
  averageR2: number;
}

export const KPISummary: React.FC<KPISummaryProps> = ({
  forecasts,
  totalDiners,
  totalFoodCost,
  procurementItems,
  gaussSeidelResult,
  averageR2,
}) => {
  const totalBatches = forecasts.reduce((acc, f) => acc + f.batchesNeeded, 0);
  const totalPortionsPrepared = forecasts.reduce((acc, f) => acc + f.totalPlannedPortionsFromBatches, 0);
  const surplusPortions = totalPortionsPrepared - totalDiners;

  const totalProcurementSpend = procurementItems.reduce((acc, item) => acc + item.totalCost, 0);
  const totalPrepKg = procurementItems
    .filter((item) => item.unit === 'kg')
    .reduce((acc, item) => acc + item.requiredAmount, 0);

  const criticalItems = procurementItems.filter((i) => i.status === 'critical').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Diners Demand */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase">Projected Demand</span>
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
            {totalDiners.toLocaleString()}
          </span>
          <span className="text-xs text-slate-500">diners</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Prepared: <strong className="text-slate-800 tabular-nums">{totalPortionsPrepared}</strong></span>
          <span className="text-emerald-700 font-medium">+{surplusPortions} buffer</span>
        </div>
      </div>

      {/* 2. Cook Batches */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase">Equipment Batches</span>
          <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
            <UtensilsCrossed className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
            {totalBatches}
          </span>
          <span className="text-xs text-slate-500">production runs</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Across 5 distinct meals</span>
          <span className="text-amber-700 font-medium">100% capacity</span>
        </div>
      </div>

      {/* 3. Ingredient Mass to Prep */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase">Ingredients to Prep</span>
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
            {totalPrepKg.toFixed(1)}
          </span>
          <span className="text-xs text-slate-500">kg gross mass</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{procurementItems.length} recipe ingredients</span>
          {criticalItems > 0 ? (
            <span className="text-rose-600 font-semibold">{criticalItems} order alerts</span>
          ) : (
            <span className="text-emerald-600 font-medium">Inventory stable</span>
          )}
        </div>
      </div>

      {/* 4. Total Procurement Cost */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase">Procurement Order</span>
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
            ${totalProcurementSpend.toFixed(2)}
          </span>
          <span className="text-xs text-slate-500">PO total</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Meal cost: ${(totalFoodCost / (totalPortionsPrepared || 1)).toFixed(2)} / pax</span>
          <span className="text-indigo-600 font-medium">BOM Optimized</span>
        </div>
      </div>

      {/* 5. Numerical Engine State */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold tracking-wide uppercase">Numerical Solver</span>
          <div className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
            <Cpu className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
            {(averageR2 * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-slate-500">avg R² fit</span>
        </div>
        <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>Gauss-Seidel: {gaussSeidelResult.iterations} iters</span>
          <span className="text-emerald-600 font-semibold flex items-center">
            Tol &lt; 10⁻⁴
          </span>
        </div>
      </div>
    </div>
  );
};
