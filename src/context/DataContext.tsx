import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import type {
  WeightTarget,
  WeightEntry,
  Exercise,
  WorkoutSessionWithDetails,
  NutritionTargets,
  FoodEntry,
} from '@/types';
import * as api from '@/services/api';

interface DataContextValue {
  weightTarget: WeightTarget | null;
  weightEntries: WeightEntry[];
  exercises: Exercise[];
  workoutSessions: WorkoutSessionWithDetails[];
  nutritionTargets: NutritionTargets | null;
  foodEntries: FoodEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  refreshWeight: () => Promise<void>;
  refreshWorkouts: () => Promise<void>;
  refreshNutrition: () => Promise<void>;
  refreshExercises: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [weightTarget, setWeightTarget] = useState<WeightTarget | null>(null);
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSessionWithDetails[]>([]);
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wt, we, ex, ws, nt, fe] = await Promise.all([
        api.getWeightTarget(),
        api.getWeightEntries(),
        api.getExercises(),
        api.getWorkoutSessions(),
        api.getNutritionTargets(),
        api.getFoodEntries(),
      ]);
      setWeightTarget(wt);
      setWeightEntries(we);
      setExercises(ex);
      setWorkoutSessions(ws);
      setNutritionTargets(nt);
      setFoodEntries(fe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWeight = useCallback(async () => {
    try {
      const [wt, we] = await Promise.all([api.getWeightTarget(), api.getWeightEntries()]);
      setWeightTarget(wt);
      setWeightEntries(we);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weight data');
    }
  }, []);

  const refreshWorkouts = useCallback(async () => {
    try {
      const [ex, ws] = await Promise.all([api.getExercises(), api.getWorkoutSessions()]);
      setExercises(ex);
      setWorkoutSessions(ws);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout data');
    }
  }, []);

  const refreshNutrition = useCallback(async () => {
    try {
      const [nt, fe] = await Promise.all([api.getNutritionTargets(), api.getFoodEntries()]);
      setNutritionTargets(nt);
      setFoodEntries(fe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nutrition data');
    }
  }, []);

  const refreshExercises = useCallback(async () => {
    try {
      const ex = await api.getExercises();
      setExercises(ex);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <DataContext.Provider
      value={{
        weightTarget,
        weightEntries,
        exercises,
        workoutSessions,
        nutritionTargets,
        foodEntries,
        loading,
        error,
        refresh,
        refreshWeight,
        refreshWorkouts,
        refreshNutrition,
        refreshExercises,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
