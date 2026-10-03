import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  ShieldAlert,
  ShieldX,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Calendar,
  Clock,
  Filter,
  Zap,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { getSchedulesApi, getScheduleCoverageMatrixApi } from '../api/client';

// ─── Types ───────────────────────────────────────────────────
interface SlotData {
  slot_index: number;
  slot_name: string;
  start_time: string;
  end_time: string;
  staff_count: number;
  target_count: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  staff_names: string[];
  is_peak: boolean;
  fill_pct: number;
}

interface DayStats {
  green_slots: number;
  yellow_slots: number;
  red_slots: number;
  total_slots: number;
  coverage_score: number;
  total_active_staff: number;
}

interface ChannelData {
  channel: string;
  available_staff_count: number;
  target_count: number;
  status: string;
  staff_names: string[];
}

interface DayRow {
  date: string;
  day_of_week: number;
  day_name: string;
  is_weekend: boolean;
  time_slots: SlotData[];
  channels: ChannelData[];
  day_stats: DayStats;
}

interface MatrixSummary {
  overall_score: number;
  total_green: number;
  total_yellow: number;
  total_red: number;
  total_cells: number;
  worst_day: string | null;
  best_day: string | null;
  avg_agents_per_slot: number;
  gap_days: { date: string; day_name: string; red_count: number }[];
  total_days: number;
}

interface MatrixResponse {
  schedule_id: number;
  schedule_name: string;
  start_date: string;
  end_date: string;
  status: string;
  summary: MatrixSummary;
  days: DayRow[];
}

// ─── Helpers ─────────────────────────────────────────────────
const SLOT_HEADERS = ['8:00–9:00', '9:00–12:00', '12:00–1:00', '1:00–2:00', '2:00–5:00', '5:00–6:00'];

function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function scoreRingColor(score: number): string {
  if (score >= 85) return 'stroke-emerald-500';
  if (score >= 60) return 'stroke-amber-500';
  return 'stroke-rose-500';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Circular Score Ring ────────────────────────────────────
const ScoreRing: React.FC<{ score: number; size?: number; strokeWidth?: number; label?: string }> = ({
  score, size = 80, strokeWidth = 6, label
}) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          className="stroke-border/40" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          className={scoreRingColor(score)}
          strokeWidth={strokeWidth}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${scoreColor(score)}`}>{score}%</span>
        {label && <span className="text-[9px] text-muted-foreground font-medium">{label}</span>}
      </div>
    </div>
  );
};

// ─── Mini Fill Bar ──────────────────────────────────────────
const FillBar: React.FC<{ pct: number; status: string }> = ({ pct, status }) => {
  const bg = status === 'GREEN'
    ? 'bg-emerald-400 dark:bg-emerald-500'
    : status === 'YELLOW'
    ? 'bg-amber-400 dark:bg-amber-500'
    : 'bg-rose-400 dark:bg-rose-500';
  return (
    <div className="w-full h-1 rounded-full bg-border/30 mt-1 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${bg}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

// ─── Coverage Cell Tooltip ──────────────────────────────────
const CoverageCell: React.FC<{ slot: SlotData; compact: boolean }> = ({ slot, compact }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const statusStyles = {
    GREEN: 'border-emerald-300/80 bg-gradient-to-b from-emerald-50 to-emerald-100/60 text-emerald-900 dark:border-emerald-700/50 dark:from-emerald-950/50 dark:to-emerald-950/30 dark:text-emerald-300',
    YELLOW: 'border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-100/60 text-amber-900 dark:border-amber-700/50 dark:from-amber-950/50 dark:to-amber-950/30 dark:text-amber-300',
    RED: 'border-rose-300/80 bg-gradient-to-b from-rose-50 to-rose-100/60 text-rose-900 dark:border-rose-700/50 dark:from-rose-950/50 dark:to-rose-950/30 dark:text-rose-300',
  };

  const iconMap = {
    GREEN: <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />,
    YELLOW: <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />,
    RED: <ShieldX className="w-3 h-3 text-rose-600 dark:text-rose-400" />,
  };

  return (
    <td className="py-1.5 px-1.5 border-r border-border/40 text-center relative">
      <div
        className={`py-2 px-2 rounded-lg border transition-all duration-200 hover:scale-[1.03] hover:shadow-md cursor-default ${statusStyles[slot.status]}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center justify-center gap-1 mb-0.5">
          {iconMap[slot.status]}
          <span className="font-bold text-xs">
            {slot.staff_count}
          </span>
          <span className="text-[10px] opacity-70">/ {slot.target_count}</span>
        </div>
        {!compact && (
          <span
            className="text-[10px] font-medium block opacity-90 truncate max-w-[110px] mx-auto"
            title={slot.staff_names.join(', ')}
          >
            {slot.staff_names.length > 0 ? slot.staff_names.join(', ') : '—'}
          </span>
        )}
        <FillBar pct={slot.fill_pct} status={slot.status} />
      </div>

      {/* Tooltip */}
      {showTooltip && slot.staff_names.length > 0 && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-lg bg-popover border border-border shadow-lg text-left animate-fade-in pointer-events-none">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Agents ({slot.staff_count})
          </p>
          {slot.staff_names.map((name, i) => (
            <div key={i} className="flex items-center gap-1.5 py-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span className="text-xs text-foreground font-medium">{name}</span>
            </div>
          ))}
          {slot.is_peak && (
            <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/50">
              <Zap className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Peak Hour</span>
            </div>
          )}
        </div>
      )}
    </td>
  );
};

// ─── Day Score Badge ────────────────────────────────────────
const DayScoreBadge: React.FC<{ stats: DayStats }> = ({ stats }) => {
  const s = stats.coverage_score;
  const bg = s >= 85
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
    : s >= 60
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400';
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${bg}`}>
      {s}%
    </span>
  );
};


// ═══════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export const CoveragePage: React.FC = () => {
  const [schedulesList, setSchedulesList] = useState<any[]>([]);
  const [activeScheduleId, setActiveScheduleId] = useState<number | null>(null);
  const [matrixResp, setMatrixResp] = useState<MatrixResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // View controls
  const [compactMode, setCompactMode] = useState(false);
  const [dayFilter, setDayFilter] = useState<'all' | 'weekday' | 'weekend' | 'problems'>('all');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showChannels, setShowChannels] = useState(false);

  // Data
  const matrixData = matrixResp?.days || [];
  const summary = matrixResp?.summary || null;

  const fetchSchedules = async () => {
    try {
      const list = await getSchedulesApi();
      setSchedulesList(list);
      if (list.length > 0 && !activeScheduleId) {
        setActiveScheduleId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to load schedules:', err);
    }
  };

  const fetchMatrix = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await getScheduleCoverageMatrixApi(id);
      // Handle both old-format (array) and new-format (object with .days)
      if (Array.isArray(data)) {
        setMatrixResp({
          schedule_id: id,
          schedule_name: '',
          start_date: '',
          end_date: '',
          status: '',
          summary: {
            overall_score: 0,
            total_green: 0,
            total_yellow: 0,
            total_red: 0,
            total_cells: 0,
            worst_day: null,
            best_day: null,
            avg_agents_per_slot: 0,
            gap_days: [],
            total_days: data.length,
          },
          days: data,
        });
      } else {
        setMatrixResp(data as MatrixResponse);
      }
    } catch (err) {
      console.error('Failed to load coverage matrix:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);
  useEffect(() => { if (activeScheduleId) fetchMatrix(activeScheduleId); }, [activeScheduleId]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    if (!matrixData.length) return [];
    switch (dayFilter) {
      case 'weekday': return matrixData.filter(r => !r.is_weekend);
      case 'weekend': return matrixData.filter(r => r.is_weekend);
      case 'problems': return matrixData.filter(r => r.day_stats?.red_slots > 0 || r.day_stats?.yellow_slots > 0);
      default: return matrixData;
    }
  }, [matrixData, dayFilter]);

  // Slot-column aggregates
  const slotAggregates = useMemo(() => {
    if (!matrixData.length) return [];
    const slotsCount = matrixData[0]?.time_slots?.length || 6;
    const agg = Array.from({ length: slotsCount }, () => ({ green: 0, yellow: 0, red: 0, total: 0, sumStaff: 0 }));
    matrixData.forEach(row => {
      row.time_slots?.forEach((slot: SlotData, idx: number) => {
        if (!agg[idx]) return;
        agg[idx].total++;
        agg[idx].sumStaff += slot.staff_count;
        if (slot.status === 'GREEN') agg[idx].green++;
        else if (slot.status === 'YELLOW') agg[idx].yellow++;
        else agg[idx].red++;
      });
    });
    return agg;
  }, [matrixData]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Header Bar ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight">Coverage Matrix</h2>
            <p className="text-xs text-muted-foreground">Real-time capacity heatmap &amp; gap analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Day filter */}
          <div className="flex items-center rounded-lg border border-input bg-background overflow-hidden text-[11px] font-medium">
            {(['all', 'weekday', 'weekend', 'problems'] as const).map(f => (
              <button key={f} onClick={() => setDayFilter(f)}
                className={`px-2.5 py-1.5 transition capitalize ${dayFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {f === 'problems' ? '⚠ Gaps' : f}
              </button>
            ))}
          </div>

          {/* Compact toggle */}
          <button onClick={() => setCompactMode(!compactMode)}
            className="h-8 px-2.5 rounded-md border border-input bg-background text-muted-foreground hover:text-foreground transition text-xs flex items-center gap-1"
            title={compactMode ? 'Show names' : 'Compact view'}
          >
            {compactMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Channel toggle */}
          <button onClick={() => setShowChannels(!showChannels)}
            className={`h-8 px-2.5 rounded-md border text-xs flex items-center gap-1 transition ${
              showChannels
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Channels</span>
          </button>

          {/* Schedule selector */}
          <select
            value={activeScheduleId || ''}
            onChange={(e) => setActiveScheduleId(Number(e.target.value))}
            className="h-8 px-2.5 rounded-md border border-input bg-background text-foreground font-medium text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring max-w-[220px]"
          >
            {schedulesList.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Summary Stats Cards ──────────────────────────────── */}
      {summary && summary.total_days > 0 && !isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Overall Score */}
          <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-4">
            <ScoreRing score={summary.overall_score} size={64} strokeWidth={5} />
            <div>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Coverage Score</p>
              <p className={`text-xl font-bold ${scoreColor(summary.overall_score)}`}>
                {summary.overall_score >= 85 ? 'Healthy' : summary.overall_score >= 60 ? 'At Risk' : 'Critical'}
              </p>
            </div>
          </div>

          {/* Green cells */}
          <div className="p-4 rounded-xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-card dark:border-emerald-800/30 dark:from-emerald-950/20 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40"><Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <span className="text-[11px] text-muted-foreground font-semibold uppercase">Covered</span>
            </div>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{summary.total_green}</p>
            <p className="text-[10px] text-muted-foreground">of {summary.total_cells} slots</p>
          </div>

          {/* Yellow cells */}
          <div className="p-4 rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-card dark:border-amber-800/30 dark:from-amber-950/20 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/40"><ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" /></div>
              <span className="text-[11px] text-muted-foreground font-semibold uppercase">Limited</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.total_yellow}</p>
            <p className="text-[10px] text-muted-foreground">single-agent slots</p>
          </div>

          {/* Red cells */}
          <div className="p-4 rounded-xl border border-rose-200/60 bg-gradient-to-br from-rose-50/50 to-card dark:border-rose-800/30 dark:from-rose-950/20 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-md bg-rose-100 dark:bg-rose-900/40"><ShieldX className="w-4 h-4 text-rose-600 dark:text-rose-400" /></div>
              <span className="text-[11px] text-muted-foreground font-semibold uppercase">Gaps</span>
            </div>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">{summary.total_red}</p>
            <p className="text-[10px] text-muted-foreground">critical gaps</p>
          </div>
        </div>
      )}

      {/* ── Legend ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-lg border border-emerald-300/60 bg-emerald-50/60 dark:border-emerald-800/30 dark:bg-emerald-950/15 flex items-center space-x-2.5 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">GREEN — Adequate</span>
            <p className="text-[10px] text-muted-foreground">&ge; 2 agents active</p>
          </div>
        </div>
        <div className="p-3 rounded-lg border border-amber-300/60 bg-amber-50/60 dark:border-amber-800/30 dark:bg-amber-950/15 flex items-center space-x-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">YELLOW — Limited</span>
            <p className="text-[10px] text-muted-foreground">Only 1 agent on duty</p>
          </div>
        </div>
        <div className="p-3 rounded-lg border border-rose-300/60 bg-rose-50/60 dark:border-rose-800/30 dark:bg-rose-950/15 flex items-center space-x-2.5 shadow-xs">
          <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <div>
            <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">RED — Gap</span>
            <p className="text-[10px] text-muted-foreground">0 agents — critical risk</p>
          </div>
        </div>
      </div>

      {/* ── Matrix Table ──────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <RotateCw className="w-6 h-6 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground">Loading coverage data…</p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-2 text-muted-foreground">
          <Info className="w-8 h-8 opacity-40" />
          <p className="text-sm font-medium">No data for the selected filter</p>
          <button onClick={() => setDayFilter('all')} className="text-xs text-primary underline">Show all days</button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* ── Head ─ */}
              <thead>
                <tr className="bg-gradient-to-r from-secondary/60 to-secondary/30 border-b border-border text-[11px] text-muted-foreground">
                  <th className="py-3 px-3 font-semibold uppercase tracking-wider w-44 border-r border-border">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Date &amp; Day
                    </div>
                  </th>
                  {SLOT_HEADERS.map((slot, i) => (
                    <th key={slot} className="py-3 px-2 text-center border-r border-border/60 font-semibold text-foreground min-w-[120px]">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 opacity-50" />
                        {slot}
                      </div>
                      {/* Column aggregate bar */}
                      {slotAggregates[i] && (
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">{slotAggregates[i].green}</span>
                          <span className="text-[9px] text-border">/</span>
                          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold">{slotAggregates[i].yellow}</span>
                          <span className="text-[9px] text-border">/</span>
                          <span className="text-[9px] text-rose-600 dark:text-rose-400 font-bold">{slotAggregates[i].red}</span>
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="py-3 px-2 text-center font-semibold text-foreground w-16">
                    Score
                  </th>
                </tr>
              </thead>

              {/* ── Body ─ */}
              <tbody className="divide-y divide-border/40">
                {filteredRows.map((row, idx) => {
                  const isSunday = row.day_of_week === 6;
                  const isSaturday = row.day_of_week === 5;
                  const isExpanded = expandedDay === row.date;
                  const hasIssue = row.day_stats?.red_slots > 0;

                  return (
                    <React.Fragment key={row.date}>
                      <tr
                        className={`group transition cursor-pointer ${
                          isSunday
                            ? 'bg-indigo-50/40 dark:bg-indigo-950/15 hover:bg-indigo-100/50 dark:hover:bg-indigo-950/30'
                            : isSaturday
                            ? 'bg-amber-50/30 dark:bg-amber-950/10 hover:bg-amber-100/40 dark:hover:bg-amber-950/20'
                            : idx % 2 === 0
                            ? 'bg-card hover:bg-accent/30'
                            : 'bg-card/60 hover:bg-accent/30'
                        } ${hasIssue ? 'ring-1 ring-inset ring-rose-200/60 dark:ring-rose-900/30' : ''}`}
                        onClick={() => setExpandedDay(isExpanded ? null : row.date)}
                      >
                        {/* Date */}
                        <td className="py-2.5 px-3 border-r border-border/40">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="block text-xs font-bold text-foreground tracking-tight">
                                {formatDate(row.date)}
                              </span>
                              <span className={`text-[11px] font-semibold ${
                                isSunday ? 'text-indigo-600 dark:text-indigo-400'
                                  : isSaturday ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-muted-foreground'
                              }`}>
                                {row.day_name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {row.day_stats && <DayScoreBadge stats={row.day_stats} />}
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                                : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                              }
                            </div>
                          </div>
                        </td>

                        {/* Slots */}
                        {row.time_slots?.map((slot: SlotData) => (
                          <CoverageCell key={slot.slot_index} slot={slot} compact={compactMode} />
                        ))}

                        {/* Day score column */}
                        <td className="py-2 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs font-bold text-foreground">{row.day_stats?.total_active_staff || 0}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded channel view */}
                      {isExpanded && row.channels && row.channels.length > 0 && (
                        <tr className="bg-accent/20 dark:bg-accent/10">
                          <td colSpan={SLOT_HEADERS.length + 2} className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              <BarChart3 className="w-3.5 h-3.5 text-primary" />
                              <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
                                Channel Coverage — {formatDate(row.date)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
                              {row.channels.map((ch: ChannelData) => (
                                <div key={ch.channel}
                                  className={`p-2 rounded-lg border text-center text-[10px] font-medium transition ${
                                    ch.status === 'GREEN'
                                      ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                                      : ch.status === 'YELLOW'
                                      ? 'border-amber-200 bg-amber-50/50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300'
                                      : 'border-rose-200 bg-rose-50/50 text-rose-800 dark:border-rose-800/40 dark:bg-rose-950/20 dark:text-rose-300'
                                  }`}
                                >
                                  <span className="block font-bold text-xs truncate">{ch.channel}</span>
                                  <span className="block mt-0.5">{ch.available_staff_count} / {ch.target_count}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>

              {/* ── Footer summary ─ */}
              {slotAggregates.length > 0 && (
                <tfoot>
                  <tr className="bg-secondary/30 border-t-2 border-border text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    <td className="py-2.5 px-3 border-r border-border">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        Totals ({filteredRows.length} days)
                      </span>
                    </td>
                    {slotAggregates.map((agg, i) => (
                      <td key={i} className="py-2.5 px-2 text-center border-r border-border/40">
                        <div className="flex items-center justify-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{agg.green}</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                          <span>{agg.yellow}</span>
                          <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                          <span>{agg.red}</span>
                        </div>
                      </td>
                    ))}
                    <td className="py-2.5 px-2 text-center">
                      {summary && (
                        <span className={`font-bold text-xs ${scoreColor(summary.overall_score)}`}>
                          {summary.overall_score}%
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* ── Channel Coverage Section (toggleable) ────────────── */}
      {showChannels && !isLoading && matrixData.length > 0 && matrixData[0]?.channels && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Channel Coverage Overview</h3>
            <span className="text-[10px] text-muted-foreground">(latest day snapshot)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {matrixData[matrixData.length - 1].channels.map((ch: ChannelData) => (
              <div key={ch.channel}
                className={`p-3 rounded-xl border text-center transition hover:shadow-md ${
                  ch.status === 'GREEN'
                    ? 'border-emerald-200 bg-gradient-to-b from-emerald-50 to-card dark:border-emerald-800/40 dark:from-emerald-950/20'
                    : ch.status === 'YELLOW'
                    ? 'border-amber-200 bg-gradient-to-b from-amber-50 to-card dark:border-amber-800/40 dark:from-amber-950/20'
                    : 'border-rose-200 bg-gradient-to-b from-rose-50 to-card dark:border-rose-800/40 dark:from-rose-950/20'
                }`}
              >
                <span className="block text-xs font-bold text-foreground mb-1 truncate">{ch.channel}</span>
                <span className={`text-xl font-bold ${
                  ch.status === 'GREEN' ? 'text-emerald-600 dark:text-emerald-400'
                    : ch.status === 'YELLOW' ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {ch.available_staff_count}
                </span>
                <span className="text-[10px] text-muted-foreground block">/ {ch.target_count} target</span>
                <div className="mt-1.5 flex flex-wrap justify-center gap-0.5">
                  {ch.staff_names.slice(0, 3).map((n, i) => (
                    <span key={i} className="inline-block px-1 py-0.5 rounded text-[9px] bg-secondary text-muted-foreground">{n}</span>
                  ))}
                  {ch.staff_names.length > 3 && (
                    <span className="inline-block px-1 py-0.5 rounded text-[9px] bg-secondary text-muted-foreground">
                      +{ch.staff_names.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Gap Alert Banner ─────────────────────────────────── */}
      {summary && summary.gap_days && summary.gap_days.length > 0 && !isLoading && (
        <div className="p-3.5 rounded-xl border border-rose-200/60 bg-gradient-to-r from-rose-50/60 to-card dark:border-rose-800/30 dark:from-rose-950/15 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldX className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">Coverage Gaps Detected</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.gap_days.map((g) => (
              <button key={g.date}
                onClick={() => { setDayFilter('all'); setExpandedDay(g.date); }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-800/40 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 transition text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                <AlertOctagon className="w-3 h-3" />
                {formatDate(g.date)} ({g.day_name}) — {g.red_count} gap{g.red_count > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
