import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  ChevronLeft, 
  ChevronRight, 
  UserCheck, 
  UserX, 
  Coffee, 
  Briefcase, 
  Clock, 
  RotateCw 
} from 'lucide-react';
import { getDayCoverageApi, getDashboardSummaryApi } from '../api/client';
import { DayCoverageSummary } from '../types';

interface DailyStaffPageProps {
  initialDate?: string;
}

export const DailyStaffPage: React.FC<DailyStaffPageProps> = ({ initialDate = '2026-09-28' }) => {
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [coverageData, setCoverageData] = useState<DayCoverageSummary | null>(null);
  const [daySummary, setDaySummary] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDailyDetails = async (dt: string) => {
    setIsLoading(true);
    try {
      const [cov, dash] = await Promise.all([
        getDayCoverageApi(dt),
        getDashboardSummaryApi(dt)
      ]);
      setCoverageData(cov);
      setDaySummary(dash);
    } catch (err) {
      console.error('Failed to load day details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyDetails(currentDate);
  }, [currentDate]);

  const changeDateBy = (days: number) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const newStr = d.toISOString().split('T')[0];
    setCurrentDate(newStr);
  };

  const dObj = new Date(currentDate + 'T00:00:00');
  const isSunday = dObj.getDay() === 0;
  const isSaturday = dObj.getDay() === 6;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Date Navigator Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-secondary text-primary">
            <CalendarClock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Daily Operations & Assignments</h2>
            <p className="text-xs text-muted-foreground">Shift times, lunch intervals, and primary/secondary tasks</p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => changeDateBy(-1)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-foreground transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="h-8 px-2.5 rounded-md border border-input bg-background text-foreground font-medium text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />

          <button
            onClick={() => changeDateBy(1)}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-foreground transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${
            isSunday
              ? 'border-indigo-800/40 bg-indigo-950/30 text-indigo-300'
              : isSaturday
              ? 'border-amber-800/40 bg-amber-950/30 text-amber-300'
              : 'border-border bg-secondary text-muted-foreground'
          }`}>
            {dObj.toLocaleDateString('en-US', { weekday: 'long' })}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Visual 8:00 AM – 6:00 PM Timeline Bar */}
          <div className="p-5 rounded-xl border border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Call Center Slot Density (8:00 AM – 6:00 PM)
              </span>
              <span className="text-xs text-muted-foreground">Target: &ge; 2 agents per slot</span>
            </div>

            <div className="grid grid-cols-6 gap-2 pt-1">
              {coverageData?.time_slots.map(slot => {
                const isGreen = slot.status === 'GREEN';
                const isYellow = slot.status === 'YELLOW';
                return (
                  <div
                    key={slot.slot_index}
                    className={`p-3 rounded-lg border text-center transition ${
                      isGreen
                        ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800/50 dark:bg-emerald-950/20'
                        : isYellow
                        ? 'border-amber-200 bg-amber-50/70 dark:border-amber-800/50 dark:bg-amber-950/20'
                        : 'border-rose-200 bg-rose-50/70 dark:border-destructive/50 dark:bg-destructive/20'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-foreground">{slot.slot_name}</p>
                    <p className={`text-lg font-bold tracking-tight my-1 ${
                      isGreen ? 'text-emerald-700 dark:text-emerald-400' : isYellow ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-destructive'
                    }`}>
                      {slot.staff_count}
                    </p>
                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isGreen
                        ? 'border border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : isYellow
                        ? 'border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300'
                        : 'border border-rose-300 bg-rose-100 text-rose-800 dark:border-destructive/60 dark:bg-destructive/50 dark:text-destructive-foreground'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Staff Working Today Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Staff Scheduled on Duty ({daySummary?.working_staff?.length || 0})</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {daySummary?.working_staff?.map((staff: any) => (
                <div
                  key={staff.id}
                  className="p-4 rounded-xl border border-border bg-card shadow-xs hover:border-border/80 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{staff.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{staff.position}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                      staff.shift_type === 'SUNDAY_DUTY'
                        ? 'border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-700/60 dark:bg-indigo-950/50 dark:text-indigo-300'
                        : staff.shift_type === 'AM_HALF'
                        ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-300'
                        : staff.shift_type === 'PM_HALF'
                        ? 'border-purple-300 bg-purple-100 text-purple-800 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300'
                        : 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}>
                      {staff.shift_type}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t border-border/60">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span><strong className="text-foreground">Hours:</strong> {staff.hours}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Coffee className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span><strong className="text-foreground">Lunch:</strong> {staff.lunch}</span>
                    </div>

                    <div className="pt-1">
                      <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                        <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold text-foreground text-[11px]">Assigned Tasks:</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pl-5">
                        {((staff.assigned_tasks && staff.assigned_tasks.length > 0)
                          ? staff.assigned_tasks
                          : [staff.primary_task, staff.secondary_task].filter(Boolean)
                        ).map((task: string) => (
                          <span
                            key={task}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border border-sky-300 bg-sky-100 text-sky-800 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-300"
                          >
                            {task}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Staff OFF Today */}
          {daySummary?.off_staff && daySummary.off_staff.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center space-x-2">
                <UserX className="w-4 h-4 text-muted-foreground" />
                <span>Staff with Scheduled Day Off ({daySummary.off_staff.length})</span>
              </h3>

              <div className="flex flex-wrap gap-2">
                {daySummary.off_staff.map((staff: any) => (
                  <span
                    key={staff.id}
                    className="inline-flex items-center space-x-2 rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-700 dark:border-border dark:bg-muted/40 dark:text-muted-foreground font-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-muted-foreground/60" />
                    <span>{staff.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
