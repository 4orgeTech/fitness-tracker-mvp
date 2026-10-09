import { type DateRangeMode, type DateRange } from '@/types/app';
import { getDayStart, getDayEnd, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd } from '@/lib/weightUtils';

export function getDateRange(mode: DateRangeMode, reference: Date = new Date()): DateRange {
  switch (mode) {
    case 'day':
      return { start: getDayStart(reference), end: getDayEnd(reference), mode };
    case 'week':
      return { start: getWeekStart(reference), end: getWeekEnd(reference), mode };
    case 'month':
      return { start: getMonthStart(reference), end: getMonthEnd(reference), mode };
  }
}

export function shiftDateRange(range: DateRange, direction: 1 | -1): DateRange {
  const ref = new Date(range.start);
  switch (range.mode) {
    case 'day':
      ref.setDate(ref.getDate() + direction);
      break;
    case 'week':
      ref.setDate(ref.getDate() + direction * 7);
      break;
    case 'month':
      ref.setMonth(ref.getMonth() + direction);
      break;
  }
  return getDateRange(range.mode, ref);
}

export function formatDateRangeLabel(range: DateRange): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = range.start.toLocaleDateString('en-US', opts);
  const endStr = range.end.toLocaleDateString('en-US', opts);

  if (range.mode === 'day') {
    return range.start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  const endOpts: Intl.DateTimeFormatOptions = sameYear ? opts : { ...opts, year: 'numeric' as const };
  return `${startStr} – ${range.end.toLocaleDateString('en-US', endOpts)}`;
}

export function getNumDaysInRange(range: DateRange): number {
  const ms = range.end.getTime() - range.start.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
