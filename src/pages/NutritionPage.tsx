import { useState, useMemo } from 'react';
import { Apple, Plus, Trash2, Pencil, Flame, Wheat, Beef, Droplet, Leaf } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, StatCard, Button, Input, Select, Badge, ConfirmDialog, Modal, EmptyState, ProgressBar, LoadingSpinner } from '@/components/ui';
import { LineChart } from '@/components/charts';
import { DateRangePicker } from '@/components/DateRangePicker';
import * as api from '@/services/api';
import { calcDailyTotals, calcAllNutrientStatuses, groupFoodEntriesByDate, type NutrientStatus, type TargetStatus } from '@/lib/nutritionUtils';
import { formatDateTime, toLocalDatetimeLocal, fromLocalDatetimeLocal } from '@/lib/weightUtils';
import { getDateRange, getNumDaysInRange } from '@/lib/dateRange';
import { NUTRIENT_LABELS, NUTRIENT_UNITS } from '@/types/app';
import type { DateRange } from '@/types/app';
import type { FoodEntry } from '@/types';

const NUTRIENT_ICONS: Record<string, typeof Flame> = {
  calories: Flame,
  carbs: Wheat,
  protein: Beef,
  fat: Droplet,
  fiber: Leaf,
};

const STATUS_BADGES: Record<TargetStatus, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  below: { variant: 'warning', label: 'Below Target' },
  within: { variant: 'success', label: 'Within Target' },
  above: { variant: 'error', label: 'Above Target' },
  'no-target': { variant: 'neutral', label: 'No Target' },
};

export function NutritionPage() {
  const { foodEntries, nutritionTargets, refreshNutrition, loading } = useData();
  const [range, setRange] = useState<DateRange>(getDateRange('day'));
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FoodEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const emptyForm = {
    food_name: '',
    consumed_at: toLocalDatetimeLocal(new Date()),
    quantity_g: '',
    calories: '',
    carbs_g: '',
    protein_g: '',
    fat_g: '',
    fiber_g: '',
  };
  const [formData, setFormData] = useState(emptyForm);

  const filteredEntries = useMemo(
    () => foodEntries.filter((e) => {
      const d = new Date(e.consumed_at);
      return d >= range.start && d <= range.end;
    }),
    [foodEntries, range]
  );

  const dailyTotals = useMemo(() => calcDailyTotals(filteredEntries), [filteredEntries]);
  const statuses = useMemo(() => calcAllNutrientStatuses(dailyTotals, nutritionTargets), [dailyTotals, nutritionTargets]);

  // Weekly chart: daily calories
  const calorieChart = useMemo(() => {
    const grouped = groupFoodEntriesByDate(filteredEntries);
    const days: { x: string; y: number }[] = [];
    const numDays = getNumDaysInRange(range);
    for (let i = 0; i < numDays; i++) {
      const d = new Date(range.start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayEntries = grouped.get(key) || [];
      const totals = calcDailyTotals(dayEntries);
      days.push({ x: key, y: totals.calories });
    }
    return days;
  }, [filteredEntries, range]);

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData(emptyForm);
    setFormError('');
    setShowFoodModal(true);
  };

  const openEditModal = (entry: FoodEntry) => {
    setEditingEntry(entry);
    setFormData({
      food_name: entry.food_name,
      consumed_at: toLocalDatetimeLocal(new Date(entry.consumed_at)),
      quantity_g: String(entry.quantity_g),
      calories: String(entry.calories),
      carbs_g: String(entry.carbs_g),
      protein_g: String(entry.protein_g),
      fat_g: String(entry.fat_g),
      fiber_g: String(entry.fiber_g),
    });
    setFormError('');
    setShowFoodModal(true);
  };

  const handleSave = async () => {
    if (!formData.food_name.trim()) {
      setFormError('Food name is required');
      return;
    }
    const payload = {
      food_name: formData.food_name.trim(),
      consumed_at: fromLocalDatetimeLocal(formData.consumed_at),
      quantity_g: parseFloat(formData.quantity_g) || 0,
      calories: parseFloat(formData.calories) || 0,
      carbs_g: parseFloat(formData.carbs_g) || 0,
      protein_g: parseFloat(formData.protein_g) || 0,
      fat_g: parseFloat(formData.fat_g) || 0,
      fiber_g: parseFloat(formData.fiber_g) || 0,
    };
    setSaving(true);
    setFormError('');
    try {
      if (editingEntry) {
        await api.updateFoodEntry(editingEntry.id, payload);
      } else {
        await api.createFoodEntry(payload);
      }
      await refreshNutrition();
      setShowFoodModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteFoodEntry(deleteId);
      await refreshNutrition();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const renderNutrientCard = (key: keyof typeof statuses, status: NutrientStatus) => {
    const Icon = NUTRIENT_ICONS[key];
    const badge = STATUS_BADGES[status.status];
    const unit = NUTRIENT_UNITS[key];
    return (
      <div key={key} className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-green-600" />
            <span className="text-sm font-medium text-gray-700">{NUTRIENT_LABELS[key]}</span>
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-gray-900">{status.actual.toFixed(0)}</span>
          <span className="text-sm text-gray-500">/ {status.target.toFixed(0)} {unit}</span>
        </div>
        <ProgressBar
          value={status.pctOfTarget}
          colorClass={status.status === 'above' ? 'bg-red-400' : status.status === 'within' ? 'bg-green-500' : 'bg-lime-400'}
        />
        <p className="text-xs text-gray-500 mt-1.5">
          {status.status === 'no-target'
            ? 'Set a target in Settings'
            : status.remaining >= 0
              ? `${status.remaining.toFixed(0)} ${unit} remaining`
              : `${Math.abs(status.remaining).toFixed(0)} ${unit} over`}
        </p>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner className="py-20" size={32} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nutrition</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your daily food intake and nutrients</p>
        </div>
        <Button onClick={openAddModal}><Plus size={16} /> Add Food</Button>
      </div>

      {/* Date range */}
      <DateRangePicker range={range} onChange={setRange} />

      {/* Nutrient status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {renderNutrientCard('calories', statuses.calories)}
        {renderNutrientCard('carbs', statuses.carbs)}
        {renderNutrientCard('protein', statuses.protein)}
        {renderNutrientCard('fat', statuses.fat)}
        {renderNutrientCard('fiber', statuses.fiber)}
      </div>

      {/* Calorie trend chart for week/month */}
      {range.mode !== 'day' && calorieChart.length > 0 && (
        <Card title="Daily Calorie Intake" subtitle={`Calories per day in selected period`}>
          <LineChart data={calorieChart} unit="kcal" height={200} color="#166534" targetLine={nutritionTargets?.calories_target} targetLabel={nutritionTargets ? `Target: ${nutritionTargets.calories_target} kcal` : undefined} />
        </Card>
      )}

      {/* Food log */}
      <Card title="Food Log" subtitle={`${filteredEntries.length} entries in selected period`}>
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={<Apple size={36} />}
            title="No food entries in this period"
            description="Add what you've eaten to track your daily intake."
            action={<Button size="sm" onClick={openAddModal}><Plus size={14} /> Add Food</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">Food</th>
                  <th className="pb-2 font-medium text-gray-500">Time</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Qty (g)</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Cal</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Carbs</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Protein</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Fat</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Fiber</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-50 hover:bg-green-50/50 transition-colors">
                    <td className="py-2.5 font-medium text-gray-900">{entry.food_name}</td>
                    <td className="py-2.5 text-gray-500 text-xs">{formatDateTime(entry.consumed_at)}</td>
                    <td className="py-2.5 text-right text-gray-700">{entry.quantity_g}</td>
                    <td className="py-2.5 text-right text-gray-700">{entry.calories.toFixed(0)}</td>
                    <td className="py-2.5 text-right text-gray-500">{entry.carbs_g.toFixed(1)}</td>
                    <td className="py-2.5 text-right text-gray-500">{entry.protein_g.toFixed(1)}</td>
                    <td className="py-2.5 text-right text-gray-500">{entry.fat_g.toFixed(1)}</td>
                    <td className="py-2.5 text-right text-gray-500">{entry.fiber_g.toFixed(1)}</td>
                    <td className="py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => openEditModal(entry)} className="p-1.5 text-gray-400 hover:text-green-700 rounded transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteId(entry.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-green-100">
                  <td className="py-2.5 font-bold text-gray-900" colSpan={2}>Daily Total</td>
                  <td className="py-2.5 text-right font-medium text-gray-700">{dailyTotals.calories > 0 ? filteredEntries.reduce((s, e) => s + e.quantity_g, 0).toFixed(0) : '—'}</td>
                  <td className="py-2.5 text-right font-bold text-gray-900">{dailyTotals.calories.toFixed(0)}</td>
                  <td className="py-2.5 text-right font-medium text-gray-700">{dailyTotals.carbs.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-medium text-gray-700">{dailyTotals.protein.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-medium text-gray-700">{dailyTotals.fat.toFixed(1)}</td>
                  <td className="py-2.5 text-right font-medium text-gray-700">{dailyTotals.fiber.toFixed(1)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Food Modal */}
      <Modal
        open={showFoodModal}
        onClose={() => setShowFoodModal(false)}
        title={editingEntry ? 'Edit Food Entry' : 'Add Food Entry'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowFoodModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editingEntry ? 'Update' : 'Add'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Food Name"
              placeholder="e.g. Chicken breast"
              value={formData.food_name}
              onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
              error={formError}
            />
            <Input
              label="Date & Time"
              type="datetime-local"
              value={formData.consumed_at}
              onChange={(e) => setFormData({ ...formData, consumed_at: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Input label="Quantity (g)" type="number" min="0" step="0.1" placeholder="0" value={formData.quantity_g} onChange={(e) => setFormData({ ...formData, quantity_g: e.target.value })} />
            <Input label="Calories (kcal)" type="number" min="0" step="0.1" placeholder="0" value={formData.calories} onChange={(e) => setFormData({ ...formData, calories: e.target.value })} />
            <Input label="Carbs (g)" type="number" min="0" step="0.1" placeholder="0" value={formData.carbs_g} onChange={(e) => setFormData({ ...formData, carbs_g: e.target.value })} />
            <Input label="Protein (g)" type="number" min="0" step="0.1" placeholder="0" value={formData.protein_g} onChange={(e) => setFormData({ ...formData, protein_g: e.target.value })} />
            <Input label="Fat (g)" type="number" min="0" step="0.1" placeholder="0" value={formData.fat_g} onChange={(e) => setFormData({ ...formData, fat_g: e.target.value })} />
            <Input label="Fiber (g)" type="number" min="0" step="0.1" placeholder="0" value={formData.fiber_g} onChange={(e) => setFormData({ ...formData, fiber_g: e.target.value })} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Food Entry"
        message="Are you sure you want to delete this food entry? This action cannot be undone."
      />
    </div>
  );
}
