import React, { useState } from 'react';
import {
  PackageCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Check,
  Filter,
  DollarSign,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { ProcurementItem, IngredientCategory, Ingredient } from '../../types';

interface ProcurementTabProps {
  procurementItems: ProcurementItem[];
  onUpdateStock: (ingredientId: string, newStock: number) => void;
  onExportCSV: () => void;
}

export const ProcurementTab: React.FC<ProcurementTabProps> = ({
  procurementItems,
  onUpdateStock,
  onExportCSV,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copied, setCopied] = useState<boolean>(false);

  const categories: (string | IngredientCategory)[] = [
    'All',
    'Produce',
    'Proteins',
    'Grains & Pasta',
    'Dairy & Refrigerated',
    'Pantry & Spices',
    'Oils & Sauces',
  ];

  const filteredItems = procurementItems.filter((item) =>
    selectedCategory === 'All' ? true : item.category === selectedCategory
  );

  const totalSpend = procurementItems.reduce((acc, i) => acc + i.totalCost, 0);
  const criticalCount = procurementItems.filter((i) => i.status === 'critical').length;
  const packagesTotal = procurementItems.reduce((acc, i) => acc + i.packagesToOrder, 0);

  const handleCopyPO = () => {
    const lines = [
      'KITCHENBATCH PURCHASE ORDER',
      `Generated: ${new Date().toLocaleDateString()}`,
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
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top PO Summary Strip */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold font-display text-slate-900">
                Constrained Integer Bill of Materials (BOM)
              </h3>
              {criticalCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {criticalCount} Deficit Items to Order
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Stock Covered
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supplier orders are automatically rounded up to integer commercial pack sizes (e.g. 25kg sacks, 10kg crates).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyPO}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? (
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
              onClick={onExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export PO (CSV)</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 mt-4 border-t border-slate-100">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Procurement Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Ingredient & Vendor Pack</th>
                <th className="py-3 px-3 text-right">Required for Prep</th>
                <th className="py-3 px-3 text-right">Current Stock</th>
                <th className="py-3 px-3 text-right">Net Deficit</th>
                <th className="py-3 px-3 text-right">Packs to Order</th>
                <th className="py-3 px-3 text-right">Total Delivered</th>
                <th className="py-3 px-3 text-right">Post-Prep Stock</th>
                <th className="py-3 px-3 text-right">Estimated Cost</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.ingredientId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{item.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                      <span>Pack: {item.packUnit}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums text-slate-800 font-medium">
                    {item.requiredAmount.toFixed(1)} {item.unit}
                  </td>

                  {/* Inline editable stock */}
                  <td className="py-3 px-3 text-right tabular-nums">
                    <div className="inline-flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Current stock for ${item.name}`}
                        value={item.currentStock}
                        onChange={(e) => onUpdateStock(item.ingredientId, Number(e.target.value))}
                        className="w-14 px-1.5 py-0.5 text-right font-mono text-xs rounded border border-slate-200 bg-white hover:border-slate-300 focus:border-emerald-500 focus:outline-none"
                      />
                      <span className="text-slate-400 text-[11px]">{item.unit}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums">
                    {item.netDeficit > 0 ? (
                      <span className="text-rose-600 font-semibold font-mono">
                        -{item.netDeficit.toFixed(1)} {item.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400">0.0 {item.unit}</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums">
                    {item.packagesToOrder > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                        {item.packagesToOrder} pk
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono">0</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                    {item.totalOrderAmount > 0 ? (
                      <span className="font-semibold text-slate-900">
                        +{item.totalOrderAmount} {item.unit}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums text-slate-700">
                    <span
                      className={`font-mono ${
                        item.projectedStockAfterPrep < 5 ? 'text-amber-600 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {item.projectedStockAfterPrep.toFixed(1)} {item.unit}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right tabular-nums">
                    <span className="font-mono font-semibold text-slate-900">
                      ${item.totalCost.toFixed(2)}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.status === 'critical' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Stockout Deficit
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

        {/* PO Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="text-slate-600">
            Showing <strong className="text-slate-900">{filteredItems.length}</strong> ingredients | Total Packages to Order:{' '}
            <strong className="text-slate-900">{packagesTotal} commercial units</strong>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-600">Total Purchase Order Spend:</span>
            <span className="text-lg font-bold font-display text-emerald-800 font-mono">
              ${totalSpend.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
