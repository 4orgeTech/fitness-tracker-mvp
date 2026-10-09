export type Page = 'dashboard' | 'weight' | 'workouts' | 'nutrition' | 'settings';

export type DateRangeMode = 'day' | 'week' | 'month';

export interface DateRange {
  start: Date;
  end: Date;
  mode: DateRangeMode;
}

export interface AppData {
  weightTarget: any;
  weightEntries: any[];
  exercises: any[];
  workoutSessions: any[];
  nutritionTargets: any;
  foodEntries: any[];
}

export const EXERCISE_CATEGORIES = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'core', label: 'Core' },
] as const;

export const NUTRIENT_LABELS = {
  calories: 'Calories',
  carbs: 'Carbs',
  protein: 'Protein',
  fat: 'Fat',
  fiber: 'Fiber',
} as const;

export const NUTRIENT_UNITS = {
  calories: 'kcal',
  carbs: 'g',
  protein: 'g',
  fat: 'g',
  fiber: 'g',
} as const;
