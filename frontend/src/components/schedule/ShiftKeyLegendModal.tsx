import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Key, Clock, ShieldCheck, Info } from 'lucide-react';

interface ShiftKeyLegendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SHIFT_KEYS = [
  { key: 'E-M', standsFor: 'Early Morning', time: '08:00 – 17:00', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60' },
  { key: 'M-M', standsFor: 'Mid Morning', time: '09:00 – 18:00', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60' },
  { key: 'M-HD', standsFor: 'Morning Half Day', time: '08:00 – 12:00', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60' },
  { key: 'M-LHD', standsFor: 'Morning Late Half Day', time: '09:00 – 13:00', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700/60' },
  { key: 'A-HD', standsFor: 'Afternoon Half Day', time: '13:00 – 17:00', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60' },
  { key: 'A-LHD', standsFor: 'Afternoon Late Half Day', time: '14:00 – 18:00', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60' },
  { key: 'DO', standsFor: 'Day Off', time: 'Full Day Off', badgeClass: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  { key: 'A-L', standsFor: 'Annual Leave', time: 'Approved Leave', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60' },
  { key: 'SUN', standsFor: 'Sunday Duty', time: '08:00 – 17:00', badgeClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-700/60' },
];

export const TASK_KEYS = [
  { key: 'C', standsFor: 'Call Center', desc: 'Inbound customer call handling' },
  { key: '/T', standsFor: 'Telegram', desc: 'Telegram chat assistance' },
  { key: '/E', standsFor: 'Email', desc: 'Customer email communications' },
  { key: '/Q', standsFor: 'Queue', desc: 'Queue & ticket monitoring' },
  { key: 'F', standsFor: 'Follow up', desc: 'Follow-up ticket resolution' },
  { key: 'ELMS', standsFor: 'ELMS', desc: 'ELMS booking system' },
  { key: '2839', standsFor: '2839 Hotline', desc: 'Direct 2839 phone line' },
  { key: 'BKP', standsFor: 'Backup', desc: 'Designated secondary backup' },
  { key: 'Lunch', standsFor: 'Lunch Break', desc: '12:00–13:00 or 13:00–14:00' },
];

export const ShiftKeyLegendModal: React.FC<ShiftKeyLegendModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border text-foreground rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-card/90 backdrop-blur-xs shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-foreground">Schedule Key & Legend</h2>
              <p className="text-xs text-muted-foreground">Standard shift intervals & task abbreviations</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1 overscroll-contain">
          {/* Shift Codes Table */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Shift Codes & Time Intervals
              </h3>
            </div>
            <div className="border border-border rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <th className="py-2.5 px-3">Key</th>
                    <th className="py-2.5 px-3">Stands For</th>
                    <th className="py-2.5 px-3">Time Interval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {SHIFT_KEYS.map((item) => (
                    <tr key={item.key} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[11px] border font-mono ${item.badgeClass}`}>
                          {item.key}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-medium text-foreground">{item.standsFor}</td>
                      <td className="py-2 px-3 font-mono text-[11px] text-muted-foreground">{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Task / Assignment Codes Table */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                Task & Role Abbreviations
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TASK_KEYS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card/60 hover:bg-accent/40 transition gap-2"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="w-12 h-6 px-1.5 rounded bg-secondary font-mono font-bold text-xs text-foreground flex items-center justify-center border border-border shrink-0">
                      {item.key}
                    </span>
                    <span className="font-semibold text-xs text-foreground truncate">{item.standsFor}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground text-right shrink-0">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Example Note */}
          <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/50 flex items-start space-x-3 text-sky-900 dark:text-sky-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
            <div className="text-[11px] leading-relaxed">
              <p className="font-semibold">Example Cell Notation:</p>
              <p>
                <code className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/60 font-mono font-bold">M-M: E/T/C-BKP</code>{' '}
                means <strong>Mid Morning (09:00–18:00)</strong> assigned to <strong>Email & Telegram</strong> with <strong>Call Center Backup</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
