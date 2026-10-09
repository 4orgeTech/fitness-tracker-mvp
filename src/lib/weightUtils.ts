import type { WeightUnit, WeightEntry, WeightTarget } from '@/types';

export function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to) return weight;
  if (from === 'kg' && to === 'lb') return weight * 2.20462262;
  if (from === 'lb' && to === 'kg') return weight / 2.20462262;
  return weight;
}

export function formatWeight(weight: number, unit: WeightUnit = 'kg'): string {
  const decimals = weight >= 100 ? 1 : 2;
  return `${weight.toFixed(decimals)} ${unit}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function toLocalDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function fromLocalDatetimeLocal(value: string): string {
  return new Date(value).toISOString();
}

export function calcWeightProgress(
  target: WeightTarget | null,
  entries: WeightEntry[]
): {
  startingWeight: number | null;
  latestWeight: number | null;
  totalChange: number | null;
  progressPct: number | null;
  isLoss: boolean;
} {
  if (!target || entries.length === 0) {
    return {
      startingWeight: target ? target.initial_weight : null,
      latestWeight: null,
      totalChange: null,
      progressPct: null,
      isLoss: target ? target.target_weight < target.initial_weight : false,
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const startingWeight = target.initial_weight;
  const latestWeight = sorted[sorted.length - 1].weight;
  const targetWeight = target.target_weight;
  const totalChange = latestWeight - startingWeight;
  const totalNeeded = targetWeight - startingWeight;
  const isLoss = totalNeeded < 0;

  let progressPct: number;
  if (isLoss) {
    progressPct = totalChange <= 0 ? Math.abs(totalChange / totalNeeded) * 100 : 0;
  } else {
    progressPct = totalChange >= 0 ? (totalChange / totalNeeded) * 100 : 0;
  }
  progressPct = Math.min(Math.max(progressPct, 0), 100);

  return { startingWeight, latestWeight, totalChange, progressPct, isLoss };
}

export function filterEntriesByDateRange<T extends { recorded_at?: string; consumed_at?: string; session_date?: string }>(
  entries: T[],
  startDate: Date,
  endDate: Date
): T[] {
  return entries.filter((e) => {
    const dateStr = e.recorded_at || e.consumed_at || e.session_date || '';
    const d = new Date(dateStr);
    return d >= startDate && d <= endDate;
  });
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function getWeekEnd(date: Date): Date {
  const end = getWeekStart(date);
  end.setDate(end.getDate() + 7);
  end.setMilliseconds(-1);
  return end;
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getDayStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getDayEnd(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatVolume(volume: number, unit: WeightUnit = 'kg'): string {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}k ${unit}`;
  }
  return `${volume.toFixed(0)} ${unit}`;
}
