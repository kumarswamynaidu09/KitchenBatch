import React, { useState } from 'react';
import { X, Plus, Trash2, DollarSign, ChefHat, Layers } from 'lucide-react';
import { Meal, Ingredient, DietaryTag, RecipeItem } from '../types';

interface RecipeModalProps {
  meal?: Meal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (meal: Meal) => void;
  allIngredients: Ingredient[];
}

const AVAILABLE_DIETARY: DietaryTag[] = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'High-Protein',
  'Dairy-Free',
];

export const RecipeModal: React.FC<RecipeModalProps> = ({
  meal,
  isOpen,
  onClose,
  onSave,
  allIngredients,
}) => {
  if (!isOpen) return null;

  const isEditing = !!meal;

  const [name, setName] = useState(meal?.name || '');
  const [category, setCategory] = useState<Meal['category']>(meal?.category || 'Main');
  const [basePrice, setBasePrice] = useState<number>(meal?.basePrice || 10.0);
  const [batchCapacity, setBatchCapacity] = useState<number>(meal?.batchCapacity || 40);
  const [cookingStation, setCookingStation] = useState<Meal['cookingStation']>(
    meal?.cookingStation || 'Steam Kettle'
  );
  const [dietary, setDietary] = useState<DietaryTag[]>(meal?.dietary || []);
  const [recipe, setRecipe] = useState<RecipeItem[]>(
    meal?.recipe || [
      { ingredientId: allIngredients[0]?.id || 'ing-rice', amountPerPortion: 0.15 },
    ]
  );

  const toggleDietary = (tag: DietaryTag) => {
    if (dietary.includes(tag)) {
      setDietary(dietary.filter((t) => t !== tag));
    } else {
      setDietary([...dietary, tag]);
    }
  };

  const handleIngredientChange = (index: number, ingredientId: string) => {
    const updated = [...recipe];
    updated[index].ingredientId = ingredientId;
    setRecipe(updated);
  };

  const handleAmountChange = (index: number, amount: number) => {
    const updated = [...recipe];
    updated[index].amountPerPortion = Math.max(0, amount);
    setRecipe(updated);
  };

  const handleAddIngredient = () => {
    setRecipe([...recipe, { ingredientId: allIngredients[0]?.id || '', amountPerPortion: 0.1 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    if (recipe.length <= 1) return;
    setRecipe(recipe.filter((_, idx) => idx !== index));
  };

  // Calculate live portion food cost
  const calculatedPortionCost = recipe.reduce((acc, item) => {
    const ing = allIngredients.find((i) => i.id === item.ingredientId);
    return acc + (ing ? item.amountPerPortion * ing.unitCost : 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedMeal: Meal = {
      id: meal?.id || `meal-${Date.now()}`,
      name: name.trim(),
      category,
      basePrice,
      targetCost: Number(calculatedPortionCost.toFixed(2)),
      batchCapacity,
      cookingStation,
      dietary,
      recipe,
      defaultShare: meal?.defaultShare || 0.2,
    };

    onSave(updatedMeal);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ChefHat className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold font-display text-slate-900">
                {isEditing ? `Edit Recipe: ${meal.name}` : 'Create New Menu Recipe'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 text-xs">
            {/* Meal Name & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Recipe Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Saffron Rice Bowl with Falafel"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-emerald-600 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-emerald-600 text-xs bg-white"
                >
                  <option value="Main">Main Course</option>
                  <option value="Vegetarian">Vegetarian Main</option>
                  <option value="Bowl">Grain & Salad Bowl</option>
                  <option value="Pasta / Grain">Pasta / Grain</option>
                  <option value="Chef Special">Chef Special</option>
                </select>
              </div>
            </div>

            {/* Batch & Cooking Station */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Batch Pan Capacity
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="10"
                    max="200"
                    required
                    value={batchCapacity}
                    onChange={(e) => setBatchCapacity(Number(e.target.value))}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                  />
                  <span className="text-slate-500 whitespace-nowrap">pax/batch</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Cooking Station
                </label>
                <select
                  value={cookingStation}
                  onChange={(e) => setCookingStation(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-emerald-600 text-xs bg-white"
                >
                  <option value="Steam Kettle">Steam Kettle</option>
                  <option value="Combi-Oven">Combi-Oven</option>
                  <option value="Griddle / Sauté">Griddle / Sauté</option>
                  <option value="Cold Larder">Cold Larder</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Retail Price</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono">$</span>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full pl-6 pr-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Dietary Tags */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">Dietary Certifications</label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_DIETARY.map((tag) => {
                  const active = dietary.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleDietary(tag)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-emerald-700 text-white font-semibold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ingredients & Quantities per Portion */}
            <div className="pt-2 border-t border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="text-slate-800 font-bold block">Bill of Materials (Per Single Portion)</label>
                  <span className="text-[11px] text-slate-500">
                    Calculated Food Cost: <strong className="text-emerald-700 font-mono">${calculatedPortionCost.toFixed(2)}</strong> / portion
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddIngredient}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Ingredient</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recipe.map((item, index) => {
                  const currentIng = allIngredients.find((i) => i.id === item.ingredientId);
                  return (
                    <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <select
                        value={item.ingredientId}
                        onChange={(e) => handleIngredientChange(index, e.target.value)}
                        className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-emerald-600"
                      >
                        {allIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (${ing.unitCost.toFixed(2)}/{ing.unit})
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1 w-28">
                        <input
                          type="number"
                          step="0.005"
                          min="0.001"
                          value={item.amountPerPortion}
                          onChange={(e) => handleAmountChange(index, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs text-right"
                        />
                        <span className="text-slate-500 text-[11px] font-mono">{currentIng?.unit || 'kg'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(index)}
                        disabled={recipe.length <= 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0 rounded-b-2xl">
            <span className="text-slate-500 text-xs">
              Batch size: <strong className="text-slate-800">{batchCapacity} portions</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-2xs cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Create Recipe'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
