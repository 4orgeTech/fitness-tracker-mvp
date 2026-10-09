import type { WorkoutSet, WorkoutExercise } from '@/types';
import type { WeightUnit } from '@/types';

export function calcSetVolume(set: WorkoutSet): number {
  return set.weight * set.reps;
}

export function calcExerciseVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + calcSetVolume(s), 0);
}

export function calcSessionVolume(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => {
    const exSets = ex.sets || [];
    return sum + calcExerciseVolume(exSets);
  }, 0);
}

export function calcSessionTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);
}

export function calcSessionTotalReps(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => {
    return sum + (ex.sets?.reduce((s, set) => s + set.reps, 0) || 0);
  }, 0);
}

export function formatVolume(volume: number, unit: WeightUnit = 'kg'): string {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k ${unit}`;
  }
  return `${volume.toFixed(0)} ${unit}`;
}
