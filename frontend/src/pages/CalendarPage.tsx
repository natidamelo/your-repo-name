import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Sparkles,
  RotateCw,
  Search,
  Users,
  X,
  Filter,
  Sun,
  Clock,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Coffee,
  Key,
} from 'lucide-react';
import { getSchedulesApi, getScheduleApi, getExcelExportUrl, exportScheduleExcel } from '../api/client';
import { SchedulePeriod, ScheduleDay, ShiftAssignment } from '../types';
import { ShiftEditModal } from '../components/calendar/ShiftEditModal';
import { ShiftKeyLegendModal } from '../components/schedule/ShiftKeyLegendModal';
import { getGuzoShiftKey, getGuzoCellNotation, GUZO_SHIFT_PRESETS, GUZO_TASK_CODES } from '../utils/guzoKey';
import { useAuth } from '../context/AuthContext';

interface CalendarPageProps {
  onOpenGenerator: () => void;
  onSelectDateForDailyView: (dateStr: string) => void;
  onDateRangeChange?: (range: { startDate?: string; endDate?: string; label?: string } | undefined) => void;
  onScheduleChange?: (sched: any) => void;
}

// ─── Avatar Initials ────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-pink-500', 'bg-lime-500', 'bg-orange-500', 'bg-fuchsia-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Today's date string ────────────────────────────────────
const TODAY_STR = new Date().toISOString().split('T')[0];

export const CalendarPage: React.FC<CalendarPageProps> = ({
  onOpenGenerator,
  onSelectDateForDailyView,
  onDateRangeChange,
  onScheduleChange
}) => {
  const { role } = useAuth();
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<SchedulePeriod | null>(null);
  const [viewMode, setViewMode] = useState<'week' | '2week' | 'month' | 'custom'>('2week');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Custom Day / Date Range Picker State
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'WORK' | 'OFF' | 'SUNDAY_DUTY'>('all');
  const [showLegend, setShowLegend] = useState(false);
  const [showLunchTime, setShowLunchTime] = useState<boolean>(true);
  const [isShiftKeyModalOpen, setIsShiftKeyModalOpen] = useState<boolean>(false);
  const [selectedMobileDayIdx, setSelectedMobileDayIdx] = useState<number>(0);

  // Shift Editing State
  const [selectedShift, setSelectedShift] = useState<ShiftAssignment | null>(null);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const fetchScheduleList = async () => {
    try {
      const list = await getSchedulesApi();
      setSchedulesList(list);
      if (list.length > 0 && !activeScheduleId) {
        const guzoSched = list.find(s => s.name?.includes('Guzo Go') || (s.start_date === '2026-10-05' && s.end_date === '2026-10-11'));
        setActiveScheduleId(guzoSched ? guzoSched.id : list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch schedule list:', err);
    }
  };

  const fetchScheduleDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await getScheduleApi(id);
      setSchedule(data);
      onScheduleChange?.(data);
    } catch (err) {
      console.error('Failed to fetch schedule details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleList();
  }, []);

  useEffect(() => {
    if (activeScheduleId) {
      fetchScheduleDetail(activeScheduleId);
    }
  }, [activeScheduleId]);

  // Memoized sorted days of active schedule
  const scheduleDaysSorted = useMemo(() => {
    if (!schedule?.days) return [];
    return [...schedule.days].sort((a, b) => a.date.localeCompare(b.date));
  }, [schedule]);

  // Initialize or update custom start/end date when schedule loads
  useEffect(() => {
    if (scheduleDaysSorted.length > 0) {
      const minDate = scheduleDaysSorted[0].date;
      const maxDate = scheduleDaysSorted[scheduleDaysSorted.length - 1].date;
      // Default to schedule range if unset or outside
      if (!customStartDate || customStartDate < minDate || customStartDate > maxDate) {
        setCustomStartDate(minDate);
      }
      if (!customEndDate || customEndDate < minDate || customEndDate > maxDate) {
        setCustomEndDate(maxDate);
      }
    }
  }, [scheduleDaysSorted]);

  const handleShiftClick = (shift: ShiftAssignment, dateStr: string) => {
    if (role === 'staff') return; // Read-only for staff role
    setSelectedShift(shift);
    setSelectedDateStr(dateStr);
    setIsEditModalOpen(true);
  };

  // Date range handlers with smart schedule switching
  const handleStartDateChange = (val: string) => {
    setCustomStartDate(val);
    if (customEndDate && val > customEndDate) {
      setCustomEndDate(val);
    }
    if (schedule && (val < schedule.start_date || val > schedule.end_date)) {
      const otherSched = schedulesList.find(s => s.start_date <= val && s.end_date >= val);
      if (otherSched && otherSched.id !== activeScheduleId) {
        setActiveScheduleId(otherSched.id);
        onScheduleChange?.(otherSched);
      }
    }
  };

  const handleEndDateChange = (val: string) => {
    setCustomEndDate(val);
    if (customStartDate && val < customStartDate) {
      setCustomStartDate(val);
    }
    if (schedule && (val < schedule.start_date || val > schedule.end_date)) {
      const otherSched = schedulesList.find(s => s.start_date <= val && s.end_date >= val);
      if (otherSched && otherSched.id !== activeScheduleId) {
        setActiveScheduleId(otherSched.id);
        onScheduleChange?.(otherSched);
      }
    }
  };

  // Day Chip click handler: 1st click selects single day, 2nd click selects date range
  const handleDayChipClick = (dateStr: string) => {
    if (!customStartDate || !customEndDate || customStartDate !== customEndDate) {
      setCustomStartDate(dateStr);
      setCustomEndDate(dateStr);
    } else {
      if (dateStr >= customStartDate) {
        setCustomEndDate(dateStr);
      } else {
        setCustomEndDate(customStartDate);
        setCustomStartDate(dateStr);
      }
    }
  };

  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return '';
    const dObj = new Date(dateStr + 'T00:00:00');
    return dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter days based on viewMode
  let displayedDays: ScheduleDay[] = [];
  if (schedule && schedule.days) {
    if (viewMode === 'week') {
      const startIdx = weekOffset * 7;
      displayedDays = scheduleDaysSorted.slice(startIdx, startIdx + 7);
    } else if (viewMode === 'custom') {
      displayedDays = scheduleDaysSorted.filter(day => {
        if (customStartDate && day.date < customStartDate) return false;
        if (customEndDate && day.date > customEndDate) return false;
        return true;
      });
    } else {
      displayedDays = scheduleDaysSorted;
    }
  }

  // Active export range based on current viewMode & selections
  const currentExportRange = useMemo(() => {
    if (viewMode === 'custom') {
      if (customStartDate && customEndDate) {
        return {
          startDate: customStartDate,
          endDate: customEndDate,
          label: `${formatDateDisplay(customStartDate)} – ${formatDateDisplay(customEndDate)}`
        };
      }
    } else if (viewMode === 'week') {
      if (displayedDays.length > 0) {
        const sDate = displayedDays[0].date;
        const eDate = displayedDays[displayedDays.length - 1].date;
        return {
          startDate: sDate,
          endDate: eDate,
          label: `Week ${weekOffset + 1}`
        };
      }
    }
    return undefined;
  }, [viewMode, customStartDate, customEndDate, displayedDays, weekOffset]);

  useEffect(() => {
    onDateRangeChange?.(currentExportRange);
  }, [currentExportRange, onDateRangeChange]);

  const handleExportExcel = () => {
    if (activeScheduleId) {
      exportScheduleExcel(activeScheduleId, currentExportRange?.startDate, currentExportRange?.endDate);
    } else {
      alert('No schedule currently selected to export');
    }
  };

  const maxWeeks = scheduleDaysSorted.length ? Math.ceil(scheduleDaysSorted.length / 7) : 1;

  // Build unique employees map
  const staffRowsMap: { [empName: string]: { [dateStr: string]: ShiftAssignment } } = {};
  if (schedule && schedule.days) {
    schedule.days.forEach(day => {
      day.shifts.forEach(shift => {
        if (!staffRowsMap[shift.employee_name]) {
          staffRowsMap[shift.employee_name] = {};
        }
        staffRowsMap[shift.employee_name][day.date] = shift;
      });
    });
  }

  const allStaffNames = Object.keys(staffRowsMap).sort();

  // ─── Filter staff by search query and shift filter ────────
  const filteredStaffNames = useMemo(() => {
    let names = allStaffNames;

    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      names = names.filter(n => n.toLowerCase().includes(q));
    }

    // Filter by shift type: show only staff who have at least one matching shift in displayed days
    if (shiftFilter !== 'all') {
      names = names.filter(name => {
        return displayedDays.some(day => {
          const shift = staffRowsMap[name]?.[day.date];
          if (!shift) return false;
          if (shiftFilter === 'WORK') return ['WORK', 'AM_HALF', 'PM_HALF'].includes(shift.shift_type);
          return shift.shift_type === shiftFilter;
        });
      });
    }

    return names;
  }, [allStaffNames, searchQuery, shiftFilter, displayedDays, staffRowsMap]);

  // ─── Daily summary stats (count WORK / OFF per column) ───
  const dailyStats = useMemo(() => {
    const stats: { [date: string]: { work: number; off: number; sunday: number; total: number } } = {};
    displayedDays.forEach(day => {
      let work = 0, off = 0, sunday = 0;
      filteredStaffNames.forEach(name => {
        const s = staffRowsMap[name]?.[day.date];
        if (!s) return;
        if (s.shift_type === 'OFF') off++;
        else if (s.shift_type === 'SUNDAY_DUTY') sunday++;
        else work++;
      });
      stats[day.date] = { work, off, sunday, total: work + sunday };
    });
    return stats;
  }, [displayedDays, filteredStaffNames, staffRowsMap]);

  const getAssignedTasks = (shift?: ShiftAssignment): string[] => {
    if (!shift) return [];
    if (shift.assigned_tasks && shift.assigned_tasks.length > 0) {
      return shift.assigned_tasks;
    }
    const list: string[] = [];
    if (shift.tasks && shift.tasks.length > 0) {
      shift.tasks.forEach(t => {
        if (t.task_name && !list.includes(t.task_name)) {
          list.push(t.task_name);
        }
      });
    }
    if (list.length === 0) {
      if (shift.primary_task) {
        shift.primary_task.split(',').forEach(p => {
          const pt = p.trim();
          if (pt && !list.includes(pt)) list.push(pt);
        });
      }
      if (shift.secondary_task) {
        shift.secondary_task.split(',').forEach(s => {
          const st = s.trim();
          if (st && !list.includes(st)) list.push(st);
        });
      }
    }
    return list;
  };

  const getTaskBadgeStyle = (task: string): string => {
    const t = task.toLowerCase();
    if (t.includes('call center')) {
      return 'border-sky-300 bg-sky-100 text-sky-900 font-semibold dark:border-sky-500/40 dark:bg-sky-950/60 dark:text-sky-300';
    } else if (t.includes('telegram')) {
      return 'border-cyan-300 bg-cyan-100 text-cyan-900 font-semibold dark:border-cyan-500/40 dark:bg-cyan-950/60 dark:text-cyan-300';
    } else if (t.includes('gds')) {
      return 'border-emerald-300 bg-emerald-100 text-emerald-900 font-semibold dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-300';
    } else if (t.includes('amadeus')) {
      return 'border-amber-300 bg-amber-100 text-amber-900 font-semibold dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-300';
    } else if (t.includes('2839')) {
      return 'border-purple-300 bg-purple-100 text-purple-900 font-semibold dark:border-purple-500/40 dark:bg-purple-950/60 dark:text-purple-300';
    } else if (t.includes('email')) {
      return 'border-blue-300 bg-blue-100 text-blue-900 font-semibold dark:border-blue-500/40 dark:bg-blue-950/60 dark:text-blue-300';
    } else if (t.includes('elms')) {
      return 'border-rose-300 bg-rose-100 text-rose-900 font-semibold dark:border-rose-500/40 dark:bg-rose-950/60 dark:text-rose-300';
    } else if (t.includes('que')) {
      return 'border-indigo-300 bg-indigo-100 text-indigo-900 font-semibold dark:border-indigo-500/40 dark:bg-indigo-950/60 dark:text-indigo-300';
    }
    return 'border-slate-300 bg-slate-100 text-slate-800 dark:border-border dark:bg-secondary dark:text-foreground font-semibold';
  };

  const getShiftBadge = (shift?: ShiftAssignment) => {
    if (!shift) {
      return (
        <span className="px-2 py-1 rounded bg-secondary/50 text-muted-foreground text-[11px] font-mono block text-center">
          —
        </span>
      );
    }

    const guzoInfo = getGuzoShiftKey(shift.start_time, shift.end_time, shift.shift_type, shift.notes);
    const guzoNotation = getGuzoCellNotation(shift);

    if (shift.shift_type === 'OFF') {
      const isLeave = guzoInfo.key === 'A-L';
      return (
        <div className={`py-2 px-1.5 rounded-lg border text-center flex flex-col items-center justify-center min-h-[64px] transition ${
          isLeave
            ? 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
            : 'border-slate-200 bg-slate-100/70 text-slate-700 dark:border-border dark:bg-muted/20 dark:text-muted-foreground'
        }`}>
          <span className="font-mono font-black text-xs sm:text-sm tracking-wider">{guzoInfo.key}</span>
          <span className="text-[10px] opacity-75 font-medium">{guzoInfo.name}</span>
        </div>
      );
    }

    const taskList = getAssignedTasks(shift);
    let badgeBorder = 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300';
    let typeLabel = 'WORK';
    if (shift.shift_type === 'AM_HALF') {
      badgeBorder = 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300';
      typeLabel = 'AM HALF';
    } else if (shift.shift_type === 'PM_HALF') {
      badgeBorder = 'border-purple-300 bg-purple-50 text-purple-950 dark:border-purple-800/50 dark:bg-purple-950/30 dark:text-purple-300';
      typeLabel = 'PM HALF';
    } else if (shift.shift_type === 'SUNDAY_DUTY') {
      badgeBorder = 'border-indigo-300 bg-indigo-50 text-indigo-950 ring-1 ring-indigo-300 dark:border-indigo-700/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-500/30';
      typeLabel = 'SUNDAY';
    }

    return (
      <div className={`p-1.5 rounded-lg border ${badgeBorder} flex flex-col justify-between min-h-[64px] gap-1 shadow-xs`}>
        {/* Header with Guzo Key Code */}
        <div className="flex items-center justify-between gap-1 leading-tight">
          <div className="flex items-center gap-1 min-w-0">
            <span
              className="font-mono font-bold text-[10px] px-1 py-0.2 rounded bg-black/10 dark:bg-white/10 shrink-0 border border-current/20"
              title={`${guzoInfo.key} — ${guzoInfo.name}`}
            >
              {guzoInfo.key}
            </span>
            <span className="font-bold text-[10px] uppercase tracking-wide truncate opacity-80">{typeLabel}</span>
          </div>
          <span className="text-[10px] font-mono opacity-85 shrink-0">
            {shift.start_time ? `${shift.start_time}–${shift.end_time}` : ''}
          </span>
        </div>

        {/* Guzo Cell Notation Badge (e.g. E-M: C/ELMS) */}
        {guzoNotation && (
          <div
            className="text-[9.5px] font-mono font-bold truncate opacity-90 px-1 py-0.5 rounded bg-muted/40 border border-border/40"
            title={`Guzo Notation: ${guzoNotation}`}
          >
            {guzoNotation}
          </div>
        )}

        {/* Lunch break time badge */}
        {showLunchTime && shift.lunch_start && shift.lunch_end && (
          <div
            className="flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-semibold border border-amber-300/80 bg-amber-50/90 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-300 shadow-2xs"
            title={`Scheduled Lunch Break: ${shift.lunch_start}–${shift.lunch_end}`}
          >
            <span className="inline-flex items-center gap-1">
              <Coffee className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Lunch</span>
            </span>
            <span className="font-mono text-[9px] font-bold opacity-90">{shift.lunch_start}–{shift.lunch_end}</span>
          </div>
        )}

        {/* Task pills — with backup indicator */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          {taskList.length > 0 ? (
            // Use shift.tasks for full data (is_backup, per-task times)
            shift.tasks && shift.tasks.length > 0 ? (
              shift.tasks.map((taskRecord, idx) => {
                const isBackup = taskRecord.is_backup ?? false;
                const timeStr = taskRecord.start_time && taskRecord.end_time
                  ? `${taskRecord.start_time}–${taskRecord.end_time}` : '';
                const badgeStyle = isBackup
                  ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-600/50 dark:bg-amber-950/50 dark:text-amber-300'
                  : getTaskBadgeStyle(taskRecord.task_name);
                return (
                  <span key={`${taskRecord.task_name}-${idx}`}
                    className={`inline-flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-semibold border w-full ${badgeStyle}`}
                    title={`${taskRecord.task_name}${isBackup ? ' (Backup)' : ''}${timeStr ? ` ${timeStr}` : ''}`}>
                    <span className="truncate">{taskRecord.task_name}</span>
                    <span className="ml-1 shrink-0 flex items-center gap-0.5">
                      {isBackup && (
                        <span className="text-[8px] font-bold bg-amber-200 dark:bg-amber-800/60 px-0.5 rounded text-amber-700 dark:text-amber-300">BKP</span>
                      )}
                      {timeStr && (
                        <span className="font-mono text-[9px] opacity-75 whitespace-nowrap">{timeStr}</span>
                      )}
                    </span>
                  </span>
                );
              })
            ) : (
              taskList.map(task => (
                <span key={task}
                  className={`inline-flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-semibold border w-full ${getTaskBadgeStyle(task)}`}>
                  <span className="truncate">{task}</span>
                </span>
              ))
            )
          ) : (
            <span className="text-[10px] text-muted-foreground/60 italic">No tasks</span>
          )}
        </div>
      </div>
    );
  };


  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Top Header Bar ─────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={activeScheduleId || ''}
                onChange={(e) => {
                  const newId = Number(e.target.value);
                  setActiveScheduleId(newId);
                  const matched = schedulesList.find(s => s.id === newId);
                  if (matched) {
                    onScheduleChange?.(matched);
                  }
                }}
                className="bg-background border border-input text-foreground font-semibold text-sm rounded-md px-2.5 py-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {schedulesList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
                schedule?.status === 'published'
                  ? 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400'
              }`}>
                {schedule?.status || 'Draft'}
              </span>
              {/* Staff counter */}
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                <Users className="w-3 h-3" />
                {filteredStaffNames.length}{filteredStaffNames.length !== allStaffNames.length ? ` / ${allStaffNames.length}` : ''} staff
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {viewMode === 'custom' && displayedDays.length > 0 ? (
                <span className="text-primary font-semibold">
                  Custom View: {displayedDays.length} {displayedDays.length === 1 ? 'day' : 'days'} ({formatDateDisplay(displayedDays[0].date)} – {formatDateDisplay(displayedDays[displayedDays.length - 1].date)}) • Click any shift to edit
                </span>
              ) : (
                'Click any shift to edit • Search by name or filter by shift type'
              )}
            </p>
          </div>
        </div>

        {/* View Mode Tabs & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Week navigation (only in week mode) */}
          {viewMode === 'week' && (
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                disabled={weekOffset === 0}
                className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-muted-foreground px-1">
                Week {weekOffset + 1}
              </span>
              <button onClick={() => setWeekOffset(Math.min(maxWeeks - 1, weekOffset + 1))}
                disabled={weekOffset >= maxWeeks - 1}
                className="h-8 w-8 rounded-md border border-input bg-background flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border">
            <button
              onClick={() => { setViewMode('week'); setWeekOffset(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'week'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => { setViewMode('2week'); setWeekOffset(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === '2week'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              2 Weeks
            </button>
            <button
              onClick={() => { setViewMode('month'); setWeekOffset(0); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                viewMode === 'month'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Days
            </button>
            <button
              onClick={() => {
                setViewMode('custom');
                if (!customStartDate && scheduleDaysSorted.length > 0) {
                  setCustomStartDate(scheduleDaysSorted[0].date);
                  setCustomEndDate(scheduleDaysSorted[scheduleDaysSorted.length - 1].date);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                viewMode === 'custom'
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Pick custom date range or specific days"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              Day Picker
            </button>
          </div>

          {activeScheduleId && (
            <button
              onClick={handleExportExcel}
              className="h-8 px-3 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium inline-flex items-center space-x-1.5 transition active:scale-[0.98]"
              title={`Download Excel Sheet${currentExportRange?.label ? ` (${currentExportRange.label})` : ''}`}
            >
              <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export</span>
              {currentExportRange?.label && (
                <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {currentExportRange.label}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Day Picker / Custom Date Range Panel ────────────── */}
      {viewMode === 'custom' && (
        <div className="p-4 rounded-xl border border-primary/25 bg-gradient-to-r from-primary/[0.06] via-primary/[0.02] to-transparent dark:from-primary/[0.12] dark:via-primary/[0.04] shadow-xs space-y-3.5 animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Date Pickers */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span>Date Range:</span>
              </div>

              <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-3 py-1.5 shadow-2xs focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">From</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

              <div className="flex items-center gap-2 bg-background border border-input rounded-lg px-3 py-1.5 shadow-2xs focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">To</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="bg-transparent text-foreground text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>

              {/* Status pill */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/25">
                <Clock className="w-3 h-3" />
                {displayedDays.length} {displayedDays.length === 1 ? 'day' : 'days'} selected
                {displayedDays.length > 0 && (
                  <span className="opacity-80 font-normal">
                    ({formatDateDisplay(displayedDays[0].date)} – {formatDateDisplay(displayedDays[displayedDays.length - 1].date)})
                  </span>
                )}
              </span>

              {/* Direct Export Selected Button */}
              {activeScheduleId && displayedDays.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center space-x-1.5 shadow-xs transition active:scale-[0.98]"
                  title={`Export Excel for selected dates (${formatDateDisplay(customStartDate)} – ${formatDateDisplay(customEndDate)})`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export {displayedDays.length} {displayedDays.length === 1 ? 'Day' : 'Days'} (Excel)</span>
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium mr-0.5">Presets:</span>

              {/* October 5 to 10 Shortcut */}
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('2026-10-05');
                  setCustomEndDate('2026-10-10');
                }}
                className={`h-7 px-2.5 rounded-md text-xs font-semibold border transition flex items-center gap-1 ${
                  customStartDate === '2026-10-05' && customEndDate === '2026-10-10'
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : 'border-border bg-background hover:bg-secondary text-foreground'
                }`}
                title="View October 5 to 10"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Oct 5 – 10
              </button>

              {/* Week 1 preset */}
              {scheduleDaysSorted.length >= 7 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate(scheduleDaysSorted[0].date);
                    setCustomEndDate(scheduleDaysSorted[6].date);
                  }}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium border transition ${
                    customStartDate === scheduleDaysSorted[0].date && customEndDate === scheduleDaysSorted[6].date
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background hover:bg-secondary text-foreground'
                  }`}
                >
                  Week 1
                </button>
              )}

              {/* Week 2 preset */}
              {scheduleDaysSorted.length >= 14 && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate(scheduleDaysSorted[7].date);
                    setCustomEndDate(scheduleDaysSorted[13].date);
                  }}
                  className={`h-7 px-2.5 rounded-md text-xs font-medium border transition ${
                    customStartDate === scheduleDaysSorted[7].date && customEndDate === scheduleDaysSorted[13].date
                      ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                      : 'border-border bg-background hover:bg-secondary text-foreground'
                  }`}
                >
                  Week 2
                </button>
              )}

              {/* All Days in Schedule */}
              <button
                type="button"
                onClick={() => {
                  if (scheduleDaysSorted.length > 0) {
                    setCustomStartDate(scheduleDaysSorted[0].date);
                    setCustomEndDate(scheduleDaysSorted[scheduleDaysSorted.length - 1].date);
                  }
                }}
                className={`h-7 px-2.5 rounded-md text-xs font-medium border transition ${
                  scheduleDaysSorted.length > 0 &&
                  customStartDate === scheduleDaysSorted[0].date &&
                  customEndDate === scheduleDaysSorted[scheduleDaysSorted.length - 1].date
                    ? 'border-primary bg-primary text-primary-foreground shadow-xs'
                    : 'border-border bg-background hover:bg-secondary text-foreground'
                }`}
              >
                All Days
              </button>
            </div>
          </div>

          {/* Interactive Day Chips Timeline */}
          {scheduleDaysSorted.length > 0 && (
            <div className="pt-2.5 border-t border-border/70">
              <div className="text-[11px] text-muted-foreground font-medium mb-1.5 flex items-center justify-between">
                <span>Click a day to pick it, or click two days to select a date range:</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Period: {scheduleDaysSorted[0].date} to {scheduleDaysSorted[scheduleDaysSorted.length - 1].date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {scheduleDaysSorted.map((d) => {
                  const isSelected = (!customStartDate || d.date >= customStartDate) && (!customEndDate || d.date <= customEndDate);
                  const isStart = d.date === customStartDate;
                  const isEnd = d.date === customEndDate;
                  const isSingle = isStart && isEnd;
                  const dObj = new Date(d.date + 'T00:00:00');
                  const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const monthDay = dObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
                  const isSun = dObj.getDay() === 0;
                  const isSat = dObj.getDay() === 6;

                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => handleDayChipClick(d.date)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 flex flex-col items-center min-w-[56px] border ${
                        isSingle
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/40'
                          : isStart || isEnd
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary'
                          : isSelected
                          ? 'bg-primary/15 text-foreground border-primary/30 font-semibold'
                          : isSun
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40 hover:bg-indigo-100/60'
                          : isSat
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100/60'
                          : 'bg-background hover:bg-secondary border-border text-muted-foreground hover:text-foreground'
                      }`}
                      title={`Click to pick ${d.date}`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-tight opacity-80">{dayName}</span>
                      <span className="text-xs font-bold">{monthDay}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Search & Filters Bar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name…"
            className="w-full h-8 pl-8 pr-8 rounded-lg border border-input bg-background text-foreground text-xs font-medium placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Shift type filter chips */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          {([
            { key: 'all', label: 'All', icon: null },
            { key: 'WORK', label: 'Working', icon: null },
            { key: 'OFF', label: 'Off Duty', icon: null },
            { key: 'SUNDAY_DUTY', label: 'Sunday', icon: <Sun className="w-3 h-3" /> },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setShiftFilter(f.key as any)}
              className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
                shiftFilter === f.key
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              {f.icon}
              {f.label}
            </button>
          ))}
        </div>

        {/* Toggle lunch time display */}
        <button
          onClick={() => setShowLunchTime(!showLunchTime)}
          className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 ${
            showLunchTime
              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs'
              : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
          }`}
          title="Toggle lunch times on roster shifts"
        >
          <Coffee className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          Lunch: {showLunchTime ? 'Shown' : 'Hidden'}
        </button>

        {/* Guzo Go Shift Key Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsShiftKeyModalOpen(true)}
          className="h-7 px-2.5 rounded-md text-[11px] font-semibold transition flex items-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 cursor-pointer shadow-2xs ml-auto"
          title="View full Guzo Go Shift Key and Legend"
        >
          <Key className="w-3.5 h-3.5 text-primary" />
          <span>Shift Key</span>
        </button>

        {/* Toggle legend */}
        <button onClick={() => setShowLegend(!showLegend)}
          className={`h-7 px-2.5 rounded-md text-[11px] font-semibold transition flex items-center gap-1 ${
            showLegend
              ? 'bg-primary/10 text-primary border border-primary/30'
              : 'bg-secondary text-muted-foreground hover:text-foreground border border-border'
          }`}
        >
          {showLegend ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          Legend
        </button>
      </div>

      {/* ── Collapsible Legend ──────────────────────────────── */}
      {showLegend && (
        <div className="p-4 rounded-xl border border-border bg-card text-xs space-y-3.5 shadow-2xs animate-fade-in">
          {/* Guzo Go Schedule Shift Keys */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Key className="w-3.5 h-3.5 text-primary" />
                Guzo Go Shift Key Codes
              </span>
              <button
                type="button"
                onClick={() => setIsShiftKeyModalOpen(true)}
                className="text-primary hover:underline text-[11px] font-semibold"
              >
                Open Full Modal &rarr;
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {GUZO_SHIFT_PRESETS.map((p) => (
                <div
                  key={p.key}
                  className={`p-2 rounded-lg border text-center flex flex-col justify-between ${p.badgeClass}`}
                >
                  <span className="font-mono font-black text-xs">{p.key}</span>
                  <span className="text-[10px] font-semibold truncate mt-0.5">{p.name}</span>
                  <span className="text-[9px] opacity-75 font-mono mt-0.5">{p.startTime ? `${p.startTime}–${p.endTime}` : 'Day Off'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Codes Legend */}
          <div className="pt-2.5 border-t border-border">
            <span className="text-foreground font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] mb-2">
              Task Key Abbreviations
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {GUZO_TASK_CODES.map((t) => (
                <span
                  key={t.code}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-secondary text-foreground text-[10px] font-semibold"
                  title={`${t.name} (${t.desc})`}
                >
                  <span className="font-mono font-bold text-primary">{t.code}</span>
                  <span className="opacity-80">{t.name}</span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-semibold">
                <Coffee className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                Lunch (12:00–13:00 / 13:00–14:00)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Loading State ──────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading roster…</p>
        </div>
      ) : displayedDays.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[220px] gap-3 rounded-xl border border-dashed border-border bg-card p-6 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-semibold text-foreground">No schedule days found in selected range</p>
            <p className="text-xs text-muted-foreground mt-1">
              {customStartDate && customEndDate
                ? `No schedule days match between ${customStartDate} and ${customEndDate}.`
                : 'Please select a valid date range.'}
            </p>
          </div>
          <button
            onClick={() => {
              if (scheduleDaysSorted.length > 0) {
                setCustomStartDate(scheduleDaysSorted[0].date);
                setCustomEndDate(scheduleDaysSorted[scheduleDaysSorted.length - 1].date);
              }
            }}
            className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition shadow-xs"
          >
            Reset to Full Roster
          </button>
        </div>
      ) : filteredStaffNames.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-muted-foreground">
          <Users className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">No staff found</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-primary underline">Clear search</button>
          )}
          {shiftFilter !== 'all' && (
            <button onClick={() => setShiftFilter('all')} className="text-xs text-primary underline">Show all shifts</button>
          )}
        </div>
      ) : (
        /* ── Roster Views ───────────────────────────────────── */
        <>
          {/* ══════════════════════════════════════════════════
              MOBILE VIEW — Day-by-day card layout (< md)
          ══════════════════════════════════════════════════ */}
          <div className="md:hidden">
            {/* Day tab strip */}
            <div className="flex overflow-x-auto gap-1.5 pb-2 mb-3 scrollbar-none snap-x snap-mandatory">
              {displayedDays.map((day, idx) => {
                const dObj = new Date(day.date + 'T00:00:00');
                const isSun = dObj.getDay() === 0;
                const isSat = dObj.getDay() === 6;
                const isToday = day.date === TODAY_STR;
                const isSelected = idx === selectedMobileDayIdx;
                const stats = dailyStats[day.date];
                return (
                  <button
                    key={day.date}
                    onClick={() => setSelectedMobileDayIdx(idx)}
                    className={`snap-start shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition font-medium text-xs min-w-[64px] ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : isToday
                        ? 'bg-primary/10 border-primary/40 text-primary'
                        : isSun
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:border-indigo-700/40 dark:text-indigo-300'
                        : isSat
                        ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-700/40 dark:text-amber-300'
                        : 'bg-card border-border text-foreground'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                      {dObj.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-base font-black leading-tight">
                      {dObj.getDate()}
                    </span>
                    <span className="text-[9px] mt-0.5 opacity-75">
                      {stats?.total || 0} on
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected day header */}
            {displayedDays[selectedMobileDayIdx] && (() => {
              const selDay = displayedDays[selectedMobileDayIdx];
              const dObj = new Date(selDay.date + 'T00:00:00');
              const stats = dailyStats[selDay.date];
              return (
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {dObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.total || 0} working · {stats?.off || 0} off
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectDateForDailyView(selDay.date)}
                    className="text-xs text-primary font-semibold flex items-center gap-1 px-2 py-1 rounded-lg border border-primary/30 bg-primary/5"
                  >
                    Full view <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })()}

            {/* Staff cards for selected day */}
            <div className="flex flex-col gap-2.5">
              {filteredStaffNames.map(name => {
                const selDay = displayedDays[selectedMobileDayIdx];
                if (!selDay) return null;
                const shift = staffRowsMap[name]?.[selDay.date];
                const avatarColor = getAvatarColor(name);
                const guzoInfo = shift ? getGuzoShiftKey(shift.start_time, shift.end_time, shift.shift_type, shift.notes) : null;
                const isOff = !shift || shift.shift_type === 'OFF';
                const isLeave = guzoInfo?.key === 'A-L';
                const isSunDuty = shift?.shift_type === 'SUNDAY_DUTY';
                const taskList = shift ? getAssignedTasks(shift) : [];

                let cardBg = 'bg-card border-border';
                if (isLeave) cardBg = 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/40';
                else if (isOff) cardBg = 'bg-muted/30 border-border';
                else if (isSunDuty) cardBg = 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-700/40';
                else cardBg = 'bg-emerald-50/60 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30';

                return (
                  <div
                    key={name}
                    onClick={() => shift && role !== 'staff' && handleShiftClick(shift, selDay.date)}
                    className={`rounded-xl border ${cardBg} p-3 shadow-xs ${role !== 'staff' && shift ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm`}>
                        {getInitials(name)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-sm text-foreground truncate">{name}</span>
                          {/* Shift key badge */}
                          {guzoInfo && (
                            <span className={`shrink-0 font-mono font-black text-sm px-2.5 py-0.5 rounded-lg border ${
                              isLeave ? 'bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : isOff ? 'bg-slate-100 border-slate-300 text-slate-600 dark:bg-muted/40 dark:text-muted-foreground'
                              : isSunDuty ? 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : 'bg-emerald-100 border-emerald-300 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}>
                              {guzoInfo.key}
                            </span>
                          )}
                        </div>

                        {/* Shift times */}
                        {shift && !isOff && shift.start_time && (
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            {shift.start_time} – {shift.end_time}
                            {shift.lunch_start && (
                              <span className="ml-2 text-amber-600 dark:text-amber-400">
                                ☕ {shift.lunch_start}–{shift.lunch_end}
                              </span>
                            )}
                          </p>
                        )}
                        {isOff && !isLeave && (
                          <p className="text-xs text-muted-foreground mt-0.5">Day off</p>
                        )}
                        {isLeave && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-0.5">Annual Leave</p>
                        )}

                        {/* Task pills */}
                        {taskList.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {shift?.tasks && shift.tasks.length > 0 ? (
                              shift.tasks.map((taskRecord, idx) => (
                                <span
                                  key={`${taskRecord.task_name}-${idx}`}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                    taskRecord.is_backup
                                      ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                      : getTaskBadgeStyle(taskRecord.task_name)
                                  }`}
                                >
                                  {taskRecord.task_name}
                                  {taskRecord.is_backup && <span className="text-[9px] font-bold opacity-75">BKP</span>}
                                </span>
                              ))
                            ) : (
                              taskList.map(task => (
                                <span
                                  key={task}
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTaskBadgeStyle(task)}`}
                                >
                                  {task}
                                </span>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              DESKTOP VIEW — Full horizontal table (≥ md)
          ══════════════════════════════════════════════════ */}
          <div className="hidden md:block rounded-xl border border-border bg-card overflow-hidden shadow-xs">
            <div className="overflow-auto max-h-[calc(100vh-280px)]">
              <table className="w-full text-left border-collapse">
                {/* ── Head ─ */}
                <thead className="sticky top-0 z-30">
                  <tr className="bg-secondary border-b border-border text-xs text-muted-foreground">
                    <th className="sticky left-0 z-40 bg-secondary py-3 px-4 font-semibold uppercase tracking-wider w-48 min-w-[180px] border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        Staff Member
                      </div>
                    </th>
                    {displayedDays.map(day => {
                      const dObj = new Date(day.date + 'T00:00:00');
                      const isSun = dObj.getDay() === 0;
                      const isSat = dObj.getDay() === 6;
                      const isToday = day.date === TODAY_STR;
                      return (
                        <th
                          key={day.date}
                          onClick={() => onSelectDateForDailyView(day.date)}
                          className={`py-2.5 px-2 text-center border-r border-border min-w-[145px] cursor-pointer hover:bg-accent/50 transition ${
                            isToday
                              ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-inset ring-primary/40'
                              : isSun
                              ? 'bg-indigo-100/80 dark:bg-indigo-950/40'
                              : isSat
                              ? 'bg-amber-100/80 dark:bg-amber-950/30'
                              : 'bg-secondary'
                          }`}
                          title="Click to view daily assignments"
                        >
                          {isToday && (
                            <span className="block text-[9px] font-bold text-primary uppercase tracking-widest mb-0.5">Today</span>
                          )}
                          <span className={`block text-[11px] font-bold ${
                            isToday ? 'text-primary'
                              : isSun ? 'text-indigo-700 dark:text-indigo-400'
                              : isSat ? 'text-amber-700 dark:text-amber-400'
                              : 'text-muted-foreground'
                          }`}>
                            {dObj.toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className={`block text-xs font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {dObj.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ── Body ─ */}
                <tbody className="divide-y divide-border/60">
                  {filteredStaffNames.map((name, rowIdx) => {
                    const isHebronOrBeti = name === 'Hebron' || name === 'Beti';
                    const avatarColor = getAvatarColor(name);

                    // Per-staff stats
                    const workDays = displayedDays.filter(d => {
                      const s = staffRowsMap[name]?.[d.date];
                      return s && s.shift_type !== 'OFF';
                    }).length;
                    const offDays = displayedDays.length - workDays;

                    return (
                      <tr
                        key={name}
                        className={`group hover:bg-accent/30 transition ${
                          rowIdx % 2 === 0 ? 'bg-card/40' : 'bg-card'
                        }`}
                      >
                        <td className="sticky left-0 z-10 bg-card py-2 px-3 border-r border-border font-medium text-xs text-foreground shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] group-hover:bg-accent/30 transition">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar */}
                            <div className={`w-7 h-7 rounded-full ${avatarColor} flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm`}>
                              {getInitials(name)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate">{name}</span>
                              {isHebronOrBeti ? (
                                <span className="text-[10px] text-primary font-semibold block">Rotation Lead</span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground block">
                                  {workDays}W / {offDays}O
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {displayedDays.map(day => {
                          const shift = staffRowsMap[name]?.[day.date];
                          const dObj = new Date(day.date + 'T00:00:00');
                          const isSun = dObj.getDay() === 0;
                          const isToday = day.date === TODAY_STR;
                          return (
                            <td
                              key={day.date}
                              onClick={() => shift && handleShiftClick(shift, day.date)}
                              className={`py-1.5 px-1.5 border-r border-border/70 transition ${
                                isToday
                                  ? 'bg-primary/[0.03] dark:bg-primary/[0.06]'
                                  : isSun
                                  ? 'bg-indigo-50/50 dark:bg-indigo-950/10'
                                  : ''
                              } ${
                                role !== 'staff'
                                  ? 'cursor-pointer hover:brightness-110 active:scale-[0.98]'
                                  : ''
                              }`}
                            >
                              {getShiftBadge(shift)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

                {/* ── Footer summary row ─ */}
                <tfoot className="sticky bottom-0 z-20">
                  <tr className="bg-secondary/90 backdrop-blur border-t-2 border-border text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    <td className="sticky left-0 z-30 bg-secondary py-2.5 px-4 border-r border-border shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-primary" />
                        <span>Daily Totals</span>
                      </div>
                    </td>
                    {displayedDays.map(day => {
                      const stats = dailyStats[day.date];
                      const isToday = day.date === TODAY_STR;
                      return (
                        <td key={day.date} className={`py-2 px-2 text-center border-r border-border/60 ${isToday ? 'bg-primary/10' : ''}`}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                              <Clock className="w-2.5 h-2.5" />
                              {stats?.total || 0}
                            </span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-muted/30 dark:text-muted-foreground">
                              {stats?.off || 0} off
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Shift Modal */}
      <ShiftEditModal
        isOpen={isEditModalOpen}
        shift={selectedShift}
        dateStr={selectedDateStr}
        onClose={() => setIsEditModalOpen(false)}
        onUpdated={() => activeScheduleId && fetchScheduleDetail(activeScheduleId)}
      />

      {/* Guzo Go Shift Key & Legend Modal */}
      <ShiftKeyLegendModal
        isOpen={isShiftKeyModalOpen}
        onClose={() => setIsShiftKeyModalOpen(false)}
      />
    </div>
  );
};
