import { useState, useMemo } from 'react';
import {
  Dumbbell, Plus, Trash2, Pencil, ChevronDown, ChevronRight, X,
  Calendar, ClipboardList, Layers,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Card, StatCard, Button, Input, Select, Textarea, Badge, ConfirmDialog, Modal, EmptyState, LoadingSpinner } from '@/components/ui';
import { BarChart } from '@/components/charts';
import { DateRangePicker } from '@/components/DateRangePicker';
import * as api from '@/services/api';
import { calcExerciseVolume, calcSessionVolume, calcSessionTotalSets, calcSessionTotalReps, formatVolume } from '@/lib/workoutUtils';
import { formatDate, formatDateISO } from '@/lib/weightUtils';
import { getDateRange, getNumDaysInRange } from '@/lib/dateRange';
import { EXERCISE_CATEGORIES } from '@/types/app';
import type { DateRange } from '@/types/app';
import type { Exercise, WorkoutSessionWithDetails, ExerciseCategory, WeightUnit } from '@/types';

type View = 'sessions' | 'library';

export function WorkoutsPage() {
  const { exercises, workoutSessions, refreshWorkouts, loading } = useData();
  const [view, setView] = useState<View>('sessions');
  const [range, setRange] = useState<DateRange>(getDateRange('month'));
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Session form state
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState({ session_date: formatDateISO(new Date()), notes: '' });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [saving, setSaving] = useState(false);

  // Exercise management within a session
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [addExerciseToSession, setAddExerciseToSession] = useState<string | null>(null);

  // Set editing
  const [editingSets, setEditingSets] = useState<{ [key: string]: { reps: string; weight: string } }>({});
  const [setErrors, setSetErrors] = useState<string>('');

  // Exercise library form
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({ name: '', category: 'chest' as ExerciseCategory });
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  const [exerciseError, setExerciseError] = useState('');

  const unit: WeightUnit = 'kg';

  const filteredSessions = useMemo(
    () => workoutSessions.filter((s) => {
      const d = new Date(s.session_date);
      return d >= range.start && d <= range.end;
    }),
    [workoutSessions, range]
  );

  const periodStats = useMemo(() => {
    const totalVolume = filteredSessions.reduce((sum, s) => sum + calcSessionVolume(s.workout_exercises || []), 0);
    const totalSets = filteredSessions.reduce((sum, s) => sum + calcSessionTotalSets(s.workout_exercises || []), 0);
    return { sessions: filteredSessions.length, totalVolume, totalSets };
  }, [filteredSessions]);

  const chartData = useMemo(
    () => filteredSessions
      .slice()
      .reverse()
      .map((s) => ({
        label: formatDate(s.session_date).split(',')[0],
        value: calcSessionVolume(s.workout_exercises || []),
      })),
    [filteredSessions]
  );

  // Session form handlers
  const openNewSession = () => {
    setEditingSessionId(null);
    setSessionForm({ session_date: formatDateISO(new Date()), notes: '' });
    setSessionError('');
    setShowSessionModal(true);
  };

  const openEditSession = (session: WorkoutSessionWithDetails) => {
    setEditingSessionId(session.id);
    setSessionForm({ session_date: session.session_date, notes: session.notes || '' });
    setSessionError('');
    setShowSessionModal(true);
  };

  const handleSaveSession = async () => {
    if (!sessionForm.session_date) {
      setSessionError('Please select a date');
      return;
    }
    setSaving(true);
    try {
      if (editingSessionId) {
        await api.updateWorkoutSession(editingSessionId, sessionForm.session_date, sessionForm.notes || null);
      } else {
        await api.createWorkoutSession(sessionForm.session_date, sessionForm.notes || null);
      }
      await refreshWorkouts();
      setShowSessionModal(false);
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    try {
      await api.deleteWorkoutSession(deleteSessionId);
      await refreshWorkouts();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleAddExerciseToSession = async () => {
    if (!showAddExerciseModal || !selectedExerciseId) return;
    try {
      await api.addExerciseToSession(showAddExerciseModal, selectedExerciseId);
      await refreshWorkouts();
      setShowAddExerciseModal(null);
      setSelectedExerciseId('');
    } catch (err) {
      console.error('Failed to add exercise:', err);
    }
  };

  const handleRemoveExercise = async (workoutExerciseId: string) => {
    try {
      await api.removeExerciseFromSession(workoutExerciseId);
      await refreshWorkouts();
    } catch (err) {
      console.error('Failed to remove exercise:', err);
    }
  };

  const handleAddSet = async (workoutExerciseId: string, currentSets: number) => {
    try {
      await api.addSet(workoutExerciseId, currentSets + 1, 0, 0, unit);
      await refreshWorkouts();
    } catch (err) {
      console.error('Failed to add set:', err);
    }
  };

  const handleUpdateSet = async (setId: string, workoutExerciseId: string) => {
    const edit = editingSets[setId];
    if (!edit) return;
    const reps = parseInt(edit.reps);
    const weight = parseFloat(edit.weight);
    if (isNaN(reps) || reps < 0 || isNaN(weight) || weight < 0) {
      setSetErrors('Please enter valid numbers');
      return;
    }
    try {
      await api.updateSet(setId, reps, weight, unit);
      await refreshWorkouts();
      setEditingSets((prev) => {
        const next = { ...prev };
        delete next[setId];
        return next;
      });
      setSetErrors('');
    } catch (err) {
      setSetErrors(err instanceof Error ? err.message : 'Failed to update set');
    }
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      await api.deleteSet(setId);
      await refreshWorkouts();
    } catch (err) {
      console.error('Failed to delete set:', err);
    }
  };

  // Exercise library handlers
  const openNewExercise = () => {
    setEditingExerciseId(null);
    setExerciseForm({ name: '', category: 'chest' });
    setExerciseError('');
    setShowExerciseModal(true);
  };

  const openEditExercise = (ex: Exercise) => {
    setEditingExerciseId(ex.id);
    setExerciseForm({ name: ex.name, category: ex.category });
    setExerciseError('');
    setShowExerciseModal(true);
  };

  const handleSaveExercise = async () => {
    if (!exerciseForm.name.trim()) {
      setExerciseError('Exercise name is required');
      return;
    }
    setSaving(true);
    try {
      if (editingExerciseId) {
        await api.updateExercise(editingExerciseId, exerciseForm.name.trim(), exerciseForm.category);
      } else {
        await api.createExercise(exerciseForm.name.trim(), exerciseForm.category);
      }
      await refreshWorkouts();
      setShowExerciseModal(false);
    } catch (err) {
      setExerciseError(err instanceof Error ? err.message : 'Failed to save exercise');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExercise = async () => {
    if (!deleteExerciseId) return;
    try {
      await api.deleteExercise(deleteExerciseId);
      await refreshWorkouts();
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
  };

  const exercisesByCategory = useMemo(() => {
    const grouped: Record<string, Exercise[]> = {};
    for (const ex of exercises) {
      if (!grouped[ex.category]) grouped[ex.category] = [];
      grouped[ex.category].push(ex);
    }
    return grouped;
  }, [exercises]);

  if (loading) {
    return <LoadingSpinner className="py-20" size={32} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Workouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your training sessions and exercises</p>
        </div>
        <div className="flex gap-2">
          {view === 'sessions' ? (
            <Button onClick={openNewSession}><Plus size={16} /> New Session</Button>
          ) : (
            <Button onClick={openNewExercise}><Plus size={16} /> New Exercise</Button>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="inline-flex rounded-lg border border-green-200 bg-white overflow-hidden">
        <button
          onClick={() => setView('sessions')}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${view === 'sessions' ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-green-50'}`}
        >
          Sessions
        </button>
        <button
          onClick={() => setView('library')}
          className={`px-4 py-1.5 text-sm font-medium transition-colors ${view === 'library' ? 'bg-green-800 text-white' : 'text-gray-600 hover:bg-green-50'}`}
        >
          Exercise Library
        </button>
      </div>

      {view === 'sessions' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Sessions" value={periodStats.sessions} icon={<Calendar size={20} />} />
            <StatCard label="Total Sets" value={periodStats.totalSets} icon={<Layers size={20} />} />
            <StatCard label="Total Volume" value={formatVolume(periodStats.totalVolume, unit)} icon={<Dumbbell size={20} />} />
          </div>

          {/* Volume chart */}
          {chartData.length > 0 && (
            <Card title="Training Volume by Session" subtitle="Total volume (weight x reps) per session">
              <BarChart data={chartData} unit={unit} />
            </Card>
          )}

          {/* Date range */}
          <Card title="Workout History" action={<DateRangePicker range={range} onChange={setRange} />}>
            {filteredSessions.length === 0 ? (
              <EmptyState
                icon={<Dumbbell size={36} />}
                title="No workout sessions in this period"
                description="Create a new session to start logging your training."
                action={<Button size="sm" onClick={openNewSession}><Plus size={14} /> New Session</Button>}
              />
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const exs = session.workout_exercises || [];
                  const volume = calcSessionVolume(exs);
                  const totalSets = calcSessionTotalSets(exs);
                  const totalReps = calcSessionTotalReps(exs);
                  const isExpanded = expandedSession === session.id;

                  return (
                    <div key={session.id} className="border border-green-100 rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-green-50/50 transition-colors"
                        onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{formatDate(session.session_date)}</p>
                            {session.notes && <p className="text-xs text-gray-500 mt-0.5">{session.notes}</p>}
                            <div className="flex gap-3 mt-1">
                              <span className="text-xs text-gray-500">{exs.length} exercises</span>
                              <span className="text-xs text-gray-500">{totalSets} sets</span>
                              <span className="text-xs text-gray-500">{formatVolume(volume, unit)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => openEditSession(session)} className="p-1.5 text-gray-400 hover:text-green-700 rounded transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => setDeleteSessionId(session.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-green-50 bg-green-50/30 px-4 py-3 space-y-3">
                          {exs.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No exercises added yet</p>
                          ) : (
                            exs.map((wEx) => {
                              const sets = wEx.sets || [];
                              const exVolume = calcExerciseVolume(sets);
                              return (
                                <div key={wEx.id} className="bg-white rounded-lg border border-green-50 p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div>
                                      <span className="text-sm font-medium text-gray-800">{wEx.exercise?.name || 'Unknown'}</span>
                                      <Badge variant="neutral" className="ml-2">{wEx.exercise?.category}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">{formatVolume(exVolume, unit)}</span>
                                      <button onClick={() => handleRemoveExercise(wEx.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                                        <X size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    {sets.map((set, si) => {
                                      const isEditing = !!editingSets[set.id];
                                      return (
                                        <div key={set.id} className="flex items-center gap-2 text-sm">
                                          <span className="text-xs text-gray-400 w-8">#{si + 1}</span>
                                          {isEditing ? (
                                            <>
                                              <input
                                                type="number"
                                                min="0"
                                                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                                placeholder="reps"
                                                value={editingSets[set.id].reps}
                                                onChange={(e) => setEditingSets({ ...editingSets, [set.id]: { ...editingSets[set.id], reps: e.target.value } })}
                                              />
                                              <span className="text-gray-400 text-xs">reps x</span>
                                              <input
                                                type="number"
                                                min="0"
                                                step="0.5"
                                                className="w-20 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-green-400"
                                                placeholder="weight"
                                                value={editingSets[set.id].weight}
                                                onChange={(e) => setEditingSets({ ...editingSets, [set.id]: { ...editingSets[set.id], weight: e.target.value } })}
                                              />
                                              <span className="text-gray-400 text-xs">{unit}</span>
                                              <button onClick={() => handleUpdateSet(set.id, wEx.id)} className="text-xs font-medium text-green-700 hover:underline">Save</button>
                                              <button onClick={() => setEditingSets((prev) => { const n = { ...prev }; delete n[set.id]; return n; })} className="text-xs text-gray-500 hover:underline">Cancel</button>
                                            </>
                                          ) : (
                                            <>
                                              <span className="text-gray-700">{set.reps} reps x {set.weight} {unit}</span>
                                              <span className="text-xs text-gray-400">= {formatVolume(set.weight * set.reps, unit)}</span>
                                              <button onClick={() => setEditingSets({ ...editingSets, [set.id]: { reps: String(set.reps), weight: String(set.weight) } })} className="p-1 text-gray-400 hover:text-green-700 rounded transition-colors ml-auto">
                                                <Pencil size={13} />
                                              </button>
                                              <button onClick={() => handleDeleteSet(set.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                                                <Trash2 size={13} />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  {setErrors && <p className="text-xs text-red-500 mt-1">{setErrors}</p>}
                                  <button
                                    onClick={() => handleAddSet(wEx.id, sets.length)}
                                    className="mt-2 text-xs font-medium text-green-700 hover:text-green-900 flex items-center gap-1"
                                  >
                                    <Plus size={13} /> Add Set
                                  </button>
                                </div>
                              );
                            })
                          )}
                          <button
                            onClick={() => { setShowAddExerciseModal(session.id); setSelectedExerciseId(''); }}
                            className="w-full py-2 text-sm font-medium text-green-700 border border-dashed border-green-300 rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Plus size={15} /> Add Exercise
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {view === 'library' && (
        <Card title="Exercise Library" subtitle={`${exercises.length} exercises`}>
          {exercises.length === 0 ? (
            <EmptyState
              icon={<Dumbbell size={36} />}
              title="No exercises yet"
              description="Create custom exercises to use in your workout sessions."
              action={<Button size="sm" onClick={openNewExercise}><Plus size={14} /> New Exercise</Button>}
            />
          ) : (
            <div className="space-y-4">
              {EXERCISE_CATEGORIES.map((cat) => {
                const catExercises = exercisesByCategory[cat.value] || [];
                if (catExercises.length === 0) return null;
                return (
                  <div key={cat.value}>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{cat.label}</h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {catExercises.map((ex) => (
                        <div key={ex.id} className="flex items-center justify-between bg-white border border-green-50 rounded-lg px-3 py-2">
                          <span className="text-sm text-gray-800">{ex.name}</span>
                          <div className="flex gap-1">
                            <button onClick={() => openEditExercise(ex)} className="p-1 text-gray-400 hover:text-green-700 rounded transition-colors">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteExerciseId(ex.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Session Modal */}
      <Modal
        open={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        title={editingSessionId ? 'Edit Workout Session' : 'New Workout Session'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowSessionModal(false)}>Cancel</Button>
            <Button onClick={handleSaveSession} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Date"
            type="date"
            value={sessionForm.session_date}
            onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
            error={sessionError}
          />
          <Textarea
            label="Notes (optional)"
            rows={3}
            placeholder="How did the session feel?"
            value={sessionForm.notes}
            onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
          />
        </div>
      </Modal>

      {/* Add Exercise to Session Modal */}
      <Modal
        open={!!showAddExerciseModal}
        onClose={() => { setShowAddExerciseModal(null); setSelectedExerciseId(''); }}
        title="Add Exercise to Session"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddExerciseModal(null); setSelectedExerciseId(''); }}>Cancel</Button>
            <Button onClick={handleAddExerciseToSession} disabled={!selectedExerciseId}>Add</Button>
          </>
        }
      >
        {exercises.length === 0 ? (
          <p className="text-sm text-gray-500">No exercises available. Create some in the Exercise Library first.</p>
        ) : (
          <Select
            label="Select Exercise"
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
          >
            <option value="">Choose an exercise…</option>
            {EXERCISE_CATEGORIES.map((cat) => (
              <optgroup key={cat.value} label={cat.label}>
                {(exercisesByCategory[cat.value] || []).map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </optgroup>
            ))}
          </Select>
        )}
      </Modal>

      {/* Exercise Library Modal */}
      <Modal
        open={showExerciseModal}
        onClose={() => setShowExerciseModal(false)}
        title={editingExerciseId ? 'Edit Exercise' : 'New Exercise'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowExerciseModal(false)}>Cancel</Button>
            <Button onClick={handleSaveExercise} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exercise Name"
            placeholder="e.g. Bench Press"
            value={exerciseForm.name}
            onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
            error={exerciseError}
          />
          <Select
            label="Category"
            value={exerciseForm.category}
            onChange={(e) => setExerciseForm({ ...exerciseForm, category: e.target.value as ExerciseCategory })}
          >
            {EXERCISE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* Confirm dialogs */}
      <ConfirmDialog
        open={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={handleDeleteSession}
        title="Delete Workout Session"
        message="This will delete the session and all its exercises and sets. This cannot be undone."
      />
      <ConfirmDialog
        open={!!deleteExerciseId}
        onClose={() => setDeleteExerciseId(null)}
        onConfirm={handleDeleteExercise}
        title="Delete Exercise"
        message="This will remove the exercise from your library. If it's used in any sessions, those records will remain."
      />
    </div>
  );
}
