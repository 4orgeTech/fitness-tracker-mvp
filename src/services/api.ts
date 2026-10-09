import { supabase } from '@/lib/supabase';
import type {
  WeightTarget,
  WeightEntry,
  Exercise,
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  NutritionTargets,
  FoodEntry,
  WorkoutSessionWithDetails,
  WeightUnit,
  ExerciseCategory,
} from '@/types';

// ============================================================
// Weight Targets
// ============================================================

export async function getWeightTarget(): Promise<WeightTarget | null> {
  const { data, error } = await supabase
    .from('weight_targets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as WeightTarget | null;
}

export async function upsertWeightTarget(
  target: Omit<WeightTarget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<WeightTarget> {
  const existing = await getWeightTarget();
  if (existing) {
    const { data, error } = await supabase
      .from('weight_targets')
      .update({
        initial_weight: target.initial_weight,
        target_weight: target.target_weight,
        weight_unit: target.weight_unit,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as WeightTarget;
  }
  const { data, error } = await supabase
    .from('weight_targets')
    .insert({
      initial_weight: target.initial_weight,
      target_weight: target.target_weight,
      weight_unit: target.weight_unit,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WeightTarget;
}

// ============================================================
// Weight Entries
// ============================================================

export async function getWeightEntries(): Promise<WeightEntry[]> {
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .order('recorded_at', { ascending: true });
  if (error) throw error;
  return data as WeightEntry[];
}

export async function createWeightEntry(
  weight: number,
  weightUnit: WeightUnit,
  recordedAt: string
): Promise<WeightEntry> {
  const { data, error } = await supabase
    .from('weight_entries')
    .insert({ weight, weight_unit: weightUnit, recorded_at: recordedAt })
    .select()
    .single();
  if (error) throw error;
  return data as WeightEntry;
}

export async function updateWeightEntry(
  id: string,
  weight: number,
  weightUnit: WeightUnit,
  recordedAt: string
): Promise<WeightEntry> {
  const { data, error } = await supabase
    .from('weight_entries')
    .update({ weight, weight_unit: weightUnit, recorded_at: recordedAt, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as WeightEntry;
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Exercises
// ============================================================

export async function getExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data as Exercise[];
}

export async function createExercise(name: string, category: ExerciseCategory): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert({ name, category })
    .select()
    .single();
  if (error) throw error;
  return data as Exercise;
}

export async function updateExercise(id: string, name: string, category: ExerciseCategory): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update({ name, category, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Exercise;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Workout Sessions
// ============================================================

export async function getWorkoutSessions(): Promise<WorkoutSessionWithDetails[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(
      `
      *,
      workout_exercises (
        *,
        exercise:exercises (*),
        workout_sets (*)
      )
    `
    )
    .order('session_date', { ascending: false });
  if (error) throw error;

  const sessions = (data || []) as unknown as WorkoutSessionWithDetails[];
  return sessions.map((s) => ({
    ...s,
    workout_exercises: (s.workout_exercises || []).map((ex) => ({
      ...ex,
      sets: (ex as any).workout_sets || [],
    })),
  }));
}

export async function createWorkoutSession(sessionDate: string, notes: string | null): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ session_date: sessionDate, notes })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSession;
}

export async function updateWorkoutSession(id: string, sessionDate: string, notes: string | null): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ session_date: sessionDate, notes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSession;
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sessions').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Workout Exercises (within a session)
// ============================================================

export async function addExerciseToSession(sessionId: string, exerciseId: string): Promise<WorkoutExercise> {
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({ workout_session_id: sessionId, exercise_id: exerciseId })
    .select('*, exercise:exercises (*)')
    .single();
  if (error) throw error;
  return data as unknown as WorkoutExercise;
}

export async function removeExerciseFromSession(workoutExerciseId: string): Promise<void> {
  const { error } = await supabase.from('workout_exercises').delete().eq('id', workoutExerciseId);
  if (error) throw error;
}

// ============================================================
// Workout Sets
// ============================================================

export async function addSet(
  workoutExerciseId: string,
  setNumber: number,
  reps: number,
  weight: number,
  weightUnit: WeightUnit
): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from('workout_sets')
    .insert({ workout_exercise_id: workoutExerciseId, set_number: setNumber, reps, weight, weight_unit: weightUnit })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSet;
}

export async function updateSet(
  id: string,
  reps: number,
  weight: number,
  weightUnit: WeightUnit
): Promise<WorkoutSet> {
  const { data, error } = await supabase
    .from('workout_sets')
    .update({ reps, weight, weight_unit: weightUnit })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutSet;
}

export async function deleteSet(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sets').delete().eq('id', id);
  if (error) throw error;
}

// ============================================================
// Nutrition Targets
// ============================================================

export async function getNutritionTargets(): Promise<NutritionTargets | null> {
  const { data, error } = await supabase
    .from('nutrition_targets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as NutritionTargets | null;
}

export async function upsertNutritionTargets(
  targets: Omit<NutritionTargets, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<NutritionTargets> {
  const existing = await getNutritionTargets();
  if (existing) {
    const { data, error } = await supabase
      .from('nutrition_targets')
      .update({ ...targets, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as NutritionTargets;
  }
  const { data, error } = await supabase
    .from('nutrition_targets')
    .insert(targets)
    .select()
    .single();
  if (error) throw error;
  return data as NutritionTargets;
}

// ============================================================
// Food Entries
// ============================================================

export async function getFoodEntries(): Promise<FoodEntry[]> {
  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .order('consumed_at', { ascending: false });
  if (error) throw error;
  return data as FoodEntry[];
}

export async function createFoodEntry(
  entry: Omit<FoodEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<FoodEntry> {
  const { data, error } = await supabase
    .from('food_entries')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data as FoodEntry;
}

export async function updateFoodEntry(
  id: string,
  entry: Omit<FoodEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<FoodEntry> {
  const { data, error } = await supabase
    .from('food_entries')
    .update({ ...entry, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as FoodEntry;
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  if (error) throw error;
}
