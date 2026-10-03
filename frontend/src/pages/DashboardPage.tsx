import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Sparkles, 
  PhoneCall, 
  ArrowRight, 
  ShieldCheck, 
  RotateCw,
  Coffee,
  Briefcase,
  ChevronDown,
  Sun,
  Layers,
  Radio,
  Key
} from 'lucide-react';
import { getDashboardSummaryApi } from '../api/client';
import { DashboardSummary } from '../types';

interface DashboardPageProps {
  onNavigateToCalendar: () => void;
  onOpenGenerator: () => void;
}

// Staff Avatar Colors
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
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToCalendar,
  onOpenGenerator
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | undefined>(undefined);
  const [staffTab, setStaffTab] = useState<'working' | 'off'>('working');

  const fetchDashboard = async (targetDate?: string, schedId?: number) => {
    setIsLoading(true);
    try {
      const summary = await getDashboardSummaryApi(targetDate, schedId);
      setData(summary);
      if (!selectedDate) {
        setSelectedDate(summary.reference_date);
      }
      if (summary.schedule_id && !selectedScheduleId) {
        setSelectedScheduleId(summary.schedule_id);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedDate || undefined, selectedScheduleId);
  }, [selectedDate, selectedScheduleId]);

  const handleSelectDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    fetchDashboard(dateStr, selectedScheduleId);
  };

  const handleSelectSchedule = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = Number(e.target.value);
    setSelectedScheduleId(sId);
    setSelectedDate(''); // Reset to schedule's default first day
    fetchDashboard(undefined, sId);
  };

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading operations dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header & Active Schedule Banner ── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Live Roster
              </span>
              <span className="text-xs text-muted-foreground font-mono font-medium">
                {data.schedule_name || 'Active Schedule'}
              </span>
              {data.all_schedules && data.all_schedules.length > 1 && (
                <div className="relative inline-block ml-1">
                  <select
                    value={selectedScheduleId || data.schedule_id}
                    onChange={handleSelectSchedule}
                    className="h-6 pl-2 pr-6 text-[11px] rounded-md border border-border bg-secondary text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer appearance-none"
                  >
                    {data.all_schedules.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.start_date} to {s.end_date})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-2">
              Staff Operations Overview &mdash; <span className="text-primary">{data.day_of_week}</span>, {data.reference_date}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Guzo Go call center operational view. Real-time agent allocation, Saturday AM/PM half-day rotation, and Sunday duty squad adherence.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onNavigateToCalendar}
              className="h-9 px-3.5 rounded-lg border border-border bg-background hover:bg-secondary text-foreground text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Full Schedule Roster</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
            </button>
            <button
              onClick={() => fetchDashboard(selectedDate || undefined, selectedScheduleId)}
              className="h-9 w-9 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer"
              title="Refresh Dashboard"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Interactive Day Selector Strip ── */}
        {data.schedule_days && data.schedule_days.length > 0 && (
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                Select Schedule Day:
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Active: <strong className="text-foreground">{data.reference_date}</strong>
              </span>
            </div>
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-thin">
              {data.schedule_days.map(d => {
                const isSelected = d.date === data.reference_date;
                return (
                  <button
                    key={d.date}
                    onClick={() => handleSelectDay(d.date)}
                    className={`shrink-0 flex flex-col items-center px-3.5 py-2 rounded-xl border transition-all cursor-pointer min-w-[70px] ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/30'
                        : d.is_sunday
                        ? 'bg-indigo-50/70 border-indigo-200 text-indigo-800 dark:bg-indigo-950/30 dark:border-indigo-800/40 dark:text-indigo-300 hover:bg-indigo-100/70'
                        : d.is_saturday
                        ? 'bg-amber-50/70 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-300 hover:bg-amber-100/70'
                        : 'bg-card border-border text-foreground hover:bg-accent'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-85">
                      {d.day_name}
                    </span>
                    <span className="text-base font-black leading-tight mt-0.5">
                      {d.day_num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Staff</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">{data.total_staff}</span>
            <span className="text-xs text-muted-foreground font-medium">configured</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">12 active core agents</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Working on {data.day_of_week.slice(0, 3)}</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {data.working_today_count}
            </span>
            <span className="text-xs text-muted-foreground font-medium">agents on duty</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Assigned shifts & half-days</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Off on {data.day_of_week.slice(0, 3)}</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 dark:bg-muted/40 dark:text-muted-foreground">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {data.off_today_count}
            </span>
            <span className="text-xs text-muted-foreground font-medium">scheduled off</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">Day off (DO) & Leave (A-L)</p>
        </div>

        <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coverage Quality</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {data.red_slots_count === 0 ? '100%' : `${Math.round(((6 - data.red_slots_count) / 6) * 100)}%`}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {data.red_slots_count === 0 ? 'Adequate' : `${data.red_slots_count} Gaps`}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">
            {data.red_slots_count === 0 ? 'All 6 slots staffed' : 'Coverage attention needed'}
          </p>
        </div>
      </div>

      {/* ── Active Staff Roster for Selected Day ── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Staff Status for {data.day_of_week}, {data.reference_date}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Exact shift codes, working hours, scheduled lunch breaks, and channel assignments.
            </p>
          </div>

          {/* Toggle between working and off staff */}
          <div className="flex items-center p-1 rounded-xl bg-secondary border border-border">
            <button
              onClick={() => setStaffTab('working')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                staffTab === 'working'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Working ({data.working_today_count})</span>
            </button>
            <button
              onClick={() => setStaffTab('off')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                staffTab === 'off'
                  ? 'bg-slate-700 text-white dark:bg-slate-800 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Off Duty ({data.off_today_count})</span>
            </button>
          </div>
        </div>

        {/* Staff cards grid */}
        {staffTab === 'working' ? (
          data.working_staff && data.working_staff.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.working_staff.map((staff: any) => {
                const avatarColor = getAvatarColor(staff.name);
                const isSunday = staff.shift_type === 'SUNDAY_DUTY';
                const isHalf = staff.shift_type === 'AM_HALF' || staff.shift_type === 'PM_HALF';

                return (
                  <div
                    key={staff.id}
                    className="p-3.5 rounded-xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}>
                        {getInitials(staff.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="font-bold text-sm text-foreground truncate">{staff.name}</h4>
                          {staff.notes && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border shrink-0">
                              {staff.notes.split(':')[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{staff.position}</p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Clock className="w-3 h-3 text-primary" />
                          Hours:
                        </span>
                        <span className="font-mono font-bold text-foreground">{staff.hours}</span>
                      </div>

                      {staff.lunch && staff.lunch !== '—' && (
                        <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Coffee className="w-3 h-3" />
                            Lunch Break:
                          </span>
                          <span className="font-mono font-bold">{staff.lunch}</span>
                        </div>
                      )}

                      {/* Tasks breakdown */}
                      {staff.task_details && staff.task_details.length > 0 ? (
                        <div className="pt-1.5 border-t border-border/40 flex flex-col gap-1">
                          {staff.task_details.map((t: any, idx: number) => {
                            const timeStr = t.start_time && t.end_time ? `${t.start_time}–${t.end_time}` : '';
                            return (
                              <div
                                key={`${t.task_name}-${idx}`}
                                className={`flex items-center justify-between px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  t.is_backup
                                    ? 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-950/40 dark:border-amber-700/50 dark:text-amber-300'
                                    : 'bg-secondary border-border text-foreground'
                                }`}
                              >
                                <span className="flex items-center gap-1">
                                  <span>{t.task_name}</span>
                                  {t.is_backup && (
                                    <span className="text-[8px] font-black bg-amber-200 dark:bg-amber-800/60 text-amber-800 dark:text-amber-300 px-1 rounded">BKP</span>
                                  )}
                                </span>
                                {timeStr && (
                                  <span className="font-mono text-[10px] opacity-80">{timeStr}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        staff.assigned_tasks && staff.assigned_tasks.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {staff.assigned_tasks.map((task: string) => (
                              <span
                                key={task}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border border-primary/30 bg-primary/5 text-primary"
                              >
                                {task}
                              </span>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No staff working on this date.</p>
          )
        ) : (
          data.off_staff && data.off_staff.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {data.off_staff.map((staff: any) => {
                const avatarColor = getAvatarColor(staff.name);
                const isLeave = staff.notes?.includes('A-L') || staff.shift_type === 'LEAVE';

                return (
                  <div
                    key={staff.id || staff.name}
                    className={`p-3 rounded-xl border text-center space-y-2 ${
                      isLeave
                        ? 'border-rose-200 bg-rose-50/70 text-rose-900 dark:border-rose-800/50 dark:bg-rose-950/20 dark:text-rose-300'
                        : 'border-border bg-secondary/30 text-foreground'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${avatarColor} flex items-center justify-center text-white text-[10px] font-bold mx-auto shadow-sm`}>
                      {getInitials(staff.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold truncate">{staff.name}</p>
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-mono font-bold mt-1 ${
                        isLeave
                          ? 'bg-rose-200 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {isLeave ? 'A-L (Leave)' : 'DO (Day Off)'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">No staff scheduled off on this date.</p>
          )
        )}
      </div>

      {/* ── Real Saturday & Sunday Operational Compliance Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Real Saturday Half-Day Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Saturday Half-Day Rotation</h3>
                <p className="text-xs text-muted-foreground">{data.upcoming_saturday.formatted_date}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-0.5 text-xs font-bold font-mono">
              Rotation Week {data.upcoming_saturday.week_type}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Morning Half (AM) */}
            <div className="p-3.5 rounded-xl border border-amber-300/80 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Sun className="w-3 h-3" />
                Morning Half (AM)
              </span>
              {data.upcoming_saturday.am_staff && data.upcoming_saturday.am_staff.length > 0 ? (
                data.upcoming_saturday.am_staff.map((s, i) => (
                  <div key={i} className="pt-1">
                    <p className="text-sm font-bold text-foreground">{s.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{s.hours}</p>
                    {s.notes && (
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-300 font-semibold block">{s.notes}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground pt-1">Bethel (09:00–13:00)</p>
              )}
            </div>

            {/* Afternoon Half (PM) */}
            <div className="p-3.5 rounded-xl border border-purple-300/80 bg-purple-50/70 dark:border-purple-800/50 dark:bg-purple-950/20 space-y-1.5">
              <span className="text-[10px] font-bold text-purple-800 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Afternoon Half (PM)
              </span>
              {data.upcoming_saturday.pm_staff && data.upcoming_saturday.pm_staff.length > 0 ? (
                data.upcoming_saturday.pm_staff.map((s, i) => (
                  <div key={i} className="pt-1">
                    <p className="text-sm font-bold text-foreground">{s.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{s.hours}</p>
                    {s.notes && (
                      <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 font-semibold block">{s.notes}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground pt-1">Hebron (14:00–18:00)</p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            * Strict alternating schedule between Beti &amp; Hebron. Total active on Saturday: {data.upcoming_saturday.full_staff?.length ? `${data.upcoming_saturday.full_staff.length + (data.upcoming_saturday.am_staff?.length || 0) + (data.upcoming_saturday.pm_staff?.length || 0)} staff scheduled` : '11 staff on duty'}.
          </p>
        </div>

        {/* Real Sunday Operating Squad Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Sunday Operating Duty Squad</h3>
                <p className="text-xs text-muted-foreground">{data.upcoming_sunday.formatted_date}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800/40 dark:bg-indigo-950/30 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-bold font-mono">
              {data.upcoming_sunday.total_squad} Assigned Staff
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200/80 bg-indigo-50/50 dark:border-indigo-800/40 dark:bg-indigo-950/20 space-y-2.5">
            <div className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase tracking-wider flex items-center justify-between">
              <span>Active Sunday Duty Agents:</span>
              <span className="font-mono font-normal">All other 7 staff OFF</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {data.upcoming_sunday.squad_details && data.upcoming_sunday.squad_details.length > 0 ? (
                data.upcoming_sunday.squad_details.map((agent, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-indigo-300 bg-indigo-100 text-indigo-900 dark:border-indigo-700/60 dark:bg-indigo-900/40 dark:text-indigo-200 text-xs font-bold"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                    <span>{agent.name}</span>
                    <span className="font-mono text-[10px] opacity-75 font-normal">({agent.hours})</span>
                  </div>
                ))
              ) : (
                data.upcoming_sunday.squad_staff.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md border border-indigo-300 bg-indigo-100 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950 px-2 py-0.5 text-xs font-semibold"
                  >
                    ✓ {name}
                  </span>
                ))
              )}
            </div>

            {data.upcoming_sunday.off_staff && data.upcoming_sunday.off_staff.length > 0 && (
              <div className="pt-2 border-t border-indigo-200/60 dark:border-indigo-800/40 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Strictly Sunday OFF: </span>
                <span>{data.upcoming_sunday.off_staff.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 6 Daily Intervals Coverage Density ── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">Call Center Slot Coverage &mdash; {data.day_of_week}</h3>
            <p className="text-xs text-muted-foreground">Active staffing density across all 6 operational intervals</p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-semibold">
            <span className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Adequate (&ge;2)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-700 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Limited (1)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-rose-700 dark:text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Gap (0)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {data.time_slot_coverage.map(slot => {
            const isGreen = slot.status === 'GREEN';
            const isYellow = slot.status === 'YELLOW';
            return (
              <div
                key={slot.slot_index}
                className={`p-3.5 rounded-xl border text-center transition ${
                  isGreen
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20'
                    : isYellow
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20'
                    : 'border-rose-200 bg-rose-50/70 dark:border-destructive/50 dark:bg-destructive/20'
                }`}
              >
                <span className="text-xs font-bold text-foreground block">{slot.slot_name}</span>
                <div className="my-2">
                  <span
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      isGreen ? 'text-emerald-700 dark:text-emerald-400' : isYellow ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-destructive'
                    }`}
                  >
                    {slot.staff_count}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1 font-semibold">agents</span>
                </div>
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isGreen
                      ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : isYellow
                      ? 'border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300'
                      : 'border border-rose-300 bg-rose-100 text-rose-800 dark:border-destructive/60 dark:bg-destructive/50 dark:text-destructive-foreground'
                  }`}
                >
                  {slot.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Channel & Task Allocation Breakdown ── */}
      <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-foreground">Channel &amp; Platform Staffing on {data.day_of_week}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {data.channel_coverage.map(ch => (
            <div
              key={ch.channel}
              className="p-3 rounded-xl border border-border bg-secondary/30 text-center space-y-1 shadow-2xs"
            >
              <span className="text-xs font-bold text-foreground block truncate" title={ch.channel}>
                {ch.channel}
              </span>
              <p className="text-xl font-black text-primary">{ch.available_staff_count}</p>
              <span className="inline-block text-[10px] px-2 py-0.5 rounded border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                Staffed
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
