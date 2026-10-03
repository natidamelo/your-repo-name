import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Users, 
  Clock, 
  RotateCw,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Radio,
  Headphones,
  MessageSquare,
  Mail,
  Phone,
  Server,
  Layers,
  Zap,
  Check,
  Info,
  LayoutGrid,
  ListFilter,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Award,
  Sparkles,
  Coffee,
  X
} from 'lucide-react';
import { 
  getSchedulesApi, 
  getScheduleApi, 
  assignTaskApi, 
  deleteTaskAssignmentApi 
} from '../api/client';
import { SchedulePeriod, ScheduleDay, ShiftAssignment, TaskAssignment } from '../types';

// Avatar Colors for Staff
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
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Channel Definitions with Visual Themes & Icons
interface ChannelMeta {
  id: string;
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
  border: string;
}

const CHANNELS: ChannelMeta[] = [
  { id: 'Call Center', name: 'Call Center', category: 'Voice', icon: Headphones, color: 'text-sky-400', badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/30', border: 'border-sky-500/30' },
  { id: 'Telegram', name: 'Telegram', category: 'Chat', icon: MessageSquare, color: 'text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/30', border: 'border-blue-500/30' },
  { id: 'GDS', name: 'GDS', category: 'Reservations', icon: Radio, color: 'text-indigo-400', badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30', border: 'border-indigo-500/30' },
  { id: 'Amadeus', name: 'Amadeus', category: 'Ticketing', icon: Server, color: 'text-purple-400', badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30', border: 'border-purple-500/30' },
  { id: '2839 phone', name: '2839 phone', category: 'Hotline', icon: Phone, color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', border: 'border-emerald-500/30' },
  { id: 'Email', name: 'Email', category: 'Written', icon: Mail, color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30', border: 'border-amber-500/30' },
  { id: 'ELMS', name: 'ELMS', category: 'Queue', icon: Layers, color: 'text-teal-400', badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/30', border: 'border-teal-500/30' },
  { id: 'QUE', name: 'QUE', category: 'Queue', icon: Zap, color: 'text-pink-400', badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/30', border: 'border-pink-500/30' },
];

function getChannelMeta(channelName: string): ChannelMeta {
  const match = CHANNELS.find(c => c.name.toLowerCase() === channelName.toLowerCase());
  if (match) return match;
  return {
    id: channelName,
    name: channelName,
    category: 'Channel',
    icon: CheckSquare,
    color: 'text-primary',
    badgeBg: 'bg-primary/10 text-primary border-primary/30',
    border: 'border-primary/30'
  };
}

// Qualification / Certification Verification Engine (Internal Helper)
function isStaffCertifiedForChannel(employeeSkills: string[] | undefined, channelName: string): boolean {
  if (!employeeSkills || employeeSkills.length === 0) return false;
  const channelLower = channelName.toLowerCase().trim();
  const channelNormalized = channelLower.replace(/[\s_-]+/g, '');

  return employeeSkills.some(skill => {
    const sLower = skill.toLowerCase().trim();
    const sNormalized = sLower.replace(/[\s_-]+/g, '');
    
    if (sLower === channelLower || sNormalized === channelNormalized) return true;
    if (channelLower.includes(sLower) || sLower.includes(channelLower)) return true;
    if (channelLower === 'call center' && (sLower.includes('call') || sLower.includes('phone'))) return true;
    if (channelLower === '2839 phone' && (sLower.includes('2839') || sLower.includes('phone'))) return true;
    if (channelLower === 'gds' && sLower.includes('gds')) return true;
    if (channelLower === 'amadeus' && sLower.includes('amadeus')) return true;
    if (channelLower === 'email' && sLower.includes('email')) return true;
    if (channelLower === 'telegram' && sLower.includes('telegram')) return true;
    return false;
  });
}

export const TaskAssignmentsPage: React.FC = () => {
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<SchedulePeriod | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'channels'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterChannel, setFilterChannel] = useState<string>('ALL');

  // Top Assignment Form State
  const [selectedShiftId, setSelectedShiftId] = useState<number | ''>('');
  const [taskName, setTaskName] = useState<string>('Telegram');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [isBackup, setIsBackup] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick Assign Modal State (for 1-click modal from any staff card)
  const [quickAssignShift, setQuickAssignShift] = useState<ShiftAssignment | null>(null);
  const [modalTaskName, setModalTaskName] = useState<string>('Telegram');
  const [modalStartTime, setModalStartTime] = useState<string>('08:00');
  const [modalEndTime, setModalEndTime] = useState<string>('12:00');
  const [modalIsBackup, setModalIsBackup] = useState<boolean>(false);
  const [modalIsSubmitting, setModalIsSubmitting] = useState<boolean>(false);

  // 1. Fetch Schedule List on Mount
  const fetchSchedules = async () => {
    try {
      const list = await getSchedulesApi();
      setSchedulesList(list);
      if (list.length > 0 && !activeScheduleId) {
        const published = list.find((s: any) => s.status === 'published');
        setActiveScheduleId(published ? published.id : list[0].id);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  };

  // 2. Fetch Detail of Active Schedule & Ensure Date Compatibility
  const fetchScheduleDetail = async (id: number) => {
    setIsLoading(true);
    try {
      const data: SchedulePeriod = await getScheduleApi(id);
      setSchedule(data);

      if (data.days && data.days.length > 0) {
        setSelectedDate(current => {
          const exists = data.days.some((d: ScheduleDay) => d.date === current);
          if (exists) return current;

          const todayStr = new Date().toISOString().split('T')[0];
          const hasToday = data.days.some((d: ScheduleDay) => d.date === todayStr);
          if (hasToday) return todayStr;

          return data.days[0].date;
        });
      }
    } catch (err) {
      console.error('Failed to load schedule detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (activeScheduleId) {
      fetchScheduleDetail(activeScheduleId);
    }
  }, [activeScheduleId]);

  // Handle Date Input Change
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);

    if (schedule && !schedule.days.some(d => d.date === newDate)) {
      const matchingSchedule = schedulesList.find(s => 
        newDate >= s.start_date && newDate <= s.end_date
      );
      if (matchingSchedule && matchingSchedule.id !== activeScheduleId) {
        setActiveScheduleId(matchingSchedule.id);
      }
    }
  };

  // Active Day & Working Staff Calculations
  const activeDay = schedule?.days?.find(d => d.date === selectedDate);
  const activeWorkingShifts = useMemo(() => {
    return activeDay?.shifts?.filter(s => s.shift_type !== 'OFF') || [];
  }, [activeDay]);

  const selectedShift = useMemo(() => {
    return activeWorkingShifts.find(s => s.id === selectedShiftId);
  }, [activeWorkingShifts, selectedShiftId]);

  // Align start time when shift selected in top form
  useEffect(() => {
    if (selectedShift && selectedShift.start_time) {
      if (selectedShift.start_time > startTime) {
        setStartTime(selectedShift.start_time);
      }
    }
  }, [selectedShift]);

  // Compatibility helper for any shift, channel, start, end
  const checkCompatibility = (
    shift: ShiftAssignment | undefined | null,
    channel: string,
    start: string,
    end: string
  ) => {
    if (!shift) return null;

    const isCertified = isStaffCertifiedForChannel(shift.skills, channel);
    let timeWarning: string | null = null;
    let lunchConflict: string | null = null;

    if (shift.start_time && shift.end_time) {
      if (start < shift.start_time || end > shift.end_time) {
        timeWarning = `Slot (${start}–${end}) falls outside staff shift hours (${shift.start_time}–${shift.end_time}).`;
      }
    }

    if (shift.lunch_start && shift.lunch_end) {
      const overlapsLunch = !(end <= shift.lunch_start || start >= shift.lunch_end);
      if (overlapsLunch) {
        lunchConflict = `Slot overlaps scheduled lunch break (${shift.lunch_start}–${shift.lunch_end}).`;
      }
    }

    let taskOverlap: string | null = null;
    if (shift.tasks && shift.tasks.length > 0) {
      const conflicting = shift.tasks.find(t => 
        !(end <= t.start_time || start >= t.end_time)
      );
      if (conflicting) {
        taskOverlap = `Overlaps with existing task '${conflicting.task_name}' (${conflicting.start_time}–${conflicting.end_time}). Enable 'Backup' role if intended.`;
      }
    }

    return {
      isCertified,
      timeWarning,
      lunchConflict,
      taskOverlap,
      isFullyCompatible: isCertified && !timeWarning && !lunchConflict
    };
  };

  const topFormCompatibility = useMemo(() => {
    return checkCompatibility(selectedShift, taskName, startTime, endTime);
  }, [selectedShift, taskName, startTime, endTime]);

  const modalCompatibility = useMemo(() => {
    return checkCompatibility(quickAssignShift, modalTaskName, modalStartTime, modalEndTime);
  }, [quickAssignShift, modalTaskName, modalStartTime, modalEndTime]);

  // Open Quick Assign Modal for a specific staff member
  const handleOpenQuickAssignModal = (shift: ShiftAssignment) => {
    setQuickAssignShift(shift);
    // Default channel: staff primary task or Telegram
    const defaultChan = shift.primary_task && CHANNELS.some(c => c.name.toLowerCase() === shift.primary_task?.toLowerCase())
      ? shift.primary_task
      : 'Telegram';
    setModalTaskName(defaultChan);
    setModalStartTime(shift.start_time || '08:00');
    setModalEndTime(shift.lunch_start || '12:00');
    setModalIsBackup(false);
  };

  // Submit Task Assignment (from modal)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAssignShift) return;

    if (modalStartTime >= modalEndTime) {
      alert('Start time must be before End time');
      return;
    }

    setModalIsSubmitting(true);
    setLastWarning(null);
    setSuccessToast(null);

    try {
      const res = await assignTaskApi({
        shift_assignment_id: quickAssignShift.id,
        task_name: modalTaskName,
        start_time: modalStartTime,
        end_time: modalEndTime,
        is_backup: modalIsBackup
      });

      if (res.skill_warning) {
        setLastWarning(res.skill_warning);
      } else {
        setSuccessToast(`Successfully assigned '${modalTaskName}' to ${quickAssignShift.employee_name}!`);
        setTimeout(() => setSuccessToast(null), 5000);
      }

      setQuickAssignShift(null);

      if (activeScheduleId) {
        await fetchScheduleDetail(activeScheduleId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign channel task');
    } finally {
      setModalIsSubmitting(false);
    }
  };

  // Submit Task Assignment (from top form)
  const handleTopFormAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId) {
      alert('Please select an active on-duty staff member');
      return;
    }

    if (startTime >= endTime) {
      alert('Start time must be before End time');
      return;
    }

    setIsSubmitting(true);
    setLastWarning(null);
    setSuccessToast(null);

    try {
      const res = await assignTaskApi({
        shift_assignment_id: Number(selectedShiftId),
        task_name: taskName,
        start_time: startTime,
        end_time: endTime,
        is_backup: isBackup
      });

      if (res.skill_warning) {
        setLastWarning(res.skill_warning);
      } else {
        setSuccessToast(`Successfully assigned '${taskName}' to ${selectedShift?.employee_name}!`);
        setTimeout(() => setSuccessToast(null), 5000);
      }

      if (activeScheduleId) {
        await fetchScheduleDetail(activeScheduleId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to assign channel task');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task Assignment
  const handleDeleteTask = async (taskId: number, staffName: string, taskTitle: string) => {
    if (!window.confirm(`Remove '${taskTitle}' assignment for ${staffName}?`)) return;
    try {
      await deleteTaskAssignmentApi(taskId);
      setSuccessToast(`Removed assignment '${taskTitle}' for ${staffName}`);
      setTimeout(() => setSuccessToast(null), 4000);
      if (activeScheduleId) {
        await fetchScheduleDetail(activeScheduleId);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Day Navigation (Prev / Next within active schedule)
  const handleNavDay = (direction: 'prev' | 'next') => {
    if (!schedule?.days || schedule.days.length === 0) return;
    const currentIndex = schedule.days.findIndex(d => d.date === selectedDate);
    if (currentIndex === -1) {
      setSelectedDate(schedule.days[0].date);
      return;
    }
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < schedule.days.length) {
      setSelectedDate(schedule.days[nextIndex].date);
    }
  };

  // Format Date for Display
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Filtered Shifts
  const filteredWorkingShifts = useMemo(() => {
    return activeWorkingShifts.filter(s => {
      const matchSearch = s.employee_name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (filterChannel === 'ALL') return true;
      if (filterChannel === 'CERTIFIED') return isStaffCertifiedForChannel(s.skills, taskName);
      if (filterChannel === 'HAS_TASKS') return (s.tasks && s.tasks.length > 0);
      if (filterChannel === 'NO_TASKS') return (!s.tasks || s.tasks.length === 0);
      
      return s.tasks?.some(t => t.task_name.toLowerCase() === filterChannel.toLowerCase()) ||
             s.primary_task?.toLowerCase().includes(filterChannel.toLowerCase());
    });
  }, [activeWorkingShifts, searchQuery, filterChannel, taskName]);

  // Aggregate Channel Coverage Stats
  const channelCoverage = useMemo(() => {
    const stats: Record<string, { count: number; agents: string[] }> = {};
    CHANNELS.forEach(c => {
      stats[c.name] = { count: 0, agents: [] };
    });

    activeWorkingShifts.forEach(s => {
      if (s.tasks && s.tasks.length > 0) {
        s.tasks.forEach(t => {
          if (!stats[t.task_name]) {
            stats[t.task_name] = { count: 0, agents: [] };
          }
          stats[t.task_name].count += 1;
          if (!stats[t.task_name].agents.includes(s.employee_name)) {
            stats[t.task_name].agents.push(s.employee_name);
          }
        });
      } else if (s.primary_task) {
        const pt = s.primary_task;
        if (!stats[pt]) stats[pt] = { count: 0, agents: [] };
        stats[pt].count += 1;
        if (!stats[pt].agents.includes(s.employee_name)) {
          stats[pt].agents.push(s.employee_name);
        }
      }
    });

    return stats;
  }, [activeWorkingShifts]);

  const activeDayIndex = schedule?.days?.findIndex(d => d.date === selectedDate) ?? -1;
  const canGoPrev = activeDayIndex > 0;
  const canGoNext = schedule?.days ? activeDayIndex < schedule.days.length - 1 : false;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* ─── Top Control Panel & Schedule Navigator ─── */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Daily Task & Channel Assignments
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Compatibility Engine
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Allocate active staff to communication channels with real-time qualification verification
              </p>
            </div>
          </div>

          {/* Schedule Picker & Direct Date Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Schedule Selector */}
            <div className="flex items-center space-x-1.5 bg-background border border-border rounded-xl px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={activeScheduleId || ''}
                onChange={(e) => setActiveScheduleId(Number(e.target.value))}
                className="bg-transparent text-foreground font-semibold text-xs focus:outline-none cursor-pointer pr-1"
              >
                {schedulesList.map(s => (
                  <option key={s.id} value={s.id} className="bg-card text-foreground">
                    {s.name} ({s.start_date} – {s.end_date})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Input with Range Bounds */}
            <div className="flex items-center space-x-1 bg-background border border-border rounded-xl px-2 py-1 text-xs">
              <input
                type="date"
                value={selectedDate}
                min={schedule?.start_date}
                max={schedule?.end_date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-transparent text-foreground font-semibold text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {/* Prev / Next Day Steppers */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => handleNavDay('prev')}
                disabled={!canGoPrev}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition shadow-xs cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavDay('next')}
                disabled={!canGoNext}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition shadow-xs cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => activeScheduleId && fetchScheduleDetail(activeScheduleId)}
                className="p-1.5 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground transition shadow-xs cursor-pointer"
                title="Refresh Schedule"
              >
                <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ─── Interactive Schedule Day Navigator Bar ─── */}
        {schedule && schedule.days && schedule.days.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {schedule.days.map((day) => {
                const isSelected = day.date === selectedDate;
                const dObj = new Date(day.date + 'T00:00:00');
                const dayName = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][dObj.getDay()];
                const dayNum = dObj.getDate();
                const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dObj.getMonth()];
                const workingCount = day.shifts.filter(s => s.shift_type !== 'OFF').length;
                const tasksCount = day.shifts.reduce((acc, s) => acc + (s.tasks?.length || 0), 0);

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary shadow-xs'
                        : 'border-border/70 bg-card hover:bg-secondary/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center justify-between space-x-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {dayName}
                      </span>
                      {day.is_weekend && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-medium">
                          {dayName === 'SUN' ? 'SUN' : 'SAT'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-foreground mt-0.5">
                      {monthName} {dayNum}
                    </div>
                    <div className="flex items-center space-x-1.5 text-[10px] mt-1 text-muted-foreground">
                      <span className="font-medium text-foreground">{workingCount} staff</span>
                      {tasksCount > 0 && (
                        <span className="px-1 rounded bg-secondary text-primary font-mono text-[9px] font-semibold">
                          {tasksCount} tasks
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Alerts & Toast Feedback ─── */}
      {lastWarning && (
        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{lastWarning}</span>
          </div>
          <button
            type="button"
            onClick={() => setLastWarning(null)}
            className="text-amber-400 hover:text-foreground font-semibold px-2 py-0.5 rounded transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {successToast && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-xs flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-400 hover:text-foreground font-semibold px-2 py-0.5 rounded transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ─── Channel Quick Allocation Summary Bar ─── */}
      <div className="p-3.5 rounded-xl border border-border bg-card/60 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-foreground">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Channel Allocation Snapshot on {formatDateLabel(selectedDate)}</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            {activeWorkingShifts.length} Working Staff on Duty
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {CHANNELS.map(ch => {
            const stat = channelCoverage[ch.name] || { count: 0, agents: [] };
            const Icon = ch.icon;
            const hasCoverage = stat.count > 0;
            return (
              <div
                key={ch.id}
                className={`p-2 rounded-lg border text-center transition ${
                  hasCoverage ? ch.badgeBg : 'bg-background/40 border-border/60 text-muted-foreground opacity-60'
                }`}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Icon className="w-3 h-3" />
                  <span className="text-[11px] font-bold truncate">{ch.name}</span>
                </div>
                <div className="text-xs font-mono font-extrabold mt-0.5">
                  {stat.count} {stat.count === 1 ? 'Agent' : 'Agents'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Top Assignment Form with Pre-Flight Compatibility ─── */}
      <div className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              Allocate Channel Task on {formatDateLabel(selectedDate)}
            </h3>
          </div>
          <div className="text-xs text-muted-foreground flex items-center space-x-2">
            <span>Presets:</span>
            <button
              type="button"
              onClick={() => { setStartTime('08:00'); setEndTime('12:00'); }}
              className="px-2 py-0.5 rounded border border-border bg-secondary hover:bg-accent text-[10px] font-medium text-foreground transition cursor-pointer"
            >
              Morning (08-12)
            </button>
            <button
              type="button"
              onClick={() => { setStartTime('13:00'); setEndTime('17:00'); }}
              className="px-2 py-0.5 rounded border border-border bg-secondary hover:bg-accent text-[10px] font-medium text-foreground transition cursor-pointer"
            >
              Afternoon (13-17)
            </button>
            <button
              type="button"
              onClick={() => { setStartTime('09:00'); setEndTime('18:00'); }}
              className="px-2 py-0.5 rounded border border-border bg-secondary hover:bg-accent text-[10px] font-medium text-foreground transition cursor-pointer"
            >
              Full Day (09-18)
            </button>
          </div>
        </div>

        <form onSubmit={handleTopFormAssign} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* 1. Employee Shift Selector */}
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                <span>Working Staff Member</span>
                {activeWorkingShifts.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {activeWorkingShifts.length} available
                  </span>
                )}
              </label>
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value ? Number(e.target.value) : '')}
                required
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              >
                <option value="">Select Working Agent...</option>
                {activeWorkingShifts.map(s => {
                  const certified = isStaffCertifiedForChannel(s.skills, taskName);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.employee_name} ({s.shift_type} | {s.start_time || '08:00'}–{s.end_time || '17:00'}) {certified ? '✅ Certified' : '⚠️ Cross-Skill'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. Target Channel */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Target Channel
              </label>
              <select
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              >
                {CHANNELS.map(ch => {
                  const isCert = selectedShift ? isStaffCertifiedForChannel(selectedShift.skills, ch.name) : true;
                  return (
                    <option key={ch.id} value={ch.name}>
                      {ch.name} {selectedShift ? (isCert ? '(Certified)' : '(Cross-Training)') : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Start Time */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              />
            </div>

            {/* 4. End Time */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              />
            </div>

            {/* 5. Submit Button */}
            <div className="md:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={isSubmitting || activeWorkingShifts.length === 0}
                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs flex items-center justify-center space-x-1.5 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? '...' : 'Assign'}</span>
              </button>
            </div>
          </div>

          {/* Backup Role Option & Interactive Pre-Flight Inspection */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2">
            <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isBackup}
                onChange={(e) => setIsBackup(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary w-4 h-4"
              />
              <span>Designate as <strong>Backup / Overflow Role</strong> (Secondary coverage if primary agent is occupied)</span>
            </label>

            {selectedShift && topFormCompatibility && (
              <div className={`p-2.5 rounded-xl border text-xs flex items-center space-x-2.5 shadow-2xs transition ${
                topFormCompatibility.isFullyCompatible
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              }`}>
                {topFormCompatibility.isFullyCompatible ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold flex items-center space-x-1.5">
                    <span>{selectedShift.employee_name}</span>
                    <span>•</span>
                    <span>{taskName}:</span>
                    {topFormCompatibility.isCertified ? (
                      <span className="text-emerald-400 font-bold">100% Certified</span>
                    ) : (
                      <span className="text-amber-400 font-bold">Cross-Training Override</span>
                    )}
                  </div>
                  {topFormCompatibility.lunchConflict && (
                    <div className="text-[11px] text-amber-200 mt-0.5">
                      ⚠️ {topFormCompatibility.lunchConflict}
                    </div>
                  )}
                  {topFormCompatibility.timeWarning && (
                    <div className="text-[11px] text-amber-200 mt-0.5">
                      ⚠️ {topFormCompatibility.timeWarning}
                    </div>
                  )}
                  {topFormCompatibility.taskOverlap && (
                    <div className="text-[11px] text-sky-200 mt-0.5">
                      ℹ️ {topFormCompatibility.taskOverlap}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* ─── Search, Filter & View Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search by Staff Name */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search staff on duty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center space-x-1.5 text-xs">
            <ListFilter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="h-8 px-2 rounded-lg border border-input bg-background text-xs text-foreground font-medium focus:outline-none"
            >
              <option value="ALL">All Working Staff</option>
              <option value="CERTIFIED">Certified for {taskName}</option>
              <option value="HAS_TASKS">Has Dedicated Tasks</option>
              <option value="NO_TASKS">Unassigned / General</option>
              {CHANNELS.map(c => (
                <option key={c.id} value={c.name}>{c.name} Assigned</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Switcher: Staff Cards vs Channel Matrix */}
        <div className="flex items-center space-x-1 bg-secondary p-1 rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Staff Cards ({filteredWorkingShifts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('channels')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
              viewMode === 'channels'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Channel Matrix</span>
          </button>
        </div>
      </div>

      {/* ─── Mode 1: Staff Cards View ─── */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredWorkingShifts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card/40 rounded-2xl border border-border space-y-2">
              <Users className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm font-semibold text-foreground">
                No matching working staff on {formatDateLabel(selectedDate)}
              </p>
              <p className="text-xs text-muted-foreground">
                Ensure this date falls within the active schedule or select another day from the navigator above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredWorkingShifts.map(s => {
                const isSelected = s.id === selectedShiftId;
                const hasTasks = s.tasks && s.tasks.length > 0;

                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border bg-card shadow-xs transition hover:border-primary/50 space-y-3 ${
                      isSelected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    {/* Header: Avatar, Name, Shift Hours */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-9 h-9 rounded-full ${getAvatarColor(s.employee_name)} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                          {getInitials(s.employee_name)}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground flex items-center space-x-1.5">
                            <span>{s.employee_name}</span>
                            {s.shift_type === 'SUNDAY_DUTY' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                                Sunday
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">
                            {s.employee_position || 'Call Center Staff'}
                          </p>
                        </div>
                      </div>

                      {/* Shift Hours Badge */}
                      <span className="text-[10px] px-2 py-0.5 rounded-lg border border-border bg-secondary font-mono text-foreground font-semibold">
                        {s.start_time || '08:00'} – {s.end_time || '17:00'}
                      </span>
                    </div>

                    {/* Lunch Break & Primary Task Info */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border/60">
                      <div className="flex items-center space-x-1.5">
                        <Coffee className="w-3.5 h-3.5 text-amber-400" />
                        <span>Lunch: <strong className="text-foreground">{s.lunch_start || '12:00'}–{s.lunch_end || '13:00'}</strong></span>
                      </div>
                      <div className="text-[10px]">
                        Primary: <span className="font-semibold text-foreground">{s.primary_task || 'Call Center'}</span>
                      </div>
                    </div>

                    {/* Certified Skills Tags */}
                    {s.skills && s.skills.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Certified Skills:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {s.skills.map((sk, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.2 rounded bg-background border border-border text-foreground font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dedicated Channel Task Assignments */}
                    <div className="pt-2 border-t border-border space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Dedicated Channel Tasks:
                        </span>
                        {/* Dedicated + Quick Assign Action Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenQuickAssignModal(s)}
                          className="px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 text-[11px] font-bold transition flex items-center space-x-1 shadow-2xs cursor-pointer active:scale-95"
                          title={`Assign channel task to ${s.employee_name}`}
                        >
                          <Plus className="w-3 h-3" />
                          <span>Quick Assign</span>
                        </button>
                      </div>

                      {hasTasks ? (
                        <div className="space-y-1.5">
                          {s.tasks!.map(t => {
                            const meta = getChannelMeta(t.task_name);
                            const Icon = meta.icon;
                            return (
                              <div
                                key={t.id}
                                className={`flex items-center justify-between p-2 rounded-xl border text-xs shadow-2xs ${meta.badgeBg}`}
                              >
                                <div className="flex items-center space-x-2">
                                  <Icon className="w-3.5 h-3.5 shrink-0" />
                                  <div>
                                    <div className="font-bold flex items-center space-x-1.5">
                                      <span>{t.task_name}</span>
                                      {t.is_backup && (
                                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold">
                                          Backup
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] opacity-80 font-mono">
                                      {t.start_time} – {t.end_time}
                                    </span>
                                  </div>
                                </div>
                                {t.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTask(t.id!, s.employee_name, t.task_name)}
                                    className="p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition cursor-pointer"
                                    title="Delete Assignment"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/70 italic py-1">
                          No dedicated channel tasks. Covering primary role.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Mode 2: Channel Matrix / Timeline View ─── */}
      {viewMode === 'channels' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {CHANNELS.map(ch => {
              const Icon = ch.icon;
              const assignedStaff = activeWorkingShifts.filter(s => 
                s.tasks?.some(t => t.task_name.toLowerCase() === ch.name.toLowerCase()) ||
                s.primary_task?.toLowerCase().includes(ch.name.toLowerCase())
              );

              return (
                <div
                  key={ch.id}
                  className="p-4 rounded-2xl border border-border bg-card shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-2 rounded-xl ${ch.badgeBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{ch.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{ch.category} Channel</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg border border-border bg-secondary text-foreground">
                      {assignedStaff.length} Allocated
                    </span>
                  </div>

                  {assignedStaff.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground/70 italic bg-secondary/30 rounded-xl">
                      No staff currently assigned to {ch.name}.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignedStaff.map(s => {
                        const specificTasks = s.tasks?.filter(t => t.task_name.toLowerCase() === ch.name.toLowerCase()) || [];
                        const isCert = isStaffCertifiedForChannel(s.skills, ch.name);

                        return (
                          <div
                            key={s.id}
                            className="p-2.5 rounded-xl border border-border bg-background/60 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-7 h-7 rounded-full ${getAvatarColor(s.employee_name)} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                                {getInitials(s.employee_name)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground flex items-center space-x-1.5">
                                  <span>{s.employee_name}</span>
                                  {isCert ? (
                                    <span className="text-[9px] px-1 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                                      Certified
                                    </span>
                                  ) : (
                                    <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-400 font-medium">
                                      Override
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  Shift: {s.start_time}–{s.end_time}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                {specificTasks.length > 0 ? (
                                  specificTasks.map(t => (
                                    <div key={t.id} className="text-[11px] font-mono font-bold text-primary">
                                      {t.start_time}–{t.end_time} {t.is_backup && '(Backup)'}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    Primary Shift Role
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenQuickAssignModal(s)}
                                className="p-1 rounded-md hover:bg-secondary text-primary transition cursor-pointer"
                                title={`Assign task to ${s.employee_name}`}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── DEDICATED QUICK ASSIGN MODAL ─── */}
      {quickAssignShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-scale-up space-y-0">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-secondary/30">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${getAvatarColor(quickAssignShift.employee_name)} text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0`}>
                  {getInitials(quickAssignShift.employee_name)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground flex items-center space-x-2">
                    <span>Quick Assign Task: {quickAssignShift.employee_name}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {quickAssignShift.employee_position || 'Staff'} • Shift: <span className="font-mono text-foreground font-semibold">{quickAssignShift.start_time || '08:00'}–{quickAssignShift.end_time || '17:00'}</span> • Lunch: <span className="font-mono text-foreground font-semibold">{quickAssignShift.lunch_start || '12:00'}–{quickAssignShift.lunch_end || '13:00'}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickAssignShift(null)}
                className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              {/* Channel Selector Pills */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Select Channel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHANNELS.map(ch => {
                    const isSelected = modalTaskName.toLowerCase() === ch.name.toLowerCase();
                    const isCert = isStaffCertifiedForChannel(quickAssignShift.skills, ch.name);
                    const Icon = ch.icon;

                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setModalTaskName(ch.name)}
                        className={`p-2 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary/10 ring-1 ring-primary shadow-xs'
                            : 'border-border/70 bg-card hover:bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-primary' : ch.color}`} />
                          <span className="text-xs font-bold truncate text-foreground">{ch.name}</span>
                        </div>
                        <span className={`text-[9px] font-semibold px-1 py-0.2 rounded w-fit ${
                          isCert 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {isCert ? 'Certified' : 'Cross-Skill'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Time Window Presets</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setModalStartTime('08:00'); setModalEndTime('12:00'); }}
                    className="px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-accent text-xs font-medium text-foreground transition cursor-pointer"
                  >
                    🌅 Morning (08:00–12:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModalStartTime('13:00'); setModalEndTime('17:00'); }}
                    className="px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-accent text-xs font-medium text-foreground transition cursor-pointer"
                  >
                    🍽️ Afternoon (13:00–17:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => { 
                      setModalStartTime(quickAssignShift.start_time || '08:00'); 
                      setModalEndTime(quickAssignShift.end_time || '17:00'); 
                    }}
                    className="px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-accent text-xs font-medium text-foreground transition cursor-pointer"
                  >
                    ⏰ Full Shift ({quickAssignShift.start_time || '08:00'}–{quickAssignShift.end_time || '17:00'})
                  </button>
                </div>
              </div>

              {/* Exact Time Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    required
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    required
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
                  />
                </div>
              </div>

              {/* Backup Role Checkbox */}
              <label className="flex items-center space-x-2 text-xs text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={modalIsBackup}
                  onChange={(e) => setModalIsBackup(e.target.checked)}
                  className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
                <span>Designate as <strong>Backup / Overflow</strong> (secondary coverage)</span>
              </label>

              {/* Real-Time Pre-Flight Compatibility Card */}
              {modalCompatibility && (
                <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 transition ${
                  modalCompatibility.isFullyCompatible
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}>
                  {modalCompatibility.isFullyCompatible ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <div className="font-semibold">
                      {modalCompatibility.isCertified ? (
                        <span className="text-emerald-400">✅ Certified for {modalTaskName}</span>
                      ) : (
                        <span className="text-amber-400">⚠️ Cross-Training Notice ({quickAssignShift.employee_name} has no registered '{modalTaskName}' skill)</span>
                      )}
                    </div>
                    {modalCompatibility.lunchConflict && (
                      <div className="text-[11px] text-amber-200">
                        ⚠️ {modalCompatibility.lunchConflict}
                      </div>
                    )}
                    {modalCompatibility.timeWarning && (
                      <div className="text-[11px] text-amber-200">
                        ⚠️ {modalCompatibility.timeWarning}
                      </div>
                    )}
                    {modalCompatibility.taskOverlap && (
                      <div className="text-[11px] text-sky-200">
                        ℹ️ {modalCompatibility.taskOverlap}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setQuickAssignShift(null)}
                  className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalIsSubmitting}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs flex items-center space-x-1.5 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{modalIsSubmitting ? 'Assigning...' : `Assign ${modalTaskName}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
