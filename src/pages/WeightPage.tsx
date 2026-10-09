import { useState, useMemo } from 'react';
import { Scale, Plus, TrendingDown, TrendingUp, Target, Pencil, Trash2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, StatCard, Button, Input, Select, Badge, ConfirmDialog, Modal, EmptyState, ProgressBar } from '@/components/ui';
import { LineChart } from '@/components/charts';
import { DateRangePicker } from '@/components/DateRangePicker';
import * as api from '@/services/api';
import { calcWeightProgress, formatWeight, formatDate, toLocalDatetimeLocal, fromLocalDatetimeLocal, filterEntriesByDateRange } from '@/lib/weightUtils';
import { getDateRange } from '@/lib/dateRange';
import type { DateRange } from '@/types/app';
import type { WeightEntry, WeightUnit } from '@/types';

export function WeightPage() {
  const { weightTarget, weightEntries, refreshWeight, loading } = useData();
  const [range, setRange] = useState<DateRange>(getDateRange('month'));
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ weight: '', recorded_at: toLocalDatetimeLocal(new Date()) });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const progress = useMemo(() => calcWeightProgress(weightTarget, weightEntries), [weightTarget, weightEntries]);

  const filteredEntries = useMemo(
    () => filterEntriesByDateRange(weightEntries, range.start, range.end).sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    ),
    [weightEntries, range]
  );

  const chartData = useMemo(
    () => filteredEntries
      .slice()
      .reverse()
      .map((e) => ({ x: e.recorded_at, y: e.weight })),
    [filteredEntries]
  );

  const unit: WeightUnit = weightTarget?.weight_unit || 'kg';

  const openLogModal = () => {
    setEditingEntry(null);
    setFormData({ weight: '', recorded_at: toLocalDatetimeLocal(new Date()) });
    setFormError('');
    setShowLogModal(true);
  };

  const openEditModal = (entry: WeightEntry) => {
    setEditingEntry(entry);
    setFormData({ weight: String(entry.weight), recorded_at: toLocalDatetimeLocal(new Date(entry.recorded_at)) });
    setFormError('');
    setShowLogModal(true);
  };

  const handleSave = async () => {
    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight <= 0) {
      setFormError('Please enter a valid weight');
      return;
    }
    if (!formData.recorded_at) {
      setFormError('Please select a date and time');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const recordedAt = fromLocalDatetimeLocal(formData.recorded_at);
      if (editingEntry) {
        await api.updateWeightEntry(editingEntry.id, weight, unit, recordedAt);
      } else {
        await api.createWeightEntry(weight, unit, recordedAt);
      }
      await refreshWeight();
      setShowLogModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.deleteWeightEntry(deleteId);
      await refreshWeight();
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Scale className="animate-pulse text-green-600" size={32} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Weight Tracking</h1>
          <p className="text-sm text-gray-500 mt-0.5">Monitor your body weight progress over time</p>
        </div>
        <Button onClick={openLogModal}>
          <Plus size={16} /> Log Weight
        </Button>
      </div>

      {!weightTarget && (
        <Card className="bg-lime-50 border-lime-200">
          <div className="flex items-center gap-3">
            <Target className="text-green-700 shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-gray-800">Set your weight goal to start tracking progress</p>
              <p className="text-xs text-gray-500 mt-0.5">Go to Settings to configure your initial weight, target weight, and unit preference.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Starting Weight"
          value={progress.startingWeight !== null ? formatWeight(progress.startingWeight, unit).split(' ')[0] : '—'}
          unit={progress.startingWeight !== null ? unit : ''}
          icon={<Scale size={20} />}
        />
        <StatCard
          label="Latest Weight"
          value={progress.latestWeight !== null ? formatWeight(progress.latestWeight, unit).split(' ')[0] : '—'}
          unit={progress.latestWeight !== null ? unit : ''}
          icon={<TrendingDown size={20} />}
        />
        <StatCard
          label="Target Weight"
          value={weightTarget ? formatWeight(weightTarget.target_weight, unit).split(' ')[0] : '—'}
          unit={weightTarget ? unit : ''}
          icon={<Target size={20} />}
        />
        <StatCard
          label="Total Change"
          value={progress.totalChange !== null ? (progress.totalChange > 0 ? '+' : '') + progress.totalChange.toFixed(1) : '—'}
          unit={progress.totalChange !== null ? unit : ''}
          trend={progress.totalChange !== null ? `${progress.progressPct?.toFixed(0)}% to goal` : undefined}
          trendColor={progress.isLoss ? (progress.totalChange !== null && progress.totalChange < 0 ? 'green' : 'red') : (progress.totalChange !== null && progress.totalChange > 0 ? 'green' : 'red')}
          icon={progress.isLoss ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
        />
      </div>

      {/* Progress bar */}
      {weightTarget && progress.progressPct !== null && (
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress toward target</span>
            <span className="text-sm font-bold text-green-700">{progress.progressPct.toFixed(0)}%</span>
          </div>
          <ProgressBar value={progress.progressPct} colorClass="bg-green-500" />
        </Card>
      )}

      {/* Chart */}
      <Card title="Weight History" subtitle={`${chartData.length} measurements in selected period`}>
        <LineChart
          data={chartData}
          targetLine={weightTarget?.target_weight}
          targetLabel={weightTarget ? `Target: ${weightTarget.target_weight} ${unit}` : undefined}
          unit={unit}
        />
      </Card>

      {/* Date range and history table */}
      <Card
        title="History"
        action={<DateRangePicker range={range} onChange={setRange} />}
      >
        {filteredEntries.length === 0 ? (
          <EmptyState
            icon={<Scale size={36} />}
            title="No weight entries in this period"
            description="Log a weight measurement to see it here."
            action={<Button size="sm" onClick={openLogModal}><Plus size={14} /> Log Weight</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-2 font-medium text-gray-500">Date</th>
                  <th className="pb-2 font-medium text-gray-500">Weight</th>
                  <th className="pb-2 font-medium text-gray-500">Change</th>
                  <th className="pb-2 font-medium text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry, i) => {
                  const prev = filteredEntries[i + 1];
                  const change = prev ? entry.weight - prev.weight : null;
                  return (
                    <tr key={entry.id} className="border-b border-gray-50 hover:bg-green-50/50 transition-colors">
                      <td className="py-2.5 text-gray-700">{formatDate(entry.recorded_at)}</td>
                      <td className="py-2.5 font-medium text-gray-900">{formatWeight(entry.weight, entry.weight_unit)}</td>
                      <td className="py-2.5">
                        {change !== null ? (
                          <Badge variant={change < 0 ? 'success' : change > 0 ? 'error' : 'neutral'}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)} {unit}
                          </Badge>
                        ) : (
                          <Badge variant="neutral">First entry</Badge>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="p-1.5 text-gray-400 hover:text-green-700 rounded transition-colors"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(entry.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Log/Edit Modal */}
      <Modal
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
        title={editingEntry ? 'Edit Weight Entry' : 'Log Weight'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : editingEntry ? 'Update' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={`Weight (${unit})`}
            type="number"
            step="0.1"
            min="0"
            placeholder="e.g. 75.5"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            error={formError}
          />
          <Input
            label="Date & Time"
            type="datetime-local"
            value={formData.recorded_at}
            onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Weight Entry"
        message="Are you sure you want to delete this weight measurement? This action cannot be undone."
      />
    </div>
  );
}
