import React from 'react';
import { Calendar, Download, Printer, AlertTriangle, CheckCircle2, RotateCw, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { exportScheduleExcel } from '../../api/client';
import { ThemeToggle } from './ThemeToggle';
import { InstallAppButton } from './InstallAppButton';

export interface DateRangeInfo {
  startDate?: string;
  endDate?: string;
  label?: string;
}

interface TopbarProps {
  activeScheduleName?: string;
  activeScheduleId?: number;
  dateRange?: DateRangeInfo;
  conflictsCount?: number;
  onRefresh?: () => void;
  onPrint?: () => void;
  onToggleSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  activeScheduleName = 'Sep 28 – Oct 11, 2026',
  activeScheduleId,
  dateRange,
  conflictsCount = 0,
  onRefresh,
  onPrint,
  onToggleSidebar
}) => {
  const { role } = useAuth();
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleExportExcel = () => {
    if (activeScheduleId) {
      exportScheduleExcel(activeScheduleId, dateRange?.startDate, dateRange?.endDate);
    } else {
      alert('No schedule currently selected to export');
    }
  };

  return (
    <header className="no-print h-14 bg-card/60 backdrop-blur-md border-b border-border px-3 sm:px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Hamburger (mobile) & Schedule Context */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs overflow-hidden">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-foreground shrink-0 transition active:scale-95"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div className="hidden sm:flex items-center space-x-1.5 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{todayStr}</span>
        </div>
        <div className="hidden sm:block h-3 w-px bg-border" />
        <div className="flex items-center space-x-1.5 truncate">
          <span className="text-muted-foreground hidden xs:inline">Active:</span>
          <span className="inline-flex items-center space-x-1.5 rounded-full border border-border bg-secondary/80 px-2 sm:px-2.5 py-0.5 text-[11px] sm:text-xs font-medium text-foreground truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate">{activeScheduleName}</span>
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2.5">
        {conflictsCount > 0 ? (
          <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{conflictsCount} Issues</span>
          </div>
        ) : (
          <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </div>
        )}

        {/* Install Mobile App Button */}
        <InstallAppButton />

        {/* Theme Toggle Button */}
        <ThemeToggle showLabel={true} />

        {onRefresh && (
          <button
            onClick={onRefresh}
            title="Refresh Data"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground transition"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        )}

        {activeScheduleId && (role === 'admin' || role === 'manager') && (
          <button
            onClick={handleExportExcel}
            title={dateRange?.startDate && dateRange?.endDate ? `Export Excel for ${dateRange.startDate} to ${dateRange.endDate}` : 'Export Schedule (Excel)'}
            className="h-8 px-3 rounded-md bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium inline-flex items-center space-x-1.5 transition active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Export Excel</span>
            {dateRange?.label && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {dateRange.label}
              </span>
            )}
          </button>
        )}

        {onPrint && (
          <button
            onClick={onPrint}
            className="h-8 px-3 rounded-md border border-input bg-background hover:bg-accent text-foreground text-xs font-medium inline-flex items-center space-x-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-foreground" />
            <span>Print</span>
          </button>
        )}
      </div>
    </header>
  );
};
