/*
# Create Fitness Tracking Schema (MVP, single-tenant with future auth support)

1. Overview
This migration creates the complete database schema for a personal fitness tracking application
with three modules: body weight tracking, workout/exercise tracking, and food/nutrition tracking.

All tables include a nullable `user_id` column referencing auth.users, designed so the app can
add authentication in a future release without schema changes. For the MVP, user_id is left
nullable and the app operates as a single-tenant system with open RLS policies.

2. New Tables

- `weight_targets`: Stores the user's weight goal settings (initial weight, target weight, unit preference).
  One row per user (or one global row for the MVP).
- `weight_entries`: Individual body weight measurements with timestamps.
- `exercises`: Custom exercise definitions organized by category (chest, back, shoulders, arms, legs, core).
  Reusable across workout sessions.
- `workout_sessions`: A workout session with a date and optional notes.
- `workout_exercises`: Links exercises to a workout session (many exercises per session).
- `workout_sets`: Individual sets within a workout exercise (reps + weight).
- `nutrition_targets`: Daily nutritional targets/ranges for calories and macros.
  One row per user (or one global row for the MVP).
- `food_entries`: Individual food consumption records with calories and nutrients.

3. Relationships
- weight_entries → weight_targets (optional, via user_id)
- workout_sessions → (self-contained, future: auth.users via user_id)
- workout_exercises → workout_sessions (cascade delete)
- workout_exercises → exercises (restrict delete if in use)
- workout_sets → workout_exercises (cascade delete)
- food_entries → nutrition_targets (optional, via user_id)

4. Security
- RLS enabled on ALL tables.
- All policies use `TO anon, authenticated` with `USING (true)` / `WITH CHECK (true)`
  because this is a single-tenant MVP with no sign-in screen. The data is intentionally
  shared/public. When auth is added in the future, these policies will be replaced with
  ownership-scoped policies using auth.uid() = user_id.

5. Indexes
- Indexes on date columns for fast historical queries and charting.
- Index on exercise category for filtered queries.
- Index on workout_exercises.session_id and workout_sets.workout_exercise_id for join performance.
*/

-- ============================================================
-- Weight Targets (settings: initial weight, target weight, unit)
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  initial_weight numeric(6,2) NOT NULL,
  target_weight numeric(6,2) NOT NULL,
  weight_unit text NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weight_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_weight_targets" ON weight_targets;
CREATE POLICY "anon_select_weight_targets" ON weight_targets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_weight_targets" ON weight_targets;
CREATE POLICY "anon_insert_weight_targets" ON weight_targets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_weight_targets" ON weight_targets;
CREATE POLICY "anon_update_weight_targets" ON weight_targets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_weight_targets" ON weight_targets;
CREATE POLICY "anon_delete_weight_targets" ON weight_targets FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Weight Entries (individual measurements)
-- ============================================================
CREATE TABLE IF NOT EXISTS weight_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  weight numeric(6,2) NOT NULL,
  weight_unit text NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_weight_entries" ON weight_entries;
CREATE POLICY "anon_select_weight_entries" ON weight_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_weight_entries" ON weight_entries;
CREATE POLICY "anon_insert_weight_entries" ON weight_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_weight_entries" ON weight_entries;
CREATE POLICY "anon_update_weight_entries" ON weight_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_weight_entries" ON weight_entries;
CREATE POLICY "anon_delete_weight_entries" ON weight_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_weight_entries_recorded_at ON weight_entries (recorded_at DESC);

-- ============================================================
-- Exercises (custom exercise library, organized by category)
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('chest', 'back', 'shoulders', 'arms', 'legs', 'core')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_exercises" ON exercises;
CREATE POLICY "anon_select_exercises" ON exercises FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_exercises" ON exercises;
CREATE POLICY "anon_insert_exercises" ON exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_exercises" ON exercises;
CREATE POLICY "anon_update_exercises" ON exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_exercises" ON exercises;
CREATE POLICY "anon_delete_exercises" ON exercises FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises (category);

-- ============================================================
-- Workout Sessions (a workout with date + notes)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_select_workout_sessions" ON workout_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_insert_workout_sessions" ON workout_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_update_workout_sessions" ON workout_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workout_sessions" ON workout_sessions;
CREATE POLICY "anon_delete_workout_sessions" ON workout_sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions (session_date DESC);

-- ============================================================
-- Workout Exercises (exercises performed in a session)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id uuid NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_select_workout_exercises" ON workout_exercises FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_insert_workout_exercises" ON workout_exercises FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_update_workout_exercises" ON workout_exercises FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workout_exercises" ON workout_exercises;
CREATE POLICY "anon_delete_workout_exercises" ON workout_exercises FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON workout_exercises (workout_session_id);

-- ============================================================
-- Workout Sets (individual sets: reps + weight)
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id uuid NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number int NOT NULL DEFAULT 1,
  reps int NOT NULL DEFAULT 0,
  weight numeric(7,2) NOT NULL DEFAULT 0,
  weight_unit text NOT NULL DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lb')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_workout_sets" ON workout_sets;
CREATE POLICY "anon_select_workout_sets" ON workout_sets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_workout_sets" ON workout_sets;
CREATE POLICY "anon_insert_workout_sets" ON workout_sets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_workout_sets" ON workout_sets;
CREATE POLICY "anon_update_workout_sets" ON workout_sets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_workout_sets" ON workout_sets;
CREATE POLICY "anon_delete_workout_sets" ON workout_sets FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets (workout_exercise_id);

-- ============================================================
-- Nutrition Targets (daily calorie + macro targets/ranges)
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_target numeric(6,1) NOT NULL DEFAULT 2000,
  calories_min numeric(6,1),
  calories_max numeric(6,1),
  carbs_target numeric(6,1) NOT NULL DEFAULT 250,
  carbs_min numeric(6,1),
  carbs_max numeric(6,1),
  protein_target numeric(6,1) NOT NULL DEFAULT 150,
  protein_min numeric(6,1),
  protein_max numeric(6,1),
  fat_target numeric(6,1) NOT NULL DEFAULT 70,
  fat_min numeric(6,1),
  fat_max numeric(6,1),
  fiber_target numeric(6,1) NOT NULL DEFAULT 30,
  fiber_min numeric(6,1),
  fiber_max numeric(6,1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_nutrition_targets" ON nutrition_targets;
CREATE POLICY "anon_select_nutrition_targets" ON nutrition_targets FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_nutrition_targets" ON nutrition_targets;
CREATE POLICY "anon_insert_nutrition_targets" ON nutrition_targets FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_nutrition_targets" ON nutrition_targets;
CREATE POLICY "anon_update_nutrition_targets" ON nutrition_targets FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_nutrition_targets" ON nutrition_targets;
CREATE POLICY "anon_delete_nutrition_targets" ON nutrition_targets FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Food Entries (individual food consumption records)
-- ============================================================
CREATE TABLE IF NOT EXISTS food_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  food_name text NOT NULL,
  consumed_at timestamptz NOT NULL DEFAULT now(),
  quantity_g numeric(8,2) NOT NULL DEFAULT 0,
  calories numeric(8,2) NOT NULL DEFAULT 0,
  carbs_g numeric(8,2) NOT NULL DEFAULT 0,
  protein_g numeric(8,2) NOT NULL DEFAULT 0,
  fat_g numeric(8,2) NOT NULL DEFAULT 0,
  fiber_g numeric(8,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_food_entries" ON food_entries;
CREATE POLICY "anon_select_food_entries" ON food_entries FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_food_entries" ON food_entries;
CREATE POLICY "anon_insert_food_entries" ON food_entries FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_food_entries" ON food_entries;
CREATE POLICY "anon_update_food_entries" ON food_entries FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_food_entries" ON food_entries;
CREATE POLICY "anon_delete_food_entries" ON food_entries FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_food_entries_consumed_at ON food_entries (consumed_at DESC);
