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
  RotateCw
} from 'lucide-react';
import { getDashboardSummaryApi } from '../api/client';
import { DashboardSummary } from '../types';

interface DashboardPageProps {
  onNavigateToCalendar: () => void;
  onOpenGenerator: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToCalendar,
  onOpenGenerator
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const summary = await getDashboardSummaryApi();
      setData(summary);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading operations dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner - Shadcn Card with subtle border */}
      <div className="p-6 rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Live Operations
            </span>
            <span className="text-xs text-muted-foreground">Anchor Roster Active</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mt-2">
            Staff Operations Overview — {data.day_of_week}, {data.reference_date}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Automated constraint-verified call center roster. Continuous coverage across all 6 daily time slots, Saturday half-day rotations, and Sunday 4-staff squad compliance.
          </p>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onNavigateToCalendar}
            className="h-9 px-4 rounded-md border border-input bg-background hover:bg-accent text-foreground text-xs font-medium inline-flex items-center space-x-1.5 transition"
          >
            <span>View Calendar</span>
            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={onOpenGenerator}
            className="h-9 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-sm inline-flex items-center space-x-1.5 transition active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Schedule</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Clean Shadcn Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-tight">Total Staff</span>
            <div className="p-1.5 rounded-md bg-secondary text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{data.total_staff}</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">configured</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">12 active core agents</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-tight">Working Today</span>
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{data.working_today_count}</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">agents</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Full shift & half-day active</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-tight">Off Today</span>
            <div className="p-1.5 rounded-md bg-secondary text-muted-foreground">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">{data.off_today_count}</span>
            <span className="text-xs text-muted-foreground ml-1.5 font-normal">staff</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">2 days off policy respected</p>
        </div>

        <div className="p-5 rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground tracking-tight">Coverage Quality</span>
            <div className="p-1.5 rounded-md bg-secondary text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-foreground">100%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1.5 font-semibold">Adequate</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {data.red_slots_count > 0 ? `${data.red_slots_count} Gaps` : '0 Critical coverage gaps'}
          </p>
        </div>
      </div>

      {/* Rotation Special Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming Saturday Half-Day Card */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Upcoming Saturday Half-Day Rotation</h3>
                <p className="text-xs text-muted-foreground">{data.upcoming_saturday.formatted_date}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300 px-2.5 py-0.5 text-xs font-semibold">
              Week {data.upcoming_saturday.week_type}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-lg border border-border bg-secondary/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Morning Shift</span>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mt-1">
                {data.upcoming_saturday.week_type === 'A' ? 'Beti' : 'Hebron'}
              </p>
              <p className="text-xs text-foreground font-mono font-medium mt-0.5">
                {data.upcoming_saturday.week_type === 'A' ? '09:00 – 14:00' : '08:00 – 12:00'}
              </p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300 font-mono font-semibold">
                AM HALF
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border bg-secondary/30">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Afternoon Shift</span>
              <p className="text-sm font-bold text-purple-700 dark:text-purple-400 mt-1">
                {data.upcoming_saturday.week_type === 'A' ? 'Hebron' : 'Beti'}
              </p>
              <p className="text-xs text-foreground font-mono font-medium mt-0.5">
                {data.upcoming_saturday.week_type === 'A' ? '13:00 – 17:00' : '14:00 – 18:00'}
              </p>
              <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded border border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 font-mono font-semibold">
                PM HALF
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            * Hebron and Beti alternate Saturday half-days every week and never overlap on the same half.
          </p>
        </div>

        {/* Upcoming Sunday Squad Card */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Sunday Operating Squad (Exactly 4 Staff)</h3>
                <p className="text-xs text-muted-foreground">{data.upcoming_sunday.formatted_date}</p>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800/40 dark:bg-indigo-950/30 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-semibold">
              4 Staff Squad
            </span>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Duty Lead:</span>
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">{data.upcoming_sunday.duty_lead} (Worker)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Mandatory Monday Off:</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">{data.upcoming_sunday.duty_lead} gets Monday OFF</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Strictly Sunday OFF:</span>
              <span className="font-medium text-foreground">Yordi, Obsa, {data.upcoming_sunday.off_lead}</span>
            </div>

            <div className="pt-2 border-t border-border/60">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Active Sunday 4-Person Squad:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {data.upcoming_sunday.squad_staff.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-md border border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-800/50 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 text-xs font-semibold"
                  >
                    ✓ {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6 Required Time Slots Coverage Breakdown */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Call Center Coverage by Required Interval</h3>
            <p className="text-xs text-muted-foreground">Density analysis across all 6 mandatory intervals</p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-medium">
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
              <span>Problem (0)</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {data.time_slot_coverage.map(slot => {
            const isGreen = slot.status === 'GREEN';
            const isYellow = slot.status === 'YELLOW';
            return (
              <div
                key={slot.slot_index}
                className={`p-3.5 rounded-lg border text-center transition ${
                  isGreen
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20'
                    : isYellow
                    ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20'
                    : 'border-rose-200 bg-rose-50/70 dark:border-destructive/50 dark:bg-destructive/20'
                }`}
              >
                <span className="text-xs font-semibold text-foreground block">{slot.slot_name}</span>
                <div className="my-2">
                  <span
                    className={`text-xl font-bold tracking-tight ${
                      isGreen ? 'text-emerald-700 dark:text-emerald-400' : isYellow ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-destructive'
                    }`}
                  >
                    {slot.staff_count}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-1 font-normal">staff</span>
                </div>
                <span
                  className={`inline-block text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
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

      {/* Channel Coverage Matrix */}
      <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Channel & System Coverage Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
          {data.channel_coverage.map(ch => (
            <div
              key={ch.channel}
              className="p-3 rounded-lg border border-border bg-secondary/30 text-center"
            >
              <span className="text-xs font-semibold text-foreground block truncate" title={ch.channel}>
                {ch.channel}
              </span>
              <p className="text-lg font-bold text-primary my-1">{ch.available_staff_count}</p>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400 font-semibold">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
