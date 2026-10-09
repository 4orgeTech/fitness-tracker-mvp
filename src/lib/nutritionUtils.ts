import type { FoodEntry, NutritionTargets } from '@/types';

export interface NutrientTotals {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

export function calcDailyTotals(entries: FoodEntry[]): NutrientTotals {
  return entries.reduce(
    (totals, e) => ({
      calories: totals.calories + e.calories,
      carbs: totals.carbs + e.carbs_g,
      protein: totals.protein + e.protein_g,
      fat: totals.fat + e.fat_g,
      fiber: totals.fiber + e.fiber_g,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 }
  );
}

export function calcAverageDailyTotals(entries: FoodEntry[], numDays: number): NutrientTotals {
  const totals = calcDailyTotals(entries);
  if (numDays <= 0) return totals;
  return {
    calories: totals.calories / numDays,
    carbs: totals.carbs / numDays,
    protein: totals.protein / numDays,
    fat: totals.fat / numDays,
    fiber: totals.fiber / numDays,
  };
}

export type TargetStatus = 'below' | 'within' | 'above' | 'no-target';

export interface NutrientStatus {
  actual: number;
  target: number;
  min: number | null;
  max: number | null;
  status: TargetStatus;
  remaining: number;
  remainingLabel: string;
  pctOfTarget: number;
}

export function calcNutrientStatus(
  actual: number,
  target: number,
  min: number | null,
  max: number | null
): NutrientStatus {
  let status: TargetStatus = 'no-target';
  if (min !== null && max !== null) {
    if (actual < min) status = 'below';
    else if (actual > max) status = 'above';
    else status = 'within';
  } else {
    if (actual < target * 0.9) status = 'below';
    else if (actual > target * 1.1) status = 'above';
    else status = 'within';
  }

  const remaining = target - actual;
  const absRemaining = Math.abs(remaining);
  const remainingLabel =
    remaining >= 0 ? `${absRemaining.toFixed(0)} under` : `${absRemaining.toFixed(0)} over`;

  const pctOfTarget = target > 0 ? Math.min((actual / target) * 100, 999) : 0;

  return { actual, target, min, max, status, remaining, remainingLabel, pctOfTarget };
}

export function calcAllNutrientStatuses(
  totals: NutrientTotals,
  targets: NutritionTargets | null
): {
  calories: NutrientStatus;
  carbs: NutrientStatus;
  protein: NutrientStatus;
  fat: NutrientStatus;
  fiber: NutrientStatus;
} {
  const noTarget: NutrientStatus = {
    actual: 0,
    target: 0,
    min: null,
    max: null,
    status: 'no-target',
    remaining: 0,
    remainingLabel: 'No target',
    pctOfTarget: 0,
  };

  if (!targets) {
    return {
      calories: { ...noTarget, actual: totals.calories },
      carbs: { ...noTarget, actual: totals.carbs },
      protein: { ...noTarget, actual: totals.protein },
      fat: { ...noTarget, actual: totals.fat },
      fiber: { ...noTarget, actual: totals.fiber },
    };
  }

  return {
    calories: calcNutrientStatus(totals.calories, targets.calories_target, targets.calories_min, targets.calories_max),
    carbs: calcNutrientStatus(totals.carbs, targets.carbs_target, targets.carbs_min, targets.carbs_max),
    protein: calcNutrientStatus(totals.protein, targets.protein_target, targets.protein_min, targets.protein_max),
    fat: calcNutrientStatus(totals.fat, targets.fat_target, targets.fat_min, targets.fat_max),
    fiber: calcNutrientStatus(totals.fiber, targets.fiber_target, targets.fiber_min, targets.fiber_max),
  };
}

export function groupFoodEntriesByDate(entries: FoodEntry[]): Map<string, FoodEntry[]> {
  const grouped = new Map<string, FoodEntry[]>();
  for (const entry of entries) {
    const dateKey = entry.consumed_at.split('T')[0];
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(entry);
  }
  return grouped;
}
