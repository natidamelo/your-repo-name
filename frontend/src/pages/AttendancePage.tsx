import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  UserX,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Edit3,
  CalendarRange,
  BarChart3,
  ListOrdered,
  CalendarClock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getDayAttendanceApi,
  recordAttendanceApi,
  bulkMarkPresentApi,
  getPendingCoverQueueApi,
  resolveCoverApi,
  getAttendanceSummaryApi
} from '../api/client';
import {
  DayAttendanceResponse,
  DayStaffAttendanceItem,
  PendingCoverItem,
  AttendanceSummaryStats,
  AttendanceStatus,
  CoverStatus
} from '../types';

interface AttendancePageProps {
  initialDate?: string;
  activeScheduleId?: number;
}

export const AttendancePage: React.FC<AttendancePageProps> = ({ initialDate = '2026-09-28', activeScheduleId }) => {
  const { role, user } = useAuth();
  const isAdminOrManager = role === 'admin' || role === 'manager';

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState<string>(initialDate);
  const [activeView, setActiveView] = useState<'sheet' | 'pending_cover' | 'analytics'>('sheet');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Data state
  const [dayData, setDayData] = useState<DayAttendanceResponse | null>(null);
  const [pendingCovers, setPendingCovers] = useState<PendingCoverItem[]>([]);
  const [summaryStats, setSummaryStats] = useState<AttendanceSummaryStats | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, scheduled, present, absent, late, cover_pending

  // Modal state for editing remarks & cover flag
  const [selectedStaff, setSelectedStaff] = useState<DayStaffAttendanceItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [formStatus, setFormStatus] = useState<AttendanceStatus>('ABSENT');
  const [formRemark, setFormRemark] = useState<string>('');
  const [formNeedsCover, setFormNeedsCover] = useState<boolean>(true);
  const [formCoverStatus, setFormCoverStatus] = useState<CoverStatus>('PENDING');
  const [formCoverNotes, setFormCoverNotes] = useState<string>('');
  const [formTargetDate, setFormTargetDate] = useState<string>('');
  const [formCheckIn, setFormCheckIn] = useState<string>('08:00');
  const [formCheckOut, setFormCheckOut] = useState<string>('17:00');
  const [formLateMinutes, setFormLateMinutes] = useState<number>(0);

  // Resolve cover modal state
  const [selectedCoverItem, setSelectedCoverItem] = useState<PendingCoverItem | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState<boolean>(false);
  const [resolveStatus, setResolveStatus] = useState<string>('SCHEDULED');
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [resolveTargetDate, setResolveTargetDate] = useState<string>('');

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load day attendance
  const loadDayAttendance = async (dateStr: string) => {
    setIsLoading(true);
    try {
      const data = await getDayAttendanceApi(dateStr, activeScheduleId);
      setDayData(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to load day attendance' });
    } finally {
      setIsLoading(false);
    }
  };

  // Load pending coverage queue
  const loadPendingCovers = async () => {
    try {
      const covers = await getPendingCoverQueueApi();
      setPendingCovers(covers);
    } catch (err: any) {
      console.error('Failed to load pending covers:', err);
    }
  };

  // Load summary stats
  const loadSummaryStats = async () => {
    try {
      const stats = await getAttendanceSummaryApi();
      setSummaryStats(stats);
    } catch (err: any) {
      console.error('Failed to load attendance summary:', err);
    }
  };

  useEffect(() => {
    loadDayAttendance(currentDate);
    loadPendingCovers();
    loadSummaryStats();
  }, [currentDate, activeScheduleId]);

  // Date controls
  const changeDateBy = (days: number) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSetToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setCurrentDate(`${yyyy}-${mm}-${dd}`);
  };

  // Quick mark present
  const handleQuickMarkPresent = async (item: DayStaffAttendanceItem) => {
    if (!isAdminOrManager) return;
    try {
      await recordAttendanceApi({
        employee_id: item.employee_id,
        date: currentDate,
        status: 'PRESENT',
        check_in_time: item.scheduled_start || '08:00',
        check_out_time: item.scheduled_end || '17:00',
        late_minutes: 0,
        admin_remark: null,
        needs_next_week_cover: false,
        cover_status: 'NONE'
      });
      setNotification({ type: 'success', message: `${item.employee_name} marked PRESENT` });
      loadDayAttendance(currentDate);
      loadSummaryStats();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to record attendance' });
    }
  };

  // Open edit / remark modal
  const openEditModal = (item: DayStaffAttendanceItem, presetStatus?: AttendanceStatus) => {
    setSelectedStaff(item);
    const initialStatus = presetStatus || item.status || 'PRESENT';
    setFormStatus(initialStatus);
    setFormRemark(item.admin_remark || '');
    setFormNeedsCover(item.needs_next_week_cover ?? (initialStatus === 'ABSENT'));
    setFormCoverStatus(item.cover_status || 'PENDING');
    setFormCoverNotes(item.cover_notes || '');
    setFormTargetDate(item.target_cover_date || '');
    setFormCheckIn(item.check_in_time || item.scheduled_start || '08:00');
    setFormCheckOut(item.check_out_time || item.scheduled_end || '17:00');
    setFormLateMinutes(item.late_minutes || 0);
    setIsEditModalOpen(true);
  };

  // Save attendance record from modal
  const handleSaveAttendanceRecord = async () => {
    if (!selectedStaff || !isAdminOrManager) return;
    setActionLoading(true);
    try {
      await recordAttendanceApi({
        employee_id: selectedStaff.employee_id,
        date: currentDate,
        status: formStatus,
        check_in_time: formStatus === 'ABSENT' ? null : formCheckIn,
        check_out_time: formStatus === 'ABSENT' ? null : formCheckOut,
        late_minutes: formStatus === 'LATE' ? formLateMinutes : 0,
        admin_remark: formRemark || null,
        needs_next_week_cover: formStatus === 'ABSENT' ? formNeedsCover : false,
        cover_status: (formStatus === 'ABSENT' && formNeedsCover) ? formCoverStatus : 'NONE',
        cover_notes: formCoverNotes || null,
        target_cover_date: formTargetDate || null
      });

      setNotification({
        type: 'success',
        message: `Attendance updated for ${selectedStaff.employee_name} (${formStatus}${formNeedsCover && formStatus === 'ABSENT' ? ' - Next Week Cover Assigned' : ''})`
      });
      setIsEditModalOpen(false);
      loadDayAttendance(currentDate);
      loadPendingCovers();
      loadSummaryStats();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to update attendance' });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk mark all scheduled as present
  const handleBulkMarkPresent = async () => {
    if (!isAdminOrManager) return;
    if (!window.confirm(`Are you sure you want to mark all scheduled employees as PRESENT for ${currentDate}? Anyone already marked Absent or Excused will remain unchanged.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await bulkMarkPresentApi(currentDate, activeScheduleId);
      setNotification({ type: 'success', message: res.message });
      loadDayAttendance(currentDate);
      loadSummaryStats();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Bulk mark failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve make-up cover queue item
  const openResolveModal = (item: PendingCoverItem) => {
    setSelectedCoverItem(item);
    setResolveStatus(item.cover_status === 'PENDING' ? 'SCHEDULED' : item.cover_status);
    setResolveNotes(item.cover_notes || '');
    setResolveTargetDate(item.target_cover_date || '');
    setIsResolveModalOpen(true);
  };

  const handleSaveResolveCoverage = async () => {
    if (!selectedCoverItem || !isAdminOrManager) return;
    setActionLoading(true);
    try {
      await resolveCoverApi(selectedCoverItem.attendance_id, {
        cover_status: resolveStatus,
        cover_notes: resolveNotes || null,
        target_cover_date: resolveTargetDate || null
      });
      setNotification({
        type: 'success',
        message: `Make-up coverage status for ${selectedCoverItem.employee_name} set to ${resolveStatus}`
      });
      setIsResolveModalOpen(false);
      loadPendingCovers();
      loadDayAttendance(currentDate);
      loadSummaryStats();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to resolve cover' });
    } finally {
      setActionLoading(false);
    }
  };

  // Filter records
  const filteredRecords = (dayData?.records || []).filter((r) => {
    const matchesSearch =
      r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.position.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'scheduled') return r.is_scheduled_work;
    if (filterStatus === 'present') return r.status === 'PRESENT';
    if (filterStatus === 'absent') return r.status === 'ABSENT';
    if (filterStatus === 'late') return r.status === 'LATE';
    if (filterStatus === 'cover_pending') return r.needs_next_week_cover && r.cover_status !== 'COMPLETED';

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <UserCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Attendance & Make-up Coverage
              </h1>
              {dayData?.schedule_name && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" />
                  <span>{dayData.schedule_name}</span>
                </span>
              )}
              {!isAdminOrManager && (
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                  View Only
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Admin-controlled daily roster check-in, reason remarks, and next-week make-up shift debt management.
            </p>
          </div>

          {/* Date Picker Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-secondary/70 border border-border rounded-lg p-0.5">
              <button
                onClick={() => changeDateBy(-1)}
                className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={currentDate}
                onChange={(e) => setCurrentDate(e.target.value)}
                className="bg-transparent px-2 py-1 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
              />
              <button
                onClick={() => changeDateBy(1)}
                className="p-1.5 rounded-md hover:bg-card text-muted-foreground hover:text-foreground transition"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSetToday}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-accent text-foreground transition"
            >
              Today
            </button>

            {isAdminOrManager && activeView === 'sheet' && (
              <button
                onClick={handleBulkMarkPresent}
                disabled={actionLoading}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-[0.98] disabled:opacity-50"
                title="Mark all staff scheduled for this day as PRESENT"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark All Scheduled Present</span>
              </button>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-border/80">
          <button
            onClick={() => setActiveView('sheet')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeView === 'sheet'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Daily Attendance Sheet</span>
            {dayData && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeView === 'sheet' ? 'bg-primary-foreground/20 text-white' : 'bg-secondary text-muted-foreground'}`}>
                {dayData.day_name}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('pending_cover')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeView === 'pending_cover'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Next-Week Make-up Queue</span>
            {pendingCovers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {pendingCovers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeView === 'analytics'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Attendance Reliability</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-lg text-xs font-medium border shadow-sm transition animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards (Daily Overview) */}
      {dayData && activeView === 'sheet' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-muted-foreground font-medium">Scheduled Staff</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-foreground">{dayData.scheduled_count}</span>
              <span className="text-[10px] text-muted-foreground">of {dayData.total_staff} total</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Present</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{dayData.present_count}</span>
              <span className="text-[10px] text-muted-foreground">
                {dayData.scheduled_count > 0
                  ? `${Math.round((dayData.present_count / dayData.scheduled_count) * 100)}%`
                  : '0%'}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1">
              <UserX className="w-3 h-3" />
              <span>Absent</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{dayData.absent_count}</span>
              <span className="text-[10px] text-rose-500 font-medium">
                {dayData.absent_count > 0 ? 'Action needed' : 'Clean'}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Late</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{dayData.late_count}</span>
              <span className="text-[10px] text-muted-foreground">arrivals</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Excused / Half</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{dayData.excused_count}</span>
              <span className="text-[10px] text-muted-foreground">approved</span>
            </div>
          </div>

          <div className="bg-card border border-amber-500/30 bg-amber-500/5 rounded-xl p-3 shadow-xs">
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              <span>Next-Week Cover</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{dayData.pending_cover_count}</span>
              <span className="text-[10px] text-amber-600/90 font-medium">owing shift</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: DAILY ATTENDANCE SHEET */}
      {activeView === 'sheet' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-xs">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee name or role..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-secondary/50 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div className="flex items-center space-x-1.5 w-full sm:w-auto overflow-x-auto">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All' },
                { id: 'scheduled', label: 'Scheduled' },
                { id: 'present', label: 'Present' },
                { id: 'absent', label: 'Absent' },
                { id: 'late', label: 'Late' },
                { id: 'cover_pending', label: 'Cover Flagged' }
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilterStatus(btn.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                    filterStatus === btn.id
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Roster Shift</th>
                    <th className="py-3 px-3">Check-In / Out</th>
                    <th className="py-3 px-3">Attendance Status</th>
                    <th className="py-3 px-3">Next-Week Cover & Remark</th>
                    {isAdminOrManager && <th className="py-3 px-4 text-right">Quick Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <div className="inline-flex items-center space-x-2">
                          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                          <span>Loading roster and attendance data...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No employees found matching the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((item) => {
                      const isAbsent = item.status === 'ABSENT';
                      const isPresent = item.status === 'PRESENT';
                      const isLate = item.status === 'LATE';
                      const isExcused = item.status === 'EXCUSED' || item.status === 'HALF_DAY';
                      const isRecorded = Boolean(item.status);

                      return (
                        <tr
                          key={item.employee_id}
                          className={`hover:bg-accent/40 transition-colors ${
                            isAbsent
                              ? 'bg-rose-50/40 dark:bg-rose-950/10'
                              : item.needs_next_week_cover
                              ? 'bg-amber-50/30 dark:bg-amber-950/10'
                              : ''
                          }`}
                        >
                          {/* Employee Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                                  isAbsent
                                    ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-900/60 dark:text-rose-200 dark:border-rose-800'
                                    : isPresent
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-800'
                                    : isLate
                                    ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-800'
                                    : 'bg-secondary text-foreground border-border'
                                }`}
                              >
                                {item.employee_name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .slice(0, 2)}
                              </div>
                              <div>
                                <div className="font-semibold text-foreground flex items-center gap-1.5">
                                  <span>{item.employee_name}</span>
                                </div>
                                <div className="text-[10px] text-muted-foreground">{item.position}</div>
                              </div>
                            </div>
                          </td>

                          {/* Roster Shift */}
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                    item.shift_type === 'OFF'
                                      ? 'bg-secondary text-muted-foreground border-border'
                                      : item.shift_type === 'SUNDAY_DUTY'
                                      ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300'
                                      : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300'
                                  }`}
                                >
                                  {item.shift_type || (item.is_scheduled_work ? 'WORK' : 'OFF')}
                                </span>
                                {item.scheduled_start && (
                                  <span className="text-[11px] text-muted-foreground">
                                    {item.scheduled_start} - {item.scheduled_end}
                                  </span>
                                )}
                              </div>
                              {item.primary_task && (
                                <span className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[140px]">
                                  Task: {item.primary_task}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actual Times */}
                          <td className="py-3 px-3">
                            {isRecorded && !isAbsent ? (
                              <div className="text-[11px] font-medium text-foreground">
                                <div>In: {item.check_in_time || '—'}</div>
                                <div className="text-muted-foreground">Out: {item.check_out_time || '—'}</div>
                                {isLate && item.late_minutes > 0 && (
                                  <span className="text-[10px] font-bold text-amber-600">
                                    +{item.late_minutes}m late
                                  </span>
                                )}
                              </div>
                            ) : isAbsent ? (
                              <span className="text-[11px] text-rose-500 font-medium italic">Did not attend</span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground italic">Not recorded</span>
                            )}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-3">
                            {isPresent && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Present</span>
                              </span>
                            )}
                            {isAbsent && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                <UserX className="w-3 h-3" />
                                <span>Absent</span>
                              </span>
                            )}
                            {isLate && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                <Clock className="w-3 h-3" />
                                <span>Late</span>
                              </span>
                            )}
                            {isExcused && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                                <ShieldCheck className="w-3 h-3" />
                                <span>{item.status}</span>
                              </span>
                            )}
                            {!isRecorded && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-secondary text-muted-foreground border border-border">
                                <HelpCircle className="w-3 h-3" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>

                          {/* Next-Week Cover & Admin Remark */}
                          <td className="py-3 px-3">
                            <div className="space-y-1 max-w-xs">
                              {/* Next Week Cover Badge */}
                              {item.needs_next_week_cover && (
                                <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  <RotateCcw className="w-3 h-3 text-amber-600" />
                                  <span>Cover Next Week: {item.cover_status}</span>
                                </div>
                              )}

                              {item.admin_remark ? (
                                <p className="text-[11px] text-foreground font-medium line-clamp-2">
                                  "{item.admin_remark}"
                                </p>
                              ) : isAbsent ? (
                                <span className="text-[10px] text-muted-foreground italic">No remark provided</span>
                              ) : null}
                            </div>
                          </td>

                          {/* Quick Admin Actions */}
                          {isAdminOrManager && (
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center space-x-1">
                                <button
                                  onClick={() => handleQuickMarkPresent(item)}
                                  className="p-1.5 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-950/50 text-emerald-600 transition"
                                  title="Quick Mark Present"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(item, 'ABSENT')}
                                  className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 transition"
                                  title="Mark Absent & Assign Cover"
                                >
                                  <UserX className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openEditModal(item)}
                                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                                  title="Edit Remarks, Hours & Cover Options"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: NEXT-WEEK MAKE-UP SHIFT QUEUE */}
      {activeView === 'pending_cover' && (
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start space-x-3">
            <RotateCcw className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-xs space-y-1">
              <h3 className="font-semibold text-foreground">
                Next-Week Shift Coverage Debt Tracker
              </h3>
              <p className="text-muted-foreground">
                Employees listed here were marked absent and explicitly designated by Admin to cover a make-up shift in next week's schedule roster. Use this queue when generating or publishing next week's schedule.
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Date Missed</th>
                    <th className="py-3 px-3">Shift Type</th>
                    <th className="py-3 px-3">Admin Reason / Remark</th>
                    <th className="py-3 px-3">Coverage Status</th>
                    <th className="py-3 px-3">Target Date / Note</th>
                    {isAdminOrManager && <th className="py-3 px-4 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingCovers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                          <span className="font-semibold text-foreground">No Pending Make-up Shifts</span>
                          <span className="text-[11px]">All absentee coverage requirements have been resolved or fulfilled.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pendingCovers.map((cover) => (
                      <tr key={cover.attendance_id} className="hover:bg-accent/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-foreground">
                          <div>{cover.employee_name}</div>
                          <div className="text-[10px] text-muted-foreground font-normal">{cover.position}</div>
                        </td>
                        <td className="py-3 px-3 font-medium text-foreground">{cover.absence_date}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary border border-border">
                            {cover.shift_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          <p className="text-[11px] text-foreground italic">
                            {cover.admin_remark ? `"${cover.admin_remark}"` : 'No remark specified'}
                          </p>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              cover.cover_status === 'SCHEDULED'
                                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                                : cover.cover_status === 'COMPLETED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {cover.cover_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <div>Target: {cover.target_cover_date || 'Next week roster'}</div>
                          {cover.cover_notes && (
                            <div className="text-muted-foreground text-[10px] truncate max-w-[160px]">
                              {cover.cover_notes}
                            </div>
                          )}
                        </td>
                        {isAdminOrManager && (
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => openResolveModal(cover)}
                              className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition shadow-xs"
                            >
                              Resolve
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ATTENDANCE ANALYTICS */}
      {activeView === 'analytics' && summaryStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <span className="text-xs text-muted-foreground font-medium">Overall Attendance Rate</span>
              <div className="text-3xl font-extrabold text-foreground mt-2">
                {summaryStats.attendance_rate_percent}%
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {summaryStats.total_present} present out of {summaryStats.total_records} logged shifts
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <span className="text-xs text-rose-600 font-medium">Total Unexcused Absences</span>
              <div className="text-3xl font-extrabold text-rose-600 mt-2">
                {summaryStats.total_absent}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Across all recorded roster days
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <span className="text-xs text-amber-600 font-medium">Total Late Minutes</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-2">
                {summaryStats.total_late_minutes}m
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                From {summaryStats.total_late} recorded late arrivals
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <span className="text-xs text-amber-600 font-medium">Unresolved Make-up Shifts</span>
              <div className="text-3xl font-extrabold text-amber-600 mt-2">
                {summaryStats.total_pending_cover}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Pending assignment into next week roster
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-sm text-foreground">Operational Attendance Guidelines</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                <span className="font-semibold text-foreground">Absence Coverage Policy</span>
                <p>When an agent calls in sick or takes unscheduled leave, the Admin can toggle "Require Next-Week Cover". This creates an official make-up obligation without breaking the current roster constraints.</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-1">
                <span className="font-semibold text-foreground">Next Week Roster Integration</span>
                <p>During automated or manual generation of the subsequent schedule period, pending cover staff are prioritized for extra Saturday/Sunday squad slots or peak-hour backup queues.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT ATTENDANCE, REMARK & NEXT-WEEK COVER */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Record Attendance & Remark
                </h3>
                <p className="text-xs text-muted-foreground">
                  {selectedStaff.employee_name} • {selectedStaff.position} ({currentDate})
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Status Radio Buttons */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Attendance Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as AttendanceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setFormStatus(st);
                        if (st === 'ABSENT') {
                          setFormNeedsCover(true);
                        } else {
                          setFormNeedsCover(false);
                        }
                      }}
                      className={`py-2 px-2 rounded-lg font-semibold text-center border transition ${
                        formStatus === st
                          ? st === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : st === 'PRESENT'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : st === 'LATE'
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-purple-600 text-white border-purple-600'
                          : 'bg-secondary/40 text-muted-foreground border-border hover:bg-secondary'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Check-In / Check-Out Times (if not absent) */}
              {formStatus !== 'ABSENT' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Actual Check-In</label>
                    <input
                      type="time"
                      value={formCheckIn}
                      onChange={(e) => setFormCheckIn(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-foreground font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground">Actual Check-Out</label>
                    <input
                      type="time"
                      value={formCheckOut}
                      onChange={(e) => setFormCheckOut(e.target.value)}
                      className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-foreground font-semibold"
                    />
                  </div>

                  {formStatus === 'LATE' && (
                    <div className="col-span-2 pt-2 border-t border-border/60">
                      <label className="text-[11px] font-medium text-amber-600">Minutes Late</label>
                      <input
                        type="number"
                        min="1"
                        max="480"
                        value={formLateMinutes}
                        onChange={(e) => setFormLateMinutes(Number(e.target.value))}
                        className="w-full mt-1 px-2.5 py-1.5 rounded-md bg-card border border-border text-foreground font-semibold"
                        placeholder="e.g. 15"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Admin Remark / Reason */}
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground flex items-center justify-between">
                  <span>Admin Remark / Reason</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Recorded in audit log</span>
                </label>
                <textarea
                  rows={2}
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  placeholder={
                    formStatus === 'ABSENT'
                      ? 'e.g. Called in sick (flu), agreed to cover next week Saturday morning...'
                      : 'Optional supervisor notes...'
                  }
                  className="w-full p-2.5 rounded-lg bg-card border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* ABSENCE NEXT-WEEK COVER SECTION (Core feature) */}
              {formStatus === 'ABSENT' && (
                <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Require Make-Up Shift in Next Week's Schedule?</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Admin decision: If enabled, this employee will owe 1 shift to be scheduled in next week's roster.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={formNeedsCover}
                        onChange={(e) => setFormNeedsCover(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {formNeedsCover && (
                    <div className="pt-2 border-t border-amber-500/20 grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-semibold text-foreground">Target Make-Up Date</label>
                        <input
                          type="date"
                          value={formTargetDate}
                          onChange={(e) => setFormTargetDate(e.target.value)}
                          className="w-full mt-1 px-2 py-1 rounded bg-card border border-border text-foreground text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-semibold text-foreground">Cover Status</label>
                        <select
                          value={formCoverStatus}
                          onChange={(e) => setFormCoverStatus(e.target.value as CoverStatus)}
                          className="w-full mt-1 px-2 py-1 rounded bg-card border border-border text-foreground text-[11px]"
                        >
                          <option value="PENDING">PENDING (Awaiting schedule)</option>
                          <option value="SCHEDULED">SCHEDULED (Assigned)</option>
                          <option value="COMPLETED">COMPLETED (Served)</option>
                          <option value="WAIVED">WAIVED (Forgiven)</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] font-semibold text-foreground">Cover Plan Notes</label>
                        <input
                          type="text"
                          value={formCoverNotes}
                          onChange={(e) => setFormCoverNotes(e.target.value)}
                          placeholder="e.g. Cover Saturday squad or +4 hours weekday evening"
                          className="w-full mt-1 px-2 py-1 rounded bg-card border border-border text-foreground text-[11px]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-end space-x-2 bg-secondary/30">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-secondary font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveAttendanceRecord}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RESOLVE PENDING COVER QUEUE ITEM */}
      {isResolveModalOpen && selectedCoverItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div>
                <h3 className="text-sm font-bold text-foreground">Resolve Make-Up Shift Coverage</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedCoverItem.employee_name} (Missed on {selectedCoverItem.absence_date})
                </p>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-secondary/40 border border-border space-y-1">
                <div className="text-[10px] text-muted-foreground font-semibold">Absence Reason</div>
                <div className="font-medium text-foreground">
                  {selectedCoverItem.admin_remark || 'No remark provided'}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Coverage Resolution Status</label>
                <select
                  value={resolveStatus}
                  onChange={(e) => setResolveStatus(e.target.value)}
                  className="w-full p-2 rounded-lg bg-card border border-border text-foreground font-medium"
                >
                  <option value="SCHEDULED">SCHEDULED (Assigned to next week roster)</option>
                  <option value="COMPLETED">COMPLETED (Make-up shift successfully worked)</option>
                  <option value="WAIVED">WAIVED (Forgiven with medical slip / approved leave)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Target Make-Up Date</label>
                <input
                  type="date"
                  value={resolveTargetDate}
                  onChange={(e) => setResolveTargetDate(e.target.value)}
                  className="w-full p-2 rounded-lg bg-card border border-border text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Coverage Notes</label>
                <textarea
                  rows={2}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="e.g. Assigned to Oct 10 Saturday squad AM shift..."
                  className="w-full p-2 rounded-lg bg-card border border-border text-foreground"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end space-x-2 bg-secondary/30">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-secondary font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveResolveCoverage}
                className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Update Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
