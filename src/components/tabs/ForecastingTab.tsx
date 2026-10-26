import React, { useState } from 'react';
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
  TrendingUp,
  Calculator,
  Layers,
  Cpu,
  Info,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { DailyLog, Meal, MealForecast, GaussSeidelResult, RegressionStats } from '../../types';
import { calculateLinearRegression } from '../../utils/numerical';

interface ForecastingTabProps {
  logs: DailyLog[];
  meals: Meal[];
  forecasts: MealForecast[];
  gaussSeidelResult: GaussSeidelResult;
  targetDayOfWeek: string;
}

export const ForecastingTab: React.FC<ForecastingTabProps> = ({
  logs,
  meals,
  forecasts,
  gaussSeidelResult,
  targetDayOfWeek,
}) => {
  const [selectedMealId, setSelectedMealId] = useState<string>(meals[0]?.id || '');
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);
  const [chartView, setChartView] = useState<'individual' | 'aggregate'>('aggregate');

  const selectedMeal = meals.find((m) => m.id === selectedMealId) || meals[0];

  // Prepare chart data for aggregate trend (last 14 days)
  const recentLogs = logs.slice(-14);
  const aggregateChartData = recentLogs.map((log) => {
    const entry: any = {
      date: log.date.slice(5),
      day: log.dayOfWeek.slice(0, 3),
      TotalAttendance: log.attendance,
    };
    meals.forEach((m) => {
      entry[m.name.slice(0, 15)] = log.mealDemand[m.id] || 0;
    });
    return entry;
  });

  // Calculate regression statistics for selected meal
  const selectedMealHistory = logs.map((l) => l.mealDemand[selectedMeal?.id || ''] || 0);
  const regressionStats: RegressionStats = calculateLinearRegression(selectedMealHistory);

  // Prepare individual meal chart data
  const individualChartData = recentLogs.map((log, idx) => {
    const demand = log.mealDemand[selectedMeal?.id || ''] || 0;
    // Regression line evaluation
    const regPoint = Math.round(regressionStats.slope * (logs.length - 14 + idx + 1) + regressionStats.intercept);
    return {
      date: `${log.dayOfWeek.slice(0, 3)} ${log.date.slice(5)}`,
      ActualDemand: demand,
      RegressionTrend: regPoint,
    };
  });

  const selectedForecast = forecasts.find((f) => f.mealId === selectedMeal?.id);

  return (
    <div className="space-y-6">
      {/* Top Controls & Explanation Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Cpu className="w-3.5 h-3.5" />
              <span>Multi-Method Numerical Pipeline</span>
            </div>
            <h2 className="text-xl font-bold font-display">
              Demand Forecasting & Equilibrium Engine
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              KitchenBatch combines <strong>Day-of-Week Seasonal Moving Averages</strong>, <strong>Least-Squares Linear Regression</strong>, and a <strong>Gauss-Seidel iterative solver</strong> to calculate cross-dish menu substitution balance.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowMatrixModal(!showMatrixModal)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>{showMatrixModal ? 'Hide Matrix Solver' : 'Inspect Gauss-Seidel System'}</span>
            </button>
          </div>
        </div>

        {/* Matrix & Numerical Solver Inspector Drawer */}
        {showMatrixModal && (
          <div className="mt-5 pt-5 border-t border-slate-700/80 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Matrix Formulation */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-700 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300 mb-2 font-sans">
                  <span className="font-semibold text-emerald-400">Coupled Linear System A · x = b</span>
                  <span className="text-[11px] text-slate-400">Diagonally Dominant (Convergence Guaranteed)</span>
                </div>
                <p className="text-slate-400 font-sans text-xs mb-3">
                  Diagonal elements <span className="text-emerald-400">A[i][i] = 1.0</span> represent own-dish elasticity. Off-diagonals represent cross-menu spillover.
                </p>
                <div className="overflow-x-auto text-[11px] text-slate-300">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-1">Meal (i)</th>
                        {gaussSeidelResult.matrix.meals.map((name: string, i: number) => (
                          <th key={i} className="py-1 px-2 text-right">
                            {name.slice(0, 8)}..
                          </th>
                        ))}
                        <th className="py-1 px-2 text-right text-emerald-400 font-semibold">b (Base)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gaussSeidelResult.matrix.A.map((row: number[], i: number) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                          <td className="py-1 font-sans text-slate-300">
                            {gaussSeidelResult.matrix.meals[i].slice(0, 14)}
                          </td>
                          {row.map((val: number, j: number) => (
                            <td
                              key={j}
                              className={`py-1 px-2 text-right tabular-nums ${
                                i === j ? 'text-emerald-400 font-bold' : 'text-slate-500'
                              }`}
                            >
                              {val.toFixed(3)}
                            </td>
                          ))}
                          <td className="py-1 px-2 text-right text-emerald-300 font-semibold tabular-nums">
                            {Math.round(gaussSeidelResult.matrix.b[i])}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Iteration Residual Log */}
              <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-700 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300 mb-2 font-sans">
                  <span className="font-semibold text-emerald-400">Gauss-Seidel Convergence Trace</span>
                  <span className="text-[11px] text-emerald-400 font-sans flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Converged in {gaussSeidelResult.iterations} steps
                  </span>
                </div>
                <p className="text-slate-400 font-sans text-xs mb-3">
                  Residual criterion: <code className="text-amber-300 font-mono">max|x^(k+1) - x^(k)| &lt; 0.0001</code>
                </p>
                <div className="max-h-48 overflow-y-auto text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 sticky top-0 bg-slate-950">
                        <th className="py-1">Iter</th>
                        <th className="py-1 px-2 text-right">Max Residual</th>
                        <th className="py-1 px-2 text-right">Dish 1</th>
                        <th className="py-1 px-2 text-right">Dish 2</th>
                        <th className="py-1 px-2 text-right">Dish 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gaussSeidelResult.history.map((step) => {
                        const vals = Object.values(step.values);
                        return (
                          <tr key={step.iteration} className="border-b border-slate-800/40">
                            <td className="py-1 text-slate-400">k = {step.iteration}</td>
                            <td className="py-1 px-2 text-right text-amber-300 font-mono">
                              {step.maxResidual.toFixed(6)}
                            </td>
                            <td className="py-1 px-2 text-right text-slate-300">
                              {vals[0] !== undefined ? String(vals[0]) : '-'}
                            </td>
                            <td className="py-1 px-2 text-right text-slate-300">
                              {vals[1] !== undefined ? String(vals[1]) : '-'}
                            </td>
                            <td className="py-1 px-2 text-right text-slate-300">
                              {vals[2] !== undefined ? String(vals[2]) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Numerical Method Comparison Grid */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Method-by-Method Demand Comparison
            </h3>
            <p className="text-xs text-slate-500">
              Comparing independent statistical methods against the final blended kitchen production plan for {targetDayOfWeek}.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="pb-3 pl-1">Menu Dish</th>
                <th className="pb-3 text-right">
                  <span title="Weighted recent 14-day & matching weekday average">Seasonal Avg</span>
                </th>
                <th className="pb-3 text-right">
                  <span title="Least-squares linear trendline projection">Linear Reg</span>
                </th>
                <th className="pb-3 text-right">
                  <span title="Cross-dish substitution equilibrium">Gauss-Seidel</span>
                </th>
                <th className="pb-3 text-right text-emerald-800 font-bold bg-emerald-50/60 px-3 py-1 rounded">
                  Blended Forecast
                </th>
                <th className="pb-3 text-right">Buffer Added</th>
                <th className="pb-3 text-right pr-2">Total Planned Portions</th>
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
                      isSelected ? 'bg-emerald-50/40 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 pl-1">
                      <div className="font-semibold text-slate-900">{fc.mealName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {meal?.category}
                        </span>
                        <span>Pan capacity: {meal?.batchCapacity}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-600">
                      {fc.historicalAvg} <span className="text-[10px] text-slate-400">pax</span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-600">
                      {fc.linearRegression} <span className="text-[10px] text-slate-400">pax</span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-600">
                      {fc.gaussSeidel} <span className="text-[10px] text-slate-400">pax</span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-emerald-700 font-bold bg-emerald-50/60 px-3">
                      {fc.blendedForecast} <span className="text-[10px]">pax</span>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-600">
                      +{fc.finalPlannedPortions - fc.blendedForecast}
                    </td>
                    <td className="py-3 text-right pr-2 tabular-nums">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-900 text-white">
                        {fc.finalPlannedPortions}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Trend Chart & Deep Dive */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-slate-900">
                Demand History & Numerical Trendline
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setChartView('aggregate')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    chartView === 'aggregate' ? 'bg-white shadow-2xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Meals Aggregate
                </button>
                <button
                  onClick={() => setChartView('individual')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    chartView === 'individual' ? 'bg-white shadow-2xs text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single Dish Focus
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {chartView === 'aggregate'
                ? 'Total canteen attendance and meal breakdown over the past 14 service days.'
                : `Focusing on ${selectedMeal?.name} with least-squares regression trend.`}
            </p>
          </div>

          {chartView === 'individual' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500 font-medium">Select Meal:</label>
              <select
                aria-label="Select Meal for Single Dish Focus"
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
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'aggregate' ? (
              <AreaChart data={aggregateChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="TotalAttendance" stroke="#047857" fill="#047857" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey={meals[0]?.name.slice(0, 15)} stroke="#2563eb" fill="#2563eb" fillOpacity={0.08} />
                <Area type="monotone" dataKey={meals[1]?.name.slice(0, 15)} stroke="#d97706" fill="#d97706" fillOpacity={0.08} />
                <Area type="monotone" dataKey={meals[2]?.name.slice(0, 15)} stroke="#9333ea" fill="#9333ea" fillOpacity={0.08} />
              </AreaChart>
            ) : (
              <LineChart data={individualChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.5rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="ActualDemand"
                  name="Actual Historical Served"
                  stroke="#047857"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#047857' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="linear"
                  dataKey="RegressionTrend"
                  name="Least-Squares Regression Line"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Selected Meal Statistical Diagnostic Box */}
        {chartView === 'individual' && selectedMeal && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Regression Slope (m)</span>
              <strong className="text-slate-800 font-mono text-sm">
                {regressionStats.slope > 0 ? `+${regressionStats.slope.toFixed(2)}` : regressionStats.slope.toFixed(2)} portions/day
              </strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">R² Correlation Fit</span>
              <strong className="text-slate-800 font-mono text-sm">
                {(regressionStats.r2 * 100).toFixed(1)}% {regressionStats.r2 > 0.7 ? '(Strong fit)' : '(Moderate)'}
              </strong>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <span className="text-slate-500 block">Projected Reg Portions</span>
              <strong className="text-slate-800 font-mono text-sm">
                {Math.round(regressionStats.projected)} portions
              </strong>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              <span className="text-emerald-700 block font-medium">Final Plan with Buffer</span>
              <strong className="text-emerald-900 font-mono text-sm">
                {selectedForecast?.finalPlannedPortions} portions ({selectedForecast?.batchesNeeded} batches)
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
