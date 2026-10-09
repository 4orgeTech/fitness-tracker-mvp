import { useState, useMemo } from 'react';
import {
  Scale, Dumbbell, Apple, TrendingDown, TrendingUp, Target,
  Calendar, Flame, Wheat, Beef, Droplet, Leaf, ArrowRight,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, StatCard, Badge, ProgressBar, EmptyState, LoadingSpinner } from '@/components/ui';
import { LineChart, BarChart } from '@/components/charts';
import { DateRangePicker } from '@/components/DateRangePicker';
import { calcWeightProgress, formatWeight, filterEntriesByDateRange } from '@/lib/weightUtils';
import { calcSessionVolume, calcSessionTotalSets, formatVolume } from '@/lib/workoutUtils';
import { calcDailyTotals, calcAllNutrientStatuses, groupFoodEntriesByDate, type TargetStatus } from '@/lib/nutritionUtils';
import { getDateRange, getNumDaysInRange } from '@/lib/dateRange';
import type { DateRange, Page } from '@/types/app';
import type { WeightUnit } from '@/types';

const STATUS_BADGES: Record<TargetStatus, { variant: 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  below: { variant: 'warning', label: 'Below' },
  within: { variant: 'success', label: 'Within' },
  above: { variant: 'error', label: 'Above' },
  'no-target': { variant: 'neutral', label: 'No Target' },
};

const NUTRIENT_ICONS: Record<string, typeof Flame> = {
  calories: Flame,
  carbs: Wheat,
  protein: Beef,
  fat: Droplet,
  fiber: Leaf,
};

const NUTRIENT_LABELS: Record<string, string> = {
  calories: 'Calories',
  carbs: 'Carbs',
  protein: 'Protein',
  fat: 'Fat',
  fiber: 'Fiber',
};

const NUTRIENT_UNITS: Record<string, string> = {
  calories: 'kcal',
  carbs: 'g',
  protein: 'g',
  fat: 'g',
  fiber: 'g',
};

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export function DashboardPage({ onNavigate }: DashboardProps) {
  const { weightTarget, weightEntries, workoutSessions, foodEntries, nutritionTargets, loading } = useData();
  const [range, setRange] = useState<DateRange>(getDateRange('week'));

  const unit: WeightUnit = weightTarget?.weight_unit || 'kg';

  // Weight data
  const filteredWeightEntries = useMemo(
    () => filterEntriesByDateRange(weightEntries, range.start, range.end),
    [weightEntries, range]
  );
  const weightProgress = useMemo(() => calcWeightProgress(weightTarget, weightEntries), [weightTarget, weightEntries]);
  const periodWeightChange = useMemo(() => {
    if (filteredWeightEntries.length < 2) return null;
    const sorted = [...filteredWeightEntries].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
    return sorted[sorted.length - 1].weight - sorted[0].weight;
  }, [filteredWeightEntries]);

  const weightChart = useMemo(
    () => filteredWeightEntries
      .slice()
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
      .map((e) => ({ x: e.recorded_at, y: e.weight })),
    [filteredWeightEntries]
  );

  // Workout data
  const filteredSessions = useMemo(
    () => workoutSessions.filter((s) => {
      const d = new Date(s.session_date);
      return d >= range.start && d <= range.end;
    }),
    [workoutSessions, range]
  );
  const workoutVolume = useMemo(
    () => filteredSessions.reduce((sum, s) => sum + calcSessionVolume(s.workout_exercises || []), 0),
    [filteredSessions]
  );
  const workoutSets = useMemo(
    () => filteredSessions.reduce((sum, s) => sum + calcSessionTotalSets(s.workout_exercises || []), 0),
    [filteredSessions]
  );
  const workoutChart = useMemo(
    () => filteredSessions
      .slice()
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
      .map((s) => ({
        label: new Date(s.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: calcSessionVolume(s.workout_exercises || []),
      })),
    [filteredSessions]
  );

  // Nutrition data
  const filteredFoodEntries = useMemo(
    () => foodEntries.filter((e) => {
      const d = new Date(e.consumed_at);
      return d >= range.start && d <= range.end;
    }),
    [foodEntries, range]
  );
  const dailyTotals = useMemo(() => calcDailyTotals(filteredFoodEntries), [filteredFoodEntries]);
  const numDays = getNumDaysInRange(range);
  const avgDaily = useMemo(() => ({
    calories: dailyTotals.calories / Math.max(numDays, 1),
    carbs: dailyTotals.carbs / Math.max(numDays, 1),
    protein: dailyTotals.protein / Math.max(numDays, 1),
    fat: dailyTotals.fat / Math.max(numDays, 1),
    fiber: dailyTotals.fiber / Math.max(numDays, 1),
  }), [dailyTotals, numDays]);
  const nutrientStatuses = useMemo(() => calcAllNutrientStatuses(dailyTotals, nutritionTargets), [dailyTotals, nutritionTargets]);

  // Days within target
  const daysWithinTarget = useMemo(() => {
    if (!nutritionTargets) return null;
    const grouped = groupFoodEntriesByDate(filteredFoodEntries);
    let within = 0;
    let total = 0;
    for (let i = 0; i < numDays; i++) {
      const d = new Date(range.start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const dayEntries = grouped.get(key) || [];
      if (dayEntries.length > 0) {
        total++;
        const totals = calcDailyTotals(dayEntries);
        const statuses = calcAllNutrientStatuses(totals, nutritionTargets);
        if (statuses.calories.status === 'within') within++;
      }
    }
    return { within, total };
  }, [filteredFoodEntries, nutritionTargets, numDays, range]);

  if (loading) {
    return <LoadingSpinner className="py-20" size={32} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your fitness progress at a glance</p>
        </div>
      </div>

      <DateRangePicker range={range} onChange={setRange} />

      {/* Weight Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-green-700" />
            <h2 className="text-sm font-semibold text-gray-800">Weight Progress</h2>
          </div>
          <button onClick={() => onNavigate('weight')} className="text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
            View details <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Latest Weight"
            value={weightProgress.latestWeight !== null ? formatWeight(weightProgress.latestWeight, unit).split(' ')[0] : '—'}
            unit={weightProgress.latestWeight !== null ? unit : ''}
            icon={weightProgress.isLoss ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
          />
          <StatCard
            label="Target Weight"
            value={weightTarget ? formatWeight(weightTarget.target_weight, unit).split(' ')[0] : '—'}
            unit={weightTarget ? unit : ''}
            icon={<Target size={20} />}
          />
          <StatCard
            label="Period Change"
            value={periodWeightChange !== null ? (periodWeightChange > 0 ? '+' : '') + periodWeightChange.toFixed(1) : '—'}
            unit={periodWeightChange !== null ? unit : ''}
            trendColor={periodWeightChange !== null ? (weightProgress.isLoss ? (periodWeightChange < 0 ? 'green' : 'red') : (periodWeightChange > 0 ? 'green' : 'red')) : 'neutral'}
            icon={<TrendingDown size={20} />}
          />
          <StatCard
            label="Progress"
            value={weightProgress.progressPct !== null ? `${weightProgress.progressPct.toFixed(0)}%` : '—'}
            icon={<Target size={20} />}
          />
        </div>
        {weightChart.length > 0 && (
          <Card>
            <LineChart
              data={weightChart}
              targetLine={weightTarget?.target_weight}
              targetLabel={weightTarget ? `Target: ${weightTarget.target_weight} ${unit}` : undefined}
              unit={unit}
              height={180}
            />
          </Card>
        )}
        {weightChart.length === 0 && !weightTarget && (
          <Card>
            <EmptyState
              icon={<Scale size={32} />}
              title="No weight data yet"
              description="Set up your weight goal and start logging measurements."
              action={<button onClick={() => onNavigate('settings')} className="text-sm font-medium text-green-700 hover:underline">Configure in Settings</button>}
            />
          </Card>
        )}
      </div>

      {/* Workout Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell size={18} className="text-green-700" />
            <h2 className="text-sm font-semibold text-gray-800">Workout Activity</h2>
          </div>
          <button onClick={() => onNavigate('workouts')} className="text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
            View details <ArrowRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Sessions" value={filteredSessions.length} icon={<Calendar size={20} />} />
          <StatCard label="Total Sets" value={workoutSets} icon={<Dumbbell size={20} />} />
          <StatCard label="Total Volume" value={formatVolume(workoutVolume, unit)} icon={<TrendingUp size={20} />} />
        </div>
        {workoutChart.length > 0 && (
          <Card title="Volume by Session">
            <BarChart data={workoutChart} unit={unit} height={180} />
          </Card>
        )}
        {filteredSessions.length === 0 && (
          <Card>
            <EmptyState
              icon={<Dumbbell size={32} />}
              title="No workouts in this period"
              description="Create a workout session to start tracking your training."
              action={<button onClick={() => onNavigate('workouts')} className="text-sm font-medium text-green-700 hover:underline">Go to Workouts</button>}
            />
          </Card>
        )}
      </div>

      {/* Nutrition Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Apple size={18} className="text-green-700" />
            <h2 className="text-sm font-semibold text-gray-800">Nutrition Summary</h2>
          </div>
          <button onClick={() => onNavigate('nutrition')} className="text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
            View details <ArrowRight size={12} />
          </button>
        </div>

        {daysWithinTarget !== null && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
            <Target size={16} className="text-green-700" />
            <span className="text-sm text-gray-700">
              <span className="font-bold text-green-800">{daysWithinTarget.within}</span> of {daysWithinTarget.total} logged days within calorie target
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {(['calories', 'carbs', 'protein', 'fat', 'fiber'] as const).map((key) => {
            const status = nutrientStatuses[key];
            const Icon = NUTRIENT_ICONS[key];
            const badge = STATUS_BADGES[status.status];
            const unitLabel = NUTRIENT_UNITS[key];
            const avgValue = avgDaily[key];
            return (
              <div key={key} className="bg-white rounded-xl border border-green-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Icon size={14} className="text-green-600" />
                    <span className="text-xs font-medium text-gray-600">{NUTRIENT_LABELS[key]}</span>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <p className="text-xl font-bold text-gray-900">{avgValue.toFixed(0)}<span className="text-xs font-normal text-gray-400 ml-1">{unitLabel}/day</span></p>
                <div className="mt-2">
                  <ProgressBar
                    value={status.pctOfTarget}
                    colorClass={status.status === 'above' ? 'bg-red-400' : status.status === 'within' ? 'bg-green-500' : 'bg-lime-400'}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Target: {status.target.toFixed(0)} {unitLabel}</p>
              </div>
            );
          })}
        </div>

        {filteredFoodEntries.length === 0 && (
          <Card>
            <EmptyState
              icon={<Apple size={32} />}
              title="No food entries in this period"
              description="Log your meals to track calorie and nutrient intake."
              action={<button onClick={() => onNavigate('nutrition')} className="text-sm font-medium text-green-700 hover:underline">Go to Nutrition</button>}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
