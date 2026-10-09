export type WeightUnit = 'kg' | 'lb';

export type ExerciseCategory = 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'core';

export interface WeightTarget {
  id: string;
  user_id: string | null;
  initial_weight: number;
  target_weight: number;
  weight_unit: WeightUnit;
  created_at: string;
  updated_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string | null;
  weight: number;
  weight_unit: WeightUnit;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  category: ExerciseCategory;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string | null;
  session_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_session_id: string;
  exercise_id: string;
  created_at: string;
  exercise?: Exercise;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  weight_unit: WeightUnit;
  created_at: string;
}

export interface NutritionTargets {
  id: string;
  user_id: string | null;
  calories_target: number;
  calories_min: number | null;
  calories_max: number | null;
  carbs_target: number;
  carbs_min: number | null;
  carbs_max: number | null;
  protein_target: number;
  protein_min: number | null;
  protein_max: number | null;
  fat_target: number;
  fat_min: number | null;
  fat_max: number | null;
  fiber_target: number;
  fiber_min: number | null;
  fiber_max: number | null;
  created_at: string;
  updated_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string | null;
  food_name: string;
  consumed_at: string;
  quantity_g: number;
  calories: number;
  carbs_g: number;
  protein_g: number;
  fat_g: number;
  fiber_g: number;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSessionWithDetails extends WorkoutSession {
  workout_exercises?: WorkoutExercise[];
}
