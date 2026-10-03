import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Briefcase, Coffee, Check, Plus, AlertCircle, AlertTriangle, ShieldAlert, Key } from 'lucide-react';
import { ShiftAssignment, ShiftType } from '../../types';
import { updateShiftApi } from '../../api/client';
import { GUZO_SHIFT_PRESETS, getGuzoTaskAbbr } from '../../utils/guzoKey';

interface TaskWithTime {
  id: string;
  name: string;
  start: string;
  end: string;
  isBackup: boolean;
}

interface ShiftEditModalProps {
  shift: ShiftAssignment | null;
  dateStr: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const AVAILABLE_TASKS = ['Call Center', 'Telegram', 'GDS', 'Amadeus', '2839 phone', 'Email', 'ELMS', 'QUE', 'Follow up'];

const TASK_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Call Center': { bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700', dot: 'bg-emerald-500' },
  'Telegram':    { bg: 'bg-blue-50 dark:bg-blue-950/30',       text: 'text-blue-800 dark:text-blue-300',       border: 'border-blue-300 dark:border-blue-700',     dot: 'bg-blue-500'   },
  'GDS':         { bg: 'bg-violet-50 dark:bg-violet-950/30',   text: 'text-violet-800 dark:text-violet-300',   border: 'border-violet-300 dark:border-violet-700', dot: 'bg-violet-500' },
  'Amadeus':     { bg: 'bg-orange-50 dark:bg-orange-950/30',   text: 'text-orange-800 dark:text-orange-300',   border: 'border-orange-300 dark:border-orange-700', dot: 'bg-orange-500' },
  '2839 phone':  { bg: 'bg-rose-50 dark:bg-rose-950/30',       text: 'text-rose-800 dark:text-rose-300',       border: 'border-rose-300 dark:border-rose-700',     dot: 'bg-rose-500'   },
  'Email':       { bg: 'bg-cyan-50 dark:bg-cyan-950/30',       text: 'text-cyan-800 dark:text-cyan-300',       border: 'border-cyan-300 dark:border-cyan-700',     dot: 'bg-cyan-500'   },
  'ELMS':        { bg: 'bg-amber-50 dark:bg-amber-950/30',     text: 'text-amber-800 dark:text-amber-300',     border: 'border-amber-300 dark:border-amber-700',   dot: 'bg-amber-500'  },
  'QUE':         { bg: 'bg-pink-50 dark:bg-pink-950/30',       text: 'text-pink-800 dark:text-pink-300',       border: 'border-pink-300 dark:border-pink-700',     dot: 'bg-pink-500'   },
  'Follow up':   { bg: 'bg-teal-50 dark:bg-teal-950/30',       text: 'text-teal-800 dark:text-teal-300',       border: 'border-teal-300 dark:border-teal-700',     dot: 'bg-teal-500'   },
};

const col = (name: string) =>
  TASK_COLORS[name] ?? { bg: 'bg-secondary', text: 'text-secondary-foreground', border: 'border-border', dot: 'bg-muted-foreground' };

let _id = 0;
const uid = () => `t${++_id}`;

function buildTasksFromShift(shift: ShiftAssignment): TaskWithTime[] {
  const s = shift.start_time || '08:00';
  const e = shift.end_time   || '17:00';
  if (shift.tasks && shift.tasks.length > 0) {
    return shift.tasks.map(t => ({
      id: uid(), name: t.task_name, start: t.start_time || s, end: t.end_time || e, isBackup: t.is_backup ?? false,
    }));
  }
  if (shift.assigned_tasks && shift.assigned_tasks.length > 0) {
    return shift.assigned_tasks.map(name => ({ id: uid(), name, start: s, end: e, isBackup: false }));
  }
  const list: TaskWithTime[] = [];
  (shift.primary_task || '').split(',').forEach(p => { const n = p.trim(); if (n) list.push({ id: uid(), name: n, start: s, end: e, isBackup: false }); });
  (shift.secondary_task || '').split(',').forEach(p => { const n = p.trim(); if (n) list.push({ id: uid(), name: n, start: s, end: e, isBackup: false }); });
  return list.length > 0 ? list : [{ id: uid(), name: 'Call Center', start: s, end: e, isBackup: false }];
}

export const ShiftEditModal: React.FC<ShiftEditModalProps> = ({ shift, dateStr, isOpen, onClose, onUpdated }) => {
  const [shiftType,  setShiftType]  = useState<ShiftType>('WORK');
  const [startTime,  setStartTime]  = useState('08:00');
  const [endTime,    setEndTime]    = useState('17:00');
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd,   setLunchEnd]   = useState('13:00');
  const [tasks,      setTasks]      = useState<TaskWithTime[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [notes,      setNotes]      = useState('');
  const [reason,     setReason]     = useState('Manager schedule adjustment');
  const [isSaving,   setIsSaving]   = useState(false);
  const [saveError,  setSaveError]  = useState<string | null>(null);
  const [saveOk,     setSaveOk]     = useState(false);

  useEffect(() => {
    if (shift && isOpen) {
      setShiftType(shift.shift_type);
      setStartTime(shift.start_time  || '08:00');
      setEndTime(shift.end_time      || '17:00');
      setLunchStart(shift.lunch_start || '12:00');
      setLunchEnd(shift.lunch_end    || '13:00');
      setTasks(buildTasksFromShift(shift));
      setNotes(shift.notes || '');
      setReason('Manager schedule adjustment');
      setCustomTask('');
      setSaveError(null);
      setSaveOk(false);
      setIsSaving(false);
    }
  }, [shift?.id, isOpen]);

  if (!isOpen || !shift) return null;

  const addTask = (name: string, asBackup = false) =>
    setTasks(prev => [...prev, { id: uid(), name, start: startTime, end: endTime, isBackup: asBackup }]);

  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  const updateField = (id: string, field: keyof TaskWithTime, val: string | boolean) =>
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));

  const handleAddCustom = () => {
    const n = customTask.trim();
    if (!n) return;
    setTasks(prev => [...prev, { id: uid(), name: n, start: startTime, end: endTime, isBackup: false }]);
    setCustomTask('');
  };

  const getOverlap = (): string | null => {
    const regular = tasks.filter(t => !t.isBackup);
    for (let i = 0; i < regular.length; i++) {
      for (let j = i + 1; j < regular.length; j++) {
        const a = regular[i], b = regular[j];
        if (a.start < b.end && b.start < a.end)
          return `"${a.name}" (${a.start}-${a.end}) overlaps "${b.name}" (${b.start}-${b.end})`;
      }
    }
    return null;
  };
  const overlap = shiftType !== 'OFF' ? getOverlap() : null;

  const handleSave = async () => {
    setSaveError(null); setSaveOk(false);
    if (!reason.trim()) { setSaveError('Please enter a reason for the change.'); return; }
    setIsSaving(true);
    try {
      const finalTasks = tasks.length > 0 ? tasks : [{ id: uid(), name: 'Call Center', start: startTime, end: endTime, isBackup: false }];
      await updateShiftApi(shift.id, {
        shift_type:     shiftType,
        start_time:     shiftType === 'OFF' ? null : startTime,
        end_time:       shiftType === 'OFF' ? null : endTime,
        lunch_start:    shiftType === 'OFF' ? null : lunchStart,
        lunch_end:      shiftType === 'OFF' ? null : lunchEnd,
        primary_task:   finalTasks[0]?.name ?? 'Call Center',
        secondary_task: finalTasks[1]?.name ?? null,
        assigned_tasks: finalTasks.map(t => t.name),
        task_times:     finalTasks.map(t => ({ task_name: t.name, start_time: t.start, end_time: t.end, is_backup: t.isBackup })),
        notes,
        reason,
      });
      setSaveOk(true);
      onUpdated();
      setTimeout(() => { onClose(); }, 600);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const shiftOpts = [
    { type: 'WORK',        label: 'Full Work',   cls: 'bg-emerald-100 border-emerald-400 text-emerald-900 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400' },
    { type: 'OFF',         label: 'Day Off',     cls: 'bg-slate-200 border-slate-300 text-slate-800 dark:bg-secondary dark:text-secondary-foreground' },
    { type: 'AM_HALF',     label: 'AM Half',     cls: 'bg-amber-100 border-amber-400 text-amber-900 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-400' },
    { type: 'PM_HALF',     label: 'PM Half',     cls: 'bg-purple-100 border-purple-400 text-purple-900 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-400' },
    { type: 'SUNDAY_DUTY', label: 'Sunday Duty', cls: 'bg-indigo-100 border-indigo-400 text-indigo-900 dark:bg-primary/20 dark:border-primary/40 dark:text-primary' },
  ];

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col my-auto overflow-hidden"
        style={{ maxHeight: 'min(90vh, calc(100vh - 32px))' }}
        onClick={(e) => e.stopPropagation()}
      >

        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 rounded-t-2xl bg-card">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Edit Shift &amp; Tasks &mdash; <span className="text-primary">{shift.employee_name}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Guzo Go Schedule Key Presets */}
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/[0.03] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-primary" />
                Guzo Go Shift Key Presets
              </label>
              <span className="text-[10px] text-muted-foreground font-medium">Click key to apply hours &amp; lunch</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GUZO_SHIFT_PRESETS.map((p) => {
                const isSelected = p.shiftType === shiftType &&
                  (p.shiftType === 'OFF' || (p.startTime === startTime && p.endTime === endTime));
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setShiftType(p.shiftType);
                      if (p.shiftType !== 'OFF') {
                        setStartTime(p.startTime);
                        setEndTime(p.endTime);
                        if (p.defaultLunchStart) setLunchStart(p.defaultLunchStart);
                        if (p.defaultLunchEnd) setLunchEnd(p.defaultLunchEnd);
                      }
                    }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? `${p.badgeClass} ring-2 ring-primary shadow-xs font-bold`
                        : 'bg-background hover:bg-accent border-border text-foreground hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono font-bold text-xs">{p.key}</span>
                      <span className="text-[9px] uppercase font-semibold opacity-70">{p.shiftType}</span>
                    </div>
                    <div className="text-[11px] font-semibold truncate mt-1">{p.name}</div>
                    <div className="text-[10px] opacity-75 font-mono mt-0.5">
                      {p.startTime ? `${p.startTime}–${p.endTime}` : 'Day Off'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Manual Shift Status</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {shiftOpts.map(o => (
                <button key={o.type} type="button" onClick={() => setShiftType(o.type as ShiftType)}
                  className={`h-9 px-2 rounded-lg text-xs font-medium border text-center transition ${
                    shiftType === o.type ? `${o.cls} ring-1 ring-ring font-bold` : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {shiftType !== 'OFF' && (<>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Shift Hours
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([['Start', startTime, setStartTime], ['End', endTime, setEndTime]] as const).map(([lbl, val, fn]) => (
                  <div key={lbl}>
                    <label className="block text-[11px] text-muted-foreground mb-1">{lbl}</label>
                    <input type="time" value={val} onChange={e => fn(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-muted-foreground" /> Lunch Break
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([['Start', lunchStart, setLunchStart], ['End', lunchEnd, setLunchEnd]] as const).map(([lbl, val, fn]) => (
                  <div key={lbl}>
                    <label className="block text-[11px] text-muted-foreground mb-1">{lbl}</label>
                    <input type="time" value={val} onChange={e => fn(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-secondary/30">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Task Time Schedule</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold">
                  {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

              <div className="p-4 space-y-4">

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-700/50">
                  <ShieldAlert className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-sky-800 dark:text-sky-300">
                    <strong>Backup coverage:</strong> Use <strong className="text-amber-600 dark:text-amber-400">+BKP</strong> to add a task as afternoon backup. Same task can appear twice with different hours.
                  </p>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Add Task</p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TASKS.map(name => {
                      const c = col(name);
                      const already = tasks.some(t => t.name === name && !t.isBackup);
                      return (
                        <div key={name} className="flex items-center">
                          <button type="button" onClick={() => addTask(name, false)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-l-lg text-xs font-medium border-y border-l transition ${
                              already ? `${c.bg} ${c.text} ${c.border}` : 'bg-background text-foreground border-border hover:bg-accent cursor-pointer'
                            }`}>
                            {already ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                            <span className="font-mono text-[10px] font-bold px-1 py-0.5 rounded bg-muted/60 text-foreground border border-border/60">
                              {getGuzoTaskAbbr(name)}
                            </span>
                            <span>{name}</span>
                          </button>
                          <button type="button" onClick={() => addTask(name, true)}
                            className="inline-flex items-center px-1.5 py-1.5 rounded-r-lg text-[10px] font-bold border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                            title={`Add ${name} as Backup slot`}>
                            +BKP
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Normal task · <strong className="text-amber-600 dark:text-amber-400">+BKP</strong> = backup/afternoon coverage slot</p>
                </div>

                {tasks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Set Time Per Task</p>
                    {tasks.map((task, idx) => {
                      const c = col(task.name);
                      const rowBg = task.isBackup
                        ? 'border-amber-400 dark:border-amber-600 bg-amber-50/60 dark:bg-amber-950/20'
                        : `${c.border} ${c.bg}`;
                      return (
                        <div key={task.id} className={`flex items-center gap-2 p-3 rounded-xl border ${rowBg}`}>
                          <span className={`shrink-0 w-5 text-center text-[11px] font-bold font-mono ${task.isBackup ? 'text-amber-600 dark:text-amber-400' : c.text}`}>{idx + 1}</span>
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${task.isBackup ? 'bg-amber-500' : c.dot}`} />
                            <span className={`text-xs font-semibold truncate ${task.isBackup ? 'text-amber-700 dark:text-amber-300' : c.text}`}>{task.name}</span>
                            {idx === 0 && !task.isBackup && <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">Primary</span>}
                            {idx === 1 && !task.isBackup && <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">Secondary</span>}
                            {task.isBackup && (
                              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 px-1.5 py-0.5 rounded shrink-0">BACKUP</span>
                            )}
                          </div>
                          <button type="button"
                            onClick={() => updateField(task.id, 'isBackup', !task.isBackup)}
                            className={`shrink-0 text-[9px] font-bold px-2 py-1 rounded border transition ${
                              task.isBackup ? 'bg-amber-500 text-white border-amber-600' : 'bg-background text-muted-foreground border-border hover:border-amber-400 hover:text-amber-600'
                            }`} title="Toggle backup">BKP</button>
                          <div className="shrink-0 flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">From</span>
                            <input type="time" value={task.start} onChange={e => updateField(task.id, 'start', e.target.value)}
                              className="h-8 w-[90px] px-2 rounded-lg bg-background border border-input text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                          </div>
                          <span className="text-muted-foreground text-sm shrink-0">to</span>
                          <div className="shrink-0 flex flex-col items-center gap-0.5">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">To</span>
                            <input type="time" value={task.end} onChange={e => updateField(task.id, 'end', e.target.value)}
                              className="h-8 w-[90px] px-2 rounded-lg bg-background border border-input text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                          </div>
                          <button type="button" onClick={() => removeTask(task.id)}
                            className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-border/60">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Add Custom Task</p>
                  <div className="flex items-center gap-2">
                    <input type="text" value={customTask}
                      onChange={e => setCustomTask(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustom(); } }}
                      placeholder="Type task name, then press Enter or click Add..."
                      className="flex-1 h-9 px-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
                    <button type="button" onClick={handleAddCustom}
                      className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold transition hover:bg-primary/90 shrink-0">
                      + Add
                    </button>
                  </div>
                </div>

                {overlap && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Warning: {overlap}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Shift swap approved by supervisor"
                className="w-full h-9 px-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Reason for Change <span className="text-destructive">*</span>
                <span className="ml-1 font-normal text-muted-foreground">(saved to Audit Log)</span>
              </label>
              <input type="text" value={reason} onChange={e => setReason(e.target.value)} required
                placeholder="e.g. Telegram 08-13, Call Center backup 13-17"
                className="w-full h-9 px-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground" />
            </div>

          </>)}

        </div>

        <div className="shrink-0 px-6 py-4 border-t border-border bg-card rounded-b-2xl space-y-2">

          {saveError && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />{saveError}
            </div>
          )}

          {saveOk && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
              <Check className="w-3.5 h-3.5 shrink-0" />Saved successfully! Refreshing schedule...
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">
              {tasks.filter(t => !t.isBackup).length} task{tasks.filter(t => !t.isBackup).length !== 1 ? 's' : ''}
              {tasks.some(t => t.isBackup) && (
                <span className="ml-1 text-amber-600 dark:text-amber-400 font-medium">
                  + {tasks.filter(t => t.isBackup).length} backup
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose}
                className="h-9 px-4 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition">
                Cancel
              </button>
              <button type="button" disabled={isSaving || saveOk} onClick={handleSave}
                className="h-9 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow flex items-center gap-2 transition active:scale-95 disabled:opacity-60">
                <Check className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : saveOk ? 'Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
