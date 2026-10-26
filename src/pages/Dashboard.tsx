import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  UtensilsCrossed,
  PackageCheck,
  FileText,
  Database,
  ChefHat,
  Calendar,
  Sliders,
  Printer,
  Download,
  Copy,
  Check,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Flame,
  Scale,
  DollarSign,
  Cpu,
  Calculator,
  Filter,
  CheckSquare,
  Square,
  Edit2,
  Layers,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
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
import { Meal, Ingredient, DailyLog, CanteenProfile, MealForecast, ProcurementItem, IngredientCategory } from '../types';
import { RecipeModal } from '../components/RecipeModal';

export const Dashboard: React.FC = () => {
  // Core state
  const [ingredients, setIngredients] = useState<Ingredient[]>(INITIAL_INGREDIENTS);
  const [meals, setMeals] = useState<Meal[]>(INITIAL_MEALS);
  const [logs, setLogs] = useState<DailyLog[]>(INITIAL_LOGS);
  const [currentProfile, setCurrentProfile] = useState<CanteenProfile>(CANTEEN_PROFILES[0]);

  // Target service controls
  const [targetDate, setTargetDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [weather, setWeather] = useState<'Sunny' | 'Rainy' | 'Cold / Snow' | 'Mild'>('Sunny');
  const [bufferMarginPct, setBufferMarginPct] = useState<number>(0.08); // 8% kitchen buffer
  const [attendanceDeltaPct, setAttendanceDeltaPct] = useState<number>(0);
  const [manualOverrides, setManualOverrides] = useState<Record<string, number>>({});

  // UI state
  const [viewMode, setViewMode] = useState<'dashboard' | 'print_sheet' | 'data_logs'>('dashboard');
  const [showMatrixDetails, setShowMatrixDetails] = useState<boolean>(false);
  const [selectedMealId, setSelectedMealId] = useState<string>(INITIAL_MEALS[0].id);
  const [selectedBOMCategory, setSelectedBOMCategory] = useState<string>('All');
  const [copiedPO, setCopiedPO] = useState<boolean>(false);
  const [completedPrepTasks, setCompletedPrepTasks] = useState<Record<string, boolean>>({});

  // Modal state
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState<boolean>(false);
  const [selectedMealForEdit, setSelectedMealForEdit] = useState<Meal | null>(null);

  // Day of week calculation
  const dayOfWeek = useMemo(() => {
    const d = new Date(targetDate + 'T12:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[d.getDay()] || 'Wednesday';
  }, [targetDate]);

  // Weather multiplier
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

  // Forecasting and integer batch allocations
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

  // Constrained integer BOM procurement
  const procurementItems = useMemo(() => {
    return calculateIngredientProcurement(meals, ingredients, forecasts);
  }, [meals, ingredients, forecasts]);

  // Average R² metric
  const averageR2 = useMemo(() => {
    let sum = 0;
    meals.forEach((m) => {
      const history = logs.map((l) => l.mealDemand[m.id] || 0);
      const reg = calculateLinearRegression(history);
      sum += reg.r2;
    });
    return sum / (meals.length || 1);
  }, [meals, logs]);

  // Selected meal details
  const selectedMeal = meals.find((m) => m.id === selectedMealId) || meals[0];
  const selectedForecast = forecasts.find((f) => f.mealId === selectedMeal?.id);
  const selectedMealHistory = logs.map((l) => l.mealDemand[selectedMeal?.id || ''] || 0);
  const selectedMealReg = useMemo(() => calculateLinearRegression(selectedMealHistory), [selectedMealHistory]);

  // Chart data: 14 recent days
  const recentLogs = useMemo(() => logs.slice(-14), [logs]);
  const chartData = useMemo(() => {
    return recentLogs.map((log, idx) => {
      const demand = log.mealDemand[selectedMeal?.id || ''] || 0;
      const regLine = Math.round(selectedMealReg.slope * (logs.length - 14 + idx + 1) + selectedMealReg.intercept);
      return {
        date: `${log.dayOfWeek.slice(0, 3)} ${log.date.slice(5)}`,
        ActualDemand: demand,
        RegressionTrend: regLine,
        TotalAttendance: log.attendance,
      };
    });
  }, [recentLogs, logs.length, selectedMeal?.id, selectedMealReg]);

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
    setViewMode('print_sheet');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCopyPO = () => {
    const totalSpend = procurementItems.reduce((acc, i) => acc + i.totalCost, 0);
    const lines = [
      'KITCHENBATCH PURCHASE ORDER',
      `Target Service: ${targetDate} (${dayOfWeek} Lunch)`,
      `Canteen Profile: ${currentProfile.name}`,
      '--------------------------------------------------',
      ...procurementItems
        .filter((i) => i.packagesToOrder > 0)
        .map(
          (i) =>
            `- ${i.name}: ${i.packagesToOrder} x ${i.packUnit} (${i.totalOrderAmount} ${i.unit}) — $${i.totalCost.toFixed(2)}`
        ),
      '--------------------------------------------------',
      `Total Estimated Spend: $${totalSpend.toFixed(2)}`,
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedPO(true);
    setTimeout(() => setCopiedPO(false), 2000);
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

  // Calculations for summary stats
  const totalBatches = forecasts.reduce((acc, f) => acc + f.batchesNeeded, 0);
  const totalPortionsPrepared = forecasts.reduce((acc, f) => acc + f.totalPlannedPortionsFromBatches, 0);
  const surplusPortions = totalPortionsPrepared - totalDiners;
  const totalProcurementSpend = procurementItems.reduce((acc, item) => acc + item.totalCost, 0);
  const totalPrepKg = procurementItems
    .filter((item) => item.unit === 'kg')
    .reduce((acc, item) => acc + item.requiredAmount, 0);
  const criticalDeficitCount = procurementItems.filter((i) => i.status === 'critical').length;

  // Filtered BOM items
  const filteredBOM = procurementItems.filter((item) =>
    selectedBOMCategory === 'All' ? true : item.category === selectedBOMCategory
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] antialiased">
      {/* Top Application Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-xs">
                <ChefHat className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold font-display tracking-tight text-slate-900">
                    KitchenBatch
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Gauss-Seidel Converged ({gaussSeidelLog.iterations} iters)
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Canteen Ingredient Planning & Numerical Demand Allocation
                </p>
              </div>
            </div>

            {/* Top Toolbar Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Canteen Selector */}
              <div className="relative">
                <select
                  aria-label="Canteen Profile"
                  value={currentProfile.id}
                  onChange={(e) => {
                    const found = CANTEEN_PROFILES.find((p) => p.id === e.target.value);
                    if (found) handleSelectProfile(found);
                  }}
                  className="pl-8 pr-8 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {CANTEEN_PROFILES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* View mode toggle */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'dashboard'
                      ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setViewMode('print_sheet')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'print_sheet'
                      ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chef Sheet
                </button>
                <button
                  onClick={() => setViewMode('data_logs')}
                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'data_logs'
                      ? 'bg-white shadow-2xs text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Logs
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Print Kitchen Sheet"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Print</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                title="Export Plan to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Subheader Parameter Controls */}
          <div className="py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Service Date:
              </span>
              <input
                type="date"
                aria-label="Service Date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono font-medium focus:outline-emerald-600"
              />
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
                {dayOfWeek} Lunch
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Weather Condition:</span>
              <select
                aria-label="Weather Condition"
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium text-xs focus:outline-emerald-600"
              >
                <option value="Sunny">Sunny (1.0x)</option>
                <option value="Mild">Mild / Overcast (1.0x)</option>
                <option value="Rainy">Rainy (+6% hot comfort dishes)</option>
                <option value="Cold / Snow">Cold / Snow (+8% demand)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                Kitchen Buffer:
              </span>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                aria-label="Kitchen Buffer Percentage"
                value={Math.round(bufferMarginPct * 100)}
                onChange={(e) => setBufferMarginPct(Number(e.target.value) / 100)}
                className="w-20 accent-emerald-600 cursor-pointer"
              />
              <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                +{Math.round(bufferMarginPct * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Attendance Delta:</span>
              <input
                type="range"
                min="-30"
                max="30"
                step="5"
                aria-label="Attendance Delta Percentage"
                value={attendanceDeltaPct}
                onChange={(e) => setAttendanceDeltaPct(Number(e.target.value))}
                className="w-20 accent-emerald-600 cursor-pointer"
              />
              <span className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                attendanceDeltaPct > 0
                  ? 'bg-blue-50 text-blue-700'
                  : attendanceDeltaPct < 0
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {attendanceDeltaPct > 0 ? `+${attendanceDeltaPct}%` : `${attendanceDeltaPct}%`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 no-print">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">Projected Demand</span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <ChefHat className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-display text-slate-900 tabular-nums">
                {totalDiners.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">diners</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
              <span>Prepared: <strong className="text-slate-800">{totalPortionsPrepared}</strong></span>
              <span className="text-emerald-700 font-medium">+{surplusPortions} buffer</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
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
              <span>5 core recipes</span>
              <span className="text-amber-700 font-medium">100% capacity</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">Gross Prep Weight</span>
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
              <span>{procurementItems.length} ingredients</span>
              {criticalDeficitCount > 0 ? (
                <span className="text-rose-600 font-bold">{criticalDeficitCount} deficits</span>
              ) : (
                <span className="text-emerald-600 font-medium">Stock stable</span>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
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
              <span>Cost/Pax: ${(totalFoodCost / (totalPortionsPrepared || 1)).toFixed(2)}</span>
              <span className="text-indigo-600 font-medium">Integer Pack</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold tracking-wide uppercase">Numerical Engine</span>
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
              <span>Gauss-Seidel: {gaussSeidelLog.iterations} iters</span>
              <span className="text-emerald-600 font-semibold">Tol &lt; 10⁻⁴</span>
            </div>
          </div>
        </div>

        {/* VIEW 1: COMPLETE UNIFIED DASHBOARD */}
        {viewMode === 'dashboard' && (
          <>
            {/* Section 1: Demand Forecasting & Numerical Analysis */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-base font-bold font-display text-slate-900">
                      Demand Forecasting & Numerical Equilibrium Analysis
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Comparing 14-Day Seasonal Averages, Least-Squares Linear Regression, and Gauss-Seidel multi-dish substitution.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    aria-label="Select Focus Meal"
                    value={selectedMealId}
                    onChange={(e) => setSelectedMealId(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-emerald-600"
                  >
                    {meals.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowMatrixDetails(!showMatrixDetails)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showMatrixDetails ? 'Hide Matrix Trace' : 'Gauss-Seidel System (A·x=b)'}</span>
                  </button>
                </div>
              </div>

              {/* Gauss-Seidel Matrix Inspector Drawer */}
              {showMatrixDetails && (
                <div className="mb-5 p-4 rounded-xl bg-slate-900 text-white font-mono text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-3 font-sans">
                    <div>
                      <span className="font-bold text-emerald-400">Coupled Linear System A · x = b</span>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Diagonally dominant substitution matrix solved via Gauss-Seidel successive iteration.
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                      Converged in {gaussSeidelLog.iterations} steps (Residual &lt; 10⁻⁴)
                    </span>
                  </div>

                  <div className="overflow-x-auto text-[11px] mb-3">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-1">Equation (i)</th>
                          {gaussSeidelLog.matrix.meals.map((name, i) => (
                            <th key={i} className="py-1 px-2 text-right">
                              {name.slice(0, 10)}..
                            </th>
                          ))}
                          <th className="py-1 px-2 text-right text-emerald-400 font-bold">b Vector</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gaussSeidelLog.matrix.A.map((row, i) => (
                          <tr key={i} className="border-b border-slate-800/40">
                            <td className="py-1 font-sans text-slate-300">
                              {gaussSeidelLog.matrix.meals[i].slice(0, 16)}
                            </td>
                            {row.map((val, j) => (
                              <td
                                key={j}
                                className={`py-1 px-2 text-right tabular-nums ${
                                  i === j ? 'text-emerald-400 font-bold' : 'text-slate-400'
                                }`}
                              >
                                {val.toFixed(3)}
                              </td>
                            ))}
                            <td className="py-1 px-2 text-right text-emerald-300 font-bold tabular-nums">
                              {Math.round(gaussSeidelLog.matrix.b[i])}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Chart and Comparison Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* 14-Day Trend Chart */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                        <YAxis stroke="#64748b" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            borderColor: '#334155',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontSize: '11px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                        <Line
                          type="monotone"
                          dataKey="ActualDemand"
                          name="Historical Served"
                          stroke="#047857"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: '#047857' }}
                        />
                        <Line
                          type="linear"
                          dataKey="RegressionTrend"
                          name="Regression Line"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px]">
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">Slope (m)</span>
                      <strong className="text-slate-900 font-mono">
                        {selectedMealReg.slope > 0 ? `+${selectedMealReg.slope.toFixed(2)}` : selectedMealReg.slope.toFixed(2)}/d
                      </strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 block">R² Fit</span>
                      <strong className="text-slate-900 font-mono">
                        {(selectedMealReg.r2 * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded border border-emerald-200">
                      <span className="text-emerald-700 block font-medium">Planned Portions</span>
                      <strong className="text-emerald-900 font-mono font-bold">
                        {selectedForecast?.finalPlannedPortions} pax
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Demand Comparison Table */}
                <div className="lg:col-span-7 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="pb-2.5 pl-1">Dish Name</th>
                        <th className="pb-2.5 text-right">Seasonal</th>
                        <th className="pb-2.5 text-right">Linear Reg</th>
                        <th className="pb-2.5 text-right">Gauss-Seidel</th>
                        <th className="pb-2.5 text-right text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          Blended
                        </th>
                        <th className="pb-2.5 text-right pr-2">Batches Needed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {forecasts.map((fc) => {
                        const meal = meals.find((m) => m.id === fc.mealId);
                        const isSelected = meal?.id === selectedMealId;
                        return (
                          <tr
                            key={fc.mealId}
                            onClick={() => meal && setSelectedMealId(meal.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/50 font-medium' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-2.5 pl-1">
                              <div className="font-semibold text-slate-900">{fc.mealName}</div>
                              <div className="text-[10px] text-slate-500">{meal?.category} • Cap: {meal?.batchCapacity}</div>
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-slate-600">
                              {fc.historicalAvg}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-slate-600">
                              {fc.linearRegression}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-slate-600">
                              {fc.gaussSeidel}
                            </td>
                            <td className="py-2.5 text-right tabular-nums text-emerald-700 font-bold bg-emerald-50 px-2">
                              {fc.blendedForecast}
                            </td>
                            <td className="py-2.5 text-right pr-2 tabular-nums">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white font-mono">
                                {fc.batchesNeeded} ({fc.totalPlannedPortionsFromBatches} pax)
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Section 2: Integer Batch & Equipment Production Schedule */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                    <h2 className="text-base font-bold font-display text-slate-900">
                      Constrained Integer Batch & Kitchen Equipment Allocation
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Dishes are scheduled in discreet batches based on cooking vessel pan capacities. Adjust portion targets directly below.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setSelectedMealForEdit(null);
                    setIsRecipeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Recipe</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meals.map((meal) => {
                  const fc = forecasts.find((f) => f.mealId === meal.id);
                  if (!fc) return null;
                  const isOverridden = fc.manualOverride !== undefined;

                  return (
                    <div
                      key={meal.id}
                      className="border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-fit mb-1">
                              <Flame className="w-3 h-3 text-amber-600" />
                              {meal.cookingStation}
                            </span>
                            <h3 className="font-bold text-sm text-slate-900 font-display leading-tight">
                              {meal.name}
                            </h3>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedMealForEdit(meal);
                              setIsRecipeModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Edit Recipe"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Batch formula breakdown */}
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 mb-3 text-xs font-mono">
                          <div className="flex items-center justify-between text-slate-500 font-sans text-[11px] mb-1">
                            <span>Formula: ⌈ {fc.finalPlannedPortions} / {meal.batchCapacity} ⌉</span>
                            <span className="text-emerald-700 font-bold">
                              {fc.batchesNeeded} Batches
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                            <span className="text-slate-600 font-sans">Yield: <strong>{fc.totalPlannedPortionsFromBatches} pax</strong></span>
                            <span className="text-emerald-700 font-sans">Buffer: <strong>+{fc.surplusPortions}</strong></span>
                          </div>
                        </div>

                        {/* Portion Target Slider */}
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 text-[11px]">Planned Pax:</span>
                            <div className="flex items-center gap-1.5">
                              {isOverridden && (
                                <button
                                  onClick={() => handleManualOverride(meal.id, undefined)}
                                  className="text-[10px] text-amber-600 hover:text-amber-700 flex items-center gap-0.5 cursor-pointer"
                                  title="Reset to Model"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                              <input
                                type="number"
                                min="10"
                                max="600"
                                step="5"
                                aria-label={`Target Portions for ${meal.name}`}
                                value={fc.finalPlannedPortions}
                                onChange={(e) => handleManualOverride(meal.id, Number(e.target.value))}
                                className="w-14 px-1 py-0.5 text-right font-mono text-xs rounded border border-slate-200"
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
                            onChange={(e) => handleManualOverride(meal.id, Number(e.target.value))}
                            className="w-full accent-emerald-600 cursor-pointer"
                          />
                        </div>

                        {/* Recipe BOM mini list */}
                        <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-100 pt-2">
                          {meal.recipe.slice(0, 3).map((item) => {
                            const ing = ingredients.find((i) => i.id === item.ingredientId);
                            if (!ing) return null;
                            const total = (item.amountPerPortion * fc.totalPlannedPortionsFromBatches).toFixed(1);
                            return (
                              <div key={item.ingredientId} className="flex items-center justify-between py-0.5">
                                <span className="truncate max-w-[170px]">{ing.name}</span>
                                <span className="font-mono text-slate-800 tabular-nums">
                                  {total} {ing.unit}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Cost: <strong>${(fc.estimatedFoodCost / fc.totalPlannedPortionsFromBatches).toFixed(2)}/pax</strong></span>
                        <span className="font-mono font-semibold text-slate-800">Total: ${fc.estimatedFoodCost.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Constrained Integer Ingredient Procurement & Bill of Materials */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-emerald-700" />
                    <h2 className="text-base font-bold font-display text-slate-900">
                      Constrained Integer Ingredient Procurement (BOM)
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Requirements are calculated from prepared batches and rounded up to minimum commercial pack sizes.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleCopyPO}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    {copiedPO ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy PO Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download PO (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-3 border-b border-slate-100 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                {['All', 'Produce', 'Proteins', 'Grains & Pasta', 'Dairy & Refrigerated', 'Pantry & Spices', 'Oils & Sauces'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedBOMCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedBOMCategory === cat
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-3 text-right">Required</th>
                      <th className="py-2.5 px-3 text-right">Current Stock</th>
                      <th className="py-2.5 px-3 text-right">Net Deficit</th>
                      <th className="py-2.5 px-3 text-right">Vendor Pack</th>
                      <th className="py-2.5 px-3 text-right">Order Packs</th>
                      <th className="py-2.5 px-3 text-right">Total Delivered</th>
                      <th className="py-2.5 px-3 text-right">Post-Prep Stock</th>
                      <th className="py-2.5 px-3 text-right">Cost</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBOM.map((item) => (
                      <tr key={item.ingredientId} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900">{item.name}</span>
                          <span className="text-[10px] text-slate-400 block">{item.category}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-800 font-medium">
                          {item.requiredAmount.toFixed(1)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          <div className="inline-flex items-center gap-1 justify-end">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              aria-label={`Current stock for ${item.name}`}
                              value={item.currentStock}
                              onChange={(e) => handleUpdateStock(item.ingredientId, Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 text-right font-mono text-xs rounded border border-slate-200 bg-white hover:border-slate-300"
                            />
                            <span className="text-slate-400 text-[10px]">{item.unit}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {item.netDeficit > 0 ? (
                            <span className="text-rose-600 font-semibold font-mono">
                              -{item.netDeficit.toFixed(1)} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400">0.0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600">
                          {item.packUnit}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {item.packagesToOrder > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 font-mono">
                              {item.packagesToOrder} pk
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-slate-700">
                          {item.totalOrderAmount > 0 ? `+${item.totalOrderAmount} ${item.unit}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-mono text-slate-700">
                          {item.projectedStockAfterPrep.toFixed(1)} {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-mono font-semibold text-slate-900">
                          ${item.totalCost.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {item.status === 'critical' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              Order Deficit
                            </span>
                          ) : item.status === 'low_buffer' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              Low Reserve
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Covered
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PO Total Footer */}
              <div className="bg-slate-50 p-3.5 border-t border-slate-200 mt-3 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">
                  Total Commercial Units to Order:{' '}
                  <strong className="text-slate-900">
                    {procurementItems.reduce((acc, i) => acc + i.packagesToOrder, 0)} packages
                  </strong>
                </span>
                <span className="text-slate-900 font-bold font-display text-sm">
                  Total Estimated Spend:{' '}
                  <strong className="text-emerald-800 font-mono text-base font-bold">
                    ${totalProcurementSpend.toFixed(2)}
                  </strong>
                </span>
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: CHEF PREP SHEET */}
        {viewMode === 'print_sheet' && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 sm:p-8 shadow-xs print-only-section">
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">
                  KitchenBatch Production Sheet
                </div>
                <h2 className="text-2xl font-black font-display text-slate-900 mt-1">
                  DAILY CHEF PREPARATION DIRECTIVE
                </h2>
                <div className="text-xs text-slate-600 mt-1 font-mono">
                  Target Service: <strong>{dayOfWeek}, {targetDate}</strong> | Shift: <strong>Lunch (11:30 - 14:00)</strong>
                </div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-xs block font-mono">Planned Covers</span>
                <span className="text-2xl font-bold font-display text-slate-900">
                  {totalPortionsPrepared} Portions
                </span>
              </div>
            </div>

            {/* Stations */}
            <div className="space-y-5">
              {['Combi-Oven', 'Steam Kettle', 'Griddle / Sauté', 'Cold Larder'].map((station) => {
                const stationMeals = meals.filter((m) => m.cookingStation === station);
                if (stationMeals.length === 0) return null;
                return (
                  <div key={station} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-emerald-700" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">
                          Station: {station}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {stationMeals.length} Assigned Dishes
                      </span>
                    </div>

                    <div className="space-y-3">
                      {stationMeals.map((meal) => {
                        const fc = forecasts.find((f) => f.mealId === meal.id);
                        if (!fc) return null;
                        const taskId = `prep-${meal.id}`;
                        const isDone = !!completedPrepTasks[taskId];

                        return (
                          <div
                            key={meal.id}
                            className={`p-3 rounded border text-xs ${
                              isDone ? 'bg-emerald-50/30 border-emerald-200 text-slate-500' : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={() =>
                                    setCompletedPrepTasks((prev) => ({
                                      ...prev,
                                      [taskId]: !prev[taskId],
                                    }))
                                  }
                                  className="mt-0.5 text-slate-400 hover:text-emerald-700 cursor-pointer no-print"
                                >
                                  {isDone ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                <div>
                                  <h4 className={`font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                    {meal.name}
                                  </h4>
                                  <span className="text-[11px] text-slate-500">
                                    Pan Capacity: {meal.batchCapacity} pax • <strong>{fc.batchesNeeded} Batches</strong> ({fc.totalPlannedPortionsFromBatches} Portions)
                                  </span>
                                </div>
                              </div>

                              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-900 text-white">
                                {fc.batchesNeeded} BATCHES
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-slate-200/80">
                              {meal.recipe.map((r) => {
                                const ing = ingredients.find((i) => i.id === r.ingredientId);
                                if (!ing) return null;
                                const scaled = (r.amountPerPortion * fc.totalPlannedPortionsFromBatches).toFixed(2);
                                return (
                                  <div key={r.ingredientId} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200 text-[11px]">
                                    <span className="truncate pr-1">{ing.name}</span>
                                    <strong className="font-mono text-slate-900 shrink-0">
                                      {scaled} {ing.unit}
                                    </strong>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Chef Sign-Off:</span>
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
        )}

        {/* VIEW 3: HISTORICAL LOGS & PROFILE SWITCHER */}
        {viewMode === 'data_logs' && (
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div>
              <h2 className="text-base font-bold font-display text-slate-900">
                Historical Attendance & Consumption Dataset
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                The numerical engine fits linear trends and day-of-week seasonality from these recorded service logs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CANTEEN_PROFILES.map((p) => {
                const isSelected = p.id === currentProfile.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <span className="font-bold text-xs text-slate-900 font-display block mb-1">
                      {p.name}
                    </span>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                      {p.description}
                    </p>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      ~{p.typicalAttendance} diners/day
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Day</th>
                      <th className="py-2.5 px-3 text-right">Attendance</th>
                      <th className="py-2.5 px-3">Weather</th>
                      {meals.map((m) => (
                        <th key={m.id} className="py-2.5 px-2 text-right">
                          {m.name.slice(0, 10)}..
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-sans text-slate-800">{log.date}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{log.dayOfWeek}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{log.attendance}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">{log.weather}</td>
                        {meals.map((m) => (
                          <td key={m.id} className="py-2 px-2 text-right text-slate-600">
                            {log.mealDemand[m.id] || 0}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
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
