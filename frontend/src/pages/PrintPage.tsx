import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  ArrowLeft, 
  RotateCw, 
  Calendar, 
  FileSpreadsheet, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Key, 
  Users, 
  Eye, 
  Settings2,
  Check
} from 'lucide-react';
import { getSchedulesApi, getScheduleApi, exportScheduleExcel } from '../api/client';
import { SchedulePeriod, ShiftAssignment } from '../types';
import { getGuzoShiftKey, getGuzoCellNotation } from '../utils/guzoKey';
import { SHIFT_KEYS, TASK_KEYS } from '../components/schedule/ShiftKeyLegendModal';

interface PrintPageProps {
  onBack: () => void;
  initialScheduleId?: number;
}

type DisplayFormat = 'notation' | 'code_time' | 'code_only' | 'simple';

export const PrintPage: React.FC<PrintPageProps> = ({ onBack, initialScheduleId }) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<SchedulePeriod | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Print View Customization Options
  const [displayFormat, setDisplayFormat] = useState<DisplayFormat>('notation');
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showTotals, setShowTotals] = useState<boolean>(true);
  const [showRules, setShowRules] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);

  // Load available schedules
  useEffect(() => {
    async function fetchSchedulesList() {
      try {
        setIsLoading(true);
        const list = await getSchedulesApi();
        setSchedules(list);

        if (list.length > 0) {
          // If initialScheduleId was provided and exists, use it; otherwise prefer the latest
          let targetId = list[0].id;
          if (initialScheduleId && list.some((s: any) => s.id === initialScheduleId)) {
            targetId = initialScheduleId;
          } else {
            // Find first published or recent
            const published = list.find((s: any) => s.status === 'published');
            if (published) targetId = published.id;
          }

          setSelectedScheduleId(targetId);
          const detail = await getScheduleApi(targetId);
          setSchedule(detail);
        }
      } catch (err) {
        console.error('Failed to load schedules for print:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSchedulesList();
  }, [initialScheduleId]);

  // Handle switching selected schedule
  const handleScheduleChange = async (newId: number) => {
    setSelectedScheduleId(newId);
    setIsSwitching(true);
    try {
      const detail = await getScheduleApi(newId);
      setSchedule(detail);
    } catch (err) {
      console.error('Failed to switch schedule:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (schedule) {
      exportScheduleExcel(schedule.id, schedule.start_date, schedule.end_date);
    }
  };

  // Group full shift objects by employee
  const empShiftsMap: { [name: string]: { [date: string]: ShiftAssignment } } = {};
  if (schedule && schedule.days) {
    schedule.days.forEach(day => {
      day.shifts.forEach(s => {
        if (!empShiftsMap[s.employee_name]) {
          empShiftsMap[s.employee_name] = {};
        }
        empShiftsMap[s.employee_name][day.date] = s;
      });
    });
  }

  // Sort staff prioritizing Rotation Leads (Hebron, Bethel/Beti) then alphabetically
  const staffNames = Object.keys(empShiftsMap).sort((a, b) => {
    const isLeadA = a.toLowerCase().includes('hebron') || a.toLowerCase().includes('bet');
    const isLeadB = b.toLowerCase().includes('hebron') || b.toLowerCase().includes('bet');
    if (isLeadA && !isLeadB) return -1;
    if (!isLeadA && isLeadB) return 1;
    return a.localeCompare(b);
  });

  const sortedDays = schedule?.days ? [...schedule.days].sort((a, b) => a.date.localeCompare(b.date)) : [];
  const daysCount = sortedDays.length;

  // Calculate daily staffing totals
  const dailyTotals: { [date: string]: { working: number; off: number; sunday: number } } = {};
  sortedDays.forEach(day => {
    let working = 0;
    let off = 0;
    let sunday = 0;
    staffNames.forEach(name => {
      const shift = empShiftsMap[name]?.[day.date];
      if (!shift || shift.shift_type === 'OFF') {
        off++;
      } else {
        working++;
        if (shift.shift_type === 'SUNDAY_DUTY') {
          sunday++;
        }
      }
    });
    dailyTotals[day.date] = { working, off, sunday };
  });

  // Render cell content based on selected display format
  const renderCellContent = (shift?: ShiftAssignment) => {
    if (!shift || shift.shift_type === 'OFF') {
      const guzo = shift ? getGuzoShiftKey(shift.start_time, shift.end_time, shift.shift_type, shift.notes) : { key: 'DO', name: 'Day Off' };
      const isLeave = guzo.key === 'A-L';
      return (
        <div className={`p-1 text-center font-mono rounded ${isLeave ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-500'}`}>
          <div className="font-bold text-[11px]">{isLeave ? 'A-L' : 'DO'}</div>
          <div className="text-[9px] opacity-75">{isLeave ? 'Leave' : 'Off'}</div>
        </div>
      );
    }

    const guzo = getGuzoShiftKey(shift.start_time, shift.end_time, shift.shift_type, shift.notes);
    const notation = getGuzoCellNotation(shift);
    const timeStr = shift.start_time && shift.end_time ? `${shift.start_time}–${shift.end_time}` : '';

    let bgClass = 'bg-emerald-50/80 text-emerald-950 border-emerald-300';
    if (shift.shift_type === 'AM_HALF') {
      bgClass = 'bg-amber-50/90 text-amber-950 border-amber-300';
    } else if (shift.shift_type === 'PM_HALF') {
      bgClass = 'bg-purple-50/90 text-purple-950 border-purple-300';
    } else if (shift.shift_type === 'SUNDAY_DUTY') {
      bgClass = 'bg-indigo-50/90 text-indigo-950 border-indigo-300';
    }

    if (displayFormat === 'simple') {
      const label = shift.shift_type === 'AM_HALF' ? 'AM' 
        : shift.shift_type === 'PM_HALF' ? 'PM' 
        : shift.shift_type === 'SUNDAY_DUTY' ? 'SUN' 
        : 'WORK';
      return (
        <div className={`p-1.5 text-center font-bold text-[11px] rounded ${bgClass}`}>
          {label}
        </div>
      );
    }

    if (displayFormat === 'code_only') {
      return (
        <div className={`p-1 text-center font-mono font-black text-xs rounded ${bgClass}`}>
          {guzo.key}
        </div>
      );
    }

    if (displayFormat === 'code_time') {
      return (
        <div className={`p-1 text-center rounded ${bgClass}`}>
          <div className="font-mono font-bold text-[11px] leading-tight">{guzo.key}</div>
          <div className="font-mono text-[9px] opacity-80 mt-0.5">{timeStr}</div>
        </div>
      );
    }

    // Default: 'notation' (Guzo Full Notation — E-M: C/ELMS, M-M: E/T/C-BKP, etc.)
    return (
      <div className={`p-1 text-center rounded ${bgClass} flex flex-col justify-between min-h-[44px]`}>
        <div className="flex items-center justify-center gap-1 font-mono leading-none">
          <span className="font-black text-[11px]">{guzo.key}</span>
        </div>
        <div className="font-mono font-bold text-[9.5px] truncate px-0.5 mt-0.5 bg-black/5 dark:bg-white/10 rounded">
          {notation}
        </div>
        <div className="font-mono text-[8.5px] opacity-75 mt-0.5 leading-none">
          {timeStr}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Control Header Bar (Hidden during window.print) ── */}
      <div className="no-print space-y-4 p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-sm">
        {/* Top row: Navigation, Schedule Selector & Primary Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onBack}
              className="flex items-center space-x-1.5 h-9 px-3 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground text-xs font-semibold border border-border transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Schedule Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Schedule:</span>
              <select
                value={selectedScheduleId || ''}
                onChange={(e) => handleScheduleChange(Number(e.target.value))}
                className="h-9 px-3 rounded-lg bg-background border border-input text-foreground text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring transition cursor-pointer max-w-[260px] sm:max-w-none truncate"
              >
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_date} to {s.end_date}) — {s.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={handleExport}
              title="Export Formatted 5-Sheet Excel Workbook"
              className="flex items-center space-x-1.5 h-9 px-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-semibold transition hover:bg-emerald-100 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-2 h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Schedule</span>
            </button>
          </div>
        </div>

        {/* Second row: Format Selector & Print Content Toggles */}
        <div className="pt-3 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          {/* Format Picker */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-muted-foreground font-medium shrink-0 mr-1">Roster Cell Style:</span>
            <button
              type="button"
              onClick={() => setDisplayFormat('notation')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                displayFormat === 'notation'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent text-foreground border-input'
              }`}
            >
              Guzo Notation (E-M: C/ELMS)
            </button>
            <button
              type="button"
              onClick={() => setDisplayFormat('code_time')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                displayFormat === 'code_time'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent text-foreground border-input'
              }`}
            >
              Code + Hours
            </button>
            <button
              type="button"
              onClick={() => setDisplayFormat('code_only')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                displayFormat === 'code_only'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent text-foreground border-input'
              }`}
            >
              Code Only
            </button>
            <button
              type="button"
              onClick={() => setDisplayFormat('simple')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition cursor-pointer ${
                displayFormat === 'simple'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent text-foreground border-input'
              }`}
            >
              Simple (WORK/OFF)
            </button>
          </div>

          {/* Toggle Checkboxes */}
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showLegend}
                onChange={(e) => setShowLegend(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium text-foreground">Shift Legend</span>
            </label>

            <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showTotals}
                onChange={(e) => setShowTotals(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium text-foreground">Daily Staff Totals</span>
            </label>

            <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRules}
                onChange={(e) => setShowRules(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium text-foreground">Operating Rules</span>
            </label>

            <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showSignatures}
                onChange={(e) => setShowSignatures(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary w-3.5 h-3.5"
              />
              <span className="text-[11px] font-medium text-foreground">Sign-Off Lines</span>
            </label>
          </div>
        </div>
      </div>

      {/* ── Document Container ── */}
      {isLoading || isSwitching ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl bg-card border border-border p-8 space-y-3">
          <RotateCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading schedule document...</p>
        </div>
      ) : !schedule ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-border">
          <p className="text-sm font-semibold text-muted-foreground">No schedule found to display.</p>
        </div>
      ) : (
        <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 font-sans print-page transition">
          {/* Header Banner */}
          <div className="border-b-2 border-slate-900 pb-4 mb-5 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-widest text-primary uppercase bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Customer Operations
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Guzo Go Roster
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">
                {schedule.name || 'CALL CENTER OPERATIONS ROSTER'}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                Schedule Period: <strong className="text-slate-950">{schedule.start_date} to {schedule.end_date}</strong> ({daysCount} Days)
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-600 space-y-1 shrink-0">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{schedule.status}</span>
              </div>
              <p className="text-[11px]">Date Generated: <span className="font-semibold text-slate-900">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></p>
              <p className="font-mono text-[11px] text-slate-500">Ref: CC-ROSTER-{schedule.id}</p>
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto mb-5 border border-slate-300 rounded-xl shadow-xs">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-300">
                  <th className="border-r border-slate-300 p-2.5 text-left font-bold text-slate-950 min-w-[130px] w-36">
                    <div>Staff Member</div>
                    <div className="text-[10px] text-slate-500 font-normal">{staffNames.length} Active Agents</div>
                  </th>
                  {sortedDays.map((day) => {
                    const d = new Date(day.date + 'T00:00:00');
                    const isSat = d.getDay() === 6;
                    const isSun = d.getDay() === 0;
                    return (
                      <th
                        key={day.date}
                        className={`border-r border-slate-300 p-1.5 text-center font-bold last:border-r-0 ${
                          isSun ? 'bg-indigo-50/80 text-indigo-950' : isSat ? 'bg-amber-50/80 text-amber-950' : 'bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] uppercase tracking-wide">
                          {d.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600 font-medium">
                          {d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {staffNames.map((name, index) => {
                  const isLead = name.toLowerCase().includes('hebron') || name.toLowerCase().includes('bet');
                  return (
                    <tr
                      key={name}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                    >
                      <td className="border-r border-slate-300 p-2 font-bold text-slate-950 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span>{name}</span>
                          {isLead && (
                            <span className="text-[9px] font-extrabold uppercase px-1 py-0.2 rounded bg-sky-100 text-sky-800 border border-sky-300">
                              Lead
                            </span>
                          )}
                        </div>
                      </td>
                      {sortedDays.map((day) => {
                        const shift = empShiftsMap[name]?.[day.date];
                        return (
                          <td
                            key={day.date}
                            className="border-r border-slate-300 p-1 text-center align-middle last:border-r-0"
                          >
                            {renderCellContent(shift)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>

              {/* Daily Staffing Totals Summary Row */}
              {showTotals && (
                <tfoot>
                  <tr className="bg-slate-100/90 border-t-2 border-slate-400 text-[10px] font-bold text-slate-800">
                    <td className="border-r border-slate-300 p-2 font-extrabold text-slate-950 uppercase tracking-wider">
                      Daily Staff
                    </td>
                    {sortedDays.map((day) => {
                      const totals = dailyTotals[day.date];
                      const d = new Date(day.date + 'T00:00:00');
                      const isSun = d.getDay() === 0;
                      return (
                        <td
                          key={day.date}
                          className={`border-r border-slate-300 p-1 text-center font-mono leading-tight last:border-r-0 ${
                            isSun ? 'bg-indigo-50/90 text-indigo-950' : ''
                          }`}
                        >
                          <div className="text-emerald-800 font-extrabold">{totals?.working || 0} Work</div>
                          <div className="text-slate-500 font-medium">{totals?.off || 0} Off</div>
                          {isSun && (
                            <div className="text-[9px] font-black text-indigo-700 mt-0.5">
                              Sun Squad: {totals?.sunday || totals?.working || 0}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Schedule Key & Legend Box */}
          {showLegend && (
            <div className="border border-slate-300 rounded-xl p-3.5 mb-4 bg-slate-50/70 text-[10.5px] space-y-3">
              <div className="flex items-center space-x-1.5 text-slate-950 font-bold uppercase tracking-wider text-xs border-b border-slate-200 pb-1.5">
                <Key className="w-3.5 h-3.5 text-primary" />
                <span>Guzo Go Schedule Key & Reference Legend</span>
              </div>

              {/* Shift Codes */}
              <div>
                <p className="font-semibold text-slate-800 mb-1.5 uppercase text-[10px]">Shift Codes & Working Windows:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 text-center font-mono">
                  {SHIFT_KEYS.map((k) => (
                    <div key={k.key} className="p-1.5 rounded border border-slate-300 bg-white">
                      <div className="font-black text-xs text-slate-950">{k.key}</div>
                      <div className="text-[9.5px] font-sans font-semibold text-slate-700 truncate">{k.standsFor}</div>
                      <div className="text-[8.5px] text-slate-500 mt-0.5">{k.time}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Codes */}
              <div>
                <p className="font-semibold text-slate-800 mb-1.5 uppercase text-[10px]">Task & Channel Abbreviations:</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 text-center">
                  {TASK_KEYS.map((t) => (
                    <div key={t.key} className="p-1 rounded border border-slate-300 bg-white">
                      <span className="font-mono font-bold text-xs text-slate-950 block">{t.key}</span>
                      <span className="text-[9px] text-slate-600 block truncate">{t.standsFor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Operational Rules Notes */}
          {showRules && (
            <div className="text-[10px] text-slate-700 border border-slate-300 p-3 rounded-xl mb-5 space-y-1 bg-white">
              <p className="font-bold text-slate-950 uppercase tracking-wider flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Standard Operating Shift Guidelines & Compliance Rules:</span>
              </p>
              <p>1. <strong>Saturday Rotation:</strong> Lead agents (Hebron and Bethel) strictly alternate Morning Half Day (08:00–12:00) and Afternoon Half Day (13:00–17:00 / 14:00–18:00).</p>
              <p>2. <strong>Sunday Duty Squad:</strong> Exactly 4 to 5 staff work Sunday duty in the office. Staff working Sunday receive compensatory Monday OFF.</p>
              <p>3. <strong>Continuous Lunch Coverage:</strong> Lunch breaks (12:00–13:00 and 13:00–14:00) are staggered to maintain continuous telephone and chat coverage.</p>
              <p>4. <strong>Shift Exchanges:</strong> Mutual shift swaps must be submitted and approved by the Call Center Operations Manager at least 24 hours in advance.</p>
            </div>
          )}

          {/* Signatures Footer */}
          {showSignatures && (
            <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-xs">
              <div>
                <p className="text-slate-600 font-semibold">Prepared By (Call Center Operations Manager):</p>
                <div className="h-10 border-b border-slate-400 w-56 mt-2"></div>
                <div className="flex justify-between w-56 text-[10px] text-slate-500 mt-1">
                  <span>Signature</span>
                  <span>Date</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <p className="text-slate-600 font-semibold">Approved By (Department Director):</p>
                <div className="h-10 border-b border-slate-400 w-56 mt-2"></div>
                <div className="flex justify-between w-56 text-[10px] text-slate-500 mt-1">
                  <span>Signature</span>
                  <span>Date</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
