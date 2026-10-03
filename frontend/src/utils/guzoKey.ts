// Guzo Go Schedule Key & Legend Definitions and Utilities
// Based on Guzo Go Schedule 05 Oct - 11 Oct Key standards

export interface GuzoShiftPreset {
  key: string;
  name: string;
  startTime: string;
  endTime: string;
  defaultLunchStart?: string;
  defaultLunchEnd?: string;
  shiftType: 'WORK' | 'OFF' | 'AM_HALF' | 'PM_HALF' | 'SUNDAY_DUTY';
  badgeClass: string;
  description: string;
}

export const GUZO_SHIFT_PRESETS: GuzoShiftPreset[] = [
  {
    key: 'E-M',
    name: 'Early Morning',
    startTime: '08:00',
    endTime: '17:00',
    defaultLunchStart: '12:00',
    defaultLunchEnd: '13:00',
    shiftType: 'WORK',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60',
    description: '08:00 – 17:00 (Lunch 12:00–13:00 or 13:00–14:00)',
  },
  {
    key: 'M-M',
    name: 'Mid Morning',
    startTime: '09:00',
    endTime: '18:00',
    defaultLunchStart: '13:00',
    defaultLunchEnd: '14:00',
    shiftType: 'WORK',
    badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60',
    description: '09:00 – 18:00 (Lunch 13:00–14:00)',
  },
  {
    key: 'M-HD',
    name: 'Morning Half Day',
    startTime: '08:00',
    endTime: '12:00',
    shiftType: 'AM_HALF',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60',
    description: '08:00 – 12:00 (Saturday Morning)',
  },
  {
    key: 'M-LHD',
    name: 'Morning Late Half Day',
    startTime: '09:00',
    endTime: '13:00',
    shiftType: 'AM_HALF',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700/60',
    description: '09:00 – 13:00 (Saturday Mid-Morning)',
  },
  {
    key: 'A-HD',
    name: 'Afternoon Half Day',
    startTime: '13:00',
    endTime: '17:00',
    shiftType: 'PM_HALF',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60',
    description: '13:00 – 17:00 (Saturday Afternoon)',
  },
  {
    key: 'A-LHD',
    name: 'Afternoon Late Half Day',
    startTime: '14:00',
    endTime: '18:00',
    shiftType: 'PM_HALF',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60',
    description: '14:00 – 18:00 (Saturday Late Afternoon)',
  },
  {
    key: 'DO',
    name: 'Day Off',
    startTime: '',
    endTime: '',
    shiftType: 'OFF',
    badgeClass: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    description: 'Full Day Off (Rest Day)',
  },
  {
    key: 'A-L',
    name: 'Annual Leave',
    startTime: '',
    endTime: '',
    shiftType: 'OFF',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60',
    description: 'Approved Annual Leave',
  },
];

export const GUZO_TASK_CODES: { code: string; name: string; desc: string }[] = [
  { code: 'C', name: 'Call Center', desc: 'Inbound customer calls' },
  { code: 'T', name: 'Telegram', desc: 'Telegram chat support' },
  { code: 'E', name: 'Email', desc: 'Customer email support' },
  { code: 'Q', name: 'Queue', desc: 'Queue & ticket monitoring' },
  { code: 'F', name: 'Follow up', desc: 'Case follow-ups' },
  { code: 'ELMS', name: 'ELMS', desc: 'ELMS bookings & tasks' },
  { code: '2839', name: '2839 phone', desc: 'Direct 2839 phone line' },
  { code: 'BKP', name: 'Backup', desc: 'Standby backup agent' },
];

/**
 * Returns the Guzo Go shift code (e.g. E-M, M-M, M-HD, A-HD, DO, A-L)
 */
export function getGuzoShiftKey(
  startTime?: string | null,
  endTime?: string | null,
  shiftType?: string,
  notes?: string
): { key: string; name: string; badgeClass: string } {
  const n = (notes || '').toLowerCase();
  if (n.includes('annual') || n.includes('leave') || n.includes('vacation')) {
    return { key: 'A-L', name: 'Annual Leave', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60' };
  }

  if (shiftType === 'OFF') {
    return { key: 'DO', name: 'Day Off', badgeClass: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
  }

  const s = (startTime || '').trim();
  const e = (endTime || '').trim();

  if (s === '08:00' && e === '17:00') {
    return { key: 'E-M', name: 'Early Morning', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60' };
  }
  if (s === '09:00' && e === '18:00') {
    return { key: 'M-M', name: 'Mid Morning', badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60' };
  }
  if (s === '08:00' && e === '12:00') {
    return { key: 'M-HD', name: 'Morning Half Day', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60' };
  }
  if (s === '09:00' && e === '13:00') {
    return { key: 'M-LHD', name: 'Morning Late Half Day', badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700/60' };
  }
  if (s === '13:00' && e === '17:00') {
    return { key: 'A-HD', name: 'Afternoon Half Day', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60' };
  }
  if (s === '14:00' && e === '18:00') {
    return { key: 'A-LHD', name: 'Afternoon Late Half Day', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60' };
  }

  // Fallback by shift_type
  if (shiftType === 'AM_HALF') {
    return { key: 'M-HD', name: 'Morning Half Day', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60' };
  }
  if (shiftType === 'PM_HALF') {
    return { key: 'A-HD', name: 'Afternoon Half Day', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60' };
  }
  if (shiftType === 'SUNDAY_DUTY') {
    return { key: 'SUN', name: 'Sunday Duty', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60' };
  }

  // Default Full Work
  return { key: 'E-M', name: 'Early Morning', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60' };
}

/**
 * Returns single task abbreviation (e.g. Call Center -> C, Telegram -> T, etc.)
 */
export function getGuzoTaskAbbr(taskName: string): string {
  const t = taskName.toLowerCase().trim();
  if (t.includes('call center')) return 'C';
  if (t.includes('telegram')) return 'T';
  if (t.includes('email')) return 'E';
  if (t.includes('que')) return 'Q';
  if (t.includes('follow')) return 'F';
  if (t.includes('elms')) return 'ELMS';
  if (t.includes('2839')) return '2839';
  if (t.includes('backup') || t.includes('bkp')) return 'BKP';
  if (t.includes('gds')) return 'GDS';
  if (t.includes('amadeus')) return 'Amadeus';
  return taskName.slice(0, 4).toUpperCase();
}

/**
 * Generates the compact cell string matching the user's WPS spreadsheet,
 * e.g., "E-M: C/ELMS", "M-M: E/T/C-BKP", "DO", "A-HD: C"
 */
export function getGuzoCellNotation(shift: any): string {
  if (!shift || shift.shift_type === 'OFF') {
    return 'DO';
  }

  const { key } = getGuzoShiftKey(shift.start_time, shift.end_time, shift.shift_type, shift.notes);

  const taskAbbrs: string[] = [];
  if (shift.tasks && shift.tasks.length > 0) {
    shift.tasks.forEach((t: any) => {
      const abbr = getGuzoTaskAbbr(t.task_name || '');
      const full = t.is_backup ? `${abbr}-BKP` : abbr;
      if (!taskAbbrs.includes(full)) {
        taskAbbrs.push(full);
      }
    });
  } else if (shift.assigned_tasks && shift.assigned_tasks.length > 0) {
    shift.assigned_tasks.forEach((name: string) => {
      const abbr = getGuzoTaskAbbr(name);
      if (!taskAbbrs.includes(abbr)) {
        taskAbbrs.push(abbr);
      }
    });
  } else if (shift.primary_task) {
    shift.primary_task.split(',').forEach((p: string) => {
      const abbr = getGuzoTaskAbbr(p.trim());
      if (abbr && !taskAbbrs.includes(abbr)) {
        taskAbbrs.push(abbr);
      }
    });
    if (shift.secondary_task) {
      shift.secondary_task.split(',').forEach((s: string) => {
        const abbr = `${getGuzoTaskAbbr(s.trim())}-BKP`;
        if (abbr && !taskAbbrs.includes(abbr)) {
          taskAbbrs.push(abbr);
        }
      });
    }
  }

  if (taskAbbrs.length === 0) {
    return key;
  }

  return `${key}: ${taskAbbrs.join('/')}`;
}
