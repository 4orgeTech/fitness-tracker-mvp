import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Scale, Apple, Save, Check } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, Button, Input, Select, Badge } from '@/components/ui';
import * as api from '@/services/api';
import type { WeightUnit } from '@/types';

export function SettingsPage() {
  const { weightTarget, nutritionTargets, refreshWeight, refreshNutrition } = useData();

  const [weightForm, setWeightForm] = useState({
    initial_weight: '',
    target_weight: '',
    weight_unit: 'kg' as WeightUnit,
  });
  const [nutritionForm, setNutritionForm] = useState({
    calories_target: '2000', calories_min: '', calories_max: '',
    carbs_target: '250', carbs_min: '', carbs_max: '',
    protein_target: '150', protein_min: '', protein_max: '',
    fat_target: '70', fat_min: '', fat_max: '',
    fiber_target: '30', fiber_min: '', fiber_max: '',
  });
  const [savingWeight, setSavingWeight] = useState(false);
  const [savingNutrition, setSavingNutrition] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);
  const [nutritionSaved, setNutritionSaved] = useState(false);
  const [weightError, setWeightError] = useState('');
  const [nutritionError, setNutritionError] = useState('');

  useEffect(() => {
    if (weightTarget) {
      setWeightForm({
        initial_weight: String(weightTarget.initial_weight),
        target_weight: String(weightTarget.target_weight),
        weight_unit: weightTarget.weight_unit,
      });
    }
  }, [weightTarget]);

  useEffect(() => {
    if (nutritionTargets) {
      setNutritionForm({
        calories_target: String(nutritionTargets.calories_target),
        calories_min: nutritionTargets.calories_min ? String(nutritionTargets.calories_min) : '',
        calories_max: nutritionTargets.calories_max ? String(nutritionTargets.calories_max) : '',
        carbs_target: String(nutritionTargets.carbs_target),
        carbs_min: nutritionTargets.carbs_min ? String(nutritionTargets.carbs_min) : '',
        carbs_max: nutritionTargets.carbs_max ? String(nutritionTargets.carbs_max) : '',
        protein_target: String(nutritionTargets.protein_target),
        protein_min: nutritionTargets.protein_min ? String(nutritionTargets.protein_min) : '',
        protein_max: nutritionTargets.protein_max ? String(nutritionTargets.protein_max) : '',
        fat_target: String(nutritionTargets.fat_target),
        fat_min: nutritionTargets.fat_min ? String(nutritionTargets.fat_min) : '',
        fat_max: nutritionTargets.fat_max ? String(nutritionTargets.fat_max) : '',
        fiber_target: String(nutritionTargets.fiber_target),
        fiber_min: nutritionTargets.fiber_min ? String(nutritionTargets.fiber_min) : '',
        fiber_max: nutritionTargets.fiber_max ? String(nutritionTargets.fiber_max) : '',
      });
    }
  }, [nutritionTargets]);

  const handleSaveWeight = async () => {
    const initial = parseFloat(weightForm.initial_weight);
    const target = parseFloat(weightForm.target_weight);
    if (isNaN(initial) || initial <= 0) {
      setWeightError('Please enter a valid initial weight');
      return;
    }
    if (isNaN(target) || target <= 0) {
      setWeightError('Please enter a valid target weight');
      return;
    }
    setSavingWeight(true);
    setWeightError('');
    try {
      await api.upsertWeightTarget({
        initial_weight: initial,
        target_weight: target,
        weight_unit: weightForm.weight_unit,
      });
      await refreshWeight();
      setWeightSaved(true);
      setTimeout(() => setWeightSaved(false), 2000);
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingWeight(false);
    }
  };

  const handleSaveNutrition = async () => {
    const toNumOrNull = (val: string): number | null => {
      if (!val.trim()) return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    };

    const calories_target = parseFloat(nutritionForm.calories_target);
    const carbs_target = parseFloat(nutritionForm.carbs_target);
    const protein_target = parseFloat(nutritionForm.protein_target);
    const fat_target = parseFloat(nutritionForm.fat_target);
    const fiber_target = parseFloat(nutritionForm.fiber_target);

    if ([calories_target, carbs_target, protein_target, fat_target, fiber_target].some((v) => isNaN(v) || v < 0)) {
      setNutritionError('Please enter valid target values');
      return;
    }

    setSavingNutrition(true);
    setNutritionError('');
    try {
      await api.upsertNutritionTargets({
        calories_target,
        calories_min: toNumOrNull(nutritionForm.calories_min),
        calories_max: toNumOrNull(nutritionForm.calories_max),
        carbs_target,
        carbs_min: toNumOrNull(nutritionForm.carbs_min),
        carbs_max: toNumOrNull(nutritionForm.carbs_max),
        protein_target,
        protein_min: toNumOrNull(nutritionForm.protein_min),
        protein_max: toNumOrNull(nutritionForm.protein_max),
        fat_target,
        fat_min: toNumOrNull(nutritionForm.fat_min),
        fat_max: toNumOrNull(nutritionForm.fat_max),
        fiber_target,
        fiber_min: toNumOrNull(nutritionForm.fiber_min),
        fiber_max: toNumOrNull(nutritionForm.fiber_max),
      });
      await refreshNutrition();
      setNutritionSaved(true);
      setTimeout(() => setNutritionSaved(false), 2000);
    } catch (err) {
      setNutritionError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingNutrition(false);
    }
  };

  const nutrientFields: { key: keyof typeof nutritionForm; label: string; unit: string }[] = [
    { key: 'calories_target', label: 'Calories', unit: 'kcal' },
    { key: 'carbs_target', label: 'Carbs', unit: 'g' },
    { key: 'protein_target', label: 'Protein', unit: 'g' },
    { key: 'fat_target', label: 'Fat', unit: 'g' },
    { key: 'fiber_target', label: 'Fiber', unit: 'g' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure your fitness goals and nutritional targets</p>
      </div>

      {/* Weight Target Settings */}
      <Card title="Weight Goal" subtitle="Set your starting weight, target weight, and preferred unit">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              label="Initial Weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 80"
              value={weightForm.initial_weight}
              onChange={(e) => setWeightForm({ ...weightForm, initial_weight: e.target.value })}
            />
            <Input
              label="Target Weight"
              type="number"
              step="0.1"
              min="0"
              placeholder="e.g. 75"
              value={weightForm.target_weight}
              onChange={(e) => setWeightForm({ ...weightForm, target_weight: e.target.value })}
            />
            <Select
              label="Unit"
              value={weightForm.weight_unit}
              onChange={(e) => setWeightForm({ ...weightForm, weight_unit: e.target.value as WeightUnit })}
            >
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
            </Select>
          </div>
          {weightError && <p className="text-sm text-red-500">{weightError}</p>}
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveWeight} disabled={savingWeight}>
              {savingWeight ? 'Saving…' : weightSaved ? (
                <><Check size={16} /> Saved</>
              ) : (
                <><Save size={16} /> Save Weight Goal</>
              )}
            </Button>
            {weightTarget && (
              <Badge variant="success">Goal configured</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Nutrition Target Settings */}
      <Card title="Nutritional Targets" subtitle="Set daily targets and optional min/max ranges for each nutrient">
        <div className="space-y-5">
          {nutrientFields.map((field) => {
            const minKey = `${field.key.replace('_target', '_min')}` as keyof typeof nutritionForm;
            const maxKey = `${field.key.replace('_target', '_max')}` as keyof typeof nutritionForm;
            return (
              <div key={field.key}>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <Input
                    label={`${field.label} Target (${field.unit})`}
                    type="number"
                    step="0.1"
                    min="0"
                    value={nutritionForm[field.key]}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, [field.key]: e.target.value })}
                  />
                  <Input
                    label="Min (optional)"
                    type="number"
                    step="0.1"
                    min="0"
                    value={nutritionForm[minKey]}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, [minKey]: e.target.value })}
                  />
                  <Input
                    label="Max (optional)"
                    type="number"
                    step="0.1"
                    min="0"
                    value={nutritionForm[maxKey]}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, [maxKey]: e.target.value })}
                  />
                </div>
              </div>
            );
          })}
          {nutritionError && <p className="text-sm text-red-500">{nutritionError}</p>}
          <div className="flex items-center gap-3">
            <Button onClick={handleSaveNutrition} disabled={savingNutrition}>
              {savingNutrition ? 'Saving…' : nutritionSaved ? (
                <><Check size={16} /> Saved</>
              ) : (
                <><Save size={16} /> Save Nutrition Targets</>
              )}
            </Button>
            {nutritionTargets && (
              <Badge variant="success">Targets configured</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Info card */}
      <Card className="bg-green-50 border-green-200">
        <div className="flex items-start gap-3">
          <SettingsIcon className="text-green-700 shrink-0 mt-0.5" size={18} />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-700 mb-1">About this app</p>
            <p className="text-xs text-gray-500">FitTrack stores all your fitness data securely in a database. Your weight goals, exercise library, workout sessions, and nutrition logs are saved and available across sessions. The app is designed to support multiple users in a future update.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
