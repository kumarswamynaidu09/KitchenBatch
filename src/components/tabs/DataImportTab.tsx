import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import {
  Upload,
  Download,
  Database,
  Building2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { DailyLog, CanteenProfile, Meal } from '../../types';

interface DataImportTabProps {
  logs: DailyLog[];
  meals: Meal[];
  onUpdateLogs: (newLogs: DailyLog[]) => void;
  profiles: CanteenProfile[];
  currentProfile: CanteenProfile;
  onSelectProfile: (profile: CanteenProfile) => void;
}

export const DataImportTab: React.FC<DataImportTabProps> = ({
  logs,
  meals,
  onUpdateLogs,
  profiles,
  currentProfile,
  onSelectProfile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParseError(null);
    setParseSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedLogs: DailyLog[] = [];
          const rows = results.data as any[];

          if (!rows || rows.length === 0) {
            setParseError('The uploaded CSV file is empty.');
            return;
          }

          rows.forEach((row, index) => {
            const date = row.date || row.Date;
            const attendance = parseInt(row.attendance || row.Attendance || '0', 10);
            const dayOfWeek = (row.dayOfWeek || row.Day || 'Wednesday') as DailyLog['dayOfWeek'];
            const weather = (row.weather || 'Mild') as DailyLog['weather'];

            if (!date || isNaN(attendance) || attendance <= 0) {
              return; // skip invalid line
            }

            const mealDemand: Record<string, number> = {};
            meals.forEach((m) => {
              const val = row[m.id] || row[m.name] || row[m.name.slice(0, 10)];
              mealDemand[m.id] = val ? parseInt(val, 10) : Math.round(attendance * m.defaultShare);
            });

            parsedLogs.push({
              id: `imported-${Date.now()}-${index}`,
              date,
              dayOfWeek,
              attendance,
              weather,
              weatherFactor: 1.0,
              eventMultiplier: 1.0,
              mealDemand,
            });
          });

          if (parsedLogs.length === 0) {
            setParseError('No valid log records found in CSV. Please follow the template format.');
            return;
          }

          onUpdateLogs(parsedLogs);
          setParseSuccess(`Successfully imported ${parsedLogs.length} historical service records!`);
        } catch (err: any) {
          setParseError(`Failed to parse CSV: ${err.message}`);
        }
      },
      error: (error) => {
        setParseError(`CSV Parse Error: ${error.message}`);
      },
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download Sample CSV template
  const handleDownloadTemplate = () => {
    const headers = ['date', 'dayOfWeek', 'attendance', 'weather', ...meals.map((m) => m.id)];
    const sampleRows = logs.slice(-5).map((l) => [
      l.date,
      l.dayOfWeek,
      l.attendance,
      l.weather,
      ...meals.map((m) => l.mealDemand[m.id] || 0),
    ]);

    const csvContent = [headers.join(','), ...sampleRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'kitchenbatch_sample_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logs for table
  const filteredLogs = logs.filter(
    (l) =>
      l.date.includes(searchTerm) ||
      l.dayOfWeek.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.weather.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Profile Switcher */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Historical Consumption Datasets & Profiles
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              The numerical engine uses these historical records to generate regression trends and cross-elasticity matrices.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Custom CSV</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>

        {/* Feedback alerts */}
        {parseError && (
          <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}
        {parseSuccess && (
          <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{parseSuccess}</span>
          </div>
        )}

        {/* Preloaded Canteen Profiles */}
        <div className="pt-4 border-t border-slate-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-3">
            Quick Canteen Archetype Presets
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {profiles.map((profile) => {
              const isSelected = profile.id === currentProfile.id;
              return (
                <button
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 font-display">
                      {profile.name}
                    </span>
                    <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                    {profile.description}
                  </p>
                  <span className="inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Typical: ~{profile.typicalAttendance} diners/day
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Historical Records Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Active Historical Canteen Dataset ({logs.length} Days Recorded)
            </h4>
          </div>

          <input
            type="text"
            placeholder="Search date, day, or weather..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-emerald-600 w-full sm:w-64"
          />
        </div>

        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Day</th>
                <th className="py-2.5 px-3 text-right">Total Diners</th>
                <th className="py-2.5 px-3">Weather</th>
                {meals.map((m) => (
                  <th key={m.id} className="py-2.5 px-2 text-right">
                    {m.name.slice(0, 10)}..
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-sans text-slate-900 font-medium">
                    {log.date}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">
                    {log.dayOfWeek}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {log.attendance}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-600">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700">
                      {log.weather}
                    </span>
                  </td>
                  {meals.map((m) => (
                    <td key={m.id} className="py-2.5 px-2 text-right text-slate-600">
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
  );
};
