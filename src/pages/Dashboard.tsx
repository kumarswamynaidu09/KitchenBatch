import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  UtensilsCrossed,
  Package,
  FileText,
  Database,
  ChefHat,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  INITIAL_INGREDIENTS,
  INITIAL_MEALS,
  INITIAL_LOGS,
  CANTEEN_PROFILES,
  generateHistoricalLogs,
} from '../data/initialData';
import {
  generateForecastBreakdown,
  calculateIngredientProcurement,
  calculateLinearRegression,
} from '../utils/numerical';
import { Meal, Ingredient, DailyLog, CanteenProfile, MealForecast } from '../types';
import { Header } from '../components/Header';
import { KPISummary } from '../components/KPISummary';
import { ForecastingTab } from '../components/tabs/ForecastingTab';
import { BatchPlanningTab } from '../components/tabs/BatchPlanningTab';
import { ProcurementTab } from '../components/tabs/ProcurementTab';
import { ChefPrepSheetTab } from '../components/tabs/ChefPrepSheetTab';
import { DataImportTab } from '../components/tabs/DataImportTab';
import { RecipeModal } from '../components/RecipeModal';

type ActiveTab = 'forecasting' | 'batch_planning' | 'procurement' | 'prep_sheet' | 'data_import';

export const Dashboard: React.FC = () => {
  // Core application state
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [logs, setLogs] = useState<DailyLog[]>(INITIAL_LOGS);
  const [currentProfile, setCurrentProfile] = useState<CanteenProfile>(CANTEEN_PROFILES[0]);

  // Target service parameters
  const [targetDate, setTargetDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [weather, setWeather] = useState<'Sunny' | 'Rainy' | 'Cold / Snow' | 'Mild'>('Sunny');
  const [bufferMarginPct, setBufferMarginPct] = useState<number>(0.08); // 8% default
  const [attendanceDeltaPct, setAttendanceDeltaPct] = useState<number>(0);
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('forecasting');

  // Modal state
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<Meal | null>(null);

  // Compute target day of week
  const dayOfWeek = useMemo(() => {
    const d = new Date(targetDate + 'T12:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[d.getDay()] || 'Wednesday';
  }, [targetDate]);

  // Weather multiplier factor
  const weatherMultiplier = useMemo(() => {
    switch (weather) {
      case 'Rainy':
        return 1.06;
      case 'Cold / Snow':
        return 1.08;
      default:
        return 1.0;
    }
  }, [weather]);

  // Compute numerical forecasting and batch breakdown
  const { forecasts, totalDiners, totalFoodCost, gaussSeidelLog } = useMemo(() => {
    return generateForecastBreakdown(
      meals,
      ingredients,
      logs,
      dayOfWeek as any,
      attendanceDeltaPct,
      weatherMultiplier,
      bufferMarginPct,
      manualOverrides
    );
  }, [meals, ingredients, logs, dayOfWeek, attendanceDeltaPct, weatherMultiplier, bufferMarginPct, manualOverrides]);

  // Compute constrained integer ingredient allocation
  const procurementItems = useMemo(() => {
    return calculateIngredientProcurement(meals, ingredients, forecasts);
  }, [meals, ingredients, forecasts]);

  // Compute average R-squared across meals
  const averageR2 = useMemo(() => {
    let sum = 0;
    meals.forEach((m) => {
      const history = logs.map((l) => l.mealDemand[m.id] || 0);
      const reg = calculateLinearRegression(history);
      sum += reg.r2;
    });
    return sum / (meals.length || 1);
  }, [meals, logs]);

  // Handlers
  const handleSelectProfile = (profile: CanteenProfile) => {
    setCurrentProfile(profile);
    const newLogs = generateHistoricalLogs(profile.typicalAttendance);
    setLogs(newLogs);
    setManualOverrides({});
  };

  const handleUpdateStock = (ingredientId: string, newStock: number) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === ingredientId ? { ...ing, currentStock: Math.max(0, newStock) } : ing))
    );
  };

  const handleManualOverride = (mealId: string, value: number | undefined) => {
    setManualOverrides((prev) => {
      const updated = { ...prev };
      if (value === undefined) {
        delete updated[mealId];
      } else {
        updated[mealId] = value;
      }
      return updated;
    });
  };

  const handleSaveMealRecipe = (updatedMeal: Meal) => {
    setMeals((prev) => {
      const idx = prev.findIndex((m) => m.id === updatedMeal.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedMeal;
        return copy;
      }
      return [...prev, updatedMeal];
    });
  };

  const handlePrint = () => {
    setActiveTab('prep_sheet');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportCSV = () => {
    const lines = [
      '# KitchenBatch Canteen Demand Forecast & Procurement Plan',
      `# Date: ${targetDate} (${dayOfWeek})`,
      `# Canteen: ${currentProfile.name}`,
      `# Total Planned Portions: ${forecasts.reduce((a, b) => a + b.totalPlannedPortionsFromBatches, 0)}`,
      '',
      '## MEAL PRODUCTION & BATCH ALLOCATION',
      'Meal Name,Category,Batch Capacity,Batches Needed,Planned Portions,Surplus Buffer,Est Food Cost',
      ...forecasts.map(
        (f) =>
          `"${f.mealName}","${meals.find((m) => m.id === f.mealId)?.category}",${
            meals.find((m) => m.id === f.mealId)?.batchCapacity
          },${f.batchesNeeded},${f.totalPlannedPortionsFromBatches},${f.surplusPortions},${f.estimatedFoodCost.toFixed(2)}`
      ),
      '',
      '## CONSTRAINED INGREDIENT PROCUREMENT (BOM)',
      'Ingredient,Category,Unit,Required Amount,Current Stock,Net Deficit,Packs to Order,Pack Size,Total Delivered,Post-Prep Stock,Estimated Spend,Status',
      ...procurementItems.map(
        (p) =>
          `"${p.name}","${p.category}","${p.unit}",${p.requiredAmount},${p.currentStock},${p.netDeficit},${p.packagesToOrder},"${p.packUnit}",${p.totalOrderAmount},${p.projectedStockAfterPrep},${p.totalCost},"${p.status}"`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kitchenbatch_plan_${targetDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criticalDeficitCount = procurementItems.filter((i) => i.status === 'critical').length;
  const totalBatches = forecasts.reduce((acc, f) => acc + f.batchesNeeded, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col">
      {/* Top Header */}
      <Header
        currentProfile={currentProfile}
        profiles={CANTEEN_PROFILES}
        onSelectProfile={handleSelectProfile}
        targetDate={targetDate}
        onTargetDateChange={setTargetDate}
        dayOfWeek={dayOfWeek}
        bufferMarginPct={bufferMarginPct}
        onBufferMarginChange={setBufferMarginPct}
        attendanceDeltaPct={attendanceDeltaPct}
        onAttendanceDeltaChange={setAttendanceDeltaPct}
        weather={weather}
        onWeatherChange={setWeather}
        onPrint={handlePrint}
        onExportCSV={handleExportCSV}
        solverConverged={gaussSeidelLog.converged}
        solverIterations={gaussSeidelLog.iterations}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPI Summary Cards */}
        <div className="no-print">
          <KPISummary
            forecasts={forecasts}
            totalDiners={totalDiners}
            totalFoodCost={totalFoodCost}
            procurementItems={procurementItems}
            gaussSeidelResult={gaussSeidelLog}
            averageR2={averageR2}
          />
        </div>

        {/* Tab Navigation Navigation */}
        <div className="border-b border-slate-200 mb-6 no-print">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('forecasting')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'forecasting'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Forecasting & Numerical Solver</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
                {(averageR2 * 100).toFixed(0)}% R²
              </span>
            </button>

            <button
              onClick={() => setActiveTab('batch_planning')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'batch_planning'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>Batch & Equipment Planning</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
                {totalBatches} runs
              </span>
            </button>

            <button
              onClick={() => setActiveTab('procurement')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'procurement'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Ingredient BOM & Stock (PO)</span>
              {criticalDeficitCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-bold font-mono">
                  {criticalDeficitCount} alerts
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                  {procurementItems.length} items
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('prep_sheet')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'prep_sheet'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Chef Prep Sheet</span>
            </button>

            <button
              onClick={() => setActiveTab('data_import')}
              className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'data_import'
                  ? 'border-emerald-700 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Historical Datasets</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono">
                {logs.length}d
              </span>
            </button>
          </nav>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'forecasting' && (
          <ForecastingTab
            logs={logs}
            meals={meals}
            forecasts={forecasts}
            gaussSeidelResult={gaussSeidelLog}
            targetDayOfWeek={dayOfWeek}
          />
        )}

        {activeTab === 'batch_planning' && (
          <BatchPlanningTab
            meals={meals}
            ingredients={ingredients}
            forecasts={forecasts}
            onManualOverrideChange={handleManualOverride}
            onEditRecipe={(meal) => {
              setSelectedMealForEdit(meal);
              setIsRecipeModalOpen(true);
            }}
            onAddNewMeal={() => {
              setSelectedMealForEdit(null);
              setIsRecipeModalOpen(true);
            }}
          />
        )}

        {activeTab === 'procurement' && (
          <ProcurementTab
            procurementItems={procurementItems}
            onUpdateStock={handleUpdateStock}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'prep_sheet' && (
          <ChefPrepSheetTab
            meals={meals}
            ingredients={ingredients}
            forecasts={forecasts}
            targetDate={targetDate}
            dayOfWeek={dayOfWeek}
            onPrint={handlePrint}
          />
        )}

        {activeTab === 'data_import' && (
          <DataImportTab
            logs={logs}
            meals={meals}
            onUpdateLogs={setLogs}
            profiles={CANTEEN_PROFILES}
            currentProfile={currentProfile}
            onSelectProfile={handleSelectProfile}
          />
        )}
      </main>

      {/* Recipe Modal */}
      <RecipeModal
        meal={selectedMealForEdit}
        isOpen={isRecipeModalOpen}
        onClose={() => {
          setIsRecipeModalOpen(false);
          setSelectedMealForEdit(null);
        }}
        onSave={handleSaveMealRecipe}
        allIngredients={ingredients}
      />
    </div>
  );
};
