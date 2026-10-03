import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  Calendar, 
  Clock, 
  Check, 
  ArrowRight,
  ShieldAlert,
  Save,
  Send
} from 'lucide-react';
import { generateScheduleApi, publishScheduleApi } from '../../api/client';
import { ValidationResult } from '../../types';

interface ScheduleGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (scheduleId: number) => void;
}

export const ScheduleGeneratorModal: React.FC<ScheduleGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [startDate, setStartDate] = useState<string>('2026-10-05');
  const [durationWeeks, setDurationWeeks] = useState<number>(2);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [showIssuesTab, setShowIssuesTab] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePreview = async () => {
    setIsGenerating(true);
    setSaveMessage(null);
    try {
      const res = await generateScheduleApi({
        start_date: startDate,
        duration_weeks: Number(durationWeeks),
        schedule_type: 'Standard',
        preview_only: true
      });
      setPreviewResult(res);
      if (res.validation?.critical_errors > 0) {
        setShowIssuesTab(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to generate preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCommit = async (shouldPublish: boolean) => {
    setIsGenerating(true);
    try {
      const res = await generateScheduleApi({
        start_date: startDate,
        duration_weeks: Number(durationWeeks),
        schedule_type: 'Standard',
        preview_only: false
      });

      if (shouldPublish) {
        await publishScheduleApi(res.id);
      }

      onSuccess(res.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save schedule');
    } finally {
      setIsGenerating(false);
    }
  };

  const val: ValidationResult = previewResult?.validation;
  const criticalCount = val?.critical_errors || 0;
  const warningCount = val?.warnings || 0;
  const canPublish = previewResult && criticalCount === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground tracking-tight">Constraint-Based Schedule Generator</h2>
              <p className="text-xs text-muted-foreground">Generates conflict-free call center rosters adhering to all staffing rules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Form Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-border">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Start Date (Monday Recommended)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                Schedule Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 4].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setDurationWeeks(w)}
                    className={`h-9 px-3 rounded-lg text-xs font-medium border transition ${
                      durationWeeks === w
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-secondary text-secondary-foreground border-border hover:bg-accent'
                    }`}
                  >
                    {w} {w === 1 ? 'Week' : 'Weeks'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Operational Rules Summary Card */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/[0.03] text-xs space-y-2">
            <span className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Active System Constraints Enforced:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-muted-foreground text-[11px] leading-relaxed">
              <div>&bull; <strong>Hebron &amp; Beti</strong>: Rotation leads with 1.5 days off (Saturday AM/PM alternation).</div>
              <div>&bull; <strong>Sunday Alternation</strong>: Bi-weekly lead rotation (worker gets Monday OFF).</div>
              <div>&bull; <strong>Sunday Squad</strong>: Exactly 5 staff on duty; 2–3 get Monday recovery OFF.</div>
              <div>&bull; <strong>Feruza</strong>: 1.5 days off, tied to Beti Saturday/Sunday schedule.</div>
              <div>&bull; <strong>Early Morning (08:00)</strong>: Hebron Mon–Fri always; Shalom, Rediet, Tirsit always.</div>
              <div>&bull; <strong>Yordi &amp; Obsa</strong>: Work Monday–Saturday; strictly Sunday DAY OFF.</div>
              <div>&bull; <strong>Rest of Staff</strong>: Standard 2 full days off per week.</div>
              <div>&bull; <strong>GDS Tasks</strong>: Telegram/ELMS/Q/E reserved for GDS staff; Yabsera N excluded from Telegram.</div>
              <div>&bull; <strong>2839 &amp; Follow-up</strong>: Rotated with Luam, Obsa, Yordi, Beti, Shalom, Yabsera N.</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePreview}
              disabled={isGenerating}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs shadow-sm flex items-center space-x-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Computing Constraints...' : 'Generate & Validate Preview'}</span>
            </button>
          </div>

          {/* Preview & Validation Results */}
          {previewResult && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                  <span>Pre-Publish Validation Check</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    ({previewResult.start_date} to {previewResult.end_date})
                  </span>
                </h3>

                <div className="flex items-center space-x-2">
                  {criticalCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-destructive/15 border border-destructive/30 text-destructive-foreground text-xs font-semibold flex items-center space-x-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      <span>{criticalCount} Critical {criticalCount === 1 ? 'Error' : 'Errors'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero Critical Errors</span>
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{warningCount} Warnings</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 7-Point Constraint Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: 'staff_count_configured', label: '12 Employees Configured & Profiled' },
                  { key: 'sunday_staffing_valid', label: 'Sunday Squad (Exact 5 Staff, Bi-weekly Lead, Monday Off)' },
                  { key: 'saturday_rotation_valid', label: 'Saturday Half-Day Alternation (Week A/B, Feruza Tied)' },
                  { key: 'days_off_valid', label: 'Days Off Policy (1.5 Days for Leads/Feruza, 2 Days for Rest)' },
                  { key: 'early_morning_valid', label: 'Early Morning (08:00) for Hebron & Shalom/Rediet/Tirsit' },
                  { key: 'gds_capability_valid', label: 'GDS Task Policy & Telegram (Yabsera N Excluded)' },
                  { key: 'call_center_coverage_valid', label: 'Call Center Coverage (All 6 Daily Time Slots)' },
                ].map(item => {
                  const passed = val?.checklist ? (val.checklist as any)[item.key] : true;
                  return (
                    <div
                      key={item.key}
                      className={`p-3 rounded-lg border flex items-center space-x-2.5 text-xs font-medium transition ${
                        passed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-destructive/10 border-destructive/20 text-destructive-foreground'
                      }`}
                    >
                      {passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Issues List */}
              {val?.conflicts && val.conflicts.length > 0 && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Detected Findings & Advisory Notes:
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {val.conflicts.map((conf, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-xs border ${
                          conf.severity === 'critical'
                            ? 'bg-destructive/10 border-destructive/30 text-rose-200'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-semibold flex items-center space-x-1.5">
                            {conf.severity === 'critical' ? (
                              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            )}
                            <span>{conf.error_type} ({conf.date || 'General'})</span>
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider opacity-80 bg-background/50">
                            {conf.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{conf.message}</p>
                        {conf.suggestion && (
                          <p className="mt-1 text-primary font-medium">💡 Suggestion: {conf.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-2.5">
            {previewResult && (
              <>
                <button
                  onClick={() => handleCommit(false)}
                  disabled={isGenerating}
                  className="h-9 px-4 rounded-lg bg-secondary hover:bg-accent text-secondary-foreground text-xs font-medium border border-border flex items-center space-x-1.5 transition active:scale-95"
                >
                  <Save className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Save Draft</span>
                </button>

                <button
                  onClick={() => handleCommit(true)}
                  disabled={isGenerating || !canPublish}
                  title={!canPublish ? 'Resolve critical errors before publishing' : 'Publish validated schedule'}
                  className={`h-9 px-5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-sm transition active:scale-95 ${
                    canPublish
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-muted text-muted-foreground cursor-not-allowed border border-border'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Schedule</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
