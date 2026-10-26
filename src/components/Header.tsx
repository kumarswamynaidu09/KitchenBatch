import React from 'react';
import { ChefHat, Calendar, Sliders, Printer, Download, Sparkles, Building2, CheckCircle2 } from 'lucide-react';
import { CanteenProfile } from '../types';

interface HeaderProps {
  currentProfile: CanteenProfile;
  profiles: CanteenProfile[];
  onSelectProfile: (profile: CanteenProfile) => void;
  targetDate: string;
  onTargetDateChange: (date: string) => void;
  dayOfWeek: string;
  bufferMarginPct: number;
  onBufferMarginChange: (pct: number) => void;
  attendanceDeltaPct: number;
  onAttendanceDeltaChange: (pct: number) => void;
  weather: 'Sunny' | 'Rainy' | 'Cold / Snow' | 'Mild';
  onWeatherChange: (weather: 'Sunny' | 'Rainy' | 'Cold / Snow' | 'Mild') => void;
  onPrint: () => void;
  onExportCSV: () => void;
  solverConverged: boolean;
  solverIterations: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentProfile,
  profiles,
  onSelectProfile,
  targetDate,
  onTargetDateChange,
  dayOfWeek,
  bufferMarginPct,
  onBufferMarginChange,
  attendanceDeltaPct,
  onAttendanceDeltaChange,
  weather,
  onWeatherChange,
  onPrint,
  onExportCSV,
  solverConverged,
  solverIterations,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main top bar */}
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
                  Gauss-Seidel Solved ({solverIterations} iters)
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Canteen Ingredient Planning & Numerical Demand Allocation
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Canteen Selector */}
            <div className="relative">
              <select
                aria-label="Canteen Profile"
                value={currentProfile.id}
                onChange={(e) => {
                  const found = profiles.find((p) => p.id === e.target.value);
                  if (found) onSelectProfile(found);
                }}
                className="pl-8 pr-8 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg cursor-pointer transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              onClick={onPrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Print Chef Production Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
              title="Export Plan to CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Control toolbar strip */}
        <div className="py-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs">
          {/* Target Planning Date & Day */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Target Service:
            </span>
            <input
              type="date"
              aria-label="Target Service Date"
              value={targetDate}
              onChange={(e) => onTargetDateChange(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono font-medium focus:outline-emerald-600"
            />
            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[11px]">
              {dayOfWeek} Lunch
            </span>
          </div>

          {/* Weather multiplier */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Weather Condition:</span>
            <select
              aria-label="Weather Condition"
              value={weather}
              onChange={(e) => onWeatherChange(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium text-xs focus:outline-emerald-600"
            >
              <option value="Sunny">Sunny (Normal 1.0x)</option>
              <option value="Mild">Mild / Overcast (1.0x)</option>
              <option value="Rainy">Rainy (+6% hot comfort dishes)</option>
              <option value="Cold / Snow">Cold / Snow (+8% demand)</option>
            </select>
          </div>

          {/* Safety Buffer Margin Slider */}
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
              onChange={(e) => onBufferMarginChange(Number(e.target.value) / 100)}
              className="w-20 accent-emerald-600 cursor-pointer"
            />
            <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
              +{Math.round(bufferMarginPct * 100)}%
            </span>
          </div>

          {/* Attendance Adjustment */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Attendance Delta:</span>
            <input
              type="range"
              min="-30"
              max="30"
              step="5"
              aria-label="Attendance Delta Percentage"
              value={attendanceDeltaPct}
              onChange={(e) => onAttendanceDeltaChange(Number(e.target.value))}
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
  );
};
