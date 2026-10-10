import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  X,
  RotateCw,
  ArrowRight,
  ShieldAlert,
  Info,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';

export interface ConflictItem {
  id?: number;
  date?: string;
  employee_id?: number;
  employee_name?: string;
  severity: 'critical' | 'warning' | string;
  error_type: string;
  message: string;
  suggestion?: string;
}

interface ConflictInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictItem[];
  scheduleName?: string;
  onSelectConflict?: (conflict: ConflictItem) => void;
  onRefreshValidation?: () => void;
  isValidating?: boolean;
}

function formatErrorType(rawType: string): string {
  if (!rawType) return 'Constraint Conflict';
  return rawType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatDateLabel(dateStr?: string): string {
  if (!dateStr) return 'General Rule';
  if (dateStr.toLowerCase().startsWith('week')) return dateStr;
  try {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export const ConflictInspectorModal: React.FC<ConflictInspectorModalProps> = ({
  isOpen,
  onClose,
  conflicts = [],
  scheduleName = 'Active Schedule',
  onSelectConflict,
  onRefreshValidation,
  isValidating = false,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning'>('all');

  if (!isOpen) return null;

  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const warningConflicts = conflicts.filter(c => c.severity !== 'critical');

  const displayedConflicts = conflicts.filter(c => {
    if (filterSeverity === 'critical') return c.severity === 'critical';
    if (filterSeverity === 'warning') return c.severity !== 'critical';
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl ${
              criticalConflicts.length > 0
                ? 'bg-destructive/15 text-destructive border border-destructive/30'
                : warningConflicts.length > 0
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            }`}>
              {criticalConflicts.length > 0 ? (
                <ShieldAlert className="w-5 h-5" />
              ) : warningConflicts.length > 0 ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground">
                  Schedule Conflicts &amp; Validation
                </h3>
                {criticalConflicts.length > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/25 uppercase tracking-wide">
                    {criticalConflicts.length} Critical
                  </span>
                ) : null}
                {warningConflicts.length > 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/25 uppercase tracking-wide">
                    {warningConflicts.length} Warning{warningConflicts.length > 1 ? 's' : ''}
                  </span>
                ) : null}
                {conflicts.length === 0 ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 uppercase tracking-wide">
                    Verified (0 Issues)
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-md">
                {scheduleName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {onRefreshValidation && (
              <button
                type="button"
                onClick={onRefreshValidation}
                disabled={isValidating}
                title="Re-validate schedule"
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Status Banner & Filters ── */}
        <div className="px-5 py-3 border-b border-border bg-card space-y-2.5">
          {criticalConflicts.length > 0 ? (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/25 text-xs text-foreground flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">
                  Publishing is blocked by {criticalConflicts.length} critical {criticalConflicts.length === 1 ? 'conflict' : 'conflicts'}.
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Resolve the critical items below by editing shifts on the calendar. Once resolved, the schedule can be published.
                </p>
              </div>
            </div>
          ) : conflicts.length > 0 ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-foreground flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  All critical checks passed! Only {warningConflicts.length} advisory {warningConflicts.length === 1 ? 'warning remains' : 'warnings remain'}.
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  Warnings do not prevent publishing, but reviewing them ensures optimal team balance.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-foreground flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Zero Conflicts Detected
                </p>
                <p className="text-muted-foreground text-[11px] mt-0.5">
                  This schedule adheres to all operational rules: 5-staff Sunday, Saturday half-day alternation, required days off, and full skill coverage.
                </p>
              </div>
            </div>
          )}

          {/* Severity filter tabs */}
          {conflicts.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFilterSeverity('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                  filterSeverity === 'all'
                    ? 'bg-secondary text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({conflicts.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity('critical')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                  filterSeverity === 'critical'
                    ? 'bg-destructive/15 text-destructive border border-destructive/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Critical</span>
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-destructive text-destructive-foreground font-bold">
                  {criticalConflicts.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setFilterSeverity('warning')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition flex items-center gap-1 ${
                  filterSeverity === 'warning'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>Warnings</span>
                <span className="text-[10px] px-1 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                  {warningConflicts.length}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ── Conflicts List ── */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {displayedConflicts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No conflicts in this view</p>
              <p className="text-xs">Your selected filter contains zero issues.</p>
            </div>
          ) : (
            displayedConflicts.map((c, idx) => {
              const isCrit = c.severity === 'critical';
              return (
                <div
                  key={c.id || idx}
                  className={`p-4 rounded-xl border text-xs space-y-2.5 transition shadow-2xs ${
                    isCrit
                      ? 'border-destructive/35 bg-destructive/[0.04] dark:bg-destructive/[0.08]'
                      : 'border-amber-500/35 bg-amber-500/[0.04] dark:bg-amber-500/[0.08]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isCrit
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-amber-500 text-white'
                        }`}>
                          {isCrit ? (
                            <AlertOctagon className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{isCrit ? 'Critical Error' : 'Warning'}</span>
                        </span>

                        <span className="font-bold text-foreground text-xs">
                          {formatErrorType(c.error_type)}
                        </span>
                      </div>

                      {/* Meta badges: Date & Staff */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                        {c.date && (
                          <span className="inline-flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-md font-medium text-foreground">
                            <Calendar className="w-3 h-3 text-primary" />
                            <span>{formatDateLabel(c.date)}</span>
                          </span>
                        )}
                        {c.employee_name && (
                          <span className="inline-flex items-center gap-1 bg-secondary/80 px-2 py-0.5 rounded-md font-medium text-foreground">
                            <User className="w-3 h-3 text-primary" />
                            <span>{c.employee_name}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Jump Action */}
                    {onSelectConflict && c.date && (
                      <button
                        type="button"
                        onClick={() => onSelectConflict(c)}
                        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Jump to this date on the calendar to adjust shift"
                      >
                        <span>Fix on Calendar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Violation Message */}
                  <p className="text-foreground leading-relaxed font-medium">
                    {c.message}
                  </p>

                  {/* Actionable Suggestion */}
                  {c.suggestion && (
                    <div className="p-2.5 rounded-lg bg-background/80 border border-primary/20 text-[11px] text-foreground space-y-0.5">
                      <div className="font-semibold text-primary flex items-center gap-1">
                        <span>💡 How to Resolve:</span>
                      </div>
                      <p className="text-muted-foreground leading-normal">
                        {c.suggestion}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div className="px-5 py-3 border-t border-border bg-card flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            {conflicts.length > 0 ? (
              <span>Showing {displayedConflicts.length} of {conflicts.length} findings</span>
            ) : (
              <span>Ready for official roster publication</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
